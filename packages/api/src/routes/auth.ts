import { Hono } from 'hono';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db, schema } from '../db/index.js';
import { getJwtSecret } from '../middleware/auth.js';

const auth = new Hono();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(8),
});

function signToken(userId: string, email: string): string {
  return jwt.sign({ userId, email }, getJwtSecret(), { expiresIn: '7d' });
}

// POST /auth/login
auth.post('/login', async (c) => {
  const body = await c.req.json();
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ success: false, error: { code: 'VALIDATION', message: parsed.error.message } }, 400);
  }

  const { email, password } = parsed.data;
  const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return c.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid credentials' } }, 401);
  }

  const token = signToken(user.id, user.email);
  return c.json({
    success: true,
    data: {
      token,
      user: { id: user.id, email: user.email, name: user.name, plan: user.plan },
    },
  });
});

// POST /auth/register
auth.post('/register', async (c) => {
  const body = await c.req.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ success: false, error: { code: 'VALIDATION', message: parsed.error.message } }, 400);
  }

  const { email, name, password } = parsed.data;

  const [existing] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, email)).limit(1);
  if (existing) {
    return c.json({ success: false, error: { code: 'CONFLICT', message: 'Email already registered' } }, 409);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const [user] = await db.insert(schema.users).values({ email, name, passwordHash }).returning();

  const token = signToken(user.id, user.email);
  return c.json({
    success: true,
    data: {
      token,
      user: { id: user.id, email: user.email, name: user.name, plan: user.plan },
    },
  }, 201);
});

// GET /auth/me
auth.get('/me', async (c) => {
  const user = c.get('user') as { id: string; email: string; name: string; plan: string };
  return c.json({ success: true, data: { user } });
});

export default auth;
