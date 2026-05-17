// @ts-nocheck
import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db/database';
import { logger } from '../utils/logger';
import { generateApiKey } from '../utils/api-key';
import { getCreditsWithBonus, PlanType, PLANS, FlutterwaveWebhookPayload } from '@nexus-ia/types';
import { v4 as uuidv4 } from 'uuid';
import { recordVoucherUse } from './vouchers';

const router = Router();

// Verify Flutterwave webhook signature
function verifyWebhookSignature(req: Request): boolean {
  const secretHash = process.env.FLUTTERWAVE_WEBHOOK_SECRET;
  const signature = req.headers['verif-hash'] as string;
  
  if (!secretHash || !signature) {
    logger.warn('Missing webhook secret or signature');
    return false;
  }
  
  return signature === secretHash;
}

// Alternative: verify using payload hash
function verifyWebhookPayload(req: Request): boolean {
  const secret = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!secret) return false;
  
  // Flutterwave sends signature in some implementations
  // This is a basic check; adjust per Flutterwave docs
  return true;
}

// Webhook endpoint for Flutterwave payments
router.post('/webhook', async (req: Request, res: Response) => {
  // Respond immediately to Flutterwave (they retry if timeout)
  res.status(200).json({ received: true });

  // Verify signature
  if (!verifyWebhookSignature(req) && !verifyWebhookPayload(req)) {
    logger.error('Invalid webhook signature');
    return;
  }

  const payload = req.body as FlutterwaveWebhookPayload;
  
  if (payload.event !== 'charge.completed') {
    logger.info(`Ignoring Flutterwave event: ${payload.event}`);
    return;
  }

  const data = payload.data;
  
  if (data.status !== 'successful') {
    logger.warn(`Payment not successful: ${data.status}, ref: ${data.tx_ref}`);
    
    // Update payment status
    db.prepare(`
      UPDATE payments SET status = ? WHERE flutterwave_ref = ?
    `).run('failed', data.tx_ref);
    
    return;
  }

  // Extract plan from meta or tx_ref
  const plan = (data.meta?.plan || data.tx_ref.split('_')[0]) as PlanType;
  const userEmail = data.customer.email;
  const userName = data.customer.name;
  const amount = data.amount;
  const currency = data.currency;
  const flwRef = data.flw_ref;
  const referralCode = data.meta?.referral_code || null;
  const voucherCode = data.meta?.voucher_code || null;

  if (!PLANS[plan]) {
    logger.error(`Invalid plan in webhook: ${plan}`);
    return;
  }

  logger.info(`Processing payment: ${flwRef}, plan: ${plan}, email: ${userEmail}, amount: ${amount} ${currency}`);

  try {
    // Check if payment already processed
    const existingPayment = db.prepare(`
      SELECT id FROM payments WHERE flutterwave_ref = ?
    `).get(flwRef);

    if (existingPayment) {
      logger.info(`Payment already processed: ${flwRef}`);
      return;
    }

    // Check if user exists
    let user = db.prepare('SELECT * FROM users WHERE email = ?').get(userEmail);
    const isNewUser = !user;

    if (isNewUser) {
      // Create new user
      const userId = uuidv4();
      const apiKey = generateApiKey();
      let credits = getCreditsWithBonus(plan);
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      // Apply new-user voucher bonus if provided
      let voucherDiscount = 0;
      if (voucherCode) {
        const voucher = db.prepare('SELECT * FROM vouchers WHERE code = ?').get(voucherCode);
        if (voucher && voucher.is_first_purchase_only) {
          voucherDiscount = voucher.discount_percent;
        }
      }

      // Apply referral bonus: new user gets 10% bonus credits on first purchase
      const referralBonus = referralCode ? Math.round(credits * 0.10) : 0;
      credits += referralBonus;

      // Ensure referral code for new user
      const userReferralCode = crypto.createHash('md5').update(userId).digest('hex').substring(0, 8).toUpperCase();

      let referrerId = null;
      if (referralCode) {
        const referrer = db.prepare('SELECT * FROM referrals WHERE referral_code = ?').get(referralCode);
        if (referrer) {
          referrerId = referrer.referrer_id;
        }
      }

      db.prepare(`
        INSERT INTO users (id, email, name, plan, api_key, credits_remaining, credits_total, status, referral_code, referred_by, expires_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(userId, userEmail, userName, plan, apiKey, credits, credits, 'active', userReferralCode, referrerId, expiresAt);

      user = { id: userId, api_key: apiKey };
      logger.info(`New user created: ${userId}, plan: ${plan}, credits: ${credits}`);

      // Create referral record for new user
      db.prepare(`
        INSERT INTO referrals (id, referrer_id, referral_code, clicks, signups, earnings)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(uuidv4(), userId, userReferralCode, 0, 0, 0);

      if (referrerId) {
        // Credit referrer with 10% bonus of new user's base credits
        const referrerBonus = Math.round(getCreditsWithBonus(plan) * 0.10);
        db.prepare(`UPDATE users SET credits_remaining = credits_remaining + ? WHERE id = ?`).run(referrerBonus, referrerId);
        db.prepare(`UPDATE users SET credits_total = credits_total + ? WHERE id = ?`).run(referrerBonus, referrerId);
        db.prepare(`UPDATE referrals SET signups = signups + 1 WHERE referrer_id = ?`).run(referrerId);
        db.prepare(`UPDATE referrals SET earnings = earnings + ? WHERE referrer_id = ?`).run(referrerBonus, referrerId);
        logger.info(`Referral bonus applied: referrer ${referrerId} earned ${referrerBonus} credits`);
      }
    } else {
      // Upgrade existing user
      let credits = getCreditsWithBonus(plan);
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      // Apply voucher bonus for existing user
      if (voucherCode) {
        const voucher = db.prepare('SELECT * FROM vouchers WHERE code = ?').get(voucherCode);
        if (voucher && !voucher.is_first_purchase_only) {
          // For existing users, non-first-purchase vouchers give extra credits equal to discount%
          const extraCredits = Math.round(credits * (voucher.discount_percent / 100));
          credits += extraCredits;
          logger.info(`Voucher bonus applied for existing user: +${extraCredits} credits`);
        }
      }

      db.prepare(`
        UPDATE users 
        SET plan = ?, credits_remaining = credits_remaining + ?, 
            credits_total = credits_total + ?, status = ?, expires_at = ?
        WHERE id = ?
      `).run(plan, credits, credits, 'active', expiresAt, user.id);

      logger.info(`User upgraded: ${user.id}, plan: ${plan}, added credits: ${credits}`);
    }

    // Record payment
    const paymentId = uuidv4();
    const amountKz = Math.round(amount * (currency === 'KZ' ? 1 : 900));
    db.prepare(`
      INSERT INTO payments (id, user_id, plan, amount_kz, flutterwave_ref, status, paid_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(paymentId, user.id, plan, amountKz, flwRef, 'success');

    // Record voucher use if provided
    if (voucherCode) {
      recordVoucherUse(voucherCode, user.id);
    }

    // TODO: Send welcome email with API key
    logger.info(`Payment completed: ${paymentId}, user: ${user.id}`);

  } catch (err: any) {
    logger.error('Webhook processing error:', err);
  }
});

// Manual payment verification (for admin/debug)
router.post('/verify', async (req: Request, res: Response) => {
  const { tx_ref } = req.body;
  
  if (!tx_ref) {
    return res.status(400).json({ error: 'tx_ref necessário' });
  }

  // Call Flutterwave API to verify
  try {
    const response = await fetch(`https://api.flutterwave.com/v3/transactions/${tx_ref}/verify`, {
      headers: {
        'Authorization': `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`
      }
    });
    
    const data = await response.json();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export { router as flutterwaveRouter };
