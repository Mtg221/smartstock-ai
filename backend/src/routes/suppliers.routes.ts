import { Router } from 'express';
import { authenticate, authorize, auditLog } from '../middlewares/auth.middleware';
import {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from '../controllers/suppliers.controller';

export const suppliersRouter = Router();

suppliersRouter.use(authenticate);

suppliersRouter.get('/', getSuppliers);
suppliersRouter.post('/', authorize('admin', 'gestionnaire'), auditLog('create', 'supplier'), createSupplier);
suppliersRouter.put('/:id', authorize('admin', 'gestionnaire'), auditLog('update', 'supplier'), updateSupplier);
suppliersRouter.delete('/:id', authorize('admin'), auditLog('delete', 'supplier'), deleteSupplier);
