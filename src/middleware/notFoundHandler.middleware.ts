import { Request, Response } from 'express';
import { errorResponse } from '../utils/response.util';

export const notFoundHandler = (req: Request, res: Response) => {
  return errorResponse(res, 'Route not found', 404);
};
