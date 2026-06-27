import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';
import { logger } from '../utils/logger';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    roleId: string;
    companyId: string;
    roleName: string;
    permissions: Record<string, boolean>;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token manquant' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string; email: string; roleId: string; companyId: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id, isActive: true },
      include: { role: true },
    });
    if (!user) return res.status(401).json({ error: 'Token invalide ou expiré' });

    req.user = {
      id: user.id,
      email: user.email,
      roleId: user.roleId,
      companyId: user.companyId ?? '',
      roleName: user.role.name,
      permissions: user.role.permissions as Record<string, boolean>,
    };
    next();
  } catch {
    return res.status(401).json({ error: 'Token invalide ou expiré' });
  }
};

// RBAC — vérifier qu'un rôle est parmi les rôles autorisés
export const authorize = (...roles: string[]) =>
  (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Non authentifié' });
    if (!roles.includes(req.user.roleName)) {
      return res.status(403).json({ error: 'Accès refusé : rôle insuffisant' });
    }
    next();
  };

// Audit log automatique
export const auditLog = (action: string, entity: string) =>
  async (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (req.user) {
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action,
          entity,
          entityId: req.params.id,
          newValues: req.body,
          ipAddress: req.ip,
        },
      }).catch((err: unknown) => logger.warn(`Audit log failed: ${err}`)); // log sans bloquer
    }
    next();
  };
