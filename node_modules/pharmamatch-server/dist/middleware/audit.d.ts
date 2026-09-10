import { AuthenticatedRequest } from './auth.js';
export declare const logAudit: (action: string, req: AuthenticatedRequest, target?: string, metadata?: Record<string, any>, status?: "SUCCESS" | "WARNING" | "ERROR") => Promise<void>;
