import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';

export const usersRouter = Router();

usersRouter.use(authenticate);

usersRouter.get('/', (_req, res) => res.json([]));
