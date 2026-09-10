import { Request, Response, NextFunction } from 'express';
export declare class AIController {
    /**
     * Process Natural Language Query with Tool Execution Trace
     */
    static processQuery(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get List of Registered AI Tools and Schemas
     */
    static getTools(req: Request, res: Response, next: NextFunction): Promise<void>;
}
