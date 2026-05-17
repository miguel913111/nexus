import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXUS_API_SECRET || 'dev-secret';

export interface TokenPayload {
  userId: string;
  email: string;
  plan: string;
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}

export function checkTokenUsage(creditsRemaining: number, tokensUsed: number): boolean {
  return creditsRemaining >= tokensUsed;
}
