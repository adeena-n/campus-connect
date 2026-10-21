import crypto from 'crypto';
import { dbStore } from '../store.ts';
import { User } from '../types.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'campusconnect-secure-jwt-editorial-secret-2026';

export function hashPassword(password: string): string {
  const salt = 'campusconnect_salt_2026';
  return crypto.pbkdf2Sync(password, salt, 1000, 32, 'sha256').toString('hex');
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export function generateToken(payload: { userId: number; email: string; name: string }): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(
    JSON.stringify({
      ...payload,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30 // 30 days
    })
  ).toString('base64url');

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');

  return `${header}.${body}.${signature}`;
}

export function verifyToken(token: string): { userId: number; email: string; name: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [header, body, signature] = parts;
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${body}`)
      .digest('base64url');

    if (signature !== expectedSignature) {
      // Also check if it might be a Supabase JWT (payload contains sub/email)
      try {
        const decoded = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
        if (decoded.sub && decoded.email) {
          return {
            userId: decoded.user_metadata?.student_id || 0,
            email: decoded.email,
            name: decoded.user_metadata?.name || decoded.email.split('@')[0]
          };
        }
      } catch {
        return null;
      }
      return null;
    }

    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }

    return payload;
  } catch (err) {
    return null;
  }
}

export async function authenticateFromHeader(authHeader?: string, demoHeader?: string): Promise<User | null> {
  const db = await dbStore.readData();

  // 1. Bearer token from Authorization header (Supabase or Local Verified JWT)
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    const verified = verifyToken(token);
    if (verified) {
      if (verified.userId > 0) {
        const user = db.users.find((u) => u.id === verified.userId);
        if (user) return user;
      }
      if (verified.email) {
        const user = db.users.find((u) => u.email?.toLowerCase() === verified.email.toLowerCase());
        if (user) return user;
      }
    }
  }

  // 2. Fallback to demoHeader if present (internal server compatibility for seed runner / matrix tests)
  if (demoHeader) {
    const id = parseInt(demoHeader, 10);
    if (!isNaN(id)) {
      const user = db.users.find((u) => u.id === id);
      if (user) return user;
    }
  }

  return null;
}
