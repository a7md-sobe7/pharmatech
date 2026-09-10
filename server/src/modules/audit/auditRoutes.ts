import { Router } from 'express';
import { AuditController } from './auditController.js';

const router = Router();

router.get('/logs', AuditController.getLogs);
router.post('/feedback', AuditController.submitFeedback);
router.get('/feedback/stats', AuditController.getFeedbackStats);

export const auditRoutes = router;
