import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { db, schema } from '../db/index.js';

const agents = new Hono();

const createAgentSchema = z.object({
  name: z.string().min(1),
  model: z.string().min(1),
  systemPrompt: z.string().optional(),
  toolsJson: z.unknown().optional(),
  permissionsJson: z.unknown().optional(),
  limitsJson: z.unknown().optional(),
  positionX: z.number().int().optional(),
  positionY: z.number().int().optional(),
});

const updateAgentSchema = createAgentSchema.partial();

const createConnectionSchema = z.object({
  sourceAgentId: z.string().uuid(),
  targetAgentId: z.string().uuid(),
  channelType: z.enum(['direct', 'broadcast', 'queue']).optional(),
  configJson: z.record(z.unknown()).optional(),
});

// Helper: verify project ownership
async function verifyProjectOwner(projectId: string, userId: string) {
  const [p] = await db
    .select({ id: schema.projects.id })
    .from(schema.projects)
    .where(and(eq(schema.projects.id, projectId), eq(schema.projects.userId, userId)))
    .limit(1);
  return !!p;
}

// GET /projects/:projectId/agents
agents.get('/projects/:projectId/agents', async (c) => {
  const user = c.get('user') as { id: string };
  const projectId = c.req.param('projectId');

  if (!(await verifyProjectOwner(projectId, user.id))) {
    return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } }, 404);
  }

  const rows = await db
    .select()
    .from(schema.agentDefinitions)
    .where(eq(schema.agentDefinitions.projectId, projectId));

  return c.json({ success: true, data: rows });
});

// POST /projects/:projectId/agents
agents.post('/projects/:projectId/agents', async (c) => {
  const user = c.get('user') as { id: string };
  const projectId = c.req.param('projectId');

  if (!(await verifyProjectOwner(projectId, user.id))) {
    return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } }, 404);
  }

  const body = await c.req.json();
  const parsed = createAgentSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ success: false, error: { code: 'VALIDATION', message: parsed.error.message } }, 400);
  }

  const [agent] = await db
    .insert(schema.agentDefinitions)
    .values({ ...parsed.data, projectId })
    .returning();

  return c.json({ success: true, data: agent }, 201);
});

// PATCH /agents/:id
agents.patch('/agents/:id', async (c) => {
  const user = c.get('user') as { id: string };
  const id = c.req.param('id');
  const body = await c.req.json();
  const parsed = updateAgentSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ success: false, error: { code: 'VALIDATION', message: parsed.error.message } }, 400);
  }

  // Verify ownership via project
  const [existing] = await db
    .select({ projectId: schema.agentDefinitions.projectId })
    .from(schema.agentDefinitions)
    .where(eq(schema.agentDefinitions.id, id))
    .limit(1);

  if (!existing || !(await verifyProjectOwner(existing.projectId, user.id))) {
    return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Agent not found' } }, 404);
  }

  const [agent] = await db
    .update(schema.agentDefinitions)
    .set(parsed.data)
    .where(eq(schema.agentDefinitions.id, id))
    .returning();

  return c.json({ success: true, data: agent });
});

// DELETE /agents/:id
agents.delete('/agents/:id', async (c) => {
  const user = c.get('user') as { id: string };
  const id = c.req.param('id');

  const [existing] = await db
    .select({ projectId: schema.agentDefinitions.projectId })
    .from(schema.agentDefinitions)
    .where(eq(schema.agentDefinitions.id, id))
    .limit(1);

  if (!existing || !(await verifyProjectOwner(existing.projectId, user.id))) {
    return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Agent not found' } }, 404);
  }

  await db.delete(schema.agentDefinitions).where(eq(schema.agentDefinitions.id, id));
  return c.json({ success: true, data: { id } });
});

// POST /projects/:projectId/connections
agents.post('/projects/:projectId/connections', async (c) => {
  const user = c.get('user') as { id: string };
  const projectId = c.req.param('projectId');

  if (!(await verifyProjectOwner(projectId, user.id))) {
    return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } }, 404);
  }

  const body = await c.req.json();
  const parsed = createConnectionSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ success: false, error: { code: 'VALIDATION', message: parsed.error.message } }, 400);
  }

  const [conn] = await db
    .insert(schema.agentConnections)
    .values({ ...parsed.data, projectId })
    .returning();

  return c.json({ success: true, data: conn }, 201);
});

// DELETE /connections/:id
agents.delete('/connections/:id', async (c) => {
  const user = c.get('user') as { id: string };
  const id = c.req.param('id');

  const [existing] = await db
    .select({ projectId: schema.agentConnections.projectId })
    .from(schema.agentConnections)
    .where(eq(schema.agentConnections.id, id))
    .limit(1);

  if (!existing || !(await verifyProjectOwner(existing.projectId, user.id))) {
    return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Connection not found' } }, 404);
  }

  await db.delete(schema.agentConnections).where(eq(schema.agentConnections.id, id));
  return c.json({ success: true, data: { id } });
});

export default agents;
