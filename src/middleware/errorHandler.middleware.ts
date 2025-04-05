import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';
import { errorResponse } from '../utils/response.util';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error(`Error on ${req.method} ${req.url}`, {
    message: err.message,
    stack: err.stack,
  });

  const statusCode = err.status || 500;
  const message = err.message || 'Internal Server Error';
  const data = err.data || null;

  return errorResponse(res, message, statusCode, data);
};