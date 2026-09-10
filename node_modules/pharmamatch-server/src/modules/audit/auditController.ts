import { Request, Response, NextFunction } from 'express';
import { AuditLog } from '../../models/AuditLog.js';
import { PharmacistFeedback } from '../../models/PharmacistFeedback.js';
import { AppError } from '../../middleware/errorHandler.js';

export class AuditController {
  /**
   * Get paginated audit logs
   */
  public static async getLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, parseInt(req.query.limit as string) || 25);
      const action = req.query.action as string;
      const skip = (page - 1) * limit;

      const query: any = {};
      if (action && action !== 'ALL') {
        query.action = action;
      }

      const [logs, total] = await Promise.all([
        AuditLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        AuditLog.countDocuments(query)
      ]);

      res.json({
        success: true,
        data: {
          logs,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Submit pharmacist feedback for a similarity recommendation
   */
  public static async submitFeedback(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { targetProductId, targetProductName, candidateProductId, candidateProductName, calculatedScore, similarityLevel, rating, notes } = req.body;

      if (!targetProductId || !candidateProductId || !rating) {
        throw new AppError('targetProductId, candidateProductId, and rating are required.', 400, 'VALIDATION_ERROR');
      }

      const user = (req as any).user || { id: 'anonymous-pharmacist', name: 'Dr. Pharmacist' };

      const feedback = new PharmacistFeedback({
        pharmacistId: user.id,
        pharmacistName: user.name,
        targetProductId,
        targetProductName: targetProductName || 'Target Drug',
        candidateProductId,
        candidateProductName: candidateProductName || 'Candidate Drug',
        calculatedScore: calculatedScore || 0,
        similarityLevel: similarityLevel || 'HIGH',
        rating,
        notes
      });

      await feedback.save();

      res.status(201).json({
        success: true,
        message: 'Pharmacist feedback recorded successfully.',
        data: { feedback }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get feedback summary metrics
   */
  public static async getFeedbackStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const [total, useful, notUseful, notSuitable, recentFeedback] = await Promise.all([
        PharmacistFeedback.countDocuments(),
        PharmacistFeedback.countDocuments({ rating: 'USEFUL' }),
        PharmacistFeedback.countDocuments({ rating: 'NOT_USEFUL' }),
        PharmacistFeedback.countDocuments({ rating: 'NOT_CLINICALLY_SUITABLE' }),
        PharmacistFeedback.find().sort({ createdAt: -1 }).limit(10).lean()
      ]);

      res.json({
        success: true,
        data: {
          total,
          useful,
          notUseful,
          notClinicallySuitable: notSuitable,
          acceptanceRate: total > 0 ? Math.round((useful / total) * 100) : 100,
          recentFeedback
        }
      });
    } catch (error) {
      next(error);
    }
  }
}
