import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';

export const reportsRouter = Router();

reportsRouter.use(authenticate);

reportsRouter.get('/', (_req, res) => res.json([]));
