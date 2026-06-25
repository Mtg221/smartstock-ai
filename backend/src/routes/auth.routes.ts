// auth.routes.ts
import { Router } from 'express';
import { registerCompany, register, login, refreshTokens, logout, setup2FA, verify2FA, forgotPassword, resetPassword } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';

export const authRouter = Router();

authRouter.post('/register-company', registerCompany);
authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/refresh', refreshTokens);
authRouter.post('/logout', logout);
authRouter.get('/2fa/setup', authenticate, setup2FA);
authRouter.post('/forgot-password', forgotPassword);
authRouter.post('/reset-password', resetPassword);
authRouter.post('/2fa/verify', authenticate, verify2FA);
