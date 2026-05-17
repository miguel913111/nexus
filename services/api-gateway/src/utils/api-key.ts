import crypto from 'crypto';

const API_KEY_PREFIX = 'nx-';

export function generateApiKey(): string {
  const random = crypto.randomBytes(24).toString('hex');
  return `${API_KEY_PREFIX}${random.slice(0, 8)}-${random.slice(8, 12)}-${random.slice(12, 16)}-${random.slice(16, 20)}-${random.slice(20, 32)}`;
}

export function hashApiKey(apiKey: string): string {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}

export function validateApiKeyFormat(apiKey: string): boolean {
  if (!apiKey || typeof apiKey !== 'string') return false;
  if (!apiKey.startsWith(API_KEY_PREFIX)) return false;
  if (apiKey.length < 20) return false;
  return true;
}
