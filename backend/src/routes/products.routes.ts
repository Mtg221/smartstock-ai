import { Router } from 'express';
import {
  getProducts, getProductById, createProduct, updateProduct,
  deleteProduct, getLowStockProducts, getDashboardStats,
} from '../controllers/products.controller';
import { authenticate, authorize, auditLog } from '../middlewares/auth.middleware';
import { AuthRequest } from '../middlewares/auth.middleware';
import { Response } from 'express';
import { prisma } from '../config/prisma';
import { sendLowStockAlert } from '../utils/mailer';

export const productsRouter = Router();

productsRouter.use(authenticate);

productsRouter.get('/stats/dashboard', getDashboardStats);
productsRouter.get('/alerts/low-stock', getLowStockProducts);

productsRouter.post('/alerts/send-email', authorize('admin', 'gestionnaire'), async (req: AuthRequest, res: Response) => {
  const lowStock: any[] = await prisma.$queryRaw`
    SELECT name, quantity, alert_threshold as threshold
    FROM products
    WHERE company_id = ${req.user!.companyId}
      AND is_active = true
      AND quantity <= alert_threshold
    ORDER BY quantity ASC
  `;

  if (lowStock.length === 0) return res.json({ message: 'Aucun produit en stock bas' });

  const admins = await prisma.user.findMany({
    where: { companyId: req.user!.companyId, isActive: true, role: { name: 'admin' } },
    include: { role: true },
  });

  const recipients = admins.map(u => u.email);
  if (req.user!.roleName !== 'admin') recipients.push(req.user!.email);

  await Promise.all(recipients.map(email =>
    sendLowStockAlert(email, lowStock.map(p => ({
      name: p.name,
      quantity: Number(p.quantity),
      threshold: Number(p.threshold),
    })))
  ));

  return res.json({ message: `Alerte envoyée à ${recipients.length} destinataire(s)`, count: lowStock.length });
});

productsRouter.get('/', getProducts);
productsRouter.get('/:id', getProductById);
productsRouter.post('/', authorize('admin', 'gestionnaire'), auditLog('CREATE', 'product'), createProduct);
productsRouter.patch('/:id', authorize('admin', 'gestionnaire'), auditLog('UPDATE', 'product'), updateProduct);
productsRouter.delete('/:id', authorize('admin'), auditLog('DELETE', 'product'), deleteProduct);
