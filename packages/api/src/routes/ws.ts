import type { IncomingMessage } from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import type { JWTPayload } from '../middleware/auth.js';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';

// runId → Set of connected WebSocket clients
const runSubscriptions = new Map<string, Set<WebSocket>>();

export function broadcastToRun(runId: string, data: unknown) {
  const clients = runSubscriptions.get(runId);
  if (!clients) return;

  const message = JSON.stringify(data);
  for (const ws of clients) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  }
}

export function setupWebSocket(wss: WebSocketServer) {
  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    const url = new URL(req.url || '/', `http://${req.headers.host}`);
    const token = url.searchParams.get('token');

    if (!token) {
      ws.close(4001, 'Missing token');
      return;
    }

    try {
      jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch {
      ws.close(4001, 'Invalid token');
      return;
    }

    const subscribedRuns = new Set<string>();

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());

        if (msg.type === 'subscribe' && msg.runId) {
          const runId = msg.runId as string;
          if (!runSubscriptions.has(runId)) {
            runSubscriptions.set(runId, new Set());
          }
          runSubscriptions.get(runId)!.add(ws);
          subscribedRuns.add(runId);
          ws.send(JSON.stringify({ type: 'subscribed', runId }));
        }

        if (msg.type === 'unsubscribe' && msg.runId) {
          const runId = msg.runId as string;
          runSubscriptions.get(runId)?.delete(ws);
          subscribedRuns.delete(runId);
        }
      } catch {
        // ignore malformed messages
      }
    });

    ws.on('close', () => {
      for (const runId of subscribedRuns) {
        const clients = runSubscriptions.get(runId);
        if (clients) {
          clients.delete(ws);
          if (clients.size === 0) runSubscriptions.delete(runId);
        }
      }
    });
  });
}
