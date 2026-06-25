import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticator } from 'otplib';
import qrcode from 'qrcode';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { redis } from '../config/redis';
import { logger } from '../utils/logger';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  companyId: z.string().uuid(),
  roleId: z.string().uuid().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  totpCode: z.string().optional(),
});

const signTokens = (userId: string, email: string, roleId: string, companyId: string) => {
  const accessToken = jwt.sign(
    { id: userId, email, roleId, companyId },
    process.env.JWT_SECRET!,
    { expiresIn: '15m' }
  );
  const refreshToken = jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: '7d' }
  );
  return { accessToken, refreshToken };
};

export const register = async (req: Request, res: Response) => {
  try {
    const body = registerSchema.parse(req.body);

    const exists = await prisma.user.findUnique({ where: { email: body.email } });
    if (exists) return res.status(409).json({ error: 'Email déjà utilisé' });

    // Rôle par défaut = Employé
    let roleId = body.roleId;
    if (!roleId) {
      const defaultRole = await prisma.role.findFirst({ where: { name: 'employe' } });
      roleId = defaultRole!.id;
    }

    const passwordHash = await bcrypt.hash(body.password, 12);
    const user = await prisma.user.create({
      data: {
        email: body.email,
        passwordHash,
        firstName: body.firstName,
        lastName: body.lastName,
        roleId,
        companyId: body.companyId,
      },
      include: { role: true },
    });

    const { accessToken, refreshToken } = signTokens(user.id, user.email, user.roleId, user.companyId);
    await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });

    return res.status(201).json({
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, firstName: user.firstName, role: user.role.name },
    });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ errors: err.errors });
    logger.error('register error', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const body = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: body.email, isActive: true },
      include: { role: true },
    });
    if (!user) return res.status(401).json({ error: 'Identifiants incorrects' });

    const valid = await bcrypt.compare(body.password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Identifiants incorrects' });

    // 2FA
    if (user.twoFaEnabled) {
      if (!body.totpCode) return res.status(200).json({ requiresTwoFa: true });
      const ok = authenticator.verify({ token: body.totpCode, secret: user.twoFaSecret! });
      if (!ok) return res.status(401).json({ error: 'Code 2FA invalide' });
    }

    const { accessToken, refreshToken } = signTokens(user.id, user.email, user.roleId, user.companyId);
    await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });

    return res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role.name,
        companyId: user.companyId,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ errors: err.errors });
    logger.error('login error', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const refreshTokens = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ error: 'Token manquant' });

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as { id: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.id, refreshToken, isActive: true },
    });
    if (!user) return res.status(401).json({ error: 'Token invalide' });

    const tokens = signTokens(user.id, user.email, user.roleId, user.companyId);
    await prisma.user.update({ where: { id: user.id }, data: { refreshToken: tokens.refreshToken } });

    return res.json(tokens);
  } catch {
    return res.status(401).json({ error: 'Token expiré ou invalide' });
  }
};

export const logout = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await prisma.user.updateMany({ where: { refreshToken }, data: { refreshToken: null } });
    // Blacklist l'access token pendant 15min
    const token = req.headers.authorization?.split(' ')[1];
    if (token) await redis.set(`blacklist:${token}`, '1', 'EX', 900);
  }
  return res.json({ message: 'Déconnecté' });
};

export const setup2FA = async (req: Request & { user?: any }, res: Response) => {
  const secret = authenticator.generateSecret();
  const otpauthUrl = authenticator.keyuri(req.user.email, 'SmartStock AI', secret);
  const qrCode = await qrcode.toDataURL(otpauthUrl);

  await prisma.user.update({
    where: { id: req.user.id },
    data: { twoFaSecret: secret },
  });
  return res.json({ qrCode, secret });
};

export const verify2FA = async (req: Request & { user?: any }, res: Response) => {
  const { code } = req.body;
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  const ok = authenticator.verify({ token: code, secret: user!.twoFaSecret! });
  if (!ok) return res.status(400).json({ error: 'Code invalide' });

  await prisma.user.update({ where: { id: req.user.id }, data: { twoFaEnabled: true } });
  return res.json({ message: '2FA activé avec succès' });
};
