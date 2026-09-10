import { Request, Response, NextFunction } from 'express';
import Fuse from 'fuse.js';
import { DrugProduct } from '../../models/DrugProduct.js';
import { PharmacyInventory } from '../../models/PharmacyInventory.js';
import { NormalizationService } from '../ingredients/normalizationService.js';
import { AppError } from '../../middleware/errorHandler.js';
import { logAudit } from '../../middleware/audit.js';

export class ProductController {
  /**
   * List all products with optional filters and pagination
   */
  public static async listProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, parseInt(req.query.limit as string) || 20);
      const therapeuticClass = req.query.therapeuticClass as string;
      const skip = (page - 1) * limit;

      const query: any = {};
      if (therapeuticClass) {
        query.therapeuticClass = new RegExp(therapeuticClass, 'i');
      }

      const [products, total] = await Promise.all([
        DrugProduct.find(query).skip(skip).limit(limit).lean(),
        DrugProduct.countDocuments(query)
      ]);

      // Enrich products with inventory status
      const productIds = products.map(p => String(p._id));
      const inventoryList = await PharmacyInventory.find({ drugProductId: { $in: productIds } }).lean();
      const inventoryMap = new Map(inventoryList.map(inv => [inv.drugProductId, inv]));

      const enrichedProducts = products.map(p => {
        const inv = inventoryMap.get(String(p._id));
        return {
          ...p,
          inventory: inv || {
            status: 'OUT_OF_STOCK',
            quantity: 0,
            availableQuantity: 0,
            price: 0
          }
        };
      });

      res.json({
        success: true,
        data: {
          products: enrichedProducts,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Multi-layered smart search (Exact, Canonical, Arabic, Fuzzy)
   */
  public static async searchProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const queryStr = (req.query.q as string || '').trim();
      if (!queryStr) {
        res.json({ success: true, data: { results: [], query: '' } });
        return;
      }

      const normalizedInput = NormalizationService.normalizeString(queryStr);
      await logAudit('SEARCH_PRODUCT', req as any, queryStr, { normalizedInput });

      // 1. Direct Regex / Text Search on Normalized & Arabic Names
      const directMatches = await DrugProduct.find({
        $or: [
          { normalizedName: new RegExp(normalizedInput, 'i') },
          { productName: new RegExp(queryStr, 'i') },
          { brandName: new RegExp(queryStr, 'i') },
          { genericName: new RegExp(queryStr, 'i') },
          { arabicName: new RegExp(queryStr, 'i') },
          { 'primaryActiveIngredient.normalizedName': new RegExp(normalizedInput, 'i') },
          { 'activeIngredients.normalizedName': new RegExp(normalizedInput, 'i') }
        ]
      }).limit(15).lean();

      let results = directMatches;

      // 2. If no direct matches, perform fuzzy search using MongoDB text index
      if (results.length === 0 && queryStr.length > 2) {
        results = await DrugProduct.find(
          { $text: { $search: queryStr } },
          { score: { $meta: 'textScore' } }
        )
        .sort({ score: { $meta: 'textScore' } })
        .limit(10)
        .lean();
      }

      // Enrich with real inventory details
      const productIds = results.map(p => String(p._id));
      const inventoryList = await PharmacyInventory.find({ drugProductId: { $in: productIds } }).lean();
      const inventoryMap = new Map(inventoryList.map(inv => [inv.drugProductId, inv]));

      const enrichedResults = results.map(p => {
        const inv = inventoryMap.get(String(p._id));
        return {
          ...p,
          inventory: inv || {
            status: 'OUT_OF_STOCK',
            quantity: 0,
            availableQuantity: 0,
            price: 0
          }
        };
      });

      res.json({
        success: true,
        data: {
          query: queryStr,
          normalizedQuery: normalizedInput,
          count: enrichedResults.length,
          results: enrichedResults
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single product by ID with full provenance and inventory status
   */
  public static async getProductById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const product = await DrugProduct.findById(id).lean();

      if (!product) {
        throw new AppError('Product not found in Drug Knowledge Database.', 404, 'PRODUCT_NOT_FOUND');
      }

      const inventory = await PharmacyInventory.findOne({ drugProductId: id }).lean();

      await logAudit('VIEW_PRODUCT_DETAILS', req as any, String(product._id), { productName: product.productName });

      res.json({
        success: true,
        data: {
          product,
          inventory: inventory || {
            status: 'OUT_OF_STOCK',
            quantity: 0,
            availableQuantity: 0,
            price: 0
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get authoritative sources and provenance for a product
   */
  public static async getProductSources(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const product = await DrugProduct.findById(id, 'productName source sourceUrl references lastVerifiedAt primaryActiveIngredient').lean();

      if (!product) {
        throw new AppError('Product not found.', 404, 'PRODUCT_NOT_FOUND');
      }

      res.json({
        success: true,
        data: {
          productId: id,
          productName: product.productName,
          primaryIngredientProvenance: {
            ingredient: product.primaryActiveIngredient?.name,
            confidence: product.primaryActiveIngredient?.confidence,
            source: product.primaryActiveIngredient?.source
          },
          primarySource: {
            name: product.source,
            url: product.sourceUrl,
            lastVerifiedAt: product.lastVerifiedAt
          },
          references: product.references || []
        }
      });
    } catch (error) {
      next(error);
    }
  }
}
