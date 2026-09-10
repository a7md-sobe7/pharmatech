import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../types/index.js';
export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: UserRole;
        name: string;
        pharmacyName?: string;
    };
}
export declare const authenticate: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const requireRole: (...roles: UserRole[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
