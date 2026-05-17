// @ts-nocheck
import { Router, Request, Response } from 'express';
import { ModelRouter, createProductionRouter } from '../clients/model-router';
import { db } from '../db/database';
import { checkRateLimit, checkCredits, deductCredits } from '../utils/rate-limiter';
import { checkLowCredits } from '../utils/alerts';
import { logUsage } from '../middleware/request-logger';
import { AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import { PLANS } from '@nexus-ia/types';

const router = Router();

// Lazy-init router to allow env vars to be loaded
let modelRouter: ModelRouter | null = null;
function getRouter(): ModelRouter {
  if (!modelRouter) {
    modelRouter = createProductionRouter();
  }
  return modelRouter;
}

// Main chat completion endpoint
router.post('/completions', async (req: AuthenticatedRequest, res: Response) => {
  const startTime = Date.now();
  const userId = req.userId!;
  const apiKey = req.userApiKey!;
  const plan = req.userPlan!;
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'];

  try {
    // 1. Check rate limit (requests per minute)
    const rateLimit = await checkRateLimit(apiKey, plan);
    if (!rateLimit.allowed) {
      logUsage(userId, apiKey, '/v1/chat/completions', 0, 0, 'rate_limited', 
        `Rate limit exceeded. Plan: ${plan}`, clientIp, userAgent);
      
      return res.status(429).json({
        error: 'Rate limit excedido',
        code: 'RATE_LIMIT_EXCEEDED',
        remaining: 0,
        resetIn: rateLimit.resetIn,
        plan,
        limit: PLANS[plan].rateLimitPerMin
      });
    }

    // 2. Estimate tokens needed
    const body = req.body;
    const promptText = body.messages.map((m: any) => m.content).join(' ');
    const estimatedInputTokens = Math.ceil(promptText.length / 3);
    const estimatedTotalTokens = estimatedInputTokens + (body.maxTokens || 4096);

    // 3. Check credits
    const creditsCheck = await checkCredits(apiKey, estimatedTotalTokens);
    if (!creditsCheck.allowed && creditsCheck.remaining !== -1) {
      logUsage(userId, apiKey, '/v1/chat/completions', 0, 0, 'insufficient_credits',
        `Credits: ${creditsCheck.remaining}, needed: ${estimatedTotalTokens}`, clientIp, userAgent);
      
      return res.status(402).json({
        error: 'Créditos insuficientes',
        code: 'INSUFFICIENT_CREDITS',
        creditsRemaining: creditsCheck.remaining,
        creditsNeeded: estimatedTotalTokens,
        upgradeUrl: `${process.env.FRONTEND_URL}/upgrade`
      });
    }

    // Also check DB directly for accurate count
    const user = db.prepare('SELECT credits_remaining, credits_total FROM users WHERE id = ?').get(userId);
    if (!user || user.credits_remaining <= 0) {
      logUsage(userId, apiKey, '/v1/chat/completions', 0, 0, 'insufficient_credits',
        'DB credits depleted', clientIp, userAgent);
      
      return res.status(402).json({
        error: 'Créditos esgotados',
        code: 'CREDITS_DEPLETED',
        creditsRemaining: user?.credits_remaining || 0,
        upgradeUrl: `${process.env.FRONTEND_URL}/upgrade`
      });
    }

    // 3.5 Check low credits and alert
    const alertStatus = checkLowCredits(userId, user.credits_remaining, user.credits_total);

    // 4. Call AI with model fallback
    const router = getRouter();

    if (body.stream) {
      // Streaming response
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-RateLimit-Remaining', rateLimit.remaining.toString());
      res.setHeader('X-RateLimit-Reset', rateLimit.resetIn.toString());
      
      let fullContent = '';
      let tokensEstimated = estimatedInputTokens;
      let modelUsed = 'unknown';
      
      try {
        // Try streaming with fallback
        for await (const chunk of router.streamCompletion(body)) {
          fullContent += chunk;
          tokensEstimated += Math.ceil(chunk.length / 3);
          
          res.write(`data: ${JSON.stringify({ 
            choices: [{ delta: { content: chunk } }],
            usage: { total_tokens: tokensEstimated }
          })}\n\n`);
        }
        
        res.write('data: [DONE]\n\n');
        
        // Get which model was used from history
        const history = router.getFallbackHistory();
        const lastSuccess = history.slice().reverse().find(h => h.success);
        if (lastSuccess) modelUsed = lastSuccess.model;
        
        // Deduct credits (approximate for streaming)
        const totalTokens = estimatedInputTokens + Math.ceil(fullContent.length / 3);
        db.prepare('UPDATE users SET credits_remaining = credits_remaining - ? WHERE id = ?')
          .run(totalTokens, userId);
        deductCredits(apiKey, totalTokens).catch(() => {});
        
        logUsage(userId, apiKey, '/v1/chat/completions', estimatedInputTokens, 
          Math.ceil(fullContent.length / 3), 'success', null, clientIp, userAgent);
        
        res.end();
      } catch (err: any) {
        logger.error('Stream error:', err);
        res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
      }
    } else {
      // Non-streaming response with fallback
      const response = await router.chatCompletion(body);
      const totalTokens = response.tokensInput + response.tokensOutput;
      
      // 5. Deduct credits
      db.prepare('UPDATE users SET credits_remaining = credits_remaining - ? WHERE id = ?')
        .run(totalTokens, userId);
      deductCredits(apiKey, totalTokens).catch(() => {});
      
      // 6. Log usage
      logUsage(userId, apiKey, '/v1/chat/completions', response.tokensInput, 
        response.tokensOutput, 'success', null, clientIp, userAgent);
      
      // 7. Get updated credits
      const updatedUser = db.prepare('SELECT credits_remaining, credits_total FROM users WHERE id = ?').get(userId);
      const newAlert = checkLowCredits(userId, updatedUser.credits_remaining, updatedUser.credits_total);
      
      res.setHeader('X-RateLimit-Remaining', rateLimit.remaining.toString());
      res.setHeader('X-RateLimit-Reset', rateLimit.resetIn.toString());
      res.setHeader('X-Credits-Remaining', updatedUser.credits_remaining.toString());
      
      res.json({
        id: response.id,
        content: response.content,
        model: response.model,
        usage: {
          input_tokens: response.tokensInput,
          output_tokens: response.tokensOutput,
          total_tokens: totalTokens
        },
        credits: {
          remaining: updatedUser.credits_remaining,
          deducted: totalTokens
        },
        alerts: {
          lowCredits: newAlert.isLow,
          creditsPercentage: newAlert.percentage
        },
        meta: {
          plan,
          requestId: (req as any).requestId
        }
      });
    }

  } catch (err: any) {
    logger.error('Chat completion error:', err);
    
    logUsage(userId, apiKey, '/v1/chat/completions', 0, 0, 'error',
      err.message, clientIp, userAgent);
    
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Get user status and credits + alerts
router.get('/status', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const user = db.prepare(`
    SELECT id, email, name, plan, credits_remaining, credits_total, status, created_at, expires_at, last_request_at
    FROM users WHERE id = ?
  `).get(userId);

  if (!user) {
    return res.status(404).json({ error: 'Utilizador não encontrado' });
  }

  // Get usage stats for current month
  const usageStats = db.prepare(`
    SELECT 
      COUNT(*) as total_requests,
      SUM(tokens_total) as total_tokens,
      SUM(credits_deducted) as total_credits
    FROM usage_logs 
    WHERE user_id = ? AND created_at >= datetime('now', 'start of month')
  `).get(userId);

  // Get pending alerts
  const alerts = db.prepare(`
    SELECT id, alert_type, message, percentage, created_at
    FROM low_credit_alerts 
    WHERE user_id = ? AND dismissed = 0
    ORDER BY created_at DESC
  `).all(userId) || [];

  // Check current low credit status
  const alertStatus = checkLowCredits(userId, user.credits_remaining, user.credits_total);

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      plan: user.plan,
      status: user.status,
      credits: {
        remaining: user.credits_remaining,
        total: user.credits_total,
        used: user.credits_total - user.credits_remaining
      },
      expiresAt: user.expires_at,
      lastRequestAt: user.last_request_at
    },
    usageThisMonth: {
      requests: usageStats.total_requests || 0,
      tokens: usageStats.total_tokens || 0,
      credits: usageStats.total_credits || 0
    },
    limits: {
      rateLimitPerMin: PLANS[user.plan].rateLimitPerMin,
      maxTokensPerRequest: PLANS[user.plan].maxTokensPerRequest
    },
    alerts: {
      lowCredits: alertStatus.isLow,
      creditsPercentage: alertStatus.percentage,
      pending: alerts
    }
  });
});

// Dismiss alert
router.post('/alerts/:id/dismiss', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const alertId = req.params.id;
  
  // Verify alert belongs to user
  const alert = db.prepare('SELECT user_id FROM low_credit_alerts WHERE id = ?').get(alertId);
  if (!alert || alert.user_id !== userId) {
    return res.status(403).json({ error: 'Alerta não encontrado' });
  }
  
  db.prepare('UPDATE low_credit_alerts SET dismissed = 1 WHERE id = ?').run(alertId);
  res.json({ dismissed: true });
});

export { router as chatRouter };
