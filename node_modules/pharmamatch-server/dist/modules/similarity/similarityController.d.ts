import { Request, Response, NextFunction } from 'express';
export declare class SimilarityController {
    /**
     * Find similar candidate products for a target drug product
     * Cross-references against pharmacy inventory
     */
    static findSimilar(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Side-by-side comparison between two specific products
     */
    static compare(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get active similarity scoring weights and thresholds
     */
    static getConfig(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Update similarity scoring weights and thresholds (Admin)
     */
    static updateConfig(req: Request, res: Response, next: NextFunction): Promise<void>;
}
