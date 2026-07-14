import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';
import { logger } from '../utils/logger';

const supplierSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  rating: z.number().min(0).max(5).optional(),
});

export const getSuppliers = async (req: AuthRequest, res: Response) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      where: { companyId: req.user!.companyId },
      orderBy: { name: 'asc' },
    });
    return res.json(suppliers);
  } catch (err) {
    logger.error('getSuppliers error', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const createSupplier = async (req: AuthRequest, res: Response) => {
  try {
    const body = supplierSchema.parse(req.body);
    const supplier = await prisma.supplier.create({
      data: { ...body, email: body.email || null, companyId: req.user!.companyId },
    });
    return res.status(201).json(supplier);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ errors: err.errors });
    logger.error('createSupplier error', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const updateSupplier = async (req: AuthRequest, res: Response) => {
  try {
    const body = supplierSchema.partial().parse(req.body);
    const existing = await prisma.supplier.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId },
    });
    if (!existing) return res.status(404).json({ error: 'Fournisseur introuvable' });

    const supplier = await prisma.supplier.update({
      where: { id: req.params.id },
      data: { ...body, email: body.email === '' ? null : body.email },
    });
    return res.json(supplier);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ errors: err.errors });
    logger.error('updateSupplier error', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const deleteSupplier = async (req: AuthRequest, res: Response) => {
  const existing = await prisma.supplier.findFirst({
    where: { id: req.params.id, companyId: req.user!.companyId },
  });
  if (!existing) return res.status(404).json({ error: 'Fournisseur introuvable' });

  try {
    await prisma.supplier.delete({ where: { id: req.params.id } });
    return res.json({ message: 'Fournisseur supprimé' });
  } catch (err) {
    // Contrainte FK : fournisseur lié à des produits ou achats
    if ((err as any).code === 'P2003') {
      return res.status(409).json({ error: 'Fournisseur lié à des produits ou achats existants' });
    }
    logger.error('deleteSupplier error', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};
