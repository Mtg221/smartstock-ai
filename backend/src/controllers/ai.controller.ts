import { Response } from 'express';
import { prisma } from '../config/prisma';
import { redis } from '../config/redis';
import { AuthRequest } from '../middlewares/auth.middleware';
import { logger } from '../utils/logger';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://ai-service:8000';

// Prévisions de rupture de stock
export const getForecasts = async (req: AuthRequest, res: Response) => {
  try {
    const cacheKey = `forecasts:${req.user!.companyId}`;
    const cached = await redis.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));

    // Récupérer historique ventes des 90 derniers jours
    const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const salesData = await prisma.saleItem.findMany({
      where: { sale: { companyId: req.user!.companyId, saleDate: { gte: since } } },
      include: {
        product: { select: { id: true, name: true, quantity: true, alertThreshold: true } },
        sale: { select: { saleDate: true } },
      },
    });

    // Appel au service IA Python
    const aiResponse = await fetch(`${AI_SERVICE_URL}/forecast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ salesData, companyId: req.user!.companyId }),
    });

    if (!aiResponse.ok) throw new Error('Service IA indisponible');

    const forecasts = await aiResponse.json() as Array<{
      productId: string; predictedDemand: number; forecastDate: string;
      confidenceScore: number; riskLevel: string;
    }>;

    // Persister les prévisions
    for (const f of forecasts) {
      await prisma.forecast.create({
        data: {
          productId: f.productId,
          predictedDemand: f.predictedDemand,
          forecastDate: new Date(f.forecastDate),
          confidenceScore: f.confidenceScore,
          riskLevel: f.riskLevel,
        },
      });
    }

    await redis.set(cacheKey, JSON.stringify(forecasts), 'EX', 3600); // Cache 1h
    return res.json(forecasts);
  } catch (err) {
    logger.error('getForecasts error', err);
    // Fallback : renvoyer les dernières prévisions en base
    const forecasts = await prisma.forecast.findMany({
      where: { product: { companyId: req.user!.companyId } },
      include: { product: { select: { name: true, quantity: true } } },
      orderBy: { generatedAt: 'desc' },
      take: 20,
    });
    return res.json(forecasts);
  }
};

// Recommandations d'achat
export const getRecommendations = async (req: AuthRequest, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      where: { companyId: req.user!.companyId, isActive: true },
      include: {
        forecasts: { orderBy: { generatedAt: 'desc' }, take: 1 },
      },
    });

    const aiResponse = await fetch(`${AI_SERVICE_URL}/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ products }),
    });

    if (!aiResponse.ok) throw new Error('Service IA indisponible');

    const recommendations = await aiResponse.json() as Array<{
      productId: string; quantity: number; reasoning: string;
    }>;

    // Sauvegarder recommandations
    for (const r of recommendations) {
      await prisma.aIRecommendation.create({
        data: {
          productId: r.productId,
          recommendedQuantity: r.quantity,
          reasoning: r.reasoning,
        },
      });
    }

    return res.json(recommendations);
  } catch (err) {
    logger.error('getRecommendations error', err);
    const existing = await prisma.aIRecommendation.findMany({
      where: { product: { companyId: req.user!.companyId }, isApplied: false },
      include: { product: { select: { name: true, quantity: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    return res.json(existing);
  }
};

// Analyse des tendances
export const analyzeTrends = async (req: AuthRequest, res: Response) => {
  try {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const salesData = await prisma.sale.findMany({
      where: { companyId: req.user!.companyId, saleDate: { gte: since } },
      include: { saleItems: { include: { product: { include: { category: true } } } } },
    });

    const aiResponse = await fetch(`${AI_SERVICE_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ salesData }),
    });

    if (!aiResponse.ok) throw new Error('Service IA indisponible');
    return res.json(await aiResponse.json());
  } catch (err) {
    logger.error('analyzeTrends error', err);
    return res.status(503).json({ error: 'Service IA temporairement indisponible' });
  }
};

// Détection d'anomalies
export const detectAnomalies = async (req: AuthRequest, res: Response) => {
  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const movements = await prisma.inventoryMovement.findMany({
      where: { product: { companyId: req.user!.companyId }, movedAt: { gte: since } },
      include: { product: { select: { name: true } } },
    });

    const aiResponse = await fetch(`${AI_SERVICE_URL}/anomalies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ movements }),
    });

    if (!aiResponse.ok) throw new Error('Service IA indisponible');
    return res.json(await aiResponse.json());
  } catch (err) {
    logger.error('detectAnomalies error', err);
    return res.status(503).json({ error: 'Service IA temporairement indisponible' });
  }
};
