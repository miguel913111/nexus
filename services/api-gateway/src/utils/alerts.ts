// @ts-nocheck
import { db } from '../db/database';
import { logger } from './logger';

export interface AlertConfig {
  userId: string;
  lowCreditsThreshold: number; // percentage
  emailSent: boolean;
  lastAlertAt: string | null;
}

// Check if user has low credits and send alert
export function checkLowCredits(userId: string, creditsRemaining: number, creditsTotal: number): { 
  isLow: boolean; 
  percentage: number;
  threshold: number;
} {
  const percentage = creditsTotal > 0 ? (creditsRemaining / creditsTotal) * 100 : 0;
  const threshold = 10; // Alert at 10%
  const isLow = percentage <= threshold && creditsRemaining > 0;

  if (isLow) {
    // Log alert (in production, send email/WhatsApp here)
    const existing = db.prepare(`
      SELECT * FROM low_credit_alerts WHERE user_id = ? AND alert_type = 'low_credits'
    `).get(userId);

    if (!existing) {
      db.prepare(`
        INSERT INTO low_credit_alerts (id, user_id, alert_type, message, credits_remaining, credits_total, percentage, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).run(
        crypto.randomUUID(),
        userId,
        'low_credits',
        `Créditos abaixo de ${threshold}%: ${Math.round(percentage)}% restantes (${creditsRemaining.toLocaleString()} tokens)`,
        creditsRemaining,
        creditsTotal,
        Math.round(percentage)
      );

      logger.warn(`LOW CREDITS ALERT: user=${userId}, remaining=${creditsRemaining}, percentage=${Math.round(percentage)}%`);
    }
  }

  return { isLow, percentage: Math.round(percentage), threshold };
}

// Get pending alerts for a user
export function getPendingAlerts(userId: string): any[] {
  return db.prepare(`
    SELECT * FROM low_credit_alerts 
    WHERE user_id = ? AND dismissed = 0
    ORDER BY created_at DESC
  `).all(userId) || [];
}

// Dismiss alert
export function dismissAlert(alertId: string): void {
  db.prepare(`UPDATE low_credit_alerts SET dismissed = 1 WHERE id = ?`).run(alertId);
}

// Initialize alerts table
export function initAlertsTable(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS low_credit_alerts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      alert_type TEXT NOT NULL,
      message TEXT NOT NULL,
      credits_remaining INTEGER,
      credits_total INTEGER,
      percentage INTEGER,
      dismissed INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_alerts_user ON low_credit_alerts(user_id)`);
}

// Generate crypto UUID fallback
if (typeof crypto === 'undefined' || !crypto.randomUUID) {
  (globalThis as any).crypto = { 
    randomUUID: () => require('crypto').randomUUID() 
  };
}
