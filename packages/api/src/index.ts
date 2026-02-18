import 'dotenv/config';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serve } from '@hono/node-server';
import { WebSocketServer } from 'ws';
import { authMiddleware } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import agentRoutes from './routes/agents.js';
import runRoutes from './routes/runs.js';
import { setupWebSocket } from './routes/ws.js';

const app = new Hono();

// Global middleware
app.use('*', cors());
app.use('*', logger());
app.use('*', authMiddleware);

// Health check
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// API v1 routes
const v1 = new Hono();
v1.route('/auth', authRoutes);
v1.route('/', projectRoutes);      // /projects, /projects/:id
v1.route('/', agentRoutes);        // /projects/:projectId/agents, /agents/:id, etc.
v1.route('/', runRoutes);          // /projects/:projectId/runs, /runs, /runs/:id

app.route('/api/v1', v1);

// Start server
const PORT = parseInt(process.env.PORT || '3300', 10);

const server = serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(`🚀 Agent DevKit API running on http://localhost:${info.port}`);
});

// WebSocket server on the same HTTP server
const wss = new WebSocketServer({ server: server as import('node:http').Server });
setupWebSocket(wss);

console.log(`📡 WebSocket server ready on ws://localhost:${PORT}/ws`);
