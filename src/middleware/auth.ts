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

  // Support either Bearer <token> or Basic <base64(user:pass)>
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    if (!token) {
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
    return;
  }

  if (authHeader.startsWith('Basic ')) {
    const b64 = authHeader.split(' ')[1];
    try {
      const decoded = Buffer.from(b64, 'base64').toString('utf8');
      const idx = decoded.indexOf(':');
      const password = idx >= 0 ? decoded.slice(idx + 1) : '';

      if (password === Config.authToken) {
        authAttempts.inc({ status: 'success' });
        next();
        return;
      }

      authAttempts.inc({ status: 'failure_invalid_token' });
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token',
      });
      return;
    } catch (_e) {
      authAttempts.inc({ status: 'failure_invalid_format' });
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Bearer token is required',
      });
      return;
    }
  }

  // Fallback: enforce existing Bearer-only error to preserve current behavior/tests
  authAttempts.inc({ status: 'failure_invalid_format' });
  res.status(401).json({
    error: 'Unauthorized',
    message: 'Bearer token is required',
  });
}
