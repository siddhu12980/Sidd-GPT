let encoding_for_model: any = null;

// Only import tiktoken on the server side
if (typeof window === 'undefined') {
  try {
    const tiktoken = require("tiktoken");
    encoding_for_model = tiktoken.encoding_for_model;
  } catch (error) {
    console.warn("Failed to load tiktoken:", error);
  }
}

export const MODEL_CONFIGS = {
  "gpt-4o": {
    maxTokens: 128000,
    maxOutputTokens: 4096,
    costPer1kInput: 0.005,
    costPer1kOutput: 0.015,
  },
  "gpt-4o-mini": {
    maxTokens: 128000,
    maxOutputTokens: 16384,
    costPer1kInput: 0.00015,
    costPer1kOutput: 0.0006,
  },
  "gpt-4-turbo": {
    maxTokens: 128000,
    maxOutputTokens: 4096,
    costPer1kInput: 0.01,
    costPer1kOutput: 0.03,
  },
  "gpt-3.5-turbo": {
    maxTokens: 16385,
    maxOutputTokens: 4096,
    costPer1kInput: 0.0005,
    costPer1kOutput: 0.0015,
  },
} as const;

export type ModelName = keyof typeof MODEL_CONFIGS;

export class TokenManager {
  private model: ModelName;
  private encoding: any;

  constructor(model: ModelName = "gpt-4o") {
    this.model = model;
    
    // Only try to create encoding on server side
    if (typeof window === 'undefined' && encoding_for_model) {
      try {
        const encodingModel = model.startsWith("gpt-4")
          ? "gpt-4"
          : "gpt-3.5-turbo";
        this.encoding = encoding_for_model(encodingModel as any);
      } catch (error) {
        console.warn(
          "Failed to load tiktoken encoding, using fallback estimation"
        );
        this.encoding = null;
      }
    } else {
      this.encoding = null;
    }
  }

  countTokens(text: string): number {
    if (!text) return 0;

    if (this.encoding) {
      try {
        return this.encoding.encode(text).length;
      } catch (error) {
        console.warn("Tiktoken encoding failed, using fallback");
      }
    }

    return Math.ceil(text.length / 4);
  }

  countMessageTokens(
    messages: Array<{ role: string; content: string }>
  ): number {
    let totalTokens = 0;

    for (const message of messages) {
      totalTokens += this.countTokens(message.content);
      totalTokens += 4;
      totalTokens += this.countTokens(message.role);
    }

    totalTokens += 3;

    return totalTokens;
  }

  countImageTokens(width: number, height: number): number {
    const tiles = Math.ceil(width / 512) * Math.ceil(height / 512);
    return 85 + tiles * 170;
  }

  getModelConfig() {
    return MODEL_CONFIGS[this.model];
  }

  checkTokenLimits(
    messages: Array<{ role: string; content: string }>,
    maxOutputTokens?: number
  ): {
    withinLimits: boolean;
    inputTokens: number;
    maxInputTokens: number;
    estimatedOutputTokens: number;
    totalEstimated: number;
  } {
    const config = this.getModelConfig();
    const inputTokens = this.countMessageTokens(messages);
    const estimatedOutputTokens = maxOutputTokens || config.maxOutputTokens;
    const totalEstimated = inputTokens + estimatedOutputTokens;
    const maxInputTokens = config.maxTokens - estimatedOutputTokens;

    return {
      withinLimits:
        totalEstimated <= config.maxTokens && inputTokens <= maxInputTokens,
      inputTokens,
      maxInputTokens,
      estimatedOutputTokens,
      totalEstimated,
    };
  }

  trimMessagesToFit(
    messages: Array<{ role: string; content: string; id?: string }>,
    maxOutputTokens?: number
  ): Array<{ role: string; content: string; id?: string }> {
    const config = this.getModelConfig();
    const estimatedOutputTokens = maxOutputTokens || config.maxOutputTokens;
    const maxInputTokens = config.maxTokens - estimatedOutputTokens;

    const systemMessages = messages.filter((msg) => msg.role === "system");
    const conversationMessages = messages.filter(
      (msg) => msg.role !== "system"
    );

    if (conversationMessages.length === 0) return messages;

    const lastUserMessage =
      conversationMessages[conversationMessages.length - 1];
    const trimmedMessages = [...systemMessages];

    let currentTokens = this.countMessageTokens([
      ...systemMessages,
      lastUserMessage,
    ]);

    if (currentTokens > maxInputTokens) {
      const systemTokens = this.countMessageTokens(systemMessages);
      const availableForUser = maxInputTokens - systemTokens - 100;

      if (availableForUser > 0) {
        const truncatedContent = this.truncateText(
          lastUserMessage.content,
          availableForUser
        );
        trimmedMessages.push({
          ...lastUserMessage,
          content: truncatedContent,
        });
      } else {
        trimmedMessages.push(lastUserMessage);
      }

      return trimmedMessages;
    }

    trimmedMessages.push(lastUserMessage);

    const previousMessages = conversationMessages.slice(0, -1).reverse();

    for (const message of previousMessages) {
      const testMessages = [
        message,
        ...trimmedMessages.filter((m) => m.role !== "system"),
      ];
      const testTokens = this.countMessageTokens([
        ...systemMessages,
        ...testMessages,
      ]);

      if (testTokens <= maxInputTokens) {
        trimmedMessages.splice(-1, 0, message);
        currentTokens = testTokens;
      } else {
        break;
      }
    }

    return trimmedMessages;
  }

  private truncateText(text: string, maxTokens: number): string {
    if (this.countTokens(text) <= maxTokens) return text;

    let left = 0;
    let right = text.length;
    let result = text;

    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      const truncated = text.substring(0, mid) + "...";
      const tokens = this.countTokens(truncated);

      if (tokens <= maxTokens) {
        result = truncated;
        left = mid + 1;
      } else {
        right = mid;
      }
    }

    return result;
  }

  calculateCost(inputTokens: number, outputTokens: number): number {
    const config = this.getModelConfig();
    const inputCost = (inputTokens / 1000) * config.costPer1kInput;
    const outputCost = (outputTokens / 1000) * config.costPer1kOutput;
    return inputCost + outputCost;
  }

  getUsageSummary(
    messages: Array<{ role: string; content: string }>,
    maxOutputTokens?: number
  ): {
    model: string;
    inputTokens: number;
    estimatedOutputTokens: number;
    totalEstimated: number;
    maxTokens: number;
    utilizationPercentage: number;
    estimatedCost: number;
    withinLimits: boolean;
  } {
    const config = this.getModelConfig();
    const inputTokens = this.countMessageTokens(messages);
    const estimatedOutputTokens = maxOutputTokens || config.maxOutputTokens;
    const totalEstimated = inputTokens + estimatedOutputTokens;
    const utilizationPercentage = (totalEstimated / config.maxTokens) * 100;
    const estimatedCost = this.calculateCost(
      inputTokens,
      estimatedOutputTokens
    );

    return {
      model: this.model,
      inputTokens,
      estimatedOutputTokens,
      totalEstimated,
      maxTokens: config.maxTokens,
      utilizationPercentage,
      estimatedCost,
      withinLimits: totalEstimated <= config.maxTokens,
    };
  }
}