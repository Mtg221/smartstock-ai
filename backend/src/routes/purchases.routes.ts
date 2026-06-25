import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';

export const purchasesRouter = Router();

purchasesRouter.use(authenticate);

purchasesRouter.get('/', (_req, res) => res.json([]));
