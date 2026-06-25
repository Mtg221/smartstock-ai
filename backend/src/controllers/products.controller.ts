import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { redis } from '../config/redis';
import { AuthRequest } from '../middlewares/auth.middleware';
import { logger } from '../utils/logger';

const productSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  sku: z.string().min(1),
  barcode: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  supplierId: z.string().uuid().optional(),
  purchasePrice: z.number().positive(),
  salePrice: z.number().positive(),
  quantity: z.number().int().min(0).default(0),
  alertThreshold: z.number().int().min(0).default(10),
  expiryDate: z.string().datetime().optional(),
  imageUrl: z.string().url().optional(),
});

const CACHE_KEY = (companyId: string) => `products:${companyId}`;

export const getProducts = async (req: AuthRequest, res: Response) => {
  try {
    const { page = '1', limit = '20', search, categoryId, lowStock } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = { companyId: req.user!.companyId, isActive: true };
    if (search) where.name = { contains: search as string, mode: 'insensitive' };
    if (categoryId) where.categoryId = categoryId as string;
    if (lowStock === 'true') where.quantity = { lte: prisma.product.fields.alertThreshold };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: { category: true, supplier: true },
      }),
      prisma.product.count({ where }),
    ]);

    return res.json({
      data: products,
      meta: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    logger.error('getProducts error', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const getProductById = async (req: AuthRequest, res: Response) => {
  const product = await prisma.product.findFirst({
    where: { id: req.params.id, companyId: req.user!.companyId },
    include: { category: true, supplier: true, movements: { take: 10, orderBy: { movedAt: 'desc' } } },
  });
  if (!product) return res.status(404).json({ error: 'Produit introuvable' });
  return res.json(product);
};

export const createProduct = async (req: AuthRequest, res: Response) => {
  try {
    const body = productSchema.parse(req.body);
    const product = await prisma.product.create({
      data: { ...body, companyId: req.user!.companyId },
    });
    await redis.del(CACHE_KEY(req.user!.companyId));
    return res.status(201).json(product);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ errors: err.errors });
    if ((err as any).code === 'P2002') return res.status(409).json({ error: 'SKU déjà utilisé' });
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const updateProduct = async (req: AuthRequest, res: Response) => {
  try {
    const body = productSchema.partial().parse(req.body);
    const existing = await prisma.product.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId },
    });
    if (!existing) return res.status(404).json({ error: 'Produit introuvable' });

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: body,
    });

    // Mouvement de stock si quantité modifiée
    if (body.quantity !== undefined && body.quantity !== existing.quantity) {
      const diff = body.quantity - existing.quantity;
      await prisma.inventoryMovement.create({
        data: {
          productId: product.id,
          type: diff > 0 ? 'entree' : 'sortie',
          quantityChange: diff,
          reason: 'Ajustement manuel',
          userId: req.user!.id,
        },
      });
    }

    await redis.del(CACHE_KEY(req.user!.companyId));
    return res.json(product);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ errors: err.errors });
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const deleteProduct = async (req: AuthRequest, res: Response) => {
  const existing = await prisma.product.findFirst({
    where: { id: req.params.id, companyId: req.user!.companyId },
  });
  if (!existing) return res.status(404).json({ error: 'Produit introuvable' });

  // Soft delete
  await prisma.product.update({ where: { id: req.params.id }, data: { isActive: false } });
  await redis.del(CACHE_KEY(req.user!.companyId));
  return res.json({ message: 'Produit supprimé' });
};

export const getLowStockProducts = async (req: AuthRequest, res: Response) => {
  const products = await prisma.$queryRaw`
    SELECT p.*, c.name as category_name
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE p.company_id = ${req.user!.companyId}
      AND p.is_active = true
      AND p.quantity <= p.alert_threshold
    ORDER BY (p.quantity::float / NULLIF(p.alert_threshold, 0)) ASC
  `;
  return res.json(products);
};

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  const companyId = req.user!.companyId;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalProducts,
    lowStockCount,
    monthlySalesAgg,
    topProducts,
  ] = await Promise.all([
    prisma.product.count({ where: { companyId, isActive: true } }),
    prisma.product.count({
      where: {
        companyId, isActive: true,
        quantity: { lte: prisma.product.fields.alertThreshold as any },
      },
    }),
    prisma.sale.aggregate({
      where: { companyId, saleDate: { gte: startOfMonth } },
      _sum: { totalAmount: true },
      _count: { id: true },
    }),
    prisma.saleItem.groupBy({
      by: ['productId'],
      where: { sale: { companyId, saleDate: { gte: startOfMonth } } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    }),
  ]);

  return res.json({
    totalProducts,
    lowStockCount,
    monthlyRevenue: monthlySalesAgg._sum.totalAmount ?? 0,
    monthlySalesCount: monthlySalesAgg._count.id,
    topProducts,
  });
};
