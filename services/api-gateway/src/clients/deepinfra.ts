import axios, { AxiosInstance } from 'axios';
import { CompletionRequest, CompletionResponse, ChatMessage } from '@nexus-ia/types';

export interface DeepInfraConfig {
  apiKey: string;
  baseURL?: string;
  model?: string;
}

export class DeepInfraClient {
  private client: AxiosInstance;
  private model: string;

  constructor(config: DeepInfraConfig) {
    this.client = axios.create({
      baseURL: config.baseURL || 'https://api.deepinfra.com/v1/openai',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 120000 // 2 min for long completions
    });
    this.model = config.model || 'moonshotai/kimi-k2-6';
  }

  async chatCompletion(request: CompletionRequest): Promise<CompletionResponse> {
    const response = await this.client.post('/chat/completions', {
      model: this.model,
      messages: request.messages,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? 4096,
      stream: false
    });

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

  async *streamCompletion(request: CompletionRequest): AsyncGenerator<string> {
    const response = await this.client.post('/chat/completions', {
      model: this.model,
      messages: request.messages,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? 4096,
      stream: true
    }, {
      responseType: 'stream'
    });

    const stream = response.data;
    
    for await (const chunk of stream) {
      const lines = chunk.toString().split('\n').filter((line: string) => line.trim() !== '');
      
      for (const line of lines) {
        const message = line.replace(/^data: /, '');
        if (message === '[DONE]') return;
        
        try {
          const parsed = JSON.parse(message);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) yield content;
        } catch {
          // Ignore invalid lines
        }
      }
    }
  }

  // DeepInfra specific: get model status
  async getModelStatus(): Promise<{ status: string; model: string }> {
    try {
      const response = await this.client.get(`/models/${this.model}`);
      return {
        status: response.data.status || 'unknown',
        model: this.model
      };
    } catch {
      return { status: 'unavailable', model: this.model };
    }
  }
}

// System prompt optimized for code
export const CODE_SYSTEM_PROMPT = `Você é o NEXUS IA, um assistente de programação especializado.
Regras:
- Responda sempre em Português (Angola/Portugal)
- Forneça código limpo, comentado e de produção
- Explique o raciocínio antes de mostrar código complexo
- Sugira melhorias de performance e segurança
- Indique quando algo é experimental ou requer testes adicionais`;

export function createCodeContext(files: Array<{path: string, content: string}>): ChatMessage[] {
  const contextMessages: ChatMessage[] = [{
    role: 'system',
    content: CODE_SYSTEM_PROMPT
  }];

  if (files.length > 0) {
    contextMessages.push({
      role: 'system',
      content: `Contexto atual dos ficheiros:\n${files.map(f => 
        `--- ${f.path} ---\n${f.content}`
      ).join('\n\n')}`
    });
  }

  return contextMessages;
}
