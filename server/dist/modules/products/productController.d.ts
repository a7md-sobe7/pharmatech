import { Request, Response, NextFunction } from 'express';
export declare class ProductController {
    /**
     * List all products with optional filters and pagination
     */
    static listProducts(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Multi-layered smart search (Exact, Canonical, Arabic, Fuzzy)
     */
    static searchProducts(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get single product by ID with full provenance and inventory status
     */
    static getProductById(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get authoritative sources and provenance for a product
     */
    static getProductSources(req: Request, res: Response, next: NextFunction): Promise<void>;
}
