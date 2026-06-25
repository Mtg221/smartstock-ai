import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '../config/prisma';
import { authenticate } from '../middlewares/auth.middleware';
import { AuthRequest } from '../middlewares/auth.middleware';
import { Response } from 'express';
import { logger } from '../utils/logger';

export const chatRouter = Router();
chatRouter.use(authenticate);

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

chatRouter.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { message, history = [] } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: 'Message requis' });

    const companyId = req.user!.companyId;

    const [products, stats, recentSales] = await Promise.all([
      prisma.product.findMany({
        where: { companyId, isActive: true },
        select: { name: true, sku: true, quantity: true, alertThreshold: true, salePrice: true, purchasePrice: true },
        orderBy: { quantity: 'asc' },
        take: 50,
      }),
      prisma.sale.aggregate({
        where: {
          companyId,
          status: { not: 'cancelled' },
          saleDate: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
        _sum: { totalAmount: true },
        _count: true,
      }),
      prisma.sale.findMany({
        where: { companyId, status: { not: 'cancelled' } },
        orderBy: { saleDate: 'desc' },
        take: 5,
        select: { totalAmount: true, saleDate: true },
      }),
    ]);

    const lowStock = products.filter(p => p.quantity <= p.alertThreshold);
    const totalProducts = products.length;

    const context = `
Tu es l'assistant IA de SmartStock AI, une application de gestion de stock pour PME africaines.
Tu aides l'utilisateur à analyser ses données et prendre des décisions.
Réponds toujours en français, de façon concise et actionnable.
Utilise des emojis pour rendre tes réponses plus lisibles.

=== DONNÉES DE L'ENTREPRISE (temps réel) ===

📦 STOCK (${totalProducts} produits actifs) :
${products.map(p => `- ${p.name} (${p.sku}): ${p.quantity} unités (seuil: ${p.alertThreshold}) — Prix vente: ${Number(p.salePrice).toLocaleString('fr-SN')} FCFA`).join('\n')}

⚠️ PRODUITS EN STOCK BAS (${lowStock.length}) :
${lowStock.length === 0 ? 'Aucun produit en stock bas' : lowStock.map(p => `- ${p.name}: ${p.quantity}/${p.alertThreshold} unités`).join('\n')}

📊 VENTES (30 derniers jours) :
- Chiffre d'affaires : ${Number(stats._sum.totalAmount || 0).toLocaleString('fr-SN')} FCFA
- Nombre de ventes : ${stats._count}
- Dernières ventes : ${recentSales.map(s => `${Number(s.totalAmount).toLocaleString('fr-SN')} FCFA le ${new Date(s.saleDate).toLocaleDateString('fr-SN')}`).join(', ')}

=== FIN DES DONNÉES ===
`.trim();

    const messages: Anthropic.MessageParam[] = [
      ...history.slice(-10).map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content: message },
    ];

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: context,
      messages,
    });

    const reply = response.content[0].type === 'text' ? response.content[0].text : '';
    return res.json({ reply });
  } catch (err: any) {
    logger.error('chat error', { message: err?.message, status: err?.status, stack: err?.stack });
    if (err?.status === 401) return res.status(500).json({ error: 'Clé API Anthropic invalide' });
    if (err?.status === 400) return res.status(500).json({ error: `Requête invalide: ${err?.message}` });
    return res.status(500).json({ error: err?.message ?? 'Erreur IA, réessayez' });
  }
});
