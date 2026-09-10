import { Request, Response, NextFunction } from 'express';
export declare class AuditController {
    /**
     * Get paginated audit logs
     */
    static getLogs(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Submit pharmacist feedback for a similarity recommendation
     */
    static submitFeedback(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get feedback summary metrics
     */
    static getFeedbackStats(req: Request, res: Response, next: NextFunction): Promise<void>;
}
