// config/prisma.ts
import { PrismaClient } from '@prisma/client';
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
});

// config/redis.ts
import Redis from 'ioredis';
export const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// config/swagger.ts
import swaggerJsdoc from 'swagger-jsdoc';
export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SmartStock AI API',
      version: '1.0.0',
      description: 'API de gestion de stock intelligente pour PME africaines',
    },
    servers: [{ url: process.env.API_URL || 'http://localhost:4000' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.ts'],
});

// utils/logger.ts
import winston from 'winston';
export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// middlewares/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  return res.status(500).json({ error: 'Erreur interne du serveur', message: err.message });
};
