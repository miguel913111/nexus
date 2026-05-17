// @ts-nocheck
// Production SQLite adapter using better-sqlite3
// Matches the same interface as the JSON in-memory adapter
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_DIR = process.env.DB_PATH ? path.dirname(process.env.DB_PATH) : path.join(__dirname, '../../data');
const DB_FILE = process.env.DB_PATH || path.join(DB_DIR, 'nexus.db');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const sqlite = new Database(DB_FILE);
sqlite.pragma('journal_mode = WAL');

// Initialize tables if they don't exist
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    name TEXT,
    api_key TEXT UNIQUE,
    plan TEXT DEFAULT 'teste',
    credits_total INTEGER DEFAULT 0,
    credits_remaining INTEGER DEFAULT 0,
    created_at TEXT,
    updated_at TEXT,
    status TEXT DEFAULT 'active',
    flutterwave_ref TEXT,
    referred_by TEXT,
    referral_code TEXT,
    github_id TEXT,
    github_username TEXT
  );

  CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    plan TEXT,
    amount INTEGER,
    currency TEXT,
    flutterwave_ref TEXT UNIQUE,
    transaction_id TEXT UNIQUE,
    status TEXT DEFAULT 'pending',
    created_at TEXT,
    metadata TEXT
  );

  CREATE TABLE IF NOT EXISTS usage_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    tokens_input INTEGER,
    tokens_output INTEGER,
    tokens_total INTEGER,
    model TEXT,
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS low_credit_alerts (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    dismissed INTEGER DEFAULT 0,
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS referrals (
    id TEXT PRIMARY KEY,
    referrer_id TEXT,
    referral_code TEXT UNIQUE,
    clicks INTEGER DEFAULT 0,
    signups INTEGER DEFAULT 0,
    earnings INTEGER DEFAULT 0,
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS vouchers (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE,
    discount_percent INTEGER,
    credits_bonus INTEGER,
    max_uses INTEGER,
    uses_count INTEGER DEFAULT 0,
    first_purchase_only INTEGER DEFAULT 0,
    expires_at TEXT,
    created_at TEXT,
    created_by TEXT
  );

  CREATE TABLE IF NOT EXISTS voucher_uses (
    id TEXT PRIMARY KEY,
    voucher_id TEXT,
    user_id TEXT,
    created_at TEXT
  );
`);

// Migrations for existing tables
try { sqlite.exec(`ALTER TABLE users ADD COLUMN expires_at TEXT`); } catch { /* already exists */ }
try { sqlite.exec(`ALTER TABLE users ADD COLUMN password_hash TEXT`); } catch { /* already exists */ }
try { sqlite.exec(`ALTER TABLE users ADD COLUMN last_request_at TEXT`); } catch { /* already exists */ }
try { sqlite.exec(`ALTER TABLE users ADD COLUMN google_id TEXT`); } catch { /* already exists */ }

// usage_logs migrations
try { sqlite.exec(`ALTER TABLE usage_logs ADD COLUMN api_key TEXT`); } catch { /* already exists */ }
try { sqlite.exec(`ALTER TABLE usage_logs ADD COLUMN endpoint TEXT`); } catch { /* already exists */ }
try { sqlite.exec(`ALTER TABLE usage_logs ADD COLUMN credits_deducted INTEGER DEFAULT 0`); } catch { /* already exists */ }
try { sqlite.exec(`ALTER TABLE usage_logs ADD COLUMN status TEXT`); } catch { /* already exists */ }
try { sqlite.exec(`ALTER TABLE usage_logs ADD COLUMN error_message TEXT`); } catch { /* already exists */ }
try { sqlite.exec(`ALTER TABLE usage_logs ADD COLUMN ip TEXT`); } catch { /* already exists */ }
try { sqlite.exec(`ALTER TABLE usage_logs ADD COLUMN user_agent TEXT`); } catch { /* already exists */ }

// low_credit_alerts migrations
try { sqlite.exec(`ALTER TABLE low_credit_alerts ADD COLUMN alert_type TEXT`); } catch { /* already exists */ }
try { sqlite.exec(`ALTER TABLE low_credit_alerts ADD COLUMN message TEXT`); } catch { /* already exists */ }
try { sqlite.exec(`ALTER TABLE low_credit_alerts ADD COLUMN percentage INTEGER`); } catch { /* already exists */ }

// payments migrations
try { sqlite.exec(`ALTER TABLE payments ADD COLUMN amount_kz INTEGER`); } catch { /* already exists */ }
try { sqlite.exec(`ALTER TABLE payments ADD COLUMN paid_at TEXT`); } catch { /* already exists */ }

function flattenParams(params: any[]): any[] {
  if (params.length === 1 && Array.isArray(params[0])) {
    return params[0];
  }
  return params;
}

export const db = {
  exec(sql: string) {
    sqlite.exec(sql);
  },

  prepare(sql: string) {
    const stmt = sqlite.prepare(sql);

    return {
      get(...params: any[]): any {
        const flat = flattenParams(params);
        try {
          return stmt.get(...flat) || null;
        } catch {
          return null;
        }
      },

      all(...params: any[]): any[] {
        const flat = flattenParams(params);
        try {
          let results = stmt.all(...flat);

          // Handle ORDER BY created_at DESC
          if (sql.includes('ORDER BY created_at DESC')) {
            results = results.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          }

          // Handle LIMIT
          const limitMatch = sql.match(/LIMIT\s+(\d+)/i);
          if (limitMatch) {
            results = results.slice(0, parseInt(limitMatch[1]));
          }

          // Handle OFFSET
          const offsetMatch = sql.match(/OFFSET\s+(\d+)/i);
          if (offsetMatch) {
            results = results.slice(parseInt(offsetMatch[1]));
          }

          // Handle GROUP BY plan
          if (sql.includes('GROUP BY plan')) {
            const grouped: Record<string, any> = {};
            for (const row of results) {
              const key = row.plan || 'unknown';
              if (!grouped[key]) grouped[key] = { plan: key, count: 0, total_credits: 0 };
              grouped[key].count++;
              grouped[key].total_credits += row.credits_remaining || 0;
            }
            return Object.values(grouped);
          }

          return results;
        } catch {
          return [];
        }
      },

      run(...params: any[]): { lastID: number; changes: number } {
        const flat = flattenParams(params);
        try {
          const info = stmt.run(...flat);
          return { lastID: Number(info.lastInsertRowid), changes: info.changes };
        } catch {
          return { lastID: 0, changes: 0 };
        }
      },
    };
  },
};
