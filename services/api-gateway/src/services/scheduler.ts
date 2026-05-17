// @ts-nocheck
import cron from 'node-cron';
import { db } from '../db/database';
import { logger } from '../utils/logger';

function sendReminderEmail(email: string, daysLeft: number, urgency: 'normal' | 'urgent') {
  // In production, integrate with SendGrid/Resend/WhatsApp here
  logger.info(`📧 [${urgency.toUpperCase()}] Lembrete enviado para ${email}: assinatura expira em ${daysLeft} dia(s)`);
}

function suspendAccount(userId: string, email: string) {
  db.prepare(`UPDATE users SET status = ? WHERE id = ?`).run('suspended', userId);
  logger.warn(`🚫 Conta suspensa: ${userId} (${email}) - assinatura expirada`);
}

export function startScheduler() {
  // Run daily at 08:00 Angola time (UTC+1)
  cron.schedule('0 8 * * *', () => {
    logger.info('⏰ Scheduler: verificando assinaturas...');
    const now = new Date().toISOString();
    const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const in1Day = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString();

    // 1. Reminder: expiring in 7 days
    const expiringIn7Days = db.prepare(`
      SELECT id, email, name, expires_at FROM users
      WHERE status = ? AND expires_at IS NOT NULL AND expires_at > ? AND expires_at <= ?
    `).all('active', now, in7Days);

    for (const user of expiringIn7Days || []) {
      const daysLeft = Math.ceil((new Date(user.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysLeft > 1) {
        sendReminderEmail(user.email, daysLeft, 'normal');
      }
    }

    // 2. Urgent reminder: expiring in 1 day
    const expiringIn1Day = db.prepare(`
      SELECT id, email, name, expires_at FROM users
      WHERE status = ? AND expires_at IS NOT NULL AND expires_at > ? AND expires_at <= ?
    `).all('active', now, in1Day);

    for (const user of expiringIn1Day || []) {
      const daysLeft = Math.ceil((new Date(user.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      sendReminderEmail(user.email, Math.max(daysLeft, 0), 'urgent');
    }

    // 3. Expired subscriptions -> suspend
    const expired = db.prepare(`
      SELECT id, email, name, expires_at FROM users
      WHERE status = ? AND expires_at IS NOT NULL AND expires_at <= ?
    `).all('active', now);

    for (const user of expired || []) {
      suspendAccount(user.id, user.email);
    }

    logger.info('✅ Scheduler: verificação concluída');
  }, {
    timezone: 'Africa/Luanda'
  });

  logger.info('✅ Scheduler iniciado (daily at 08:00 WAT)');
}
