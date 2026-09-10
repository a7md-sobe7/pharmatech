import { Request, Response, NextFunction } from 'express';
export declare class ShortageController {
    /**
     * GET /api/shortages
     * List all shortage entries, optionally filtered by urgency or status
     */
    static listShortages(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/shortages/stats
     * Summary counts broken down by urgency and status
     */
    static getShortageStats(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /api/shortages
     * Add a new shortage entry
     */
    static createShortage(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * PATCH /api/shortages/:id
     * Update an existing shortage entry
     */
    static updateShortage(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * DELETE /api/shortages/:id
     * Remove a shortage entry
     */
    static deleteShortage(req: Request, res: Response, next: NextFunction): Promise<void>;
}
