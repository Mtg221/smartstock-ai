// auth.routes.ts
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { registerCompany, register, login, refreshTokens, logout, setup2FA, verify2FA, forgotPassword, resetPassword } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';

export const authRouter = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Trop de tentatives de connexion, réessayez dans 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const sensitiveActionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'Trop de tentatives, réessayez dans 1 heure.' },
  standardHeaders: true,
  legacyHeaders: false,
});

authRouter.post('/register-company', sensitiveActionLimiter, registerCompany);
authRouter.post('/register', sensitiveActionLimiter, register);
authRouter.post('/login', loginLimiter, login);
authRouter.post('/refresh', refreshTokens);
authRouter.post('/logout', logout);
authRouter.get('/2fa/setup', authenticate, setup2FA);
authRouter.post('/forgot-password', sensitiveActionLimiter, forgotPassword);
authRouter.post('/reset-password', sensitiveActionLimiter, resetPassword);
authRouter.post('/2fa/verify', authenticate, verify2FA);
