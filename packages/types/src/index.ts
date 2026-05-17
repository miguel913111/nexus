export interface User {
  id: string;
  email: string;
  name: string;
  plan: PlanType;
  apiKey: string;
  creditsRemaining: number;
  creditsTotal: number;
  status: 'active' | 'suspended' | 'cancelled';
  createdAt: string;
  expiresAt: string | null;
  lastRequestAt: string | null;
}

export type PlanType = 'teste' | 'starter' | 'pro' | 'team';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CompletionRequest {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface CompletionResponse {
  id: string;
  content: string;
  tokensUsed: number;
  tokensInput: number;
  tokensOutput: number;
  finishReason: string;
}

export interface PlanConfig {
  name: string;
  credits: number;
  priceKZ: number;
  bonus: number;
  rateLimitPerMin: number;
  maxTokensPerRequest: number;
  features: string[];
}

export const PLANS: Record<PlanType, PlanConfig> = {
  teste: {
    name: 'Teste',
    credits: 10000,
    priceKZ: 0,
    bonus: 0,
    rateLimitPerMin: 10,
    maxTokensPerRequest: 2048,
    features: ['10.000 tokens', '10 req/min', 'Suporte básico', 'Sem limite de tempo']
  },
  starter: {
    name: 'Starter',
    credits: 6000000,
    priceKZ: 15000,
    bonus: 10,
    rateLimitPerMin: 30,
    maxTokensPerRequest: 4096,
    features: ['6M tokens (+10% bónus)', '30 req/min', 'Suporte email', 'Acesso 30 dias']
  },
  pro: {
    name: 'Pro',
    credits: 20000000,
    priceKZ: 60000,
    bonus: 20,
    rateLimitPerMin: 60,
    maxTokensPerRequest: 8192,
    features: ['20M tokens (+20% bónus)', '60 req/min', 'Suporte prioritário', 'Acesso 30 dias', 'Contexto extendido']
  },
  team: {
    name: 'Team',
    credits: 70000000,
    priceKZ: 220000,
    bonus: 25,
    rateLimitPerMin: 120,
    maxTokensPerRequest: 128000,
    features: ['70M tokens (+25% bónus)', '120 req/min', 'Suporte 24/7', 'Acesso 30 dias', 'API dedicada', 'Múltiplos utilizadores']
  }
};

export function getCreditsWithBonus(plan: PlanType): number {
  const config = PLANS[plan];
  return Math.floor(config.credits * (1 + config.bonus / 100));
}

export interface PaymentRecord {
  id: string;
  userId: string;
  plan: PlanType;
  amountKZ: number;
  flutterwaveRef: string;
  status: 'pending' | 'success' | 'failed';
  createdAt: string;
  paidAt: string | null;
}

export interface UsageLog {
  id: string;
  userId: string;
  apiKey: string;
  endpoint: string;
  tokensInput: number;
  tokensOutput: number;
  tokensTotal: number;
  creditsDeducted: number;
  status: 'success' | 'error' | 'rate_limited' | 'insufficient_credits';
  errorMessage: string | null;
  ip: string;
  userAgent: string;
  createdAt: string;
}

export interface FlutterwaveWebhookPayload {
  event: string;
  data: {
    id: number;
    tx_ref: string;
    flw_ref: string;
    amount: number;
    currency: string;
    status: string;
    customer: {
      email: string;
      name: string;
      phone_number: string;
    };
    meta?: Record<string, string>;
  };
}
