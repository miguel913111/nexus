// @ts-nocheck
import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { generateApiKey } from '../utils/api-key';
import { logger } from '../utils/logger';
import { PLANS } from '@nexus-ia/types';
import crypto from 'crypto';
import https from 'https';

const router = Router();

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || '';
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || '';
const GITHUB_CALLBACK_URL = process.env.GITHUB_CALLBACK_URL || 'http://localhost:3001/auth/github/callback';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

interface GitHubUser {
  id: number;
  login: string;
  email: string | null;
  name: string | null;
  avatar_url: string;
}

interface GitHubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
}

function makeHttpsRequest(url: string, options: any = {}, postData?: string): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode || 0, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode || 0, data });
        }
      });
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

// Step 1: Redirect to GitHub OAuth
router.get('/github', (req: Request, res: Response) => {
  if (!GITHUB_CLIENT_ID) {
    logger.error('GITHUB_CLIENT_ID not configured');
    return res.status(500).json({ error: 'GitHub OAuth não configurado', code: 'GITHUB_NOT_CONFIGURED' });
  }

  const state = crypto.randomBytes(16).toString('hex');
  // Store state in a simple in-memory map (use Redis in production)
  (globalThis as any).__githubOAuthStates = (globalThis as any).__githubOAuthStates || new Map();
  (globalThis as any).__githubOAuthStates.set(state, { createdAt: Date.now() });

  const scope = 'read:user user:email';
  const redirectUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(GITHUB_CALLBACK_URL)}&scope=${encodeURIComponent(scope)}&state=${state}`;

  res.redirect(redirectUrl);
});

// Step 2: Handle GitHub callback
router.get('/github/callback', async (req: Request, res: Response) => {
  const { code, state, error: githubError } = req.query;

  if (githubError) {
    logger.error(`GitHub OAuth error: ${githubError}`);
    return res.redirect(`${FRONTEND_URL}/dashboard?error=github_denied`);
  }

  if (!code || !state) {
    return res.redirect(`${FRONTEND_URL}/dashboard?error=missing_params`);
  }

  // Verify state
  const statesMap = (globalThis as any).__githubOAuthStates;
  if (!statesMap || !statesMap.has(state as string)) {
    return res.redirect(`${FRONTEND_URL}/dashboard?error=invalid_state`);
  }
  statesMap.delete(state as string);

  if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
    logger.error('GitHub OAuth credentials not configured');
    return res.redirect(`${FRONTEND_URL}/dashboard?error=not_configured`);
  }

  try {
    // Exchange code for access token
    const tokenResponse = await makeHttpsRequest(
      'https://github.com/login/oauth/access_token',
      {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
      `client_id=${GITHUB_CLIENT_ID}&client_secret=${GITHUB_CLIENT_SECRET}&code=${code}&redirect_uri=${encodeURIComponent(GITHUB_CALLBACK_URL)}`
    );

    if (tokenResponse.status !== 200 || !tokenResponse.data.access_token) {
      logger.error('Failed to exchange GitHub code for token', tokenResponse.data);
      return res.redirect(`${FRONTEND_URL}/dashboard?error=token_exchange_failed`);
    }

    const accessToken = tokenResponse.data.access_token;

    // Fetch GitHub user profile
    const userResponse = await makeHttpsRequest('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'NEXUS-IA-App',
      },
    });

    if (userResponse.status !== 200) {
      logger.error('Failed to fetch GitHub user', userResponse.data);
      return res.redirect(`${FRONTEND_URL}/dashboard?error=github_user_failed`);
    }

    const githubUser: GitHubUser = userResponse.data;

    // Fetch user emails (primary email may be private)
    let primaryEmail = githubUser.email;
    if (!primaryEmail) {
      const emailsResponse = await makeHttpsRequest('https://api.github.com/user/emails', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'NEXUS-IA-App',
        },
      });

      if (emailsResponse.status === 200 && Array.isArray(emailsResponse.data)) {
        const emails: GitHubEmail[] = emailsResponse.data;
        const primary = emails.find((e) => e.primary && e.verified) || emails.find((e) => e.primary) || emails[0];
        if (primary) primaryEmail = primary.email;
      }
    }

    if (!primaryEmail) {
      return res.redirect(`${FRONTEND_URL}/dashboard?error=no_email`);
    }

    // Check if user already exists
    let user = db.prepare('SELECT id, email, name, api_key, plan, credits_remaining, credits_total, status FROM users WHERE email = ?').get(primaryEmail);

    if (!user) {
      // Create new user
      const newApiKey = generateApiKey();
      const userId = crypto.randomUUID();
      const now = new Date().toISOString();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7-day trial

      db.prepare(`
        INSERT INTO users (id, email, name, api_key, plan, credits_remaining, credits_total, status, created_at, expires_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        userId,
        primaryEmail,
        githubUser.name || githubUser.login,
        newApiKey,
        'teste',
        PLANS.teste.credits,
        PLANS.teste.credits,
        'active',
        now,
        expiresAt.toISOString()
      );

      user = {
        id: userId,
        email: primaryEmail,
        name: githubUser.name || githubUser.login,
        api_key: newApiKey,
        plan: 'teste',
        credits_remaining: PLANS.teste.credits,
        credits_total: PLANS.teste.credits,
        status: 'active',
      };

      logger.info(`New user registered via GitHub: ${primaryEmail}`);
    } else {
      logger.info(`Existing user logged in via GitHub: ${primaryEmail}`);
    }

    // Redirect to dashboard with API key
    res.redirect(`${FRONTEND_URL}/dashboard?github_login=success&api_key=${encodeURIComponent(user.api_key)}&email=${encodeURIComponent(user.email)}&name=${encodeURIComponent(user.name || '')}`);
  } catch (err: any) {
    logger.error('GitHub callback error:', err);
    res.redirect(`${FRONTEND_URL}/dashboard?error=github_callback_error`);
  }
});

// Get current user info (for frontend to confirm login)
router.get('/me', (req: Request, res: Response) => {
  const apiKey = req.headers['x-api-key'] as string || req.headers['authorization']?.replace('Bearer ', '');
  if (!apiKey) {
    return res.status(401).json({ error: 'API Key necessária' });
  }

  const user = db.prepare('SELECT id, email, name, plan, credits_remaining, credits_total, status FROM users WHERE api_key = ?').get(apiKey);
  if (!user) {
    return res.status(404).json({ error: 'Utilizador não encontrado' });
  }

  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    plan: user.plan,
    credits: {
      remaining: user.credits_remaining,
      total: user.credits_total,
    },
    status: user.status,
  });
});

export { router as authRouter };
