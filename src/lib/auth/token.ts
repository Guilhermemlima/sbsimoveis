import crypto from 'crypto';
import { SESSION_SECRET } from '@/lib/auth/config';

export function signSessionToken(userId: string): string {
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(userId).digest('hex');
  return `${userId}.${signature}`;
}

export function verifySessionToken(token: string): string | null {
  const [userId, signature] = token.split('.');
  if (!userId || !signature) return null;

  const expected = crypto.createHmac('sha256', SESSION_SECRET).update(userId).digest('hex');
  const signatureBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);
  if (signatureBuf.length !== expectedBuf.length) return null;
  if (!crypto.timingSafeEqual(signatureBuf, expectedBuf)) return null;

  return userId;
}
