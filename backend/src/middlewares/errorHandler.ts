import { Request, Response, NextFunction } from 'express';
export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  return res.status(500).json({ error: 'Erreur interne du serveur', message: err.message });
};
