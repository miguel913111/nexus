#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { PLANS, getCreditsWithBonus } from '@nexus-ia/types';
import { chatMode } from './commands/chat';
import { authCommand, loginCommand, logoutCommand } from './commands/auth';
import { statusCommand } from './commands/status';
import { usageCommand } from './commands/usage';
import { NexusApiClient } from '@nexus-ia/core';

const program = new Command();

program
  .name('nexus')
  .description('NEXUS IA - Terminal de programação com Kimi K2.6')
  .version('0.1.0');

program
  .command('chat')
  .description('Iniciar sessão de chat interativa')
  .option('-f, --files <paths...>', 'Ficheiros para contexto')
  .action(async (options) => {
    await chatMode(options);
  });

program
  .command('ask <prompt>')
  .description('Fazer uma pergunta única')
  .option('-m, --model <model>', 'Modelo a usar', 'kimi-k2-6')
  .action(async (prompt, options) => {
    const config = await import('./commands/auth').then(m => m.loadConfig());
    if (!config.apiKey) {
      console.log(chalk.red('❌ Não autenticado. Corre primeiro: nexus login --key <tua-api-key>'));
      process.exit(1);
    }

    const client = new NexusApiClient({ 
      apiKey: config.apiKey,
      baseURL: config.apiUrl
    });
    
    const spinner = require('ora')('A pensar...').start();

    try {
      const response = await client.chatCompletion({
        messages: [
          { role: 'system', content: 'Assistente de código especializado.' },
          { role: 'user', content: prompt }
        ],
        model: options.model,
        maxTokens: 4096
      });
      spinner.stop();
      console.log(chalk.green('\n🤖 NEXUS IA:\n'));
      console.log(response.content);
      if (response.credits) {
        console.log(chalk.gray(`\n📊 Tokens usados: ${response.credits.deducted} | Créditos restantes: ${response.credits.remaining.toLocaleString()}`));
      }
    } catch (err: any) {
      spinner.stop();
      if (err.response?.data?.code === 'INSUFFICIENT_CREDITS') {
        console.log(chalk.red(`❌ Créditos insgotados. Restantes: ${err.response.data.creditsRemaining}`));
        console.log(chalk.yellow(`⬆️  Renova em: ${err.response.data.upgradeUrl}`));
      } else if (err.response?.data?.code === 'RATE_LIMIT_EXCEEDED') {
        console.log(chalk.red(`❌ Rate limit excedido. Tenta novamente em ${err.response.data.resetIn}s`));
      } else {
        console.log(chalk.red(`Erro: ${err.response?.data?.error || err.message}`));
      }
    }
  });

program
  .command('login')
  .description('Autenticar com API Key')
  .requiredOption('-k, --key <apiKey>', 'A tua API Key da NEXUS IA')
  .option('-u, --url <url>', 'URL da API', 'https://api.nexus-ia.ao/v1')
  .action(loginCommand);

program
  .command('logout')
  .description('Remover autenticação local')
  .action(logoutCommand);

program
  .command('status')
  .description('Ver estado da conta e créditos')
  .action(statusCommand);

program
  .command('usage')
  .description('Ver histórico de uso')
  .option('-l, --limit <n>', 'Número de registos', '20')
  .action(usageCommand);

program
  .command('planos')
  .description('Ver planos disponíveis')
  .action(async () => {
    console.log(chalk.blue.bold('\n📋 PLANOS NEXUS IA\n'));
    console.log(chalk.gray('Todos os planos incluem acesso ao Kimi K2.6 via DeepInfra\n'));
    
    const plans: Array<{key: string, plan: any}> = [];
    Object.entries(PLANS).forEach(([key, plan]) => {
      plans.push({ key, plan });
    });

    for (const { key, plan } of plans) {
      const total = getCreditsWithBonus(key as any);
      const color = key === 'teste' ? chalk.gray : key === 'starter' ? chalk.cyan : key === 'pro' ? chalk.magenta : chalk.yellow;
      
      console.log(color.bold(`${plan.name}${key === 'teste' ? ' (Trial)' : ''}`));
      console.log(`  Preço: ${plan.priceKZ === 0 ? 'GRÁTIS' : plan.priceKZ.toLocaleString() + ' KZ'}`);
      console.log(`  Créditos: ${plan.credits.toLocaleString()} tokens${plan.bonus > 0 ? ` (+${plan.bonus}% = ${total.toLocaleString()})` : ''}`);
      console.log(`  Rate Limit: ${plan.rateLimitPerMin} req/min`);
      console.log(`  Max Tokens/Req: ${plan.maxTokensPerRequest.toLocaleString()}`);
      console.log(`  Features: ${plan.features.join(', ')}\n`);
    }
    
    console.log(chalk.gray('Comprar: https://nexus-ia.ao/planos'));
  });

program.parse();
