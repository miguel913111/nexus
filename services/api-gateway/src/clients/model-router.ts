// @ts-nocheck
import axios from 'axios';

export interface ModelConfig {
  name: string;
  provider: string;
  apiKey: string;
  baseURL: string;
  modelId: string;
  priority: number;
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

  async chatCompletion(request: any): Promise<any & { model: string }> {
    const errors: string[] = [];

    for (const config of this.configs) {
      for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
        try {
          const result = await this.callModel(config, request);
          this.fallbackHistory.push({ model: config.name, success: true });
          return { ...result, model: config.name };
        } catch (err: any) {
          const errorMsg = err.message || 'Unknown error';
          
          if (err.response?.status === 401 || err.response?.status === 403) {
            errors.push(`${config.name}: Auth failed`);
            break;
          }
          
          if (attempt === config.maxRetries) {
            errors.push(`${config.name}: ${errorMsg}`);
          }
        }
      }
      
      this.fallbackHistory.push({ model: config.name, success: false, error: errors[errors.length - 1] });
      console.warn(`Model ${config.name} failed, trying fallback...`);
    }

    throw new Error(`All models failed: ${errors.join('; ')}`);
  }

  async *streamCompletion(request: any): AsyncGenerator<string> {
    for (const config of this.configs) {
      try {
        const stream = this.callModelStream(config, request);
        yield* stream;
        this.fallbackHistory.push({ model: config.name, success: true });
        return;
      } catch (err: any) {
        this.fallbackHistory.push({ model: config.name, success: false, error: err.message });
        console.warn(`Streaming model ${config.name} failed, trying fallback...`);
      }
    }
    
    throw new Error('All models failed for streaming');
  }

  private async callModel(config: ModelConfig, request: any): Promise<any> {
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
          'Content-Type': 'application/json',
          ...(config.provider === 'openrouter' ? { 'HTTP-Referer': 'https://nexus-ia.ao', 'X-Title': 'NEXUS IA' } : {})
        },
        timeout: this.timeout
      }
    );

    const data = response.data;
    const choice = data.choices[0];
    const usage = data.usage || {};

    return {
      id: data.id || `fallback-${Date.now()}`,
      content: choice.message.content,
      tokensUsed: usage.total_tokens || 0,
      tokensInput: usage.prompt_tokens || 0,
      tokensOutput: usage.completion_tokens || 0,
      finishReason: choice.finish_reason
    };
  }

  private async *callModelStream(config: ModelConfig, request: any): AsyncGenerator<string> {
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
          'Content-Type': 'application/json',
          ...(config.provider === 'openrouter' ? { 'HTTP-Referer': 'https://nexus-ia.ao', 'X-Title': 'NEXUS IA' } : {})
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
    return [...this.fallbackHistory];
  }

  getHealthyModels(): string[] {
    const recentFailures = new Set(
      this.fallbackHistory
        .slice(-10)
        .filter(h => !h.success)
        .map(h => h.model)
    );
    return this.configs.map(c => c.name).filter(name => !recentFailures.has(name));
  }
}

export function createProductionRouter(): ModelRouter {
  const configs: ModelConfig[] = [];

  // Try user's Moonshot key first (Kimi Open Platform)
  if (process.env.MOONSHOT_API_KEY) {
    configs.push({
      name: 'moonshot-kimi',
      provider: 'moonshot',
      apiKey: process.env.MOONSHOT_API_KEY,
      baseURL: process.env.MOONSHOT_BASE_URL || 'https://api.moonshot.ai/v1',
      modelId: 'kimi-k2.6',
      priority: 1,
      maxRetries: 2
    });
  }

  // Fallback: Groq (fast, free tier available)
  if (process.env.GROQ_API_KEY) {
    configs.push({
      name: 'groq-llama',
      provider: 'groq',
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
      modelId: 'llama-3.3-70b-versatile',
      priority: 2,
      maxRetries: 2
    });
  }

  // Fallback: OpenRouter
  if (process.env.OPENROUTER_API_KEY) {
    configs.push({
      name: 'openrouter-kimi',
      provider: 'openrouter',
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
      modelId: 'moonshotai/kimi-k2-6',
      priority: 3,
      maxRetries: 2
    });
  }

  // Fallback: DeepInfra
  if (process.env.DEEPINFRA_API_KEY) {
    configs.push({
      name: 'deepinfra-kimi',
      provider: 'deepinfra',
      apiKey: process.env.DEEPINFRA_API_KEY,
      baseURL: 'https://api.deepinfra.com/v1/openai',
      modelId: 'moonshotai/kimi-k2-6',
      priority: 4,
      maxRetries: 2
    });
  }

  // Demo mode: if no keys, show a warning but don't crash
  if (configs.length === 0) {
    console.warn('⚠️  No AI API keys configured. Set MOONSHOT_API_KEY, GROQ_API_KEY, OPENROUTER_API_KEY, or DEEPINFRA_API_KEY');
    // Return a dummy router that will fail gracefully
    return new ModelRouter({ 
      models: [],
      timeout: 1000 
    });
  }

  return new ModelRouter({ models: configs, timeout: 120000 });
}
