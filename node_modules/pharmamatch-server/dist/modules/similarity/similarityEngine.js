import { StrengthNormalizer } from '../../utils/strengthNormalizer.js';
import { NormalizationService } from '../ingredients/normalizationService.js';
import { SimilarityConfig } from '../../models/SimilarityConfig.js';
import mongoose from 'mongoose';
export class SimilarityEngine {
    static DEFAULT_CONFIG = {
        primaryIngredientWeight: 0.60,
        strengthWeight: 0.20,
        dosageFormWeight: 0.10,
        secondaryIngredientWeight: 0.10,
        thresholds: {
            veryHigh: 90,
            high: 75,
            moderate: 50,
            low: 25,
        },
        version: '1.0.0'
    };
    /**
     * Fetch active similarity configuration
     */
    static async getActiveConfig() {
        if (mongoose.connection.readyState === 1) {
            try {
                const config = await SimilarityConfig.findOne().sort({ updatedAt: -1 }).lean();
                if (config)
                    return config;
            }
            catch {
                // ignore
            }
        }
        return this.DEFAULT_CONFIG;
    }
    /**
     * Dosage Form Compatibility Evaluation
     */
    static evaluateDosageForm(targetForm, candidateForm) {
        const tForm = (targetForm || '').trim().toLowerCase();
        const cForm = (candidateForm || '').trim().toLowerCase();
        if (tForm === cForm) {
            return { score: 1.0, matched: true, explanation: `Identical dosage form (${targetForm}).` };
        }
        // Oral Solid Family
        const oralSolids = ['tablet', 'capsule', 'caplet', 'film-coated tablet', 'effervescent tablet', 'chewable tablet', 'dispersible tablet', 'dragee', 'قرص', 'كبسولة'];
        const isTargetOralSolid = oralSolids.some(f => tForm.includes(f));
        const isCandOralSolid = oralSolids.some(f => cForm.includes(f));
        if (isTargetOralSolid && isCandOralSolid) {
            return { score: 0.80, matched: true, explanation: `Compatible oral solid form (${targetForm} vs ${candidateForm}).` };
        }
        // Oral Liquid Family
        const oralLiquids = ['syrup', 'suspension', 'solution', 'oral drops', 'elixir', 'شراب', 'معلق', 'نقط فم'];
        const isTargetOralLiquid = oralLiquids.some(f => tForm.includes(f));
        const isCandOralLiquid = oralLiquids.some(f => cForm.includes(f));
        if (isTargetOralLiquid && isCandOralLiquid) {
            return { score: 0.80, matched: true, explanation: `Compatible oral liquid form (${targetForm} vs ${candidateForm}).` };
        }
        // Topical Family
        const topicals = ['cream', 'ointment', 'gel', 'lotion', 'foam', 'كريم', 'مرهم', 'جل'];
        const isTargetTopical = topicals.some(f => tForm.includes(f));
        const isCandTopical = topicals.some(f => cForm.includes(f));
        if (isTargetTopical && isCandTopical) {
            return { score: 0.80, matched: true, explanation: `Compatible topical form (${targetForm} vs ${candidateForm}).` };
        }
        // Injectables
        const injectables = ['injection', 'vial', 'ampoule', 'infusion', 'حقن', 'امبول', 'فيال'];
        const isTargetInjectable = injectables.some(f => tForm.includes(f));
        const isCandInjectable = injectables.some(f => cForm.includes(f));
        if (isTargetInjectable && isCandInjectable) {
            return { score: 0.85, matched: true, explanation: `Compatible parenteral form (${targetForm} vs ${candidateForm}).` };
        }
        return { score: 0.0, matched: false, explanation: `Different dosage forms: ${targetForm} vs ${candidateForm}.` };
    }
    /**
     * Compare secondary active ingredients using Jaccard Similarity
     */
    static evaluateSecondaryIngredients(targetProduct, candidateProduct) {
        const targetSecondary = (targetProduct.activeIngredients || [])
            .filter(i => i.role !== 'PRIMARY')
            .map(i => NormalizationService.normalizeString(i.name))
            .filter(Boolean);
        const candSecondary = (candidateProduct.activeIngredients || [])
            .filter(i => i.role !== 'PRIMARY')
            .map(i => NormalizationService.normalizeString(i.name))
            .filter(Boolean);
        const targetSet = new Set(targetSecondary);
        const candSet = new Set(candSecondary);
        // If neither has secondary ingredients
        if (targetSet.size === 0 && candSet.size === 0) {
            return {
                score: 1.0,
                targetList: [],
                candidateList: [],
                overlap: [],
                different: [],
                explanation: 'Both products are single active ingredient formulations.'
            };
        }
        const overlap = [...targetSet].filter(x => candSet.has(x));
        const allUnique = new Set([...targetSet, ...candSet]);
        const different = [...allUnique].filter(x => !targetSet.has(x) || !candSet.has(x));
        const jaccardScore = allUnique.size > 0 ? overlap.length / allUnique.size : 1.0;
        let explanation = '';
        if (overlap.length > 0 && different.length === 0) {
            explanation = `Identical secondary ingredients (${overlap.join(', ')}).`;
        }
        else if (overlap.length > 0 && different.length > 0) {
            explanation = `Shared secondary: [${overlap.join(', ')}]. Distinct: [${different.join(', ')}].`;
        }
        else {
            explanation = `No secondary ingredient overlap. Target has: [${targetSecondary.join(', ') || 'None'}], Candidate has: [${candSecondary.join(', ') || 'None'}].`;
        }
        return {
            score: jaccardScore,
            targetList: [...targetSet],
            candidateList: [...candSet],
            overlap,
            different,
            explanation
        };
    }
    /**
     * Determine similarity classification level from percentage score
     */
    static getSimilarityLevel(score, thresholds) {
        if (score >= thresholds.veryHigh)
            return 'VERY_HIGH';
        if (score >= thresholds.high)
            return 'HIGH';
        if (score >= thresholds.moderate)
            return 'MODERATE';
        if (score >= thresholds.low)
            return 'LOW';
        return 'NOT_SIMILAR';
    }
    /**
     * Calculate deterministic similarity between target product and candidate product
     */
    static async calculateSimilarity(targetProduct, candidateProduct, customConfig) {
        const config = customConfig || await this.getActiveConfig();
        const reasons = [];
        const warnings = [];
        // 1. Primary Active Ingredient Match
        const targetPrimaryNorm = NormalizationService.normalizeString(targetProduct.primaryActiveIngredient?.normalizedName || targetProduct.primaryActiveIngredient?.name || '');
        const candPrimaryNorm = NormalizationService.normalizeString(candidateProduct.primaryActiveIngredient?.normalizedName || candidateProduct.primaryActiveIngredient?.name || '');
        const primaryCanonicalTarget = (await NormalizationService.resolveCanonical(targetPrimaryNorm)).normalized;
        const primaryCanonicalCand = (await NormalizationService.resolveCanonical(candPrimaryNorm)).normalized;
        const primaryMatched = Boolean(primaryCanonicalTarget &&
            primaryCanonicalCand &&
            primaryCanonicalTarget === primaryCanonicalCand);
        const primaryScore = primaryMatched ? 1.0 : 0.0;
        if (primaryMatched) {
            reasons.push(`✓ Same primary active ingredient: ${targetProduct.primaryActiveIngredient.name}`);
        }
        else {
            warnings.push(`✕ Different primary active ingredient (${targetProduct.primaryActiveIngredient?.name || 'N/A'} vs ${candidateProduct.primaryActiveIngredient?.name || 'N/A'})`);
        }
        // 2. Strength Comparison
        const strengthRes = StrengthNormalizer.calculateStrengthSimilarity(targetProduct.primaryActiveIngredient?.strength, targetProduct.primaryActiveIngredient?.unit, candidateProduct.primaryActiveIngredient?.strength, candidateProduct.primaryActiveIngredient?.unit);
        const strengthScore = strengthRes.score;
        if (strengthScore === 1.0) {
            reasons.push(`✓ ${strengthRes.explanation}`);
        }
        else if (strengthScore > 0.5) {
            reasons.push(`△ ${strengthRes.explanation}`);
        }
        else {
            warnings.push(`△ ${strengthRes.explanation}`);
        }
        // 3. Dosage Form Comparison
        const dosageRes = this.evaluateDosageForm(targetProduct.dosageForm, candidateProduct.dosageForm);
        const dosageScore = dosageRes.score;
        if (dosageScore >= 0.8) {
            reasons.push(`✓ ${dosageRes.explanation}`);
        }
        else {
            warnings.push(`△ ${dosageRes.explanation}`);
        }
        // 4. Secondary Ingredients Overlap
        const secondaryRes = this.evaluateSecondaryIngredients(targetProduct, candidateProduct);
        const secondaryScore = secondaryRes.score;
        if (secondaryRes.overlap.length > 0) {
            reasons.push(`✓ Shared secondary ingredient(s): ${secondaryRes.overlap.join(', ')}`);
        }
        if (secondaryRes.different.length > 0 && (targetProduct.activeIngredients?.length > 1 || candidateProduct.activeIngredients?.length > 1)) {
            warnings.push(`△ Different secondary formulation: ${secondaryRes.explanation}`);
        }
        // Weighted Score Calculation
        let totalScore = 0;
        if (primaryMatched) {
            totalScore = ((primaryScore * config.primaryIngredientWeight) +
                (strengthScore * config.strengthWeight) +
                (dosageScore * config.dosageFormWeight) +
                (secondaryScore * config.secondaryIngredientWeight));
        }
        else {
            // Severe penalty if primary ingredient does not match
            totalScore = ((0 * config.primaryIngredientWeight) +
                (strengthScore * 0.05) +
                (dosageScore * 0.05) +
                (secondaryScore * 0.10));
        }
        const percentageScore = Math.min(100, Math.max(0, Math.round(totalScore * 100)));
        const similarityLevel = this.getSimilarityLevel(percentageScore, config.thresholds);
        const isSimilar = primaryMatched && percentageScore >= config.thresholds.moderate;
        const targetStrengthStr = `${targetProduct.primaryActiveIngredient?.strength || ''} ${targetProduct.primaryActiveIngredient?.unit || ''}`.trim() || 'N/A';
        const candStrengthStr = `${candidateProduct.primaryActiveIngredient?.strength || ''} ${candidateProduct.primaryActiveIngredient?.unit || ''}`.trim() || 'N/A';
        return {
            targetProductId: String(targetProduct._id),
            candidateProductId: String(candidateProduct._id),
            candidateProduct,
            isSimilar,
            similarityLevel,
            score: Number(totalScore.toFixed(4)),
            percentageScore,
            componentScores: {
                primaryIngredientScore: Number((primaryScore * config.primaryIngredientWeight).toFixed(3)),
                strengthScore: Number((strengthScore * config.strengthWeight).toFixed(3)),
                dosageFormScore: Number((dosageScore * config.dosageFormWeight).toFixed(3)),
                secondaryIngredientScore: Number((secondaryScore * config.secondaryIngredientWeight).toFixed(3)),
            },
            reasons,
            warnings,
            comparison: {
                primaryIngredient: {
                    target: targetProduct.primaryActiveIngredient?.name || 'N/A',
                    candidate: candidateProduct.primaryActiveIngredient?.name || 'N/A',
                    matched: primaryMatched
                },
                strength: {
                    target: targetStrengthStr,
                    candidate: candStrengthStr,
                    matchPercentage: strengthRes.percentage
                },
                dosageForm: {
                    target: targetProduct.dosageForm,
                    candidate: candidateProduct.dosageForm,
                    matched: dosageRes.matched
                },
                secondaryIngredients: {
                    target: secondaryRes.targetList,
                    candidate: secondaryRes.candidateList,
                    overlap: secondaryRes.overlap,
                    different: secondaryRes.different
                }
            },
            requiresPharmacistReview: true
        };
    }
}
