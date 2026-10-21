import crypto from 'crypto';
import { User } from '../types.ts';

const SESSION_SECRET = process.env.SESSION_SECRET || 'campusconnect_sec_token_sig_2026_prod';
const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET;

export function hashPassword(password: string, existingSalt?: string): { hash: string; salt: string } {
  const salt = existingSalt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

export function verifyPassword(providedPassword: string, storedHashOrPassword?: string, salt?: string): boolean {
  if (!storedHashOrPassword) return false;

  // 1. If salt exists, verify using PBKDF2 with timingSafeEqual
  if (salt) {
    try {
      const computedHash = crypto.pbkdf2Sync(providedPassword, salt, 100000, 64, 'sha512').toString('hex');
      const hashBuf = Buffer.from(computedHash, 'hex');
      const storedBuf = Buffer.from(storedHashOrPassword, 'hex');
      if (hashBuf.length !== storedBuf.length) return false;
      return crypto.timingSafeEqual(hashBuf, storedBuf);
    } catch (e) {
      return false;
    }
  }

  // 2. Fallback for seeded plaintext passwords (e.g. 'password123')
  return providedPassword === storedHashOrPassword;
}

export function createSignedSessionToken(user: User): string {
  const payload = {
    userId: user.id,
    email: user.email,
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(payloadB64).digest('base64url');
  return `cc_session_${payloadB64}.${signature}`;
}

export function verifySignedSessionToken(token: string): { userId?: number; email?: string } | null {
  if (!token.startsWith('cc_session_')) {
    // Check if it is a Supabase JWT and we have SUPABASE_JWT_SECRET
    if (SUPABASE_JWT_SECRET && token.split('.').length === 3) {
      try {
        const [headerB64, payloadB64, signatureB64] = token.split('.');
        const expectedSig = crypto
          .createHmac('sha256', SUPABASE_JWT_SECRET)
          .update(`${headerB64}.${payloadB64}`)
          .digest('base64url');
        if (crypto.timingSafeEqual(Buffer.from(signatureB64), Buffer.from(expectedSig))) {
          const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8'));
          if (!payload.exp || payload.exp * 1000 > Date.now()) {
            return { email: payload.email, userId: payload.user_metadata?.student_id };
          }
        }
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  try {
    const raw = token.replace('cc_session_', '');
    const dotIndex = raw.lastIndexOf('.');

    // Signed token format: <payloadB64>.<signature>
    if (dotIndex !== -1) {
      const payloadB64 = raw.substring(0, dotIndex);
      const signature = raw.substring(dotIndex + 1);
      const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(payloadB64).digest('base64url');

      const sigBuf = Buffer.from(signature);
      const expectedBuf = Buffer.from(expectedSig);

      if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
        console.warn('Tampered or invalid session signature rejected.');
        return null;
      }

      const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8'));
      if (payload.userId && (!payload.exp || payload.exp > Date.now())) {
        return { userId: payload.userId, email: payload.email };
      }
    } else {
      // Legacy unsigned fallback (for smooth migration during running server sessions)
      const payloadStr = Buffer.from(raw, 'base64').toString('utf-8');
      const payload = JSON.parse(payloadStr);
      if (payload.userId && (!payload.exp || payload.exp > Date.now())) {
        return { userId: payload.userId, email: payload.email };
      }
    }
  } catch (e) {
    return null;
  }

  return null;
}
