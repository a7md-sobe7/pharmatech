import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.js';
export declare class AuthController {
    static register(req: Request, res: Response, next: NextFunction): Promise<void>;
    static login(req: Request, res: Response, next: NextFunction): Promise<void>;
    static sendOtp(req: Request, res: Response, next: NextFunction): Promise<void>;
    static verifyOtp(req: Request, res: Response, next: NextFunction): Promise<void>;
    static me(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
}
