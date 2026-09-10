import { Request, Response, NextFunction } from 'express';
export declare class InventoryController {
    /**
     * List inventory items with filtering and pagination
     */
    static listInventory(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get pharmacy inventory high-level statistics for dashboard
     */
    static getInventoryStats(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Update stock or batch details
     */
    static updateInventoryItem(req: Request, res: Response, next: NextFunction): Promise<void>;
}
