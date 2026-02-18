# COORDINATION — Agent DevKit Phase 1 Build

## File Ownership (STRICT — no cross-editing)

### Agent 1: Runtime Engine
OWNS: `packages/runtime/`
- `src/engine/` — Scheduler, executor, agent lifecycle
- `src/types.ts` — Core type definitions (AgentConfig, RunConfig, RunEvent, etc.)
- `src/index.ts` — Public exports
- `package.json`, `tsconfig.json`

### Agent 2: Coordinator
OWNS: `packages/runtime/src/coordinator/`
- File locking system
- Task queue (claim/complete)
- Shared key-value state
- Message passing between agents
IMPORTS types from `../types.ts` (read-only)

### Agent 3: Provider Adapters + Telemetry
OWNS: `packages/runtime/src/providers/`, `packages/runtime/src/telemetry/`
- LLM provider adapters (Anthropic, OpenAI)
- Telemetry event collector
- Token counting, cost tracking
IMPORTS types from `../types.ts` (read-only)

### Agent 4: CLI
OWNS: `packages/cli/`
- CLI commands: init, run, logs
- Config file loading (devkit.config.ts)
- Console output formatting
IMPORTS from `@agent-devkit/runtime` (read-only)

## Rules
1. Do NOT edit files outside your ownership
2. Read shared types from `types.ts` but don't modify it (Agent 1 owns it)
3. All code must be TypeScript, strict mode
4. Use `NodeNext` module resolution
5. Export everything through index.ts barrel files
6. No external dependencies without justification — keep it lean
