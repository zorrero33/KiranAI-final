import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { UserStore } from './userStore.ts';
import { type UserEntity } from './db/types.ts';

export interface AuthContext {
  user: UserEntity;
  via: 'session' | 'firebase';
}

export interface AuthenticatedRequest extends Request {
  auth?: AuthContext;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

const userStore = UserStore.getInstance();

function extractBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  const token = header.slice(7).trim();
  return token.length > 0 ? token : null;
}

/**
 * Optional authentication: attaches req.auth when a valid session token is
 * present, but never rejects the request. Used to derive the effective user id.
 */
export const optionalAuth: RequestHandler = (req: Request, _res: Response, next: NextFunction) => {
  const token = extractBearerToken(req);
  if (token) {
    const userId = userStore.verifySessionToken(token);
    if (userId) {
      const user = userStore.getUserById(userId);
      if (user) {
        req.auth = { user, via: 'session' };
      }
    }
  }
  next();
};

/**
 * Hard authentication: rejects any request without a valid session token.
 */
export const requireAuth: RequestHandler = (req: Request, _res: Response, next: NextFunction) => {
  const token = extractBearerToken(req);
  const userId = token ? userStore.verifySessionToken(token) : null;
  const user = userId ? userStore.getUserById(userId) : undefined;
  if (!user) {
    return _res.status(401).json({ error: 'Autenticación requerida. Inicia sesión para continuar.' });
  }
  req.auth = { user, via: 'session' };
  next();
};

/**
 * Resolves the effective user id for a request. When the caller is
 * authenticated, the authenticated id always wins over any body/query value so
 * that a client can never act on behalf of another user.
 */
export function resolveUserId(req: Request, requested?: unknown): { userId: string; authenticated: boolean } {
  if (req.auth) {
    return { userId: req.auth.user.id, authenticated: true };
  }
  // Unauthenticated fallback: a single shared guest sandbox identity.
  return { userId: 'usr_guest', authenticated: false };
}

/**
 * Admin-only guard. Must run after requireAuth.
 */
export const requireAdmin: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  if (!req.auth) {
    return res.status(401).json({ error: 'Autenticación requerida.' });
  }
  if (req.auth.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acceso restringido a administradores.' });
  }
  next();
};

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

/**
 * Minimal in-memory fixed-window rate limiter keyed by authenticated user id
 * (or client IP for anonymous callers). Suitable for a single-instance
 * deployment; replace with a shared store when running multiple replicas.
 */
export function rateLimit(options: { windowMs: number; max: number; keyPrefix?: string }): RequestHandler {
  const buckets = new Map<string, RateLimitEntry>();
  const prefix = options.keyPrefix || 'rl';

  return (req: Request, res: Response, next: NextFunction) => {
    const identity = req.auth?.user.id || req.ip || 'unknown';
    const key = `${prefix}:${identity}`;
    const now = Date.now();

    let entry = buckets.get(key);
    if (!entry || now >= entry.resetAt) {
      entry = { count: 0, resetAt: now + options.windowMs };
      buckets.set(key, entry);
    }

    entry.count += 1;
    if (entry.count > options.max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader('Retry-After', String(retryAfter));
      return res.status(429).json({
        error: 'Demasiadas solicitudes. Espera un momento antes de volver a intentarlo.',
        retryAfterSeconds: retryAfter,
      });
    }

    // Opportunistic cleanup to bound memory usage.
    if (buckets.size > 5000) {
      for (const [k, v] of buckets) {
        if (now >= v.resetAt) buckets.delete(k);
      }
    }

    next();
  };
}

/**
 * Narrow CORS policy. Reflects only allow-listed origins plus localhost during
 * development. Falls back to '*' only when no allow-list is configured, which
 * keeps first-run local usage frictionless.
 */
export function buildCorsMiddleware() {
  const configured = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  const isAllowed = (origin: string): boolean => {
    if (configured.length === 0) return true;
    if (configured.includes(origin)) return true;
    try {
      const { hostname } = new URL(origin);
      if (hostname === 'localhost' || hostname === '127.0.0.1') return true;
    } catch {
      return false;
    }
    return false;
  };

  return (req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    if (origin && isAllowed(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
    } else if (!origin || configured.length === 0) {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  };
}
