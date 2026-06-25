import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { AuthRequest } from '../middlewares/auth.middleware';
import { Response } from 'express';

// ─── Users ───────────────────────────────────────────────────────────────────
export const usersRouter = Router();
usersRouter.use(authenticate);
usersRouter.get('/', authorize('admin'), async (req: AuthRequest, res: Response) => {
  const users = await prisma.user.findMany({
    where: { companyId: req.user!.companyId },
    select: {
      id: true, email: true, firstName: true, lastName: true,
      isActive: true, twoFaEnabled: true, createdAt: true,
      roleId: true, companyId: true,
      role: true,
    },
  });
  return res.json(users);
});
usersRouter.get('/me', async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: { role: true, company: true },
  });
  return res.json(user);
});

// ─── Categories ───────────────────────────────────────────────────────────────
export const categoriesRouter = Router();
categoriesRouter.use(authenticate);
categoriesRouter.get('/', async (req: AuthRequest, res: Response) => {
  const cats = await prisma.category.findMany({ include: { children: true } });
  return res.json(cats);
});
categoriesRouter.post('/', authorize('admin', 'gestionnaire'), async (req: AuthRequest, res: Response) => {
  const cat = await prisma.category.create({ data: req.body });
  return res.status(201).json(cat);
});

// ─── Suppliers ────────────────────────────────────────────────────────────────
export const suppliersRouter = Router();
suppliersRouter.use(authenticate);
suppliersRouter.get('/', async (req: AuthRequest, res: Response) => {
  const suppliers = await prisma.supplier.findMany({ where: { companyId: req.user!.companyId } });
  return res.json(suppliers);
});
suppliersRouter.post('/', authorize('admin', 'gestionnaire'), async (req: AuthRequest, res: Response) => {
  const s = await prisma.supplier.create({ data: { ...req.body, companyId: req.user!.companyId } });
  return res.status(201).json(s);
});
suppliersRouter.patch('/:id', authorize('admin', 'gestionnaire'), async (req: AuthRequest, res: Response) => {
  const s = await prisma.supplier.updateMany({
    where: { id: req.params.id, companyId: req.user!.companyId },
    data: req.body,
  });
  return res.json(s);
});

// ─── Purchases ────────────────────────────────────────────────────────────────
export const purchasesRouter = Router();
purchasesRouter.use(authenticate);
purchasesRouter.get('/', async (req: AuthRequest, res: Response) => {
  const p = await prisma.purchase.findMany({
    where: { companyId: req.user!.companyId } as any,
    include: { supplier: true, purchaseItems: { include: { product: true } } },
    orderBy: { orderDate: 'desc' },
  });
  return res.json(p);
});
purchasesRouter.post('/', authorize('admin', 'gestionnaire'), async (req: AuthRequest, res: Response) => {
  const { supplierId, items, notes } = req.body;
  const totalAmount = items.reduce((s: number, i: any) => s + i.quantity * i.unitPrice, 0);
  const purchase = await prisma.purchase.create({
    data: {
      supplierId,
      companyId: req.user!.companyId,
      totalAmount,
      notes,
      purchaseItems: { create: items },
    },
    include: { purchaseItems: true },
  });
  return res.status(201).json(purchase);
});
purchasesRouter.patch('/:id/receive', authorize('admin', 'gestionnaire'), async (req: AuthRequest, res: Response) => {
  const purchase = await prisma.purchase.findFirst({
    where: { id: req.params.id, companyId: req.user!.companyId } as any,
    include: { purchaseItems: true },
  });
  if (!purchase) return res.status(404).json({ error: 'Commande introuvable' });

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.purchase.update({ where: { id: purchase.id }, data: { status: 'received', receivedDate: new Date() } });
    for (const item of purchase.purchaseItems) {
      await tx.product.update({
        where: { id: item.productId },
        data: { quantity: { increment: item.quantity } },
      });
      await tx.inventoryMovement.create({
        data: {
          productId: item.productId,
          type: 'entree',
          quantityChange: item.quantity,
          reason: `Réception commande #${purchase.id}`,
          userId: req.user!.id,
        },
      });
    }
  });
  return res.json({ message: 'Commande réceptionnée et stock mis à jour' });
});

// ─── Reports ──────────────────────────────────────────────────────────────────
export const reportsRouter = Router();
reportsRouter.use(authenticate, authorize('admin', 'directeur', 'gestionnaire'));
reportsRouter.get('/revenue', async (req: AuthRequest, res: Response) => {
  const { year = new Date().getFullYear() } = req.query;
  const data = await prisma.$queryRaw`
    SELECT
      EXTRACT(MONTH FROM sale_date) as month,
      SUM(total_amount) as revenue,
      COUNT(*) as sales_count
    FROM sales
    WHERE company_id = ${req.user!.companyId}
      AND EXTRACT(YEAR FROM sale_date) = ${Number(year)}
      AND status != 'cancelled'
    GROUP BY EXTRACT(MONTH FROM sale_date)
    ORDER BY month
  `;
  return res.json(data);
});

reportsRouter.get('/top-products', async (req: AuthRequest, res: Response) => {
  const { limit = 10 } = req.query;
  const data = await prisma.$queryRaw`
    SELECT
      p.id, p.name, p.sku,
      SUM(si.quantity) as total_sold,
      SUM(si.quantity * si.unit_price) as revenue
    FROM sale_items si
    JOIN products p ON p.id = si.product_id
    JOIN sales s ON s.id = si.sale_id
    WHERE s.company_id = ${req.user!.companyId}
      AND s.status != 'cancelled'
    GROUP BY p.id, p.name, p.sku
    ORDER BY total_sold DESC
    LIMIT ${Number(limit)}
  `;
  return res.json(data);
});

// ─── Notifications ────────────────────────────────────────────────────────────
export const notificationsRouter = Router();
notificationsRouter.use(authenticate);
notificationsRouter.get('/', async (req: AuthRequest, res: Response) => {
  const notifs = await prisma.notification.findMany({
    where: { userId: req.user!.id },
    orderBy: { sentAt: 'desc' },
    take: 50,
  });
  return res.json(notifs);
});
notificationsRouter.patch('/:id/read', async (req: AuthRequest, res: Response) => {
  await prisma.notification.updateMany({
    where: { id: req.params.id, userId: req.user!.id },
    data: { isRead: true },
  });
  return res.json({ message: 'Marquée comme lue' });
});
notificationsRouter.patch('/read-all', async (req: AuthRequest, res: Response) => {
  await prisma.notification.updateMany({
    where: { userId: req.user!.id, isRead: false },
    data: { isRead: true },
  });
  return res.json({ message: 'Toutes les notifications lues' });
});
