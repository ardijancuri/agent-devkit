import { Hono } from 'hono';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';
import { db, schema } from '../db/index.js';
import { broadcastToRun } from './ws.js';

const runs = new Hono();

const createRunSchema = z.object({
  input: z.unknown().optional(),
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

// POST /projects/:projectId/runs — trigger a new run
runs.post('/projects/:projectId/runs', async (c) => {
  const user = c.get('user') as { id: string };
  const projectId = c.req.param('projectId');

  if (!(await verifyProjectOwner(projectId, user.id))) {
    return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } }, 404);
  }

  const body = await c.req.json().catch(() => ({}));
  const parsed = createRunSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ success: false, error: { code: 'VALIDATION', message: parsed.error.message } }, 400);
  }

  const [run] = await db
    .insert(schema.runs)
    .values({
      projectId,
      status: 'pending',
      inputJson: parsed.data.input ?? null,
      startedAt: new Date(),
    })
    .returning();

  // TODO: integrate with @agent-devkit/runtime to actually execute the run
  // For now, mark as running and emit a start event
  await db
    .update(schema.runs)
    .set({ status: 'running' })
    .where(eq(schema.runs.id, run.id));

  const [event] = await db
    .insert(schema.runEvents)
    .values({
      runId: run.id,
      eventType: 'run_started',
      dataJson: { input: parsed.data.input },
    })
    .returning();

  broadcastToRun(run.id, { type: 'run_started', event });

  return c.json({ success: true, data: { ...run, status: 'running' } }, 201);
});

// GET /runs — list runs
runs.get('/runs', async (c) => {
  const user = c.get('user') as { id: string };
  const projectId = c.req.query('projectId');
  const status = c.req.query('status');

  // Get user's project IDs
  const userProjects = await db
    .select({ id: schema.projects.id })
    .from(schema.projects)
    .where(eq(schema.projects.userId, user.id));

  const projectIds = projectId
    ? [projectId]
    : userProjects.map((p) => p.id);

  if (projectIds.length === 0) {
    return c.json({ success: true, data: [] });
  }

  let query = db.select().from(schema.runs).orderBy(desc(schema.runs.createdAt));

  // Filter manually since we need IN clause
  const allRuns = await query;
  const filtered = allRuns.filter((r) => {
    if (!projectIds.includes(r.projectId)) return false;
    if (status && r.status !== status) return false;
    return true;
  });

  return c.json({ success: true, data: filtered });
});

// GET /runs/:id — get run with events
runs.get('/runs/:id', async (c) => {
  const id = c.req.param('id');

  const [run] = await db.select().from(schema.runs).where(eq(schema.runs.id, id)).limit(1);
  if (!run) {
    return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Run not found' } }, 404);
  }

  const events = await db
    .select()
    .from(schema.runEvents)
    .where(eq(schema.runEvents.runId, id))
    .orderBy(schema.runEvents.timestamp);

  return c.json({ success: true, data: { ...run, events } });
});

// GET /runs/:id/events — get events with filters
runs.get('/runs/:id/events', async (c) => {
  const id = c.req.param('id');
  const agentId = c.req.query('agentId');
  const eventType = c.req.query('type');

  const allEvents = await db
    .select()
    .from(schema.runEvents)
    .where(eq(schema.runEvents.runId, id))
    .orderBy(schema.runEvents.timestamp);

  const filtered = allEvents.filter((e) => {
    if (agentId && e.agentId !== agentId) return false;
    if (eventType && e.eventType !== eventType) return false;
    return true;
  });

  return c.json({ success: true, data: filtered });
});

// POST /runs/:id/stop — stop a running run
runs.post('/runs/:id/stop', async (c) => {
  const id = c.req.param('id');

  const [run] = await db.select().from(schema.runs).where(eq(schema.runs.id, id)).limit(1);
  if (!run) {
    return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Run not found' } }, 404);
  }

  if (run.status !== 'running' && run.status !== 'pending') {
    return c.json({ success: false, error: { code: 'BAD_REQUEST', message: 'Run is not active' } }, 400);
  }

  const [updated] = await db
    .update(schema.runs)
    .set({ status: 'cancelled', completedAt: new Date() })
    .where(eq(schema.runs.id, id))
    .returning();

  broadcastToRun(id, { type: 'run_stopped', runId: id });

  return c.json({ success: true, data: updated });
});

export default runs;
