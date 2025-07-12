import { Request, Response, NextFunction } from 'express';
import { Config } from '../config';
import { ErrorResponse } from '../types';
import { authAttempts } from '../metrics';

export function authenticateToken(req: Request, res: Response<ErrorResponse>, next: NextFunction): void {
  if (!Config.authToken) {
    authAttempts.inc({ status: 'bypass_no_token_required' });
    return next();
  }

  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    authAttempts.inc({ status: 'failure_missing_header' });
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authorization header is required',
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  
  if (!authHeader.startsWith('Bearer ') || !token) {
    authAttempts.inc({ status: 'failure_invalid_format' });
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Bearer token is required',
    });
    return;
  }

  if (token !== Config.authToken) {
    authAttempts.inc({ status: 'failure_invalid_token' });
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid token',
    });
    return;
  }

  authAttempts.inc({ status: 'success' });
  next();
}