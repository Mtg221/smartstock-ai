import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';

export const categoriesRouter = Router();

categoriesRouter.use(authenticate);

categoriesRouter.get('/', (_req, res) => res.json([]));
