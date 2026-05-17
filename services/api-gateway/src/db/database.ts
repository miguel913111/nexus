// @ts-nocheck
// Database adapter selector: better-sqlite3 for production, JSON for local dev
import fs from 'fs';
import path from 'path';

// Use better-sqlite3 when DB_PATH is set (Railway / Docker) or explicitly requested
const useBetterSQLite = process.env.DB_PATH || process.env.USE_BETTER_SQLITE === '1' || process.env.NODE_ENV === 'production';

let db: any;

if (useBetterSQLite) {
  const sqliteDb = require('./database-sqlite');
  db = sqliteDb.db;
} else {

// ======== JSON In-Memory Fallback (local dev on Windows) ========

const DB_FILE = path.join(__dirname, '../../data/nexus-db.json');

interface DB {
  users: any[];
  payments: any[];
  usage_logs: any[];
  low_credit_alerts: any[];
  referrals: any[];
  vouchers: any[];
  voucher_uses: any[];
}

let data: DB = {
  users: [],
  payments: [],
  usage_logs: [],
  low_credit_alerts: [],
  referrals: [],
  vouchers: [],
  voucher_uses: [],
};

// Load from disk if exists
if (fs.existsSync(DB_FILE)) {
  try {
    const loaded = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    data = { ...data, ...loaded };
  } catch { /* ignore */ }
}

function save() {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

function matchWhere(row: any, sql: string, params: any[]): boolean {
  const whereMatch = sql.match(/WHERE\s+(.+)/i);
  if (!whereMatch) return true;

  const whereClause = whereMatch[1];
  // Split by AND but not inside parentheses
  const conditions = whereClause.split(/\s+AND\s+/i).map((c: string) => c.trim());

  let paramIndex = 0;
  for (const condition of conditions) {
    // field = ?
    const eqMatch = condition.match(/^([\w_]+)\s*=\s*\?$/);
    if (eqMatch) {
      const field = eqMatch[1];
      if (String(row[field] ?? '') !== String(params[paramIndex] ?? '')) return false;
      paramIndex++;
      continue;
    }

    // field IS NOT NULL
    const notNullMatch = condition.match(/^([\w_]+)\s+IS\s+NOT\s+NULL$/i);
    if (notNullMatch) {
      const field = notNullMatch[1];
      if (row[field] == null) return false;
      continue;
    }

    // field IS NULL
    const isNullMatch = condition.match(/^([\w_]+)\s+IS\s+NULL$/i);
    if (isNullMatch) {
      const field = isNullMatch[1];
      if (row[field] != null) return false;
      continue;
    }

    // field <= ?
    const lteMatch = condition.match(/^([\w_]+)\s*<=\s*\?$/);
    if (lteMatch) {
      const field = lteMatch[1];
      if (row[field] == null) return false;
      if (new Date(row[field]) > new Date(params[paramIndex])) return false;
      paramIndex++;
      continue;
    }

    // field >= ?
    const gteMatch = condition.match(/^([\w_]+)\s*>=\s*\?$/);
    if (gteMatch) {
      const field = gteMatch[1];
      if (row[field] == null) return false;
      if (new Date(row[field]) < new Date(params[paramIndex])) return false;
      paramIndex++;
      continue;
    }

    // field < ?
    const ltMatch = condition.match(/^([\w_]+)\s*<\s*\?$/);
    if (ltMatch) {
      const field = ltMatch[1];
      if (row[field] == null) return false;
      if (new Date(row[field]) >= new Date(params[paramIndex])) return false;
      paramIndex++;
      continue;
    }

    // field > ?
    const gtMatch = condition.match(/^([\w_]+)\s*>\s*\?$/);
    if (gtMatch) {
      const field = gtMatch[1];
      if (row[field] == null) return false;
      if (new Date(row[field]) <= new Date(params[paramIndex])) return false;
      paramIndex++;
      continue;
    }

    // field != ? or field <> ?
    const neqMatch = condition.match(/^([\w_]+)\s*(?:!=|<>)/);
    if (neqMatch) {
      const field = neqMatch[1];
      if (String(row[field] ?? '') === String(params[paramIndex] ?? '')) return false;
      paramIndex++;
      continue;
    }

    // Fallback: check common hardcoded patterns from original code
    if (condition.includes('api_key = ?') && params.length >= 1) {
      if (row.api_key !== params[0]) return false;
      continue;
    }
    if (condition.includes('id = ?') && params.length >= 1) {
      if (row.id !== params[0]) return false;
      continue;
    }
    if (condition.includes('email = ?') && params.length >= 1) {
      if (row.email !== params[0]) return false;
      continue;
    }
    if (condition.includes('user_id = ?') && params.length >= 1) {
      if (row.user_id !== params[0]) return false;
      continue;
    }
    if (condition.includes('flutterwave_ref = ?') && params.length >= 1) {
      if (row.flutterwave_ref !== params[0]) return false;
      continue;
    }
    if (condition.includes('plan = ?') && params.length >= 1) {
      if (row.plan !== params[0]) return false;
      continue;
    }
    if (condition.includes('referral_code = ?') && params.length >= 1) {
      if (row.referral_code !== params[0]) return false;
      continue;
    }
    if (condition.includes('code = ?') && params.length >= 1) {
      if (row.code !== params[0]) return false;
      continue;
    }
    if (condition.includes('referrer_id = ?') && params.length >= 1) {
      if (row.referrer_id !== params[0]) return false;
      continue;
    }
    if (condition.includes('referred_id = ?') && params.length >= 1) {
      if (row.referred_id !== params[0]) return false;
      continue;
    }
    if (condition.includes('voucher_id = ?') && params.length >= 1) {
      if (row.voucher_id !== params[0]) return false;
      continue;
    }
  }

  return true;
}

function getTable(sql: string): keyof DB | null {
  const match = sql.match(/FROM\s+(\w+)/i);
  return match ? (match[1] as keyof DB) : null;
}

function getInsertTable(sql: string): keyof DB | null {
  const match = sql.match(/INTO\s+(\w+)/i);
  return match ? (match[1] as keyof DB) : null;
}

function getUpdateTable(sql: string): keyof DB | null {
  const match = sql.match(/UPDATE\s+(\w+)/i);
  return match ? (match[1] as keyof DB) : null;
}

function extractSetFields(sql: string): string[] {
  const match = sql.match(/SET\s+(.+?)(?:WHERE|$)/i);
  if (!match) return [];
  return match[1].split(',').map(s => s.trim().split('=')[0].trim());
}

function extractValues(sql: string): string[] {
  const match = sql.match(/\(([^)]+)\)\s*VALUES/);
  if (!match) return [];
  return match[1].split(',').map(s => s.trim());
}

function extractColumns(sql: string): string[] {
  const match = sql.match(/SELECT\s+(.+?)\s+FROM/i);
  if (!match) return [];
  return match[1].split(',').map(s => s.trim());
}

db = {
  exec(sql: string) {
    // Ignore CREATE TABLE / INDEX / PRAGMA for in-memory demo
    if (sql.match(/CREATE TABLE|CREATE INDEX|PRAGMA/i)) return;
    
    const table = getUpdateTable(sql);
    if (table && sql.includes('SET')) {
      const fields = extractSetFields(sql);
      const whereMatch = sql.match(/WHERE\s+(.+)/i);
      const whereParts = whereMatch ? whereMatch[1].split('=').map(s => s.trim()) : [];
      
      data[table] = data[table].map(row => {
        if (whereParts.length >= 2) {
          const field = whereParts[0];
          // Simple string comparison
          if (String(row[field]) === String(whereParts[1]).replace(/['"]/g, '')) {
            // Update with params - this is tricky without proper parsing
            // For demo, we handle the common UPDATE users SET ... WHERE id = ? pattern
          }
        }
        return row;
      });
      save();
    }
  },

  prepare(sql: string) {
    return {
      get(...params: any[]): any {
        const table = getTable(sql);
        if (!table) return null;
        const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
        return data[table].find(row => matchWhere(row, sql, flatParams)) || null;
      },

      all(...params: any[]): any[] {
        const table = getTable(sql);
        if (!table) return [];
        const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
        let results = data[table].filter(row => matchWhere(row, sql, flatParams));
        
        // Handle ORDER BY
        if (sql.includes('ORDER BY created_at DESC')) {
          results = results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
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
        
        // Handle GROUP BY
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
      },

      run(...params: any[]): { lastID: number; changes: number } {
        const insertTable = getInsertTable(sql);
        if (insertTable) {
          const columns = extractValues(sql);
          const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
          const row: any = {};
          columns.forEach((col, i) => {
            row[col] = flatParams[i];
          });
          // Generate ID if not provided
          if (!row.id && columns.includes('id')) {
            row.id = `auto-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          }
          data[insertTable].push(row);
          save();
          return { lastID: data[insertTable].length, changes: 1 };
        }

        const updateTable = getUpdateTable(sql);
        if (updateTable && sql.includes('SET')) {
          // Handle UPDATE users SET credits_remaining = credits_remaining - ? WHERE id = ?
          const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
          
          // Simple pattern matching for common updates
          if (sql.includes('credits_remaining = credits_remaining - ?') && sql.includes('WHERE id = ?')) {
            const deduct = flatParams[0];
            const id = flatParams[1];
            const idx = data[updateTable].findIndex((r: any) => r.id === id);
            if (idx >= 0) {
              data[updateTable][idx].credits_remaining = (data[updateTable][idx].credits_remaining || 0) - deduct;
              save();
              return { lastID: 0, changes: 1 };
            }
          }
          
          if (sql.includes('credits_remaining = ?') && sql.includes('WHERE id = ?')) {
            const credits = flatParams[0];
            const id = flatParams[1];
            const idx = data[updateTable].findIndex((r: any) => r.id === id);
            if (idx >= 0) {
              data[updateTable][idx].credits_remaining = credits;
              save();
              return { lastID: 0, changes: 1 };
            }
          }

          if (sql.includes('credits_remaining = credits_remaining + ?') && sql.includes('WHERE id = ?')) {
            const add = flatParams[0];
            const id = flatParams[1];
            const idx = data[updateTable].findIndex((r: any) => r.id === id);
            if (idx >= 0) {
              data[updateTable][idx].credits_remaining = (data[updateTable][idx].credits_remaining || 0) + add;
              save();
              return { lastID: 0, changes: 1 };
            }
          }

          if (sql.includes('credits_total = credits_total + ?') && sql.includes('WHERE id = ?')) {
            const add = flatParams[0];
            const id = flatParams[1];
            const idx = data[updateTable].findIndex((r: any) => r.id === id);
            if (idx >= 0) {
              data[updateTable][idx].credits_total = (data[updateTable][idx].credits_total || 0) + add;
              save();
              return { lastID: 0, changes: 1 };
            }
          }
          
          if (sql.includes('plan = ?') && sql.includes('WHERE id = ?')) {
            const plan = flatParams[0];
            const id = flatParams[1];
            const idx = data[updateTable].findIndex((r: any) => r.id === id);
            if (idx >= 0) {
              data[updateTable][idx].plan = plan;
              save();
              return { lastID: 0, changes: 1 };
            }
          }
          
          if (sql.includes('status = ?') && sql.includes('WHERE flutterwave_ref = ?')) {
            const status = flatParams[0];
            const ref = flatParams[1];
            const idx = data[updateTable].findIndex((r: any) => r.flutterwave_ref === ref);
            if (idx >= 0) {
              data[updateTable][idx].status = status;
              save();
              return { lastID: 0, changes: 1 };
            }
          }
          
          if (sql.includes('dismissed = 1')) {
            const id = flatParams[0];
            const idx = data[updateTable].findIndex((r: any) => r.id === id);
            if (idx >= 0) {
              data[updateTable][idx].dismissed = 1;
              save();
              return { lastID: 0, changes: 1 };
            }
          }

          if (sql.includes('status = ?') && sql.includes('WHERE id = ?')) {
            const status = flatParams[0];
            const id = flatParams[1];
            const idx = data[updateTable].findIndex((r: any) => r.id === id);
            if (idx >= 0) {
              data[updateTable][idx].status = status;
              save();
              return { lastID: 0, changes: 1 };
            }
          }

          if (sql.includes('uses_count = uses_count + 1') && sql.includes('WHERE id = ?')) {
            const id = flatParams[0];
            const idx = data[updateTable].findIndex((r: any) => r.id === id);
            if (idx >= 0) {
              data[updateTable][idx].uses_count = (data[updateTable][idx].uses_count || 0) + 1;
              save();
              return { lastID: 0, changes: 1 };
            }
          }

          if (sql.includes('signups = signups + 1') && sql.includes('WHERE referrer_id = ?')) {
            const referrerId = flatParams[0];
            const idx = data[updateTable].findIndex((r: any) => r.referrer_id === referrerId);
            if (idx >= 0) {
              data[updateTable][idx].signups = (data[updateTable][idx].signups || 0) + 1;
              save();
              return { lastID: 0, changes: 1 };
            }
          }

          if (sql.includes('earnings = earnings + ?') && sql.includes('WHERE referrer_id = ?')) {
            const amount = flatParams[0];
            const referrerId = flatParams[1];
            const idx = data[updateTable].findIndex((r: any) => r.referrer_id === referrerId);
            if (idx >= 0) {
              data[updateTable][idx].earnings = (data[updateTable][idx].earnings || 0) + amount;
              save();
              return { lastID: 0, changes: 1 };
            }
          }

          if (sql.includes('clicks = clicks + 1') && sql.includes('WHERE referral_code = ?')) {
            const code = flatParams[0];
            const idx = data[updateTable].findIndex((r: any) => r.referral_code === code);
            if (idx >= 0) {
              data[updateTable][idx].clicks = (data[updateTable][idx].clicks || 0) + 1;
              save();
              return { lastID: 0, changes: 1 };
            }
          }

          // Generic SET field = ? WHERE id = ? handler
          const setMatch = sql.match(/SET\s+([\w_]+)\s*=\s*\?/i);
          if (setMatch && sql.includes('WHERE id = ?')) {
            const field = setMatch[1];
            const value = flatParams[0];
            const id = flatParams[1];
            const idx = data[updateTable].findIndex((r: any) => r.id === id);
            if (idx >= 0) {
              data[updateTable][idx][field] = value;
              save();
              return { lastID: 0, changes: 1 };
            }
          }
        }
        
        return { lastID: 0, changes: 0 };
      },
    };
  },
};

} // end else

export { db };
