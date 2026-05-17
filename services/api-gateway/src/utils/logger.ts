import winston from 'winston';
import path from 'path';

const LOG_DIR = process.env.LOG_DIR || path.join(__dirname, '../../logs');

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'nexus-api-gateway' },
  transports: [
    new winston.transports.File({ 
      filename: path.join(LOG_DIR, 'error.log'), 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: path.join(LOG_DIR, 'combined.log') 
    }),
    new winston.transports.File({ 
      filename: path.join(LOG_DIR, 'requests.log'),
      level: 'http'
    })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}
