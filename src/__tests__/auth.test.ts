import { Request, Response, NextFunction } from 'express';
import { authenticateToken } from '../middleware/auth';
import { Config } from '../config';

describe('authenticateToken middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      headers: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  describe('when authToken is not configured', () => {
    beforeEach(() => {
      Object.defineProperty(Config, 'authToken', { value: undefined, writable: true });
    });

    it('should call next() without authentication', () => {
      authenticateToken(req as Request, res as Response, next);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('when authToken is configured', () => {
    beforeEach(() => {
      Object.defineProperty(Config, 'authToken', { value: 'test-token-123', writable: true });
    });

    afterEach(() => {
      Object.defineProperty(Config, 'authToken', { value: undefined, writable: true });
    });

    it('should reject requests without authorization header', () => {
      authenticateToken(req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Authorization header is required',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject requests with invalid authorization header format', () => {
      req.headers = { authorization: 'Invalid token' };
      authenticateToken(req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Bearer token is required',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject requests with Bearer but no token', () => {
      req.headers = { authorization: 'Bearer' };
      authenticateToken(req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Bearer token is required',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject requests with Bearer but empty token', () => {
      req.headers = { authorization: 'Bearer ' };
      authenticateToken(req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Bearer token is required',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject requests with incorrect token', () => {
      req.headers = { authorization: 'Bearer wrong-token' };
      authenticateToken(req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Invalid token',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should allow requests with correct token', () => {
      req.headers = { authorization: 'Bearer test-token-123' };
      authenticateToken(req as Request, res as Response, next);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });
});