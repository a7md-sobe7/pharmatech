import { Router } from 'express';
import { InventoryController } from './inventoryController.js';

const router = Router();

router.get('/', InventoryController.listInventory);
router.get('/stats', InventoryController.getInventoryStats);
router.patch('/:id', InventoryController.updateInventoryItem);

export const inventoryRoutes = router;
