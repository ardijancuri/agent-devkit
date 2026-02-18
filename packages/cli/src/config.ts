import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { readFile } from 'node:fs/promises';
import { z } from 'zod';
import type { RunConfig } from '@agent-devkit/runtime';

// ─── Validation Schema ─────────────────────────────────────────

const AgentConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  model: z.string(),
  systemPrompt: z.string(),
  tools: z.array(z.any()).optional(),
  permissions: z.object({
    allowedTools: z.array(z.string()).optional(),
    deniedTools: z.array(z.string()).optional(),
    canMessage: z.array(z.string()).optional(),
  }).optional(),
  limits: z.object({
    maxTokens: z.number().optional(),
    maxCost: z.number().optional(),
    maxToolCalls: z.number().optional(),
    timeoutMs: z.number().optional(),
  }).optional(),
});

const ConnectionSchema = z.object({
  sourceId: z.string(),
  targetId: z.string(),
  channelType: z.enum(['direct', 'broadcast', 'queue']),
});

const RunConfigSchema = z.object({
  agents: z.array(AgentConfigSchema).min(1),
  connections: z.array(ConnectionSchema),
  sharedState: z.record(z.unknown()).optional(),
  timeout: z.number().optional(),
  maxCost: z.number().optional(),
  input: z.unknown().optional(),
});

// ─── Config Loader ─────────────────────────────────────────────

export async function loadConfig(configPath: string): Promise<RunConfig> {
  const absPath = resolve(configPath);

  let rawConfig: unknown;

  if (absPath.endsWith('.json')) {
    const content = await readFile(absPath, 'utf-8');
    rawConfig = JSON.parse(content);
  } else {
    // TypeScript / JavaScript — dynamic import
    const fileUrl = pathToFileURL(absPath).href;
    const mod = await import(fileUrl);
    rawConfig = mod.default ?? mod.config ?? mod;
  }

  const result = RunConfigSchema.safeParse(rawConfig);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid config:\n${issues}`);
  }

  return result.data as RunConfig;
}
