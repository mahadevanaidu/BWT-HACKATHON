import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import logger from '../utils/logger';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  logger.error(err.message, { stack: err.stack });

  // Mongoose validation errors
  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    res.status(400).json({ error: 'Validation failed', details });
    return;
  }

  // Mongoose duplicate key error
  if ('code' in err && (err as NodeJS.ErrnoException).code === '11000') {
    res.status(409).json({ error: 'A record with this identifier already exists.' });
    return;
  }

  // Mongoose cast error (invalid ObjectId)
  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({ error: `Invalid value for field: ${err.path}` });
    return;
  }

  // CORS errors
  if (err.message === 'Not allowed by CORS') {
    res.status(403).json({ error: 'CORS: Origin not allowed.' });
    return;
  }

  // Generic server error (hide details in production)
  const message =
    process.env.NODE_ENV === 'production' ? 'Internal server error.' : err.message;

  res.status(500).json({ error: message });
}
