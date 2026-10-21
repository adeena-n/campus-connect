import { Request, Response, NextFunction } from 'express';
import { dbStore } from '../store.ts';
import { User } from '../types.ts';
import { verifySignedSessionToken } from '../utils/auth.ts';

declare global {
  namespace Express {
    interface Request {
      demoUserId?: number;
      demoUser?: User;
      authUser?: User;
      authUserId?: number;
    }
  }
}

export function parseToken(authHeader?: string | null): { userId?: number; email?: string } | null {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return null;
  }
  const token = parts[1];
  return verifySignedSessionToken(token);
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.header('Authorization');
  const tokenData = parseToken(authHeader);

  const db = await dbStore.readData();
  let user: User | undefined;

  if (tokenData?.userId) {
    user = db.users.find((u) => u.id === tokenData.userId);
  } else if (tokenData?.email) {
    user = db.users.find((u) => u.email?.toLowerCase() === tokenData.email?.toLowerCase());
  } else if (process.env.NODE_ENV === 'test') {
    // Only in automated test runner environment allow legacy header fallback
    const legacyHeader = req.header('X-Demo-User-Id');
    if (legacyHeader) {
      const uid = parseInt(legacyHeader, 10);
      if (!isNaN(uid)) {
        user = db.users.find((u) => u.id === uid);
      }
    }
  }

  if (!user) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required. Please sign in to your student account.'
      }
    });
  }

  req.authUserId = user.id;
  req.authUser = user;
  req.demoUserId = user.id;
  req.demoUser = user;
  next();
}

export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.header('Authorization');
  const tokenData = parseToken(authHeader);
  const legacyHeader = req.header('X-Demo-User-Id');

  const db = await dbStore.readData();
  let user: User | undefined;

  if (tokenData?.userId) {
    user = db.users.find((u) => u.id === tokenData.userId);
  } else if (tokenData?.email) {
    user = db.users.find((u) => u.email?.toLowerCase() === tokenData.email?.toLowerCase());
  } else if (legacyHeader) {
    const uid = parseInt(legacyHeader, 10);
    if (!isNaN(uid)) {
      user = db.users.find((u) => u.id === uid);
    }
  }

  if (user) {
    req.authUserId = user.id;
    req.authUser = user;
    req.demoUserId = user.id;
    req.demoUser = user;
  }

  next();
}

export const requireDemoAuth = requireAuth;
export const optionalDemoAuth = optionalAuth;
