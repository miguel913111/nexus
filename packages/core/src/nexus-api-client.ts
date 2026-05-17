import axios, { AxiosInstance } from 'axios';
import { CompletionRequest, CompletionResponse, ChatMessage, PlanConfig } from '@nexus-ia/types';

export interface NexusClientConfig {
  apiKey: string;
  baseURL?: string;
}

export interface UserStatus {
  user: {
    id: string;
    email: string;
    name: string;
    plan: string;
    status: string;
    credits: {
      remaining: number;
      total: number;
      used: number;
    };
    expiresAt: string;
    lastRequestAt: string;
  };
  usageThisMonth: {
    requests: number;
    tokens: number;
    credits: number;
  };
  limits: {
    rateLimitPerMin: number;
    maxTokensPerRequest: number;
  };
}

export interface PaymentHistory {
  id: string;
  plan: string;
  amount_kz: number;
  status: string;
  created_at: string;
  paid_at: string;
}

export class NexusApiClient {
  private client: AxiosInstance;

  constructor(config: NexusClientConfig) {
    this.client = axios.create({
      baseURL: config.baseURL || 'https://api.nexus-ia.ao/v1',
      headers: {
        'X-API-Key': config.apiKey,
        'Content-Type': 'application/json'
      },
      timeout: 120000
    });
  }

  async chatCompletion(request: CompletionRequest): Promise<CompletionResponse & { credits?: { remaining: number; deducted: number } }> {
    const response = await this.client.post('/chat/completions', request);
    return response.data;
  }

  async *streamCompletion(request: CompletionRequest): AsyncGenerator<string> {
    const response = await this.client.post('/chat/completions', 
      { ...request, stream: true },
      { responseType: 'stream' }
    );

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

  async getStatus(): Promise<UserStatus> {
    const response = await this.client.get('/chat/status');
    return response.data;
  }

  async getUsage(limit?: number, offset?: number): Promise<{ logs: any[]; pagination: { total: number; limit: number; offset: number } }> {
    const response = await this.client.get('/billing/usage', {
      params: { limit, offset }
    });
    return response.data;
  }

  async getPlans(): Promise<{ plans: (PlanConfig & { id: string; totalCreditsWithBonus: number })[] }> {
    const response = await this.client.get('/billing/plans');
    return response.data;
  }

  async getBillingStatus(): Promise<{
    currentPlan: string;
    credits: { remaining: number; total: number; used: number };
    status: string;
    expiresAt: string;
    payments: PaymentHistory[];
  }> {
    const response = await this.client.get('/billing/status');
    return response.data;
  }
}
