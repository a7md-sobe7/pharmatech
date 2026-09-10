import { DrugProduct } from '../../models/DrugProduct.js';
import { PharmacyInventory } from '../../models/PharmacyInventory.js';
import { SimilarityConfig } from '../../models/SimilarityConfig.js';
import { SimilarityEngine } from './similarityEngine.js';
import { NormalizationService } from '../ingredients/normalizationService.js';
import { AppError } from '../../middleware/errorHandler.js';
import { logAudit } from '../../middleware/audit.js';
export class SimilarityController {
    /**
     * Find similar candidate products for a target drug product
     * Cross-references against pharmacy inventory
     */
    static async findSimilar(req, res, next) {
        try {
            const { id } = req.params;
            const onlyAvailable = req.query.onlyAvailable !== 'false'; // default true
            const targetProduct = await DrugProduct.findById(id).lean();
            if (!targetProduct) {
                throw new AppError('Target product not found in Drug Knowledge Base.', 404, 'PRODUCT_NOT_FOUND');
            }
            // 1. Fetch Target's Inventory Status
            const targetInventory = await PharmacyInventory.findOne({ drugProductId: id }).lean();
            // 2. Extract and Normalize Primary Active Ingredient
            const primaryNorm = NormalizationService.normalizeString(targetProduct.primaryActiveIngredient?.normalizedName || targetProduct.primaryActiveIngredient?.name || '');
            const canonicalPrimary = (await NormalizationService.resolveCanonical(primaryNorm)).normalized;
            // 3. Find Candidate Products in Knowledge Base (excluding the target product itself)
            const allCandidates = await DrugProduct.find({ _id: { $ne: targetProduct._id } }).lean();
            const config = await SimilarityEngine.getActiveConfig();
            const similarityResults = [];
            // 4. Calculate similarity for each candidate
            for (const cand of allCandidates) {
                const sim = await SimilarityEngine.calculateSimilarity(targetProduct, cand, config);
                // Fetch candidate's inventory
                const inv = await PharmacyInventory.findOne({ drugProductId: String(cand._id) }).lean();
                sim.inventory = inv || undefined;
                // Apply strict inventory filter if requested
                if (onlyAvailable) {
                    const now = new Date();
                    const isExpired = inv?.expirationDate && new Date(inv.expirationDate) <= now;
                    const isAvailable = inv && inv.availableQuantity > 0 && inv.status !== 'OUT_OF_STOCK' && inv.status !== 'EXPIRED' && inv.status !== 'DISCONTINUED' && !isExpired;
                    // Only keep candidates that have matching primary ingredient AND are currently available in stock
                    if (sim.isSimilar && isAvailable) {
                        similarityResults.push(sim);
                    }
                }
                else {
                    // If not filtering out of stock, return all primary ingredient similar matches
                    if (sim.isSimilar) {
                        similarityResults.push(sim);
                    }
                }
            }
            // 5. Sort candidates: Highest similarity score first, then highest available quantity
            similarityResults.sort((a, b) => {
                if (b.percentageScore !== a.percentageScore) {
                    return b.percentageScore - a.percentageScore;
                }
                return (b.inventory?.availableQuantity || 0) - (a.inventory?.availableQuantity || 0);
            });
            await logAudit('SIMILARITY_LOOKUP', req, targetProduct.productName, {
                targetProductId: id,
                primaryIngredient: targetProduct.primaryActiveIngredient?.name,
                candidatesFound: similarityResults.length,
                onlyAvailable
            });
            res.json({
                success: true,
                data: {
                    targetProduct: {
                        ...targetProduct,
                        inventory: targetInventory || {
                            status: 'OUT_OF_STOCK',
                            quantity: 0,
                            availableQuantity: 0
                        }
                    },
                    primaryActiveIngredient: targetProduct.primaryActiveIngredient,
                    totalCandidatesFound: similarityResults.length,
                    candidates: similarityResults,
                    disclaimer: 'System-generated similarity matches based on primary active ingredient. Pharmacist clinical review and verification is required before substitution.'
                }
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Side-by-side comparison between two specific products
     */
    static async compare(req, res, next) {
        try {
            const { targetProductId, candidateProductId } = req.body;
            if (!targetProductId || !candidateProductId) {
                throw new AppError('Both targetProductId and candidateProductId are required for comparison.', 400, 'VALIDATION_ERROR');
            }
            const [target, candidate] = await Promise.all([
                DrugProduct.findById(targetProductId).lean(),
                DrugProduct.findById(candidateProductId).lean()
            ]);
            if (!target || !candidate) {
                throw new AppError('One or both products were not found.', 404, 'PRODUCT_NOT_FOUND');
            }
            const [targetInv, candInv] = await Promise.all([
                PharmacyInventory.findOne({ drugProductId: targetProductId }).lean(),
                PharmacyInventory.findOne({ drugProductId: candidateProductId }).lean()
            ]);
            const config = await SimilarityEngine.getActiveConfig();
            const similarity = await SimilarityEngine.calculateSimilarity(target, candidate, config);
            similarity.inventory = candInv || undefined;
            await logAudit('PRODUCT_COMPARE', req, `${target.productName} vs ${candidate.productName}`, {
                targetId: targetProductId,
                candidateId: candidateProductId,
                score: similarity.score
            });
            res.json({
                success: true,
                data: {
                    targetProduct: { ...target, inventory: targetInv },
                    candidateProduct: { ...candidate, inventory: candInv },
                    similarity,
                    disclaimer: 'The side-by-side comparison reflects structured catalog attributes. Pharmacist must evaluate patient-specific factors before any medication change.'
                }
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get active similarity scoring weights and thresholds
     */
    static async getConfig(req, res, next) {
        try {
            const config = await SimilarityEngine.getActiveConfig();
            res.json({ success: true, data: { config } });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Update similarity scoring weights and thresholds (Admin)
     */
    static async updateConfig(req, res, next) {
        try {
            const { primaryIngredientWeight, strengthWeight, dosageFormWeight, secondaryIngredientWeight, thresholds } = req.body;
            const sumWeights = ((Number(primaryIngredientWeight) || 0) +
                (Number(strengthWeight) || 0) +
                (Number(dosageFormWeight) || 0) +
                (Number(secondaryIngredientWeight) || 0));
            if (Math.abs(sumWeights - 1.0) > 0.01) {
                throw new AppError(`Total weights must sum to 1.0 (currently sums to ${sumWeights.toFixed(2)}).`, 400, 'INVALID_WEIGHTS');
            }
            let config = await SimilarityConfig.findOne().sort({ updatedAt: -1 });
            if (!config) {
                config = new SimilarityConfig();
            }
            config.primaryIngredientWeight = primaryIngredientWeight;
            config.strengthWeight = strengthWeight;
            config.dosageFormWeight = dosageFormWeight;
            config.secondaryIngredientWeight = secondaryIngredientWeight;
            if (thresholds)
                config.thresholds = thresholds;
            config.version = `1.${Date.now().toString().slice(-4)}`;
            config.updatedBy = req.user?.name || 'ADMIN';
            await config.save();
            await logAudit('UPDATE_SIMILARITY_CONFIG', req, 'SYSTEM_CONFIG', {
                newWeights: { primaryIngredientWeight, strengthWeight, dosageFormWeight, secondaryIngredientWeight }
            });
            res.json({
                success: true,
                message: 'Similarity weights updated successfully.',
                data: { config }
            });
        }
        catch (error) {
            next(error);
        }
    }
}
