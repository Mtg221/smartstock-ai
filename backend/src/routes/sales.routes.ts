// sales.routes.ts
import { Router } from 'express';
import { createSale, getSales, getSaleStats, cancelSale } from '../controllers/sales.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

export const salesRouter = Router();
salesRouter.use(authenticate);
salesRouter.get('/', getSales);
salesRouter.get('/stats', authorize('admin', 'directeur', 'gestionnaire'), getSaleStats);
salesRouter.post('/', authorize('admin', 'gestionnaire', 'employe'), createSale);
salesRouter.patch('/:id/cancel', authorize('admin', 'gestionnaire'), cancelSale);
