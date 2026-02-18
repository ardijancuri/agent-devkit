import type {
  LLMProvider,
  LLMMessage,
  LLMToolDefinition,
  LLMResponse,
  LLMProviderConfig,
} from '../types.js';

export interface RetryOptions {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

export interface BaseLLMProviderOptions {
  apiKey: string;
  model: string;
  timeoutMs?: number;
  retry?: Partial<RetryOptions>;
}

const DEFAULT_RETRY: RetryOptions = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
};

export class ProviderError extends Error {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly statusCode?: number,
    public readonly retryable: boolean = false,
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}

export abstract class BaseLLMProvider implements LLMProvider {
  protected readonly apiKey: string;
  protected readonly model: string;
  protected readonly timeoutMs: number;
  protected readonly retryOptions: RetryOptions;

  constructor(options: BaseLLMProviderOptions) {
    this.apiKey = options.apiKey;
    this.model = options.model;
    this.timeoutMs = options.timeoutMs ?? 120_000;
    this.retryOptions = { ...DEFAULT_RETRY, ...options.retry };
  }

  abstract get providerName(): string;

  async chat(
    messages: LLMMessage[],
    tools: LLMToolDefinition[],
    config?: LLMProviderConfig,
  ): Promise<LLMResponse> {
    return this.withRetry(() => this.doChat(messages, tools, config));
  }

  protected abstract doChat(
    messages: LLMMessage[],
    tools: LLMToolDefinition[],
    config?: LLMProviderConfig,
  ): Promise<LLMResponse>;

  protected async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error | undefined;
    for (let attempt = 0; attempt <= this.retryOptions.maxRetries; attempt++) {
      try {
        return await this.withTimeout(fn(), this.timeoutMs);
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (err instanceof ProviderError && !err.retryable) throw err;
        if (attempt === this.retryOptions.maxRetries) break;
        const delay = Math.min(
          this.retryOptions.baseDelayMs * 2 ** attempt,
          this.retryOptions.maxDelayMs,
        );
        await this.sleep(delay + Math.random() * delay * 0.1);
      }
    }
    throw lastError ?? new ProviderError('Unknown error', this.providerName);
  }

  protected withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new ProviderError(`Timeout after ${ms}ms`, this.providerName, undefined, true)),
        ms,
      );
      promise.then(
        (v) => { clearTimeout(timer); resolve(v); },
        (e) => { clearTimeout(timer); reject(e); },
      );
    });
  }

  protected normalizeError(err: unknown): ProviderError {
    if (err instanceof ProviderError) return err;
    const msg = err instanceof Error ? err.message : String(err);
    const status = (err as { status?: number })?.status;
    const retryable = status !== undefined && (status === 429 || status >= 500);
    return new ProviderError(msg, this.providerName, status, retryable);
  }

  protected sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /** Rough token estimate (~4 chars per token) for when exact counts aren't available */
  static estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }
}
