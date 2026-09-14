import { Router } from 'express';
import { InventoryController } from './inventoryController.js';
const router = Router();
router.get('/', InventoryController.listInventory);
router.get('/stats', InventoryController.getInventoryStats);
router.post('/', InventoryController.createInventoryItem);
router.patch('/:id', InventoryController.updateInventoryItem);
router.delete('/:id', InventoryController.deleteInventoryItem);
export const inventoryRoutes = router;
