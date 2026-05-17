import chalk from 'chalk';
import fs from 'fs';
import os from 'os';
import path from 'path';
import inquirer from 'inquirer';
import open from 'open';
import { NexusApiClient } from '@nexus-ia/core';

const CONFIG_DIR = path.join(os.homedir(), '.nexus');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

export interface CliConfig {
  apiKey?: string;
  apiUrl?: string;
  email?: string;
}

export function loadConfig(): CliConfig {
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    } catch {
      return {};
    }
  }
  return {};
}

function saveConfig(config: CliConfig) {
  if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), { mode: 0o600 });
}

export async function loginCommand(options: { key?: string; url?: string; browser?: boolean }) {
  let apiKey = options.key;
  let apiUrl = options.url || 'https://api-gateway-production-dccf.up.railway.app/v1';

  if (options.browser) {
    const dashboardUrl = 'https://web-production-6ef15.up.railway.app/dashboard';
    console.log(chalk.blue('A abrir o browser no dashboard...'));
    await open(dashboardUrl);
    console.log(chalk.gray('Faz login no browser (GitHub, Google ou Email) e copia a tua API Key.'));
    console.log();
  }

  if (!apiKey) {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'key',
        message: 'Digita a tua API Key:',
        validate: (input: string) => input.trim().length > 0 ? true : 'API Key é obrigatória.'
      }
    ]);
    apiKey = answers.key.trim();
  }

  console.log(chalk.blue('A verificar API Key...'));

  try {
    const client = new NexusApiClient({
      apiKey: apiKey,
      baseURL: apiUrl
    });

    const status = await client.getStatus();

    saveConfig({
      apiKey: apiKey,
      apiUrl: apiUrl,
      email: status.user.email
    });

    console.log(chalk.green('Login bem-sucedido!'));
    console.log(`Email: ${status.user.email}`);
    console.log(`Plano: ${status.user.plan}`);
    console.log(`Créditos: ${status.user.credits.remaining.toLocaleString()} / ${status.user.credits.total.toLocaleString()}`);
    console.log(`Expira: ${status.user.expiresAt ? new Date(status.user.expiresAt).toLocaleDateString('pt-AO') : 'Nunca'}`);
    console.log(chalk.gray('\nSessao guardada. Podes fechar o terminal e voltar quando quiseres.'));

  } catch (err: any) {
    console.log(chalk.red(`Login falhou: ${err.response?.data?.error || err.message}`));
    process.exit(1);
  }
}

export function logoutCommand() {
  if (fs.existsSync(CONFIG_FILE)) {
    fs.unlinkSync(CONFIG_FILE);
    console.log(chalk.green('✅ Logout efetuado. API Key removida.'));
  } else {
    console.log(chalk.yellow('⚠️  Nenhuma sessão ativa.'));
  }
}

export function authCommand() {
  const config = loadConfig();
  
  if (config.apiKey) {
    console.log(chalk.green('✅ Autenticado'));
    console.log(`API URL: ${config.apiUrl}`);
    console.log(`API Key: ${config.apiKey.slice(0, 12)}...`);
    console.log(chalk.gray('Usa "nexus status" para ver detalhes da conta'));
  } else {
    console.log(chalk.yellow('⚠️  Não autenticado'));
    console.log(chalk.gray('Usa: nexus login'));
  }
}
