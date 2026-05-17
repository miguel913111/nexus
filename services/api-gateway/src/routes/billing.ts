// @ts-nocheck
import { Router, Request, Response } from 'express';
import { PLANS, PlanType, getCreditsWithBonus } from '@nexus-ia/types';
import { db } from '../db/database';
import { AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Get all plans
router.get('/plans', (req: Request, res: Response) => {
  const plansWithComputed = Object.entries(PLANS).map(([key, plan]) => ({
    id: key,
    ...plan,
    totalCreditsWithBonus: getCreditsWithBonus(key as PlanType)
  }));

  res.json({ plans: plansWithComputed });
});

// Get user billing status
router.get('/status', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  
  const user = db.prepare(`
    SELECT plan, credits_remaining, credits_total, status, expires_at
    FROM users WHERE id = ?
  `).get(userId);

  if (!user) {
    return res.status(404).json({ error: 'Utilizador não encontrado' });
  }

  // Get payment history
  const payments = db.prepare(`
    SELECT id, plan, amount_kz, status, created_at, paid_at
    FROM payments WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 20
  `).all(userId);

  res.json({
    currentPlan: user.plan,
    credits: {
      remaining: user.credits_remaining,
      total: user.credits_total,
      used: user.credits_total - user.credits_remaining
    },
    status: user.status,
    expiresAt: user.expires_at,
    payments: payments || []
  });
});

// Get usage history
router.get('/usage', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
  const offset = parseInt(req.query.offset as string) || 0;

  const logs = db.prepare(`
    SELECT id, endpoint, tokens_input, tokens_output, tokens_total, 
           credits_deducted, status, error_message, created_at
    FROM usage_logs 
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(userId, limit, offset);

  const total = db.prepare(`
    SELECT COUNT(*) as count FROM usage_logs WHERE user_id = ?
  `).get(userId);

  res.json({
    logs: logs || [],
    pagination: {
      total: total.count,
      limit,
      offset
    }
  });
});

// Admin: get all users (protected by admin key)
router.get('/admin/users', (req: Request, res: Response) => {
  const adminKey = req.headers['x-admin-key'];
  if (adminKey !== process.env.ADMIN_API_KEY) {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  const users = db.prepare(`
    SELECT id, email, name, plan, credits_remaining, credits_total, status, created_at, expires_at
    FROM users
    ORDER BY created_at DESC
  `).all();

  res.json({ users: users || [] });
});

// Admin: get revenue stats
router.get('/admin/stats', (req: Request, res: Response) => {
  const adminKey = req.headers['x-admin-key'];
  if (adminKey !== process.env.ADMIN_API_KEY) {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  const revenue = db.prepare(`
    SELECT 
      SUM(CASE WHEN status = 'success' THEN amount_kz ELSE 0 END) as total_revenue_kz,
      COUNT(CASE WHEN status = 'success' THEN 1 END) as successful_payments,
      COUNT(*) as total_payments
    FROM payments
  `).get();

  const usersByPlan = db.prepare(`
    SELECT plan, COUNT(*) as count, SUM(credits_remaining) as total_credits
    FROM users
    GROUP BY plan
  `).all();

  const todayUsage = db.prepare(`
    SELECT SUM(tokens_total) as tokens, SUM(credits_deducted) as credits
    FROM usage_logs
    WHERE created_at >= date('now')
  `).get();

  res.json({
    revenue: {
      totalKZ: revenue.total_revenue_kz || 0,
      successfulPayments: revenue.successful_payments || 0,
      totalPayments: revenue.total_payments || 0
    },
    usersByPlan: usersByPlan || [],
    todayUsage: {
      tokens: todayUsage.tokens || 0,
      credits: todayUsage.credits || 0
    }
  });
});

export { router as billingRouter };
