import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { db, schema } from '../db/index.js';

const projects = new Hono();

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  configJson: z.record(z.unknown()).optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  configJson: z.record(z.unknown()).optional(),
});

// GET /projects
projects.get('/', async (c) => {
  const user = c.get('user') as { id: string };
  const rows = await db
    .select()
    .from(schema.projects)
    .where(eq(schema.projects.userId, user.id))
    .orderBy(schema.projects.updatedAt);

  return c.json({ success: true, data: rows });
});

// POST /projects
projects.post('/', async (c) => {
  const user = c.get('user') as { id: string };
  const body = await c.req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ success: false, error: { code: 'VALIDATION', message: parsed.error.message } }, 400);
  }

  const [project] = await db
    .insert(schema.projects)
    .values({ ...parsed.data, userId: user.id })
    .returning();

  return c.json({ success: true, data: project }, 201);
});

// GET /projects/:id
projects.get('/:id', async (c) => {
  const user = c.get('user') as { id: string };
  const id = c.req.param('id');

  const [project] = await db
    .select()
    .from(schema.projects)
    .where(and(eq(schema.projects.id, id), eq(schema.projects.userId, user.id)))
    .limit(1);

  if (!project) {
    return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } }, 404);
  }

  const agents = await db
    .select()
    .from(schema.agentDefinitions)
    .where(eq(schema.agentDefinitions.projectId, id));

  const connections = await db
    .select()
    .from(schema.agentConnections)
    .where(eq(schema.agentConnections.projectId, id));

  return c.json({ success: true, data: { ...project, agents, connections } });
});

// PATCH /projects/:id
projects.patch('/:id', async (c) => {
  const user = c.get('user') as { id: string };
  const id = c.req.param('id');
  const body = await c.req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ success: false, error: { code: 'VALIDATION', message: parsed.error.message } }, 400);
  }

  const [project] = await db
    .update(schema.projects)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(and(eq(schema.projects.id, id), eq(schema.projects.userId, user.id)))
    .returning();

  if (!project) {
    return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } }, 404);
  }

  return c.json({ success: true, data: project });
});

// DELETE /projects/:id
projects.delete('/:id', async (c) => {
  const user = c.get('user') as { id: string };
  const id = c.req.param('id');

  const [deleted] = await db
    .delete(schema.projects)
    .where(and(eq(schema.projects.id, id), eq(schema.projects.userId, user.id)))
    .returning({ id: schema.projects.id });

  if (!deleted) {
    return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } }, 404);
  }

  return c.json({ success: true, data: { id: deleted.id } });
});

export default projects;
