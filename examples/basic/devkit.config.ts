/**
 * Agent DevKit — Basic Example
 *
 * A 3-agent system demonstrating the Orchestrator → Workers pattern:
 *
 *   Orchestrator
 *       ├── Researcher  (searches for information)
 *       └── Writer      (produces the final output)
 *
 * The Orchestrator assigns tasks via direct messages.
 * Agents share state through the key-value store.
 */

import type { RunConfig, ToolConfig } from '@agent-devkit/runtime';

// ─── Tool Definitions ──────────────────────────────────────────

/**
 * A simple search tool for the Researcher agent.
 * In a real project, this would call an actual search API.
 */
const searchTool: ToolConfig = {
  name: 'web_search',
  description: 'Search the web for information on a topic',
  parameters: {} as any, // In practice: z.object({ query: z.string() })
  execute: async (params: unknown) => {
    const { query } = params as { query: string };
    // Simulated search results
    return {
      results: [
        { title: `Result 1 for "${query}"`, snippet: 'Relevant information...' },
        { title: `Result 2 for "${query}"`, snippet: 'More details...' },
      ],
    };
  },
};

/**
 * A write tool for the Writer agent to produce output files.
 */
const writeTool: ToolConfig = {
  name: 'write_file',
  description: 'Write content to an output file',
  parameters: {} as any, // In practice: z.object({ filename: z.string(), content: z.string() })
  execute: async (params: unknown) => {
    const { filename, content } = params as { filename: string; content: string };
    console.log(`[write_file] Would write ${content.length} chars to ${filename}`);
    return { success: true, filename };
  },
};

// ─── Run Configuration ─────────────────────────────────────────

const config: RunConfig = {
  // Define the agents
  agents: [
    {
      id: 'orchestrator',
      name: 'Orchestrator',
      model: 'claude-sonnet-4-20250514',
      systemPrompt: `You are the Orchestrator. Your job is to:
1. Break down the user's request into research and writing tasks
2. Send research tasks to the Researcher agent
3. Once research is complete, send writing tasks to the Writer agent
4. Review the final output and approve or request revisions

Always coordinate — never do the research or writing yourself.`,
      permissions: {
        canMessage: ['researcher', 'writer'], // Can talk to both workers
      },
      limits: {
        maxTokens: 10_000,
        maxCost: 0.50,
      },
    },
    {
      id: 'researcher',
      name: 'Researcher',
      model: 'claude-sonnet-4-20250514',
      systemPrompt: `You are the Researcher. Your job is to:
1. Receive research tasks from the Orchestrator
2. Use the web_search tool to find relevant information
3. Synthesize findings into clear summaries
4. Store research results in shared state for the Writer

Be thorough but concise. Focus on facts and key insights.`,
      tools: [searchTool],
      permissions: {
        allowedTools: ['web_search'],
        canMessage: ['orchestrator'], // Reports back to orchestrator
      },
      limits: {
        maxToolCalls: 10,
        maxCost: 0.30,
      },
    },
    {
      id: 'writer',
      name: 'Writer',
      model: 'claude-sonnet-4-20250514',
      systemPrompt: `You are the Writer. Your job is to:
1. Receive writing tasks from the Orchestrator
2. Read research from shared state
3. Produce well-structured, engaging content
4. Use the write_file tool to save the output

Write clearly and professionally. Cite research where appropriate.`,
      tools: [writeTool],
      permissions: {
        allowedTools: ['write_file'],
        canMessage: ['orchestrator'], // Reports back to orchestrator
      },
      limits: {
        maxToolCalls: 5,
        maxCost: 0.30,
      },
    },
  ],

  // Define communication topology
  connections: [
    // Orchestrator can send tasks to both workers
    { sourceId: 'orchestrator', targetId: 'researcher', channelType: 'direct' },
    { sourceId: 'orchestrator', targetId: 'writer', channelType: 'direct' },
    // Workers report back to orchestrator
    { sourceId: 'researcher', targetId: 'orchestrator', channelType: 'direct' },
    { sourceId: 'writer', targetId: 'orchestrator', channelType: 'direct' },
  ],

  // Initial shared state — agents can read/write during the run
  sharedState: {
    task: 'Write a blog post about the future of multi-agent AI systems',
    researchFindings: null,
    draft: null,
    status: 'pending',
  },

  // Global limits
  timeout: 120_000,  // 2 minute max
  maxCost: 1.00,     // $1 budget cap

  // Input passed to the orchestrator
  input: 'Write a blog post about the future of multi-agent AI systems',
};

export default config;
