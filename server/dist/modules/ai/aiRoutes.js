import { Router } from 'express';
import { AIController } from './aiController.js';
const router = Router();
router.post('/query', AIController.processQuery);
router.get('/tools', AIController.getTools);
export const aiRoutes = router;
