/** Pricing per 1M tokens: [input, output] in USD */
const MODEL_PRICING: Record<string, [input: number, output: number]> = {
  // Anthropic Claude
  'claude-opus-4-20250514': [15, 75],
  'claude-sonnet-4-20250514': [3, 15],
  'claude-3-5-sonnet-20241022': [3, 15],
  'claude-3-5-haiku-20241022': [1, 5],
  'claude-3-opus-20240229': [15, 75],
  'claude-3-sonnet-20240229': [3, 15],
  'claude-3-haiku-20240307': [0.25, 1.25],

  // OpenAI GPT-4
  'gpt-4o': [2.5, 10],
  'gpt-4o-2024-11-20': [2.5, 10],
  'gpt-4o-mini': [0.15, 0.6],
  'gpt-4-turbo': [10, 30],
  'gpt-4': [30, 60],

  // OpenAI o-series
  'o1': [15, 60],
  'o1-mini': [3, 12],
  'o3-mini': [1.1, 4.4],
};

/**
 * Calculate cost in USD for a given model and token usage.
 */
export function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  const pricing = findPricing(model);
  if (!pricing) return 0;
  const [inputPer1M, outputPer1M] = pricing;
  return (inputTokens * inputPer1M + outputTokens * outputPer1M) / 1_000_000;
}

function findPricing(model: string): [number, number] | undefined {
  // Exact match first
  if (MODEL_PRICING[model]) return MODEL_PRICING[model];
  // Prefix match (e.g., "gpt-4o-2024-08-06" matches "gpt-4o")
  for (const [key, pricing] of Object.entries(MODEL_PRICING)) {
    if (model.startsWith(key)) return pricing;
  }
  return undefined;
}

/** Register or update pricing for a model. */
export function setModelPricing(model: string, inputPer1M: number, outputPer1M: number): void {
  MODEL_PRICING[model] = [inputPer1M, outputPer1M];
}
