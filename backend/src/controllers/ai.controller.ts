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
    let cached = null;
    try {
      cached = await redis.get(cacheKey);
    } catch (e) {
      // Redis non disponible, continuer sans cache
    }
    if (cached) return res.json(JSON.parse(cached));

    // Prévisions fallback depuis la base
    const forecasts = await prisma.forecast.findMany({
      where: { product: { companyId: req.user!.companyId } },
      include: { product: { select: { name: true, quantity: true, alertThreshold: true } } },
      orderBy: { generatedAt: 'desc' },
      take: 20,
    });

    // Formater les données
    const formattedForecasts = forecasts.map(f => ({
      productId: f.productId,
      productName: f.product.name,
      currentStock: f.product.quantity,
      alertThreshold: f.product.alertThreshold,
      predictedDemand: f.predictedDemand,
      forecastDate: f.forecastDate,
      confidenceScore: f.confidenceScore,
      riskLevel: f.riskLevel,
      daysUntilStockout: Math.floor(f.product.quantity / Math.max(1, f.predictedDemand)),
      avgDailySales: Math.round(f.predictedDemand / 30),
    }));

    return res.json(formattedForecasts);
  } catch (err) {
    logger.error('getForecasts error', err);
    return res.status(500).json({ error: 'Erreur lors de la récupération des prévisions' });
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

    // Générer des recommandations basiques côté serveur
    const recommendations = products.map(p => {
      const forecast = p.forecasts[0];
      const predictedDemand = forecast?.predictedDemand ?? 0;
      const stockNeeded = Math.max(0, predictedDemand - p.quantity);
      const urgency = stockNeeded > p.quantity * 2 ? 'critical' 
        : stockNeeded > p.quantity ? 'high' 
        : stockNeeded > 0 ? 'medium' 
        : 'low';
      
      return {
        productId: p.id,
        productName: p.name,
        currentStock: p.quantity,
        predictedDemand30d: Math.round(predictedDemand),
        quantity: Math.ceil(stockNeeded),
        estimatedCost: Math.ceil(stockNeeded) * Number(p.purchasePrice ?? 0),
        urgency,
        reasoning: `Basé sur la demande prévue de ${Math.round(predictedDemand)} unités pour les 30 prochains jours`,
      };
    }).filter(r => r.quantity > 0);

    return res.json(recommendations);
  } catch (err) {
    logger.error('getRecommendations error', err);
    return res.status(500).json({ error: 'Erreur lors de la récupération des recommandations' });
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

    // Analyse basique des tendances
    const topProducts: Record<string, number> = {};
    salesData.forEach(sale => {
      sale.saleItems.forEach(item => {
        topProducts[item.product.name] = (topProducts[item.product.name] || 0) + item.quantity;
      });
    });

    const sorted = Object.entries(topProducts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, quantity]) => ({ productName: name, quantity }));

    const insights = sorted.map((p, i) => ({
      message: `Le produit "${p.productName}" est parmi les plus vendus avec ${p.quantity} unités`,
      recommendation: `Assurez-vous de maintenir un stock suffisant pour ce produit`,
    }));

    return res.json({ insights, topProducts: sorted });
  } catch (err) {
    logger.error('analyzeTrends error', err);
    return res.status(500).json({ error: 'Erreur lors de l\'analyse des tendances' });
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

    // Détection basique d'anomalies
    const anomalies: any[] = [];
    const productMovements: Record<string, number[]> = {};
    
    movements.forEach(m => {
      if (!productMovements[m.productId]) productMovements[m.productId] = [];
      productMovements[m.productId].push(m.quantityChange);
    });

    Object.entries(productMovements).forEach(([productId, quantities]) => {
      if (quantities.length < 3) return;
      const avg = quantities.reduce((a, b) => a + b, 0) / quantities.length;
      const stdDev = Math.sqrt(quantities.reduce((sum, q) => sum + Math.pow(q - avg, 2), 0) / quantities.length);
      
      quantities.forEach((q, i) => {
        if (Math.abs(q - avg) > 2 * stdDev) {
          const movement = movements.find(m => m.productId === productId && m.quantityChange === q);
          if (movement) {
            anomalies.push({
              productId,
              productName: movement.product.name,
              type: 'quantity_spike',
              description: `Mouvement inhabituel : ${q} unités (moyenne: ${avg.toFixed(0)})`,
              date: movement.movedAt,
            });
          }
        }
      });
    });

    return res.json({ anomalies });
  } catch (err) {
    logger.error('detectAnomalies error', err);
    return res.status(500).json({ error: 'Erreur lors de la détection des anomalies' });
  }
};
