import Anthropic from '@anthropic-ai/sdk';
import type {
  LLMMessage,
  LLMToolDefinition,
  LLMResponse,
  LLMProviderConfig,
  LLMToolCall,
} from '../types.js';
import { BaseLLMProvider, ProviderError, type BaseLLMProviderOptions } from './base.js';

export class AnthropicProvider extends BaseLLMProvider {
  private client: Anthropic;

  constructor(options: BaseLLMProviderOptions) {
    super(options);
    this.client = new Anthropic({ apiKey: this.apiKey });
  }

  get providerName(): string {
    return 'anthropic';
  }

  protected async doChat(
    messages: LLMMessage[],
    tools: LLMToolDefinition[],
    config?: LLMProviderConfig,
  ): Promise<LLMResponse> {
    const { systemPrompt, chatMessages } = this.splitSystem(messages);

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: config?.maxTokens ?? 4096,
        ...(config?.temperature !== undefined && { temperature: config.temperature }),
        ...(config?.topP !== undefined && { top_p: config.topP }),
        ...(config?.stop && { stop_sequences: config.stop }),
        ...(systemPrompt && { system: systemPrompt }),
        messages: chatMessages as Anthropic.MessageParam[],
        ...(tools.length > 0 && { tools: tools.map(this.mapTool) }),
      });

      return this.mapResponse(response);
    } catch (err) {
      throw this.normalizeError(err);
    }
  }

  private splitSystem(messages: LLMMessage[]): {
    systemPrompt: string | undefined;
    chatMessages: Array<{ role: string; content: string | Anthropic.ToolResultBlockParam[] }>;
  } {
    let systemPrompt: string | undefined;
    const chatMessages: Array<{ role: string; content: string | Anthropic.ToolResultBlockParam[] }> = [];

    for (const msg of messages) {
      if (msg.role === 'system') {
        systemPrompt = (systemPrompt ? systemPrompt + '\n' : '') + msg.content;
      } else if (msg.role === 'tool') {
        chatMessages.push({
          role: 'user',
          content: [
            {
              type: 'tool_result' as const,
              tool_use_id: msg.toolCallId ?? '',
              content: msg.content,
            },
          ],
        });
      } else {
        chatMessages.push({ role: msg.role, content: msg.content });
      }
    }

    return { systemPrompt, chatMessages };
  }

  private mapTool(tool: LLMToolDefinition): Anthropic.Tool {
    return {
      name: tool.name,
      description: tool.description,
      input_schema: tool.parameters as Anthropic.Tool.InputSchema,
    };
  }

  private mapResponse(response: Anthropic.Message): LLMResponse {
    let content: string | null = null;
    const toolCalls: LLMToolCall[] = [];

    for (const block of response.content) {
      if (block.type === 'text') {
        content = (content ?? '') + block.text;
      } else if (block.type === 'tool_use') {
        toolCalls.push({
          id: block.id,
          name: block.name,
          arguments: JSON.stringify(block.input),
        });
      }
    }

    const finishReason =
      response.stop_reason === 'tool_use'
        ? 'tool_calls' as const
        : response.stop_reason === 'max_tokens'
          ? 'length' as const
          : 'stop' as const;

    return {
      content,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      tokensUsed: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
      },
      finishReason,
    };
  }
}
