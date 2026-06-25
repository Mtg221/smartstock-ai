import { Router } from 'express';
import {
  getProducts, getProductById, createProduct, updateProduct,
  deleteProduct, getLowStockProducts, getDashboardStats,
} from '../controllers/products.controller';
import { authenticate, authorize, auditLog } from '../middlewares/auth.middleware';

export const productsRouter = Router();

productsRouter.use(authenticate);

productsRouter.get('/stats/dashboard', getDashboardStats);
productsRouter.get('/alerts/low-stock', getLowStockProducts);

productsRouter.get('/', getProducts);
productsRouter.get('/:id', getProductById);
productsRouter.post('/', authorize('admin', 'gestionnaire'), auditLog('CREATE', 'product'), createProduct);
productsRouter.patch('/:id', authorize('admin', 'gestionnaire'), auditLog('UPDATE', 'product'), updateProduct);
productsRouter.delete('/:id', authorize('admin'), auditLog('DELETE', 'product'), deleteProduct);
