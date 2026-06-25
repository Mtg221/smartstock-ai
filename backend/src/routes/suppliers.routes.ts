import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';

export const suppliersRouter = Router();

suppliersRouter.use(authenticate);

suppliersRouter.get('/', (_req, res) => res.json([]));
