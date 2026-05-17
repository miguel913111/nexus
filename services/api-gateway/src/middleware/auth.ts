// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import { db } from '../db/database';
import { validateApiKeyFormat } from '../utils/api-key';
import { cacheCredits } from '../utils/rate-limiter';
import { logger } from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userPlan?: string;
  userApiKey?: string;
  userCredits?: number;
}

export function apiKeyAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'] as string || req.headers['authorization']?.replace('Bearer ', '');
  
  if (!apiKey) {
    logger.warn(`Missing API key from IP: ${req.ip}`);
    return res.status(401).json({ 
      error: 'API Key necessária no header X-API-Key ou Authorization: Bearer',
      code: 'MISSING_API_KEY'
    });
  }

  if (!validateApiKeyFormat(apiKey)) {
    logger.warn(`Invalid API key format from IP: ${req.ip}`);
    return res.status(401).json({ 
      error: 'Formato de API Key inválido',
      code: 'INVALID_API_KEY_FORMAT'
    });
  }

  // Lookup user in database
  const user = db.prepare(`
    SELECT id, plan, api_key, credits_remaining, status, expires_at 
    FROM users 
    WHERE api_key = ?
  `).get(apiKey);

  if (!user) {
    logger.warn(`Unknown API key from IP: ${req.ip}`);
    return res.status(401).json({ 
      error: 'API Key inválida',
      code: 'INVALID_API_KEY'
    });
  }

  if (user.status !== 'active') {
    logger.warn(`Inactive user attempt: ${user.id}, status: ${user.status}`);
    return res.status(403).json({ 
      error: `Conta ${user.status}. Contacta suporte.`,
      code: 'ACCOUNT_INACTIVE'
    });
  }

  if (user.expires_at && new Date(user.expires_at) < new Date()) {
    logger.warn(`Expired subscription: ${user.id}`);
    return res.status(403).json({ 
      error: 'Assinatura expirada. Renova o teu plano.',
      code: 'SUBSCRIPTION_EXPIRED'
    });
  }

  // Attach user info to request
  req.userId = user.id;
  req.userPlan = user.plan;
  req.userApiKey = apiKey;
  req.userCredits = user.credits_remaining;

  // Cache credits in Redis for fast lookup
  cacheCredits(apiKey, user.credits_remaining).catch(() => {});

  // Update last request timestamp
  db.prepare(`UPDATE users SET last_request_at = datetime('now') WHERE id = ?`).run(user.id);

  next();
}
