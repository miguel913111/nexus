// @ts-nocheck
import { db } from './database';

// Users table
 db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    plan TEXT NOT NULL DEFAULT 'teste',
    api_key TEXT UNIQUE NOT NULL,
    credits_remaining INTEGER NOT NULL DEFAULT 0,
    credits_total INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active',
    referral_code TEXT,
    referred_by TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    expires_at TEXT,
    last_request_at TEXT
  )
`);

// Payments table
 db.exec(`
  CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    plan TEXT NOT NULL,
    amount_kz INTEGER NOT NULL,
    flutterwave_ref TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    paid_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`);

// Usage logs table
 db.exec(`
  CREATE TABLE IF NOT EXISTS usage_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    api_key TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    tokens_input INTEGER NOT NULL DEFAULT 0,
    tokens_output INTEGER NOT NULL DEFAULT 0,
    tokens_total INTEGER NOT NULL DEFAULT 0,
    credits_deducted INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL,
    error_message TEXT,
    ip TEXT NOT NULL,
    user_agent TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

// Referrals table
 db.exec(`
  CREATE TABLE IF NOT EXISTS referrals (
    id TEXT PRIMARY KEY,
    referrer_id TEXT UNIQUE NOT NULL,
    referral_code TEXT UNIQUE NOT NULL,
    clicks INTEGER NOT NULL DEFAULT 0,
    signups INTEGER NOT NULL DEFAULT 0,
    earnings INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

// Vouchers table
 db.exec(`
  CREATE TABLE IF NOT EXISTS vouchers (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    discount_percent INTEGER NOT NULL,
    max_uses INTEGER NOT NULL DEFAULT 1,
    uses_count INTEGER NOT NULL DEFAULT 0,
    expiry_date TEXT NOT NULL,
    is_first_purchase_only INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

// Voucher uses table
 db.exec(`
  CREATE TABLE IF NOT EXISTS voucher_uses (
    id TEXT PRIMARY KEY,
    voucher_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    used_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

// Indexes for performance
 db.exec(`CREATE INDEX IF NOT EXISTS idx_users_api_key ON users(api_key)`);
 db.exec(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
 db.exec(`CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code)`);
 db.exec(`CREATE INDEX IF NOT EXISTS idx_users_referred_by ON users(referred_by)`);
 db.exec(`CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id)`);
 db.exec(`CREATE INDEX IF NOT EXISTS idx_payments_flw_ref ON payments(flutterwave_ref)`);
 db.exec(`CREATE INDEX IF NOT EXISTS idx_usage_user ON usage_logs(user_id)`);
 db.exec(`CREATE INDEX IF NOT EXISTS idx_usage_created ON usage_logs(created_at)`);
 db.exec(`CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code)`);
 db.exec(`CREATE INDEX IF NOT EXISTS idx_vouchers_code ON vouchers(code)`);
 db.exec(`CREATE INDEX IF NOT EXISTS idx_voucher_uses_voucher ON voucher_uses(voucher_id)`);
 db.exec(`CREATE INDEX IF NOT EXISTS idx_voucher_uses_user ON voucher_uses(user_id)`);

// Insert default test user if not exists
 const testUser = db.prepare('SELECT id FROM users WHERE plan = ?').get('teste');
 if (!testUser) {
   db.prepare(`
     INSERT INTO users (id, email, name, plan, api_key, credits_remaining, credits_total, status, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
   `).run([
     'test-user-001',
     'demo@nexus.ia',
     'Utilizador Teste',
     'teste',
     'nx-test-00000000-0000-0000-0000-000000000001',
     100000,
     100000,
     'active',
     new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
   ]);
 }

// Seed default vouchers if not exists
const existingVoucher = db.prepare('SELECT id FROM vouchers WHERE code = ?').get('NEXUS10');
if (!existingVoucher) {
  db.prepare(`
    INSERT INTO vouchers (id, code, discount_percent, max_uses, expiry_date, is_first_purchase_only)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(['voucher-nexus10', 'NEXUS10', 10, 9999, new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), 0]);

  db.prepare(`
    INSERT INTO vouchers (id, code, discount_percent, max_uses, expiry_date, is_first_purchase_only)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(['voucher-angola20', 'ANGOLA20', 20, 9999, new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), 1]);
}

console.log('✅ Database initialized');
