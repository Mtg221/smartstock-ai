import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';

export const notificationsRouter = Router();

notificationsRouter.use(authenticate);

notificationsRouter.get('/', (_req, res) => res.json([]));
