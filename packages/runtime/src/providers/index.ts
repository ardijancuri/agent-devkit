import type { LLMProvider } from '../types.js';
import { AnthropicProvider } from './anthropic.js';
import { OpenAIProvider } from './openai.js';
import type { BaseLLMProviderOptions } from './base.js';

export { BaseLLMProvider, ProviderError, type BaseLLMProviderOptions } from './base.js';
export { AnthropicProvider } from './anthropic.js';
export { OpenAIProvider } from './openai.js';

export interface CreateProviderConfig {
  provider: 'anthropic' | 'openai';
  apiKey: string;
  model: string;
  options?: Omit<Partial<BaseLLMProviderOptions>, 'apiKey' | 'model'>;
}

export function createProvider(config: CreateProviderConfig): LLMProvider {
  const opts: BaseLLMProviderOptions = {
    apiKey: config.apiKey,
    model: config.model,
    ...config.options,
  };

  switch (config.provider) {
    case 'anthropic':
      return new AnthropicProvider(opts);
    case 'openai':
      return new OpenAIProvider(opts);
    default:
      throw new Error(`Unknown provider: ${config.provider as string}`);
  }
}
