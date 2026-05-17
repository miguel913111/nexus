// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import { ZodError, z } from 'zod';
import { PLANS, PlanType } from '@nexus-ia/types';
import { logger } from '../utils/logger';

// Force HTTPS in production
export function enforceHttps(req: Request, res: Response, next: NextFunction) {
  if (process.env.NODE_ENV === 'production') {
    if (req.headers['x-forwarded-proto'] !== 'https' && !req.secure) {
      return res.status(403).json({ 
        error: 'HTTPS obrigatório',
        code: 'HTTPS_REQUIRED'
      });
    }
  }
  next();
}

// Max body size validation
export function validateBodySize(maxBytes: number = 100 * 1024) {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    if (contentLength > maxBytes) {
      logger.warn(`Body too large: ${contentLength} bytes from ${req.ip}`);
      return res.status(413).json({ 
        error: 'Payload muito grande. Máximo 100KB.',
        code: 'PAYLOAD_TOO_LARGE'
      });
    }
    next();
  };
}

// Chat request validation schema
export const ChatRequestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['system', 'user', 'assistant']),
    content: z.string().min(1).max(30000)
  })).min(1).max(50),
  model: z.string().optional().default('kimi-k2-6'),
  temperature: z.number().min(0).max(2).optional().default(0.7),
  maxTokens: z.number().min(1).max(128000).optional().default(4096),
  stream: z.boolean().optional().default(false)
});

export function validateChatRequest(req: Request, res: Response, next: NextFunction) {
  try {
    req.body = ChatRequestSchema.parse(req.body);
    
    // Additional: check max tokens against plan
    const plan = (req as any).userPlan as PlanType;
    if (plan) {
      const planConfig = PLANS[plan];
      if (req.body.maxTokens > planConfig.maxTokensPerRequest) {
        return res.status(400).json({
          error: `maxTokens excede o limite do plano ${plan}. Máximo: ${planConfig.maxTokensPerRequest}`,
          code: 'MAX_TOKENS_EXCEEDED'
        });
      }
    }
    
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: err.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
        code: 'VALIDATION_ERROR'
      });
    }
    next(err);
  }
}

// Input sanitization - basic
export function sanitizeInput(req: Request, res: Response, next: NextFunction) {
  if (req.body && typeof req.body === 'object') {
    // Remove null bytes and excessive whitespace
    const sanitize = (obj: any): any => {
      if (typeof obj === 'string') {
        return obj.replace(/\0/g, '').trim();
      }
      if (Array.isArray(obj)) {
        return obj.map(sanitize);
      }
      if (obj && typeof obj === 'object') {
        return Object.fromEntries(
          Object.entries(obj).map(([k, v]) => [k, sanitize(v)])
        );
      }
      return obj;
    };
    req.body = sanitize(req.body);
  }
  next();
}
