import { Response } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';
import { logger } from '../utils/logger';

const saleItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
});

const createSaleSchema = z.object({
  items: z.array(saleItemSchema).min(1),
  notes: z.string().optional(),
});

export const createSale = async (req: AuthRequest, res: Response) => {
  try {
    const body = createSaleSchema.parse(req.body);
    const companyId = req.user!.companyId;

    // Vérifier stock disponible
    for (const item of body.items) {
      const product = await prisma.product.findFirst({
        where: { id: item.productId, companyId, isActive: true },
      });
      if (!product) return res.status(404).json({ error: `Produit ${item.productId} introuvable` });
      if (product.quantity < item.quantity) {
        return res.status(400).json({
          error: `Stock insuffisant pour "${product.name}" (disponible: ${product.quantity})`,
        });
      }
    }

    const totalAmount = body.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);

    // Transaction atomique : créer vente + décrémenter stock + créer mouvements
    const sale = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const sale = await tx.sale.create({
        data: {
          userId: req.user!.id,
          companyId,
          totalAmount,
          notes: body.notes,
          saleItems: {
            create: body.items.map(i => ({
              productId: i.productId,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
            })),
          },
        },
        include: { saleItems: { include: { product: true } } },
      });

      for (const item of body.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { quantity: { decrement: item.quantity } },
        });
        await tx.inventoryMovement.create({
          data: {
            productId: item.productId,
            type: 'sortie',
            quantityChange: -item.quantity,
            reason: `Vente #${sale.id}`,
            userId: req.user!.id,
          },
        });
      }

      return sale;
    });

    // Vérifier alertes stock faible post-vente
    const updatedProducts = await prisma.product.findMany({
      where: { id: { in: body.items.map(i => i.productId) } },
    });
    for (const p of updatedProducts) {
      if (p.quantity <= p.alertThreshold) {
        await prisma.notification.create({
          data: {
            userId: req.user!.id,
            type: 'low_stock',
            message: `Stock faible : "${p.name}" — ${p.quantity} unités restantes (seuil: ${p.alertThreshold})`,
          },
        });
      }
    }

    return res.status(201).json(sale);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ errors: err.errors });
    logger.error('createSale error', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const getSales = async (req: AuthRequest, res: Response) => {
  const { page = '1', limit = '20', startDate, endDate } = req.query;
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);

  const where: any = { companyId: req.user!.companyId };
  if (startDate || endDate) {
    where.saleDate = {};
    if (startDate) where.saleDate.gte = new Date(startDate as string);
    if (endDate) where.saleDate.lte = new Date(endDate as string);
  }

  const [sales, total] = await Promise.all([
    prisma.sale.findMany({
      where,
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
      orderBy: { saleDate: 'desc' },
      include: {
        user: { select: { firstName: true, lastName: true } },
        saleItems: { include: { product: { select: { name: true, sku: true } } } },
      },
    }),
    prisma.sale.count({ where }),
  ]);

  return res.json({ data: sales, meta: { page: pageNum, limit: limitNum, total } });
};

export const getSaleStats = async (req: AuthRequest, res: Response) => {
  const companyId = req.user!.companyId;
  const days = parseInt((req.query.days as string) || '30');
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const stats = await prisma.sale.groupBy({
    by: ['saleDate'],
    where: { companyId, saleDate: { gte: since } },
    _sum: { totalAmount: true },
    _count: { id: true },
  });

  return res.json(stats);
};

export const cancelSale = async (req: AuthRequest, res: Response) => {
  const sale = await prisma.sale.findFirst({
    where: { id: req.params.id, companyId: req.user!.companyId },
    include: { saleItems: true },
  });
  if (!sale) return res.status(404).json({ error: 'Vente introuvable' });
  if (sale.status === 'cancelled') return res.status(400).json({ error: 'Vente déjà annulée' });

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.sale.update({ where: { id: sale.id }, data: { status: 'cancelled' } });
    for (const item of sale.saleItems) {
      await tx.product.update({
        where: { id: item.productId },
        data: { quantity: { increment: item.quantity } },
      });
      await tx.inventoryMovement.create({
        data: {
          productId: item.productId,
          type: 'retour',
          quantityChange: item.quantity,
          reason: `Annulation vente #${sale.id}`,
          userId: req.user!.id,
        },
      });
    }
  });

  return res.json({ message: 'Vente annulée et stock restauré' });
};
