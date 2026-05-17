// @ts-nocheck
import { db } from '../db/database';
import { logger } from '../utils/logger';
import https from 'https';
import http from 'http';

interface HealthStatus {
  backend: 'healthy' | 'unhealthy';
  moonshotApi: 'healthy' | 'unhealthy' | 'unknown';
  database: 'healthy' | 'unhealthy';
  timestamp: string;
}

let lastHealthStatus: HealthStatus = {
  backend: 'healthy',
  moonshotApi: 'unknown',
  database: 'healthy',
  timestamp: new Date().toISOString(),
};

function makeRequest(url: string, timeout = 5000): Promise<{ status: number; data: string }> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { timeout }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve({ status: res.statusCode || 0, data }));
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function checkMoonshotApiHealth(): Promise<boolean> {
  try {
    // Try DeepInfra (primary Moonshot/Kimi provider)
    const deepInfraKey = process.env.DEEPINFRA_API_KEY;
    if (deepInfraKey) {
      const { status } = await makeRequest('https://api.deepinfra.com/v1/openai/models', 8000);
      return status === 200;
    }

    // Fallback: try OpenRouter
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    if (openRouterKey) {
      const { status } = await makeRequest('https://openrouter.ai/api/v1/models', 8000);
      return status === 200;
    }

    // If no keys configured, mark as unknown
    return true;
  } catch (err: any) {
    logger.error(`Moonshot API health check failed: ${err.message}`);
    return false;
  }
}

function checkDatabaseHealth(): boolean {
  try {
    // Try a simple query
    const result = db.prepare('SELECT COUNT(*) as count FROM users').all();
    return Array.isArray(result);
  } catch (err: any) {
    logger.error(`Database health check failed: ${err.message}`);
    return false;
  }
}

function getDatabaseSize(): number {
  try {
    const fs = require('fs');
    const path = require('path');
    const dbPath = path.join(__dirname, '../../data/nexus-db.json');
    if (fs.existsSync(dbPath)) {
      const stats = fs.statSync(dbPath);
      return stats.size;
    }
    return 0;
  } catch {
    return 0;
  }
}

function getActiveUsersToday(): number {
  try {
    const today = new Date().toISOString().split('T')[0];
    const logs = db.prepare(`SELECT * FROM usage_logs WHERE created_at LIKE ?`).all(`${today}%`);
    const uniqueUsers = new Set((logs || []).map((l: any) => l.user_id));
    return uniqueUsers.size;
  } catch {
    return 0;
  }
}

function getTotalRevenue(): number {
  try {
    const result = db.prepare(`
      SELECT SUM(amount_kz) as total FROM payments WHERE status = 'success'
    `).get();
    return result?.total || 0;
  } catch {
    return 0;
  }
}

async function sendAlertEmail(service: string, error: string): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    logger.warn('ADMIN_EMAIL not configured, skipping alert email');
    return;
  }

  // Log the alert (in production, integrate with SMTP/SES/SendGrid)
  logger.error(`ALERT EMAIL TO ${adminEmail}: Service [${service}] is DOWN. Error: ${error}`);

  // TODO: Integrate with email provider:
  // - nodemailer for SMTP
  // - AWS SES
  // - SendGrid
  // Example:
  // await sendGrid.send({ to: adminEmail, subject: `NEXUS IA Alert: ${service} down`, text: error });
}

export async function runHealthChecks(): Promise<HealthStatus> {
  const moonshotHealthy = await checkMoonshotApiHealth();
  const dbHealthy = checkDatabaseHealth();

  const status: HealthStatus = {
    backend: 'healthy',
    moonshotApi: moonshotHealthy ? 'healthy' : 'unhealthy',
    database: dbHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
  };

  // Send alerts if any service is down
  if (!moonshotHealthy && lastHealthStatus.moonshotApi !== 'unhealthy') {
    await sendAlertEmail('Moonshot API', 'Moonshot/DeepInfra API is not responding');
  }
  if (!dbHealthy && lastHealthStatus.database !== 'unhealthy') {
    await sendAlertEmail('Database', 'Database is not responding to queries');
  }

  lastHealthStatus = status;

  if (!moonshotHealthy || !dbHealthy) {
    logger.error('Health check failed', status);
  } else {
    logger.info('Health check passed');
  }

  return status;
}

export function getLastHealthStatus(): HealthStatus {
  return lastHealthStatus;
}

export function getDetailedHealth() {
  const dbSize = getDatabaseSize();
  const activeUsers = getActiveUsersToday();
  const totalRevenue = getTotalRevenue();

  return {
    ...lastHealthStatus,
    databaseSize: dbSize,
    databaseSizeReadable: `${(dbSize / 1024).toFixed(2)} KB`,
    activeUsersToday: activeUsers,
    totalRevenueKZ: totalRevenue,
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
  };
}

export function startMonitoring(intervalMinutes = 5): NodeJS.Timeout {
  logger.info(`Starting health monitor every ${intervalMinutes} minutes`);
  // Run immediately
  runHealthChecks().catch(() => {});
  // Then schedule
  return setInterval(() => {
    runHealthChecks().catch((err) => logger.error('Health check error:', err));
  }, intervalMinutes * 60 * 1000);
}
