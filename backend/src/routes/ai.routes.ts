import { Router } from 'express';
import { getForecasts, getRecommendations, analyzeTrends, detectAnomalies } from '../controllers/ai.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

export const aiRouter = Router();
aiRouter.use(authenticate);

aiRouter.get('/forecasts', authorize('admin', 'directeur', 'gestionnaire'), getForecasts);
aiRouter.get('/recommendations', authorize('admin', 'directeur', 'gestionnaire'), getRecommendations);
aiRouter.get('/trends', authorize('admin', 'directeur'), analyzeTrends);
aiRouter.get('/anomalies', authorize('admin'), detectAnomalies);
