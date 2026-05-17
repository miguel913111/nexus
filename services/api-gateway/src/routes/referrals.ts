// @ts-nocheck
import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db/database';
import { AuthenticatedRequest, apiKeyAuth } from '../middleware/auth';
import { logger } from '../utils/logger';
import { generateApiKey } from '../utils/api-key';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

export function generateReferralCode(userId: string): string {
  return crypto.createHash('md5').update(userId).digest('hex').substring(0, 8).toUpperCase();
}

function ensureReferralRecord(userId: string) {
  const code = generateReferralCode(userId);
  const existing = db.prepare('SELECT * FROM referrals WHERE referrer_id = ?').get(userId);
  if (!existing) {
    db.prepare(`
      INSERT INTO referrals (id, referrer_id, referral_code, clicks, signups, earnings)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), userId, code, 0, 0, 0);
  }
  return code;
}

// GET /v1/referrals/code - get current user's referral code
router.get('/code', apiKeyAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const code = ensureReferralRecord(userId);
  res.json({ referralCode: code, referralLink: `https://nexus.ia/signup?ref=${code}` });
});

// GET /v1/referrals/stats - get referral stats
router.get('/stats', apiKeyAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  ensureReferralRecord(userId);
  const stats = db.prepare('SELECT * FROM referrals WHERE referrer_id = ?').get(userId);
  if (!stats) {
    return res.json({ clicks: 0, signups: 0, earnings: 0, referrals: [] });
  }

  const referredUsers = db.prepare('SELECT id, email, name, created_at FROM users WHERE referred_by = ?').all(userId);

  res.json({
    referralCode: stats.referral_code,
    clicks: stats.clicks || 0,
    signups: stats.signups || 0,
    earnings: stats.earnings || 0,
    referredUsers: referredUsers || []
  });
});

// POST /v1/referrals/track-click - track a referral click
router.post('/track-click', (req: Request, res: Response) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'Código de referência necessário' });

  const referral = db.prepare('SELECT * FROM referrals WHERE referral_code = ?').get(code);
  if (!referral) return res.status(404).json({ error: 'Código não encontrado' });

  db.prepare(`UPDATE referrals SET clicks = clicks + 1 WHERE referral_code = ?`).run(code);
  logger.info(`Referral click: ${code}`);
  res.json({ success: true });
});

// POST /v1/referrals/signup - sign up with referral code
router.post('/signup', (req: Request, res: Response) => {
  const { email, name, plan, ref } = req.body;
  if (!email || !name) {
    return res.status(400).json({ error: 'Email e nome são obrigatórios' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(409).json({ error: 'Email já registado' });
  }

  let referrer = null;
  let referrerId = null;
  if (ref) {
    referrer = db.prepare('SELECT * FROM referrals WHERE referral_code = ?').get(ref);
    if (referrer) {
      referrerId = referrer.referrer_id;
    }
  }

  const userId = uuidv4();
  const apiKey = generateApiKey();
  const referralCode = generateReferralCode(userId);
  const baseCredits = 1000; // starter credits
  const bonusCredits = referrer ? Math.round(baseCredits * 0.10) : 0;
  const totalCredits = baseCredits + bonusCredits;

  db.prepare(`
    INSERT INTO users (id, email, name, plan, api_key, credits_remaining, credits_total, status, referral_code, referred_by, expires_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    userId,
    email,
    name,
    plan || 'teste',
    apiKey,
    totalCredits,
    totalCredits,
    'active',
    referralCode,
    referrerId,
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  );

  // Ensure the new user has a referral record too
  db.prepare(`
    INSERT INTO referrals (id, referrer_id, referral_code, clicks, signups, earnings)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(uuidv4(), userId, referralCode, 0, 0, 0);

  if (referrer) {
    // Credit referrer with 10% bonus of base credits
    const referrerBonus = Math.round(baseCredits * 0.10);
    db.prepare(`UPDATE users SET credits_remaining = credits_remaining + ? WHERE id = ?`).run(referrerBonus, referrerId);
    db.prepare(`UPDATE users SET credits_total = credits_total + ? WHERE id = ?`).run(referrerBonus, referrerId);
    db.prepare(`UPDATE referrals SET signups = signups + 1 WHERE referrer_id = ?`).run(referrerId);
    db.prepare(`UPDATE referrals SET earnings = earnings + ? WHERE referrer_id = ?`).run(referrerBonus, referrerId);
    logger.info(`Referral signup: ${email} via ${ref}, referrer ${referrerId} earned ${referrerBonus} credits`);
  }

  res.status(201).json({
    id: userId,
    email,
    apiKey,
    credits: totalCredits,
    referrerBonus: bonusCredits
  });
});

export { router as referralsRouter };
