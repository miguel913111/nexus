import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { chatRouter } from './routes/chat';
import { billingRouter } from './routes/billing';
import { flutterwaveRouter } from './routes/flutterwave';
import { invoicesRouter } from './routes/invoices';
import { authRouter } from './routes/auth';
import { referralsRouter } from './routes/referrals';
import { vouchersRouter } from './routes/vouchers';
import { startMonitoring, getDetailedHealth } from './services/monitor';
import { apiKeyAuth } from './middleware/auth';
import { enforceHttps, validateBodySize, sanitizeInput } from './middleware/security';
import { requestLogger } from './middleware/request-logger';
import { logger } from './utils/logger';
import { initAlertsTable } from './utils/alerts';
import { startScheduler } from './services/scheduler';

dotenv.config();
dotenv.config({ path: '.env.local' });

// Initialize alerts table
initAlertsTable();

// Start health monitoring (every 5 minutes)
startMonitoring(5);

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(enforceHttps);
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));

// Body parsing with size limit
app.use(express.json({ limit: '100kb' }));
app.use(sanitizeInput);
app.use(requestLogger);

// Health check (no auth)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'nexus-api-gateway',
    version: '0.1.0',
    timestamp: new Date().toISOString()
  });
});

// Public routes
app.use('/v1/billing', billingRouter);
app.use('/v1/payments/flutterwave', flutterwaveRouter);
app.use('/v1/referrals', referralsRouter);
app.use('/v1/auth', authRouter);

// Protected routes (require API key)
app.use('/v1/chat', apiKeyAuth, validateBodySize(100 * 1024), chatRouter);
app.use('/v1/status', apiKeyAuth, billingRouter);
app.use('/v1/usage', apiKeyAuth, billingRouter);
app.use('/v1/invoices', apiKeyAuth, invoicesRouter);
app.use('/v1/vouchers', apiKeyAuth, vouchersRouter);

// Admin routes
app.use('/v1/admin', billingRouter);
app.use('/v1/admin', vouchersRouter);

// Detailed health endpoint (admin only)
app.get('/v1/admin/health/detailed', (req, res) => {
  const adminKey = req.headers['x-admin-key'];
  if (adminKey !== process.env.ADMIN_API_KEY) {
    return res.status(403).json({ error: 'Acesso negado' });
  }
  res.json(getDetailedHealth());
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Endpoint não encontrado',
    code: 'NOT_FOUND'
  });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Erro interno do servidor',
    code: 'INTERNAL_ERROR',
    requestId: (req as any).requestId
  });
});

app.listen(PORT, () => {
  logger.info(`🚀 NEXUS API Gateway rodando na porta ${PORT}`);
  logger.info(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
  
  if (!process.env.DEEPINFRA_API_KEY && !process.env.OPENROUTER_API_KEY && !process.env.GROQ_API_KEY) {
    logger.warn('⚠️  Nenhuma model API key configurada. Set DEEPINFRA_API_KEY, OPENROUTER_API_KEY, ou GROQ_API_KEY');
  }
});

// Start daily scheduler
startScheduler();
