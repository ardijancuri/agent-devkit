import OpenAI from 'openai';
import type {
  LLMMessage,
  LLMToolDefinition,
  LLMResponse,
  LLMProviderConfig,
  LLMToolCall,
} from '../types.js';
import { BaseLLMProvider, type BaseLLMProviderOptions } from './base.js';

export class OpenAIProvider extends BaseLLMProvider {
  private client: OpenAI;

  constructor(options: BaseLLMProviderOptions) {
    super(options);
    this.client = new OpenAI({ apiKey: this.apiKey });
  }

  get providerName(): string {
    return 'openai';
  }

  protected async doChat(
    messages: LLMMessage[],
    tools: LLMToolDefinition[],
    config?: LLMProviderConfig,
  ): Promise<LLMResponse> {
    const mappedMessages = messages.map(this.mapMessage);

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: mappedMessages,
        ...(config?.temperature !== undefined && { temperature: config.temperature }),
        ...(config?.maxTokens !== undefined && { max_tokens: config.maxTokens }),
        ...(config?.topP !== undefined && { top_p: config.topP }),
        ...(config?.stop && { stop: config.stop }),
        ...(tools.length > 0 && {
          tools: tools.map(this.mapTool),
          tool_choice: 'auto' as const,
        }),
      });

      const choice = response.choices[0];
      if (!choice) {
        return { content: null, tokensUsed: { input: 0, output: 0 }, finishReason: 'error' };
      }

      const toolCalls: LLMToolCall[] | undefined = choice.message.tool_calls?.map((tc) => ({
        id: tc.id,
        name: tc.function.name,
        arguments: tc.function.arguments,
      }));

      const finishReason =
        choice.finish_reason === 'tool_calls'
          ? 'tool_calls' as const
          : choice.finish_reason === 'length'
            ? 'length' as const
            : toolCalls && toolCalls.length > 0
              ? 'tool_calls' as const
              : 'stop' as const;

      return {
        content: choice.message.content,
        toolCalls: toolCalls && toolCalls.length > 0 ? toolCalls : undefined,
        tokensUsed: {
          input: response.usage?.prompt_tokens ?? 0,
          output: response.usage?.completion_tokens ?? 0,
        },
        finishReason,
      };
    } catch (err) {
      throw this.normalizeError(err);
    }
  }

  private mapMessage(msg: LLMMessage): OpenAI.ChatCompletionMessageParam {
    if (msg.role === 'tool') {
      return {
        role: 'tool' as const,
        content: msg.content,
        tool_call_id: msg.toolCallId ?? '',
      };
    }
    return { role: msg.role, content: msg.content } as OpenAI.ChatCompletionMessageParam;
  }

  private mapTool(tool: LLMToolDefinition): OpenAI.ChatCompletionTool {
    return {
      type: 'function' as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    };
  }
}
