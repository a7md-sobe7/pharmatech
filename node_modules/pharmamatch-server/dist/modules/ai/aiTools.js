import { DrugProduct } from '../../models/DrugProduct.js';
import { PharmacyInventory } from '../../models/PharmacyInventory.js';
import { SimilarityEngine } from '../similarity/similarityEngine.js';
import { NormalizationService } from '../ingredients/normalizationService.js';
export const AI_TOOL_DEFINITIONS = [
    {
        name: 'searchProduct',
        description: 'Searches the Drug Knowledge Database and Pharmacy Inventory by medication name (supports English, Arabic, and fuzzy matching).',
        parameters: {
            type: 'object',
            properties: {
                query: { type: 'string', description: 'The brand, generic, or Arabic medication name to search for (e.g., "Calmag", "كالماج", "Augmentin")' }
            },
            required: ['query']
        }
    },
    {
        name: 'getProductDetails',
        description: 'Retrieves comprehensive authoritative details of a drug product including ingredients, dosage form, manufacturer, and warnings.',
        parameters: {
            type: 'object',
            properties: {
                productId: { type: 'string', description: 'The unique MongoDB ID of the product.' }
            },
            required: ['productId']
        }
    },
    {
        name: 'getPrimaryIngredient',
        description: 'Extracts the primary active ingredient with confidence level and provenance for a given drug product.',
        parameters: {
            type: 'object',
            properties: {
                productId: { type: 'string', description: 'The product ID.' }
            },
            required: ['productId']
        }
    },
    {
        name: 'checkPharmacyInventory',
        description: 'Checks real-time inventory for a product: stock quantity, batch number, expiration date, and availability status.',
        parameters: {
            type: 'object',
            properties: {
                productId: { type: 'string', description: 'The product ID.' }
            },
            required: ['productId']
        }
    },
    {
        name: 'getAvailableSimilarProducts',
        description: 'Finds candidate products that share the same primary active ingredient AND are currently available in the pharmacy inventory (excludes out of stock and expired).',
        parameters: {
            type: 'object',
            properties: {
                targetProductId: { type: 'string', description: 'The ID of the unavailable requested product.' }
            },
            required: ['targetProductId']
        }
    },
    {
        name: 'calculateSimilarity',
        description: 'Calculates the deterministic similarity score between a target drug and a candidate drug based on active ingredient, strength, form, and secondary components.',
        parameters: {
            type: 'object',
            properties: {
                targetProductId: { type: 'string', description: 'Target product ID' },
                candidateProductId: { type: 'string', description: 'Candidate product ID' }
            },
            required: ['targetProductId', 'candidateProductId']
        }
    },
    {
        name: 'getProductSources',
        description: 'Retrieves authoritative regulatory provenance and monograph references (DailyMed, FDA, EMA) for a drug.',
        parameters: {
            type: 'object',
            properties: {
                productId: { type: 'string', description: 'The product ID.' }
            },
            required: ['productId']
        }
    }
];
export class AIToolsExecutor {
    static async executeTool(toolName, args) {
        switch (toolName) {
            case 'searchProduct': {
                const query = (args.query || '').trim();
                const norm = NormalizationService.normalizeString(query);
                // Escape regex special characters to prevent crashes
                const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const safeQuery = escapeRegExp(query);
                const safeNorm = escapeRegExp(norm);
                let products = await DrugProduct.find({
                    $or: [
                        { normalizedName: new RegExp(safeNorm, 'i') },
                        { productName: new RegExp(safeQuery, 'i') },
                        { brandName: new RegExp(safeQuery, 'i') },
                        { arabicName: new RegExp(safeQuery, 'i') },
                        { 'primaryActiveIngredient.normalizedName': new RegExp(safeNorm, 'i') }
                    ]
                }).limit(5).lean();
                if (products.length === 0 && query.length > 2) {
                    // Fallback to MongoDB text index search (much faster than loading 25k items into memory for Fuse)
                    products = await DrugProduct.find({ $text: { $search: query } }, { score: { $meta: 'textScore' } })
                        .sort({ score: { $meta: 'textScore' } })
                        .limit(5)
                        .lean();
                }
                // Enrich with inventory status
                const productIds = products.map(p => String(p._id));
                const inventoryList = await PharmacyInventory.find({ drugProductId: { $in: productIds } }).lean();
                const invMap = new Map(inventoryList.map(i => [i.drugProductId, i]));
                return {
                    query,
                    found: products.length > 0,
                    results: products.map(p => ({
                        id: String(p._id),
                        productName: p.productName,
                        arabicName: p.arabicName,
                        brandName: p.brandName,
                        genericName: p.genericName,
                        primaryIngredient: p.primaryActiveIngredient?.name,
                        dosageForm: p.dosageForm,
                        stockStatus: invMap.get(String(p._id))?.status || 'OUT_OF_STOCK',
                        availableQuantity: invMap.get(String(p._id))?.availableQuantity || 0,
                        price: invMap.get(String(p._id))?.price || 0
                    }))
                };
            }
            case 'getProductDetails': {
                const product = await DrugProduct.findById(args.productId).lean();
                if (!product)
                    return { error: 'Product not found' };
                const inv = await PharmacyInventory.findOne({ drugProductId: args.productId }).lean();
                return {
                    product,
                    inventory: inv || { status: 'OUT_OF_STOCK', availableQuantity: 0 }
                };
            }
            case 'getPrimaryIngredient': {
                const product = await DrugProduct.findById(args.productId).lean();
                if (!product)
                    return { error: 'Product not found' };
                return {
                    productId: args.productId,
                    productName: product.productName,
                    primaryActiveIngredient: product.primaryActiveIngredient
                };
            }
            case 'checkPharmacyInventory': {
                const inv = await PharmacyInventory.findOne({ drugProductId: args.productId }).lean();
                if (!inv)
                    return { available: false, status: 'NOT_IN_INVENTORY', availableQuantity: 0 };
                const now = new Date();
                const isExpired = inv.expirationDate && new Date(inv.expirationDate) <= now;
                return {
                    productId: args.productId,
                    productName: inv.productName,
                    quantity: inv.quantity,
                    availableQuantity: inv.availableQuantity,
                    status: isExpired ? 'EXPIRED' : inv.status,
                    price: inv.price,
                    currency: inv.currency,
                    batchNumber: inv.batchNumber,
                    expirationDate: inv.expirationDate,
                    storageLocation: inv.storageLocation,
                    isAvailableInStock: inv.availableQuantity > 0 && inv.status === 'AVAILABLE' && !isExpired
                };
            }
            case 'getAvailableSimilarProducts': {
                const target = await DrugProduct.findById(args.targetProductId).lean();
                if (!target)
                    return { error: 'Target product not found' };
                const allCandidates = await DrugProduct.find({ _id: { $ne: target._id } }).lean();
                const config = await SimilarityEngine.getActiveConfig();
                const matched = [];
                const now = new Date();
                for (const cand of allCandidates) {
                    const sim = await SimilarityEngine.calculateSimilarity(target, cand, config);
                    const inv = await PharmacyInventory.findOne({ drugProductId: String(cand._id) }).lean();
                    const isExpired = inv?.expirationDate && new Date(inv.expirationDate) <= now;
                    const isAvailable = inv && inv.availableQuantity > 0 && inv.status !== 'OUT_OF_STOCK' && inv.status !== 'EXPIRED' && !isExpired;
                    if (sim.isSimilar && isAvailable) {
                        matched.push({
                            productId: String(cand._id),
                            productName: cand.productName,
                            arabicName: cand.arabicName,
                            brandName: cand.brandName,
                            primaryIngredient: cand.primaryActiveIngredient?.name,
                            dosageForm: cand.dosageForm,
                            strength: `${cand.primaryActiveIngredient?.strength || ''} ${cand.primaryActiveIngredient?.unit || ''}`.trim(),
                            similarityScore: sim.score,
                            percentageScore: sim.percentageScore,
                            similarityLevel: sim.similarityLevel,
                            reasons: sim.reasons,
                            warnings: sim.warnings,
                            availableQuantity: inv.availableQuantity,
                            price: inv.price,
                            batchNumber: inv.batchNumber,
                            storageLocation: inv.storageLocation
                        });
                    }
                }
                matched.sort((a, b) => b.percentageScore - a.percentageScore);
                return {
                    targetProduct: target.productName,
                    primaryActiveIngredient: target.primaryActiveIngredient.name,
                    availableSimilarProductsCount: matched.length,
                    candidates: matched
                };
            }
            case 'calculateSimilarity': {
                const [target, cand] = await Promise.all([
                    DrugProduct.findById(args.targetProductId).lean(),
                    DrugProduct.findById(args.candidateProductId).lean()
                ]);
                if (!target || !cand)
                    return { error: 'One or both products not found' };
                const sim = await SimilarityEngine.calculateSimilarity(target, cand);
                return sim;
            }
            case 'getProductSources': {
                const product = await DrugProduct.findById(args.productId).lean();
                if (!product)
                    return { error: 'Product not found' };
                return {
                    productId: String(product._id),
                    productName: product.productName,
                    source: product.source,
                    sourceUrl: product.sourceUrl,
                    lastVerifiedAt: product.lastVerifiedAt,
                    references: product.references
                };
            }
            default:
                return { error: `Tool ${toolName} not recognized.` };
        }
    }
}
