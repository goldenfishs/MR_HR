import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/env';
import { AccessTokenPayload } from '../types';
import UserModel from '../models/User.model';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, error: 'No token provided' });
      return;
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, config.jwt.accessSecret) as AccessTokenPayload;

      // Verify user still exists
      const user = await UserModel.findById(decoded.userId);
      if (!user) {
        res.status(401).json({ success: false, error: 'User not found' });
        return;
      }

      req.user = decoded;
      next();
    } catch (error) {
      res.status(401).json({ success: false, error: 'Invalid or expired token' });
      return;
    }
  } catch (error) {
    res.status(500).json({ success: false, error: 'Authentication error' });
  }
};

export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ success: false, error: 'Insufficient permissions' });
      return;
    }

    next();
  };
};

export const requireAdmin = requireRole('admin');
export const requireInterviewer = requireRole('interviewer', 'admin');
