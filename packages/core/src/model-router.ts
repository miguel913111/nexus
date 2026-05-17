import axios from 'axios';
import { CompletionRequest, CompletionResponse, ChatMessage } from '@nexus-ia/types';

export interface ModelConfig {
  name: string;
  provider: string;
  apiKey: string;
  baseURL: string;
  modelId: string;
  priority: number; // lower = tried first
  maxRetries: number;
}

export interface RouterConfig {
  models: ModelConfig[];
  timeout: number;
}

export class ModelRouter {
  private configs: ModelConfig[];
  private timeout: number;
  private fallbackHistory: Array<{ model: string; success: boolean; error?: string }> = [];

  constructor(config: RouterConfig) {
    this.configs = config.models.sort((a, b) => a.priority - b.priority);
    this.timeout = config.timeout || 60000;
  }

  async chatCompletion(request: CompletionRequest): Promise<CompletionResponse & { model: string }> {
    const errors: string[] = [];

    for (const config of this.configs) {
      try {
        const result = await this.callModel(config, request);
        this.fallbackHistory.push({ model: config.name, success: true });
        return { ...result, model: config.name };
      } catch (err: any) {
        const errorMsg = err.message || 'Unknown error';
        errors.push(`${config.name}: ${errorMsg}`);
        this.fallbackHistory.push({ model: config.name, success: false, error: errorMsg });
        
        // Continue to next model
        console.warn(`Model ${config.name} failed, trying fallback...`);
      }
    }

    throw new Error(`All models failed: ${errors.join('; ')}`);
  }

  async *streamCompletion(request: CompletionRequest): AsyncGenerator<string> {
    for (const config of this.configs) {
      try {
        const stream = this.callModelStream(config, request);
        yield* stream;
        this.fallbackHistory.push({ model: config.name, success: true });
        return;
      } catch (err: any) {
        this.fallbackHistory.push({ model: config.name, success: false, error: err.message });
      }
    }
    
    throw new Error('All models failed for streaming');
  }

  private async callModel(config: ModelConfig, request: CompletionRequest): Promise<CompletionResponse> {
    const response = await axios.post(
      `${config.baseURL}/chat/completions`,
      {
        model: config.modelId,
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? 4096,
        stream: false
      },
      {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: this.timeout
      }
    );

    const data = response.data;
    const choice = data.choices[0];
    const usage = data.usage || {};

    return {
      id: data.id,
      content: choice.message.content,
      tokensUsed: usage.total_tokens || 0,
      tokensInput: usage.prompt_tokens || 0,
      tokensOutput: usage.completion_tokens || 0,
      finishReason: choice.finish_reason
    };
  }

  private async *callModelStream(config: ModelConfig, request: CompletionRequest): AsyncGenerator<string> {
    const response = await axios.post(
      `${config.baseURL}/chat/completions`,
      {
        model: config.modelId,
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? 4096,
        stream: true
      },
      {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        },
        responseType: 'stream',
        timeout: this.timeout
      }
    );

    for await (const chunk of response.data) {
      const lines = chunk.toString().split('\n').filter((line: string) => line.trim() !== '');
      for (const line of lines) {
        const message = line.replace(/^data: /, '');
        if (message === '[DONE]') return;
        try {
          const parsed = JSON.parse(message);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) yield content;
        } catch { /* ignore */ }
      }
    }
  }

  getFallbackHistory() {
    return this.fallbackHistory;
  }

  getHealthyModels(): string[] {
    // Return models that haven't failed recently
    const recentFailures = new Set(
      this.fallbackHistory
        .slice(-10)
        .filter(h => !h.success)
        .map(h => h.model)
    );
    return this.configs.map(c => c.name).filter(name => !recentFailures.has(name));
  }
}

// Pre-configured routers
export function createProductionRouter(): ModelRouter {
  const configs: ModelConfig[] = [];

  // Primary: DeepInfra Kimi K2.6
  if (process.env.DEEPINFRA_API_KEY) {
    configs.push({
      name: 'deepinfra-kimi',
      provider: 'deepinfra',
      apiKey: process.env.DEEPINFRA_API_KEY,
      baseURL: 'https://api.deepinfra.com/v1/openai',
      modelId: 'moonshotai/kimi-k2-6',
      priority: 1,
      maxRetries: 2
    });
  }

  // Fallback 1: OpenRouter
  if (process.env.OPENROUTER_API_KEY) {
    configs.push({
      name: 'openrouter-kimi',
      provider: 'openrouter',
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
      modelId: 'moonshotai/kimi-k2-6',
      priority: 2,
      maxRetries: 2
    });
  }

  // Fallback 2: Groq (fast, cheap)
  if (process.env.GROQ_API_KEY) {
    configs.push({
      name: 'groq-llama',
      provider: 'groq',
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
      modelId: 'llama-3.3-70b-versatile',
      priority: 3,
      maxRetries: 2
    });
  }

  // Fallback 3: Together AI
  if (process.env.TOGETHER_API_KEY) {
    configs.push({
      name: 'together-qwen',
      provider: 'together',
      apiKey: process.env.TOGETHER_API_KEY,
      baseURL: 'https://api.together.xyz/v1',
      modelId: 'Qwen/Qwen2.5-Coder-32B-Instruct',
      priority: 4,
      maxRetries: 1
    });
  }

  if (configs.length === 0) {
    throw new Error('No model API keys configured. Set at least DEEPINFRA_API_KEY');
  }

  return new ModelRouter({ models: configs, timeout: 120000 });
}
