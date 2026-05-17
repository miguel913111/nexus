import axios, { AxiosInstance } from 'axios';
import { CompletionRequest, CompletionResponse, ChatMessage } from '@nexus-ia/types';

export interface KimiClientConfig {
  apiKey: string;
  baseURL?: string;
  model?: string;
}

export class KimiClient {
  private client: AxiosInstance;
  private model: string;

  constructor(config: KimiClientConfig) {
    this.client = axios.create({
      baseURL: config.baseURL || 'https://api.moonshot.cn/v1',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000
    });
    this.model = config.model || 'kimi-k2-6';
  }

  async chatCompletion(request: CompletionRequest): Promise<CompletionResponse> {
    const response = await this.client.post('/chat/completions', {
      model: request.model || this.model,
      messages: request.messages,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? 4096,
      stream: false
    });

    const data = response.data;
    const choice = data.choices[0];

    return {
      id: data.id,
      content: choice.message.content,
      tokensUsed: data.usage?.total_tokens || 0,
      tokensInput: data.usage?.prompt_tokens || 0,
      tokensOutput: data.usage?.completion_tokens || 0,
      finishReason: choice.finish_reason
    };
  }

  async *streamCompletion(request: CompletionRequest): AsyncGenerator<string> {
    const response = await this.client.post('/chat/completions', {
      model: request.model || this.model,
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
          // Ignorar linhas inválidas
        }
      }
    }
  }

  async checkBalance(): Promise<number> {
    try {
      const response = await this.client.get('/user/balance');
      return response.data.data?.available_balance || 0;
    } catch {
      // Fallback se endpoint não existir
      return -1;
    }
  }
}

// System prompt otimizado para código
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
