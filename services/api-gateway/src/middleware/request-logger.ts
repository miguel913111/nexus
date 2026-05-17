// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/database';
import { AuthenticatedRequest } from './auth';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const requestId = uuidv4();
  (req as any).requestId = requestId;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const authReq = req as AuthenticatedRequest;
    
    logger.http({
      requestId,
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration,
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
      userId: authReq.userId,
      apiKey: authReq.userApiKey ? `${authReq.userApiKey.slice(0, 12)}...` : null
    });
  });

  next();
}

export function logUsage(
  userId: string,
  apiKey: string,
  endpoint: string,
  tokensInput: number,
  tokensOutput: number,
  status: string,
  errorMessage: string | null,
  ip: string,
  userAgent: string | undefined
): void {
  const total = tokensInput + tokensOutput;
  
  db.prepare(`
    INSERT INTO usage_logs 
    (id, user_id, api_key, endpoint, tokens_input, tokens_output, tokens_total, credits_deducted, status, error_message, ip, user_agent)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    uuidv4(),
    userId,
    apiKey,
    endpoint,
    tokensInput,
    tokensOutput,
    total,
    total, // 1 token = 1 credit
    status,
    errorMessage,
    ip,
    userAgent || null
  );
}
