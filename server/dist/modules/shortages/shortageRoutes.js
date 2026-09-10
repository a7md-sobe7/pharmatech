import { Router } from 'express';
import { ShortageController } from './shortageController.js';
const router = Router();
router.get('/', ShortageController.listShortages);
router.get('/stats', ShortageController.getShortageStats);
router.post('/', ShortageController.createShortage);
router.patch('/:id', ShortageController.updateShortage);
router.delete('/:id', ShortageController.deleteShortage);
export const shortageRoutes = router;
