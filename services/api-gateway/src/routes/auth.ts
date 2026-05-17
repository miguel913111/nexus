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

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/auth/google/callback';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// ─── Password Hash Helpers ───
const SCRYPT_KEYLEN = 64;

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, SCRYPT_KEYLEN).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const computed = crypto.scryptSync(password, salt, SCRYPT_KEYLEN).toString('hex');
  return computed === hash;
}

// Ensure password_hash column exists (migration)
try {
  db.exec(`ALTER TABLE users ADD COLUMN password_hash TEXT`);
  logger.info('Added password_hash column to users table');
} catch {
  // Column already exists
}

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
    console.log('[GITHUB CALLBACK] Received code:', !!code, 'state:', !!state);

    // Exchange code for access token
    const postData = `client_id=${GITHUB_CLIENT_ID}&client_secret=${GITHUB_CLIENT_SECRET}&code=${code}&redirect_uri=${encodeURIComponent(GITHUB_CALLBACK_URL)}`;
    console.log('[GITHUB CALLBACK] Exchanging code for token...');
    const tokenResponse = await makeHttpsRequest(
      'https://github.com/login/oauth/access_token',
      {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData),
        },
      },
      postData
    );
    console.log('[GITHUB CALLBACK] Token exchange status:', tokenResponse.status, 'data:', JSON.stringify(tokenResponse.data).substring(0, 200));

    if (tokenResponse.status !== 200 || !tokenResponse.data.access_token) {
      console.error('[GITHUB CALLBACK] FAILED: No access token. Data:', JSON.stringify(tokenResponse.data));
      return res.redirect(`${FRONTEND_URL}/dashboard?error=token_exchange_failed`);
    }

    const accessToken = tokenResponse.data.access_token;
    console.log('[GITHUB CALLBACK] Got access token');

    // Fetch GitHub user profile
    const userResponse = await makeHttpsRequest('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'NEXUS-IA-App',
      },
    });
    console.log('[GITHUB CALLBACK] User fetch status:', userResponse.status);

    if (userResponse.status !== 200) {
      console.error('[GITHUB CALLBACK] FAILED: Could not fetch user. Data:', JSON.stringify(userResponse.data));
      return res.redirect(`${FRONTEND_URL}/dashboard?error=github_user_failed`);
    }

    const githubUser: GitHubUser = userResponse.data;
    console.log('[GITHUB CALLBACK] User login:', githubUser.login, 'public email:', githubUser.email);

    // Fetch user emails (primary email may be private)
    let primaryEmail = githubUser.email;
    if (!primaryEmail) {
      console.log('[GITHUB CALLBACK] No public email, fetching emails...');
      const emailsResponse = await makeHttpsRequest('https://api.github.com/user/emails', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'NEXUS-IA-App',
        },
      });
      console.log('[GITHUB CALLBACK] Emails fetch status:', emailsResponse.status);

      if (emailsResponse.status === 200 && Array.isArray(emailsResponse.data)) {
        const emails: GitHubEmail[] = emailsResponse.data;
        const primary = emails.find((e) => e.primary && e.verified) || emails.find((e) => e.primary) || emails[0];
        if (primary) primaryEmail = primary.email;
      }
    }

    if (!primaryEmail) {
      console.error('[GITHUB CALLBACK] FAILED: No email found');
      return res.redirect(`${FRONTEND_URL}/dashboard?error=no_email`);
    }
    console.log('[GITHUB CALLBACK] Primary email:', primaryEmail);

    // Check if user already exists
    let user = db.prepare('SELECT id, email, name, api_key, plan, credits_remaining, credits_total, status FROM users WHERE email = ?').get(primaryEmail);

    if (!user) {
      console.log('[GITHUB CALLBACK] Creating new user...');
      const newApiKey = generateApiKey();
      const userId = crypto.randomUUID();
      const now = new Date().toISOString();

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
        null
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
      console.log('[GITHUB CALLBACK] New user created with API key:', newApiKey.slice(0, 12) + '...');
    } else {
      console.log('[GITHUB CALLBACK] Existing user found:', user.email);
    }

    // Redirect to dashboard with API key
    console.log('[GITHUB CALLBACK] SUCCESS. Redirecting to dashboard...');
    res.redirect(`${FRONTEND_URL}/dashboard?github_login=success&api_key=${encodeURIComponent(user.api_key)}&email=${encodeURIComponent(user.email)}&name=${encodeURIComponent(user.name || '')}`);
  } catch (err: any) {
    console.error('[GITHUB CALLBACK] CRASH ERROR:', err.message || err);
    console.error('[GITHUB CALLBACK] STACK:', err.stack || 'no stack');
    res.redirect(`${FRONTEND_URL}/dashboard?error=github_callback_error`);
  }
});

// ─── Email/Password Registration ───
router.post('/register', (req: Request, res: Response) => {
  try {
    const { email, name, password } = req.body;

    if (!email || !name || !password) {
      return res.status(400).json({ error: 'Email, nome e senha são obrigatórios' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres' });
    }

    // Check if user already exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ error: 'Este email já está registado' });
    }

    const newApiKey = generateApiKey();
    const userId = crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO users (id, email, name, api_key, plan, credits_remaining, credits_total, status, created_at, expires_at, password_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      email,
      name,
      newApiKey,
      'teste',
      PLANS.teste.credits,
      PLANS.teste.credits,
      'active',
      now,
      null,
      hashPassword(password)
    );

    logger.info(`New user registered via email: ${email}`);

    res.status(201).json({
      success: true,
      message: 'Conta criada com sucesso',
      api_key: newApiKey,
      email,
      name,
      plan: 'teste',
      credits_remaining: PLANS.teste.credits,
    });
  } catch (err: any) {
    logger.error('Register error:', err);
    res.status(500).json({ error: 'Erro ao criar conta' });
  }
});

// ─── Email/Password Login ───
router.post('/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    const user = db.prepare('SELECT id, email, name, api_key, plan, credits_remaining, credits_total, status, password_hash FROM users WHERE email = ?').get(email);

    if (!user) {
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }

    if (!user.password_hash || !verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }

    logger.info(`User logged in via email: ${email}`);

    res.json({
      success: true,
      api_key: user.api_key,
      email: user.email,
      name: user.name,
      plan: user.plan,
      credits_remaining: user.credits_remaining,
      credits_total: user.credits_total,
      status: user.status,
    });
  } catch (err: any) {
    logger.error('Login error:', err);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

// ─── Google OAuth ───
router.get('/google', (req: Request, res: Response) => {
  if (!GOOGLE_CLIENT_ID) {
    logger.error('GOOGLE_CLIENT_ID not configured');
    return res.status(500).json({ error: 'Google OAuth não configurado', code: 'GOOGLE_NOT_CONFIGURED' });
  }

  const state = crypto.randomBytes(16).toString('hex');
  (globalThis as any).__googleOAuthStates = (globalThis as any).__googleOAuthStates || new Map();
  (globalThis as any).__googleOAuthStates.set(state, { createdAt: Date.now() });

  const scope = encodeURIComponent('openid email profile');
  const redirectUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(GOOGLE_CALLBACK_URL)}&response_type=code&scope=${scope}&state=${state}&access_type=offline&prompt=consent`;

  res.redirect(redirectUrl);
});

router.get('/google/callback', async (req: Request, res: Response) => {
  const { code, state, error: googleError } = req.query;

  if (googleError) {
    logger.error(`Google OAuth error: ${googleError}`);
    return res.redirect(`${FRONTEND_URL}/dashboard?error=google_denied`);
  }

  if (!code || !state) {
    return res.redirect(`${FRONTEND_URL}/dashboard?error=missing_params`);
  }

  const statesMap = (globalThis as any).__googleOAuthStates;
  if (!statesMap || !statesMap.has(state as string)) {
    return res.redirect(`${FRONTEND_URL}/dashboard?error=invalid_state`);
  }
  statesMap.delete(state as string);

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    logger.error('Google OAuth credentials not configured');
    return res.redirect(`${FRONTEND_URL}/dashboard?error=not_configured`);
  }

  try {
    // Exchange code for access token
    const tokenResponse = await makeHttpsRequest(
      'https://oauth2.googleapis.com/token',
      {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
      `client_id=${GOOGLE_CLIENT_ID}&client_secret=${GOOGLE_CLIENT_SECRET}&code=${code}&redirect_uri=${encodeURIComponent(GOOGLE_CALLBACK_URL)}&grant_type=authorization_code`
    );

    if (tokenResponse.status !== 200 || !tokenResponse.data.access_token) {
      logger.error('Failed to exchange Google code for token', tokenResponse.data);
      return res.redirect(`${FRONTEND_URL}/dashboard?error=token_exchange_failed`);
    }

    const accessToken = tokenResponse.data.access_token;

    // Fetch Google user profile
    const userResponse = await makeHttpsRequest('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    if (userResponse.status !== 200) {
      logger.error('Failed to fetch Google user', userResponse.data);
      return res.redirect(`${FRONTEND_URL}/dashboard?error=google_user_failed`);
    }

    const googleUser = userResponse.data;
    const primaryEmail = googleUser.email;

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

      db.prepare(`
        INSERT INTO users (id, email, name, api_key, plan, credits_remaining, credits_total, status, created_at, expires_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        userId,
        primaryEmail,
        googleUser.name || googleUser.given_name || primaryEmail.split('@')[0],
        newApiKey,
        'teste',
        PLANS.teste.credits,
        PLANS.teste.credits,
        'active',
        now,
        null
      );

      user = {
        id: userId,
        email: primaryEmail,
        name: googleUser.name || googleUser.given_name || primaryEmail.split('@')[0],
        api_key: newApiKey,
        plan: 'teste',
        credits_remaining: PLANS.teste.credits,
        credits_total: PLANS.teste.credits,
        status: 'active',
      };

      logger.info(`New user registered via Google: ${primaryEmail}`);
    } else {
      logger.info(`Existing user logged in via Google: ${primaryEmail}`);
    }

    // Redirect to dashboard with API key
    res.redirect(`${FRONTEND_URL}/dashboard?github_login=success&api_key=${encodeURIComponent(user.api_key)}&email=${encodeURIComponent(user.email)}&name=${encodeURIComponent(user.name || '')}`);
  } catch (err: any) {
    logger.error('Google callback error:', err);
    res.redirect(`${FRONTEND_URL}/dashboard?error=google_callback_error`);
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
