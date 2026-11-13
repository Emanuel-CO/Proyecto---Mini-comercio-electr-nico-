import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

export interface AuthTokenPayload {
  id: number;
  rol: 'ADMIN' | 'CLIENTE';
  correo: string;
  nombresCompletos: string;
  iat: number;
  exp: number;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthTokenPayload;
}

const JWT_SECRET =
  process.env.JWT_SECRET || 'mercado-trust-local-dev-secret-2026-colombia';
const JWT_EXPIRES_SEC = 60 * 60 * 12; // 12 horas

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, originalHex] = parts;
  const derived = crypto.scryptSync(password, salt, 64);
  const original = Buffer.from(originalHex, 'hex');
  if (derived.length !== original.length) return false;
  return crypto.timingSafeEqual(derived, original);
}

function base64UrlEncode(input: Buffer | string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(input: string): string {
  let padded = input.replace(/-/g, '+').replace(/_/g, '/');
  while (padded.length % 4 !== 0) {
    padded += '=';
  }
  return Buffer.from(padded, 'base64').toString('utf8');
}

export function signJwt(
  payload: Omit<AuthTokenPayload, 'iat' | 'exp'>,
  expiresInSec = JWT_EXPIRES_SEC
): string {
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: AuthTokenPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSec,
  };
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64UrlEncode(JSON.stringify(fullPayload));
  const signature = base64UrlEncode(
    crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest()
  );
  return `${header}.${body}.${signature}`;
}

export function verifyJwt(token: string): AuthTokenPayload | null {
  try {
    const segments = token.split('.');
    if (segments.length !== 3) return null;
    const [header, body, signature] = segments;
    const expectedSig = base64UrlEncode(
      crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest()
    );
    const sigBuf = Buffer.from(signature);
    const expectedBuf = Buffer.from(expectedSig);
    if (
      sigBuf.length !== expectedBuf.length ||
      !crypto.timingSafeEqual(sigBuf, expectedBuf)
    ) {
      return null;
    }
    const decoded = JSON.parse(base64UrlDecode(body)) as AuthTokenPayload;
    if (!decoded.exp || decoded.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Autenticación requerida. Por favor inicia sesión para continuar.',
    });
    return;
  }
  const token = authHeader.slice(7).trim();
  const payload = verifyJwt(token);
  if (!payload) {
    res.status(401).json({
      error: 'Tu sesión expiró o el token no es válido. Inicia sesión nuevamente.',
    });
    return;
  }
  req.user = payload;
  next();
}

export function requireRole(allowedRoles: Array<'ADMIN' | 'CLIENTE'>) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Sesión no iniciada.' });
      return;
    }
    if (!allowedRoles.includes(req.user.rol)) {
      res.status(403).json({
        error: 'Acceso no autorizado. No cuentas con permisos para esta operación.',
      });
      return;
    }
    next();
  };
}
