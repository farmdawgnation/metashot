import { Request, Response, NextFunction } from 'express';
import { Config } from '../config';
import { ErrorResponse } from '../types';

export function authenticateToken(req: Request, res: Response<ErrorResponse>, next: NextFunction): void {
  if (!Config.authToken) {
    return next();
  }

  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authorization header is required',
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  
  if (!authHeader.startsWith('Bearer ') || !token) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Bearer token is required',
    });
    return;
  }

  if (token !== Config.authToken) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid token',
    });
    return;
  }

  next();
}