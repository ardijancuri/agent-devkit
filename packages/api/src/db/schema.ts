import {
  pgTable,
  uuid,
  varchar,
  text,
  jsonb,
  integer,
  numeric,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';

// ─── Users ─────────────────────────────────────────────────────

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  passwordHash: text('password_hash').notNull(),
  plan: varchar('plan', { length: 50 }).notNull().default('free'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ─── Projects ──────────────────────────────────────────────────

export const projects = pgTable(
  'projects',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    configJson: jsonb('config_json'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [index('projects_user_id_idx').on(t.userId)],
);

// ─── Agent Definitions ─────────────────────────────────────────

export const agentDefinitions = pgTable(
  'agent_definitions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    model: varchar('model', { length: 255 }).notNull(),
    systemPrompt: text('system_prompt'),
    toolsJson: jsonb('tools_json'),
    permissionsJson: jsonb('permissions_json'),
    limitsJson: jsonb('limits_json'),
    positionX: integer('position_x').default(0),
    positionY: integer('position_y').default(0),
  },
  (t) => [index('agent_definitions_project_id_idx').on(t.projectId)],
);

// ─── Agent Connections ─────────────────────────────────────────

export const agentConnections = pgTable(
  'agent_connections',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    sourceAgentId: uuid('source_agent_id')
      .notNull()
      .references(() => agentDefinitions.id, { onDelete: 'cascade' }),
    targetAgentId: uuid('target_agent_id')
      .notNull()
      .references(() => agentDefinitions.id, { onDelete: 'cascade' }),
    channelType: varchar('channel_type', { length: 50 }).notNull().default('direct'),
    configJson: jsonb('config_json'),
  },
  (t) => [index('agent_connections_project_id_idx').on(t.projectId)],
);

// ─── Runs ──────────────────────────────────────────────────────

export const runs = pgTable(
  'runs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    status: varchar('status', { length: 50 }).notNull().default('pending'),
    inputJson: jsonb('input_json'),
    outputJson: jsonb('output_json'),
    totalTokens: integer('total_tokens').default(0),
    totalCost: numeric('total_cost', { precision: 12, scale: 6 }).default('0'),
    durationMs: integer('duration_ms'),
    startedAt: timestamp('started_at'),
    completedAt: timestamp('completed_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('runs_project_id_idx').on(t.projectId),
    index('runs_status_idx').on(t.status),
  ],
);

// ─── Run Events ────────────────────────────────────────────────

export const runEvents = pgTable(
  'run_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    runId: uuid('run_id')
      .notNull()
      .references(() => runs.id, { onDelete: 'cascade' }),
    agentId: varchar('agent_id', { length: 255 }),
    agentName: varchar('agent_name', { length: 255 }),
    eventType: varchar('event_type', { length: 100 }).notNull(),
    dataJson: jsonb('data_json'),
    tokens: integer('tokens'),
    cost: numeric('cost', { precision: 12, scale: 6 }),
    timestamp: timestamp('timestamp').notNull().defaultNow(),
  },
  (t) => [
    index('run_events_run_id_idx').on(t.runId),
    index('run_events_agent_id_idx').on(t.agentId),
  ],
);
