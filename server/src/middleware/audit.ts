import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.js';
import { AuditLog } from '../models/AuditLog.js';

export const logAudit = async (
  action: string,
  req: AuthenticatedRequest,
  target?: string,
  metadata: Record<string, any> = {},
  status: 'SUCCESS' | 'WARNING' | 'ERROR' = 'SUCCESS'
) => {
  try {
    const ipAddress = req.ip || req.socket.remoteAddress || '127.0.0.1';
    await AuditLog.create({
      userId: req.user?.id || 'anonymous',
      userName: req.user?.name || 'Anonymous User',
      userRole: req.user?.role || 'GUEST',
      action,
      target,
      metadata,
      resultStatus: status,
      ipAddress
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
};
