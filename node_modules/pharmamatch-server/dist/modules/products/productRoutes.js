import { Router } from 'express';
import { ProductController } from './productController.js';
const router = Router();
router.get('/', ProductController.listProducts);
router.get('/search', ProductController.searchProducts);
router.get('/:id', ProductController.getProductById);
router.get('/:id/sources', ProductController.getProductSources);
export const productRoutes = router;
