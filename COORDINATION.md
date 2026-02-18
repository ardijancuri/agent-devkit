# COORDINATION — Agent DevKit Phase 2: Dashboard + Studio

## File Ownership (STRICT — no cross-editing)

### Agent 1: Dashboard Foundation
OWNS: `packages/dashboard/` (root files + src/app/ + src/lib/ + src/components/layout/)
- package.json, tsconfig.json, next.config.ts, tailwind.config.ts, postcss.config.js
- src/app/layout.tsx, src/app/page.tsx (dashboard home)
- src/app/login/page.tsx
- src/app/globals.css
- src/lib/api.ts (API client with WebSocket)
- src/lib/auth.tsx (auth context + provider)
- src/lib/store.ts (Zustand stores)
- src/lib/types.ts (frontend types)
- src/lib/constants.ts
- src/components/layout/Sidebar.tsx
- src/components/layout/Header.tsx
- src/components/layout/Shell.tsx (main layout wrapper)

### Agent 2: Agent Studio (Canvas)
OWNS: `packages/dashboard/src/app/studio/`, `packages/dashboard/src/components/studio/`
- src/app/studio/page.tsx
- src/app/studio/[id]/page.tsx (project editor)
- src/components/studio/AgentCanvas.tsx (React Flow canvas)
- src/components/studio/AgentNode.tsx (custom node for agents)
- src/components/studio/ConnectionEdge.tsx (custom edge)
- src/components/studio/AgentConfigPanel.tsx (right sidebar config)
- src/components/studio/ToolSelector.tsx
- src/components/studio/PatternLibrary.tsx (pre-built topologies)
- src/components/studio/CanvasToolbar.tsx (zoom, layout, save)
IMPORTS types from `src/lib/types.ts` (read-only)

### Agent 3: Run & Monitor Pages
OWNS: `packages/dashboard/src/app/runs/`, `packages/dashboard/src/app/monitor/`, `packages/dashboard/src/components/runs/`, `packages/dashboard/src/components/monitor/`
- src/app/runs/page.tsx (run history list)
- src/app/runs/[id]/page.tsx (single run detail)
- src/app/monitor/page.tsx (live monitoring)
- src/components/runs/RunCard.tsx
- src/components/runs/EventTimeline.tsx (execution timeline)
- src/components/runs/TokenWaterfall.tsx
- src/components/monitor/LiveAgentGrid.tsx
- src/components/monitor/CostTracker.tsx
- src/components/monitor/EventFeed.tsx
IMPORTS types from `src/lib/types.ts` (read-only)

### Agent 4: API Layer
OWNS: `packages/api/`
- package.json, tsconfig.json
- src/index.ts (Hono server entry)
- src/routes/auth.ts
- src/routes/projects.ts (CRUD)
- src/routes/agents.ts (agent definitions CRUD)
- src/routes/runs.ts (trigger, list, get, events)
- src/routes/ws.ts (WebSocket handler for live events)
- src/middleware/auth.ts
- src/db/schema.ts (Drizzle schema)
- src/db/index.ts (DB connection)

## Shared Dependencies
- All dashboard agents use Tailwind CSS + dark theme (bg-gray-950 base)
- React Flow v12 for canvas
- Zustand for state (Agent 1 sets up stores, others read from them)
- WebSocket for real-time (Agent 1 sets up connection, others consume)

## Rules
1. Do NOT edit files outside your ownership
2. Import types from `src/lib/types.ts` — don't duplicate type definitions
3. Dark theme: bg-gray-950 body, bg-gray-900 cards, bg-gray-800 inputs, border-gray-800
4. Use Tailwind only, no CSS modules
5. All components are 'use client' unless explicitly server components
6. Use lucide-react for icons
