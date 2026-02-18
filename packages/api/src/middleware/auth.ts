import type { Context, Next } from 'hono';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { db, schema } from '../db/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';

const PUBLIC_PATHS = ['/api/v1/auth/login', '/api/v1/auth/register', '/health'];

export interface JWTPayload {
  userId: string;
  email: string;
}

export function getJwtSecret(): string {
  return JWT_SECRET;
}

export async function authMiddleware(c: Context, next: Next) {
  const path = new URL(c.req.url).pathname;

  if (PUBLIC_PATHS.some((p) => path === p || path.startsWith('/ws'))) {
    return next();
  }

  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Missing or invalid token' } },
      401,
    );
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
    const [user] = await db
      .select({ id: schema.users.id, email: schema.users.email, name: schema.users.name, plan: schema.users.plan })
      .from(schema.users)
      .where(eq(schema.users.id, payload.userId))
      .limit(1);

    if (!user) {
      return c.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'User not found' } },
        401,
      );
    }

    c.set('user', user);
    return next();
  } catch {
    return c.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid token' } },
      401,
    );
  }
}
