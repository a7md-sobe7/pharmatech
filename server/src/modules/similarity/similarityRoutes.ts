import { Router } from 'express';
import { SimilarityController } from './similarityController.js';

const router = Router();

router.get('/similar/:id', SimilarityController.findSimilar);
router.post('/compare', SimilarityController.compare);
router.get('/config', SimilarityController.getConfig);
router.patch('/config', SimilarityController.updateConfig);

export const similarityRoutes = router;
