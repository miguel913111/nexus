// @ts-nocheck
import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { AuthenticatedRequest, apiKeyAuth } from '../middleware/auth';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Helper: check admin key
function isAdmin(req: Request): boolean {
  return req.headers['x-admin-key'] === process.env.ADMIN_API_KEY;
}

// POST /v1/admin/vouchers - create voucher
router.post('/vouchers', (req: Request, res: Response) => {
  if (!isAdmin(req)) {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  const { code, discountPercent, maxUses, expiryDate, isFirstPurchaseOnly } = req.body;

  if (!code || !discountPercent || !maxUses || !expiryDate) {
    return res.status(400).json({ error: 'Campos obrigatórios: code, discountPercent, maxUses, expiryDate' });
  }

  if (discountPercent < 1 || discountPercent > 100) {
    return res.status(400).json({ error: 'discountPercent deve estar entre 1 e 100' });
  }

  const existing = db.prepare('SELECT id FROM vouchers WHERE code = ?').get(code);
  if (existing) {
    return res.status(409).json({ error: 'Código já existe' });
  }

  db.prepare(`
    INSERT INTO vouchers (id, code, discount_percent, max_uses, expiry_date, is_first_purchase_only)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(uuidv4(), code, discountPercent, maxUses, expiryDate, isFirstPurchaseOnly ? 1 : 0);

  logger.info(`Voucher criado: ${code} (${discountPercent}% off)`);
  res.status(201).json({ code, discountPercent, maxUses, expiryDate, isFirstPurchaseOnly: !!isFirstPurchaseOnly });
});

// GET /v1/admin/vouchers - list all vouchers
router.get('/vouchers', (req: Request, res: Response) => {
  if (!isAdmin(req)) {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  const vouchers = db.prepare('SELECT * FROM vouchers ORDER BY created_at DESC').all();
  res.json({ vouchers: vouchers || [] });
});

// GET /v1/vouchers/validate?code=XXX - validate voucher
router.get('/validate', (req: Request, res: Response) => {
  const code = req.query.code as string;
  if (!code) {
    return res.status(400).json({ error: 'Código necessário' });
  }

  const voucher = db.prepare('SELECT * FROM vouchers WHERE code = ?').get(code);
  if (!voucher) {
    return res.status(404).json({ valid: false, error: 'Código não encontrado' });
  }

  const now = new Date().toISOString();
  if (voucher.expiry_date && new Date(voucher.expiry_date) < new Date(now)) {
    return res.json({ valid: false, error: 'Código expirado' });
  }

  if (voucher.uses_count >= voucher.max_uses) {
    return res.json({ valid: false, error: 'Código esgotado' });
  }

  res.json({
    valid: true,
    code: voucher.code,
    discountPercent: voucher.discount_percent,
    isFirstPurchaseOnly: !!voucher.is_first_purchase_only
  });
});

// POST /v1/vouchers/apply - apply voucher at checkout (returns discounted amount)
router.post('/apply', apiKeyAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const { code, originalAmount } = req.body;

  if (!code || !originalAmount || originalAmount <= 0) {
    return res.status(400).json({ error: 'code e originalAmount são obrigatórios' });
  }

  const voucher = db.prepare('SELECT * FROM vouchers WHERE code = ?').get(code);
  if (!voucher) {
    return res.status(404).json({ error: 'Código não encontrado' });
  }

  const now = new Date().toISOString();
  if (voucher.expiry_date && new Date(voucher.expiry_date) < new Date(now)) {
    return res.status(400).json({ error: 'Código expirado' });
  }

  if (voucher.uses_count >= voucher.max_uses) {
    return res.status(400).json({ error: 'Código esgotado' });
  }

  // Check first-purchase-only restriction
  if (voucher.is_first_purchase_only) {
    const previousPayments = db.prepare('SELECT COUNT(*) as count FROM payments WHERE user_id = ? AND status = ?').get(userId, 'success');
    if (previousPayments && previousPayments.count > 0) {
      return res.status(400).json({ error: 'Código válido apenas para primeira compra' });
    }
  }

  const discount = Math.round(originalAmount * (voucher.discount_percent / 100));
  const finalAmount = originalAmount - discount;

  res.json({
    valid: true,
    code,
    originalAmount,
    discount,
    discountPercent: voucher.discount_percent,
    finalAmount
  });
});

// Internal helper to record voucher use (called from flutterwave webhook)
export function recordVoucherUse(voucherCode: string, userId: string): boolean {
  const voucher = db.prepare('SELECT * FROM vouchers WHERE code = ?').get(voucherCode);
  if (!voucher) return false;

  if (voucher.uses_count >= voucher.max_uses) return false;
  if (voucher.expiry_date && new Date(voucher.expiry_date) < new Date()) return false;

  db.prepare(`UPDATE vouchers SET uses_count = uses_count + 1 WHERE id = ?`).run(voucher.id);
  db.prepare(`
    INSERT INTO voucher_uses (id, voucher_id, user_id)
    VALUES (?, ?, ?)
  `).run(uuidv4(), voucher.id, userId);

  logger.info(`Voucher usado: ${voucherCode} por ${userId}`);
  return true;
}

export { router as vouchersRouter };
