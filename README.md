# AgentDevKit

The IDE for multi-agent AI systems. Design, run, and monitor AI agent workflows from a visual dashboard.

## 🌐 Live Instance

| Service   | URL                              |
|-----------|----------------------------------|
| Dashboard | <a href="http://187.77.82.137:8082" target="_blank">http://187.77.82.137:8082</a> |
| API       | <a href="http://187.77.82.137:8082/api/v1" target="_blank">http://187.77.82.137:8082/api/v1</a> |

## Stack

- **Dashboard:** Next.js 16 + Tailwind CSS
- **API:** Hono + TypeScript
- **Database:** PostgreSQL + Drizzle ORM
- **Monorepo:** Turborepo

## Packages

| Package     | Description            |
|-------------|------------------------|
| `api`       | REST API + WebSocket   |
| `dashboard` | Web UI                 |
| `runtime`   | Agent execution engine |
| `cli`       | Command-line interface |

## Development

```bash
npm install
npx turbo dev
```
