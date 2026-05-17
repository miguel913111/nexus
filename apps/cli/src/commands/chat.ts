import readline from 'readline';
import chalk from 'chalk';
import { NexusApiClient } from '@nexus-ia/core';
import { parseContext, buildMessagesWithContext } from '@nexus-ia/core';
import { loadConfig } from './auth';

export async function chatMode(options: { files?: string[] }) {
  const config = loadConfig();
  if (!config.apiKey) {
    console.log(chalk.red('❌ Não autenticado. Corre primeiro: nexus login --key <tua-api-key>'));
    return;
  }

  const client = new NexusApiClient({ 
    apiKey: config.apiKey,
    baseURL: config.apiUrl
  });
  
  console.log(chalk.blue.bold('\n🤖 NEXUS IA - Modo Chat'));
  console.log(chalk.gray('Dica: Usa @file caminho/do/ficheiro.ts para incluir contexto'));
  console.log(chalk.gray('Comandos: :quit | :clear | :status | :files\n'));

  const messages: Array<{role: string, content: string}> = [];

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const askQuestion = () => {
    rl.question(chalk.cyan('Tu > '), async (input) => {
      if (input === ':quit') {
        rl.close();
        return;
      }
      if (input === ':clear') {
        messages.length = 0;
        console.log(chalk.gray('Contexto limpo.\n'));
        askQuestion();
        return;
      }
      if (input === ':status') {
        try {
          const status = await client.getStatus();
          const pct = status.alerts.creditsPercentage;
          const color = pct < 10 ? chalk.red : pct < 25 ? chalk.yellow : chalk.green;
          
          console.log(color(`\n📊 Créditos: ${status.user.credits.remaining.toLocaleString()} / ${status.user.credits.total.toLocaleString()} (${pct}%)`));
          console.log(chalk.blue(`Plano: ${status.user.plan} | Expira: ${new Date(status.user.expiresAt).toLocaleDateString('pt-AO')}\n`));
          
          // Show alerts
          if (status.alerts.lowCredits) {
            console.log(chalk.red.bold('⚠️  ALERTA: Créditos baixos!'));
            console.log(chalk.red('Renova em: https://nexus-ia.ao/planos\n'));
          }
        } catch (err: any) {
          console.log(chalk.red(`Erro: ${err.message}\n`));
        }
        askQuestion();
        return;
      }
      if (input === ':files') {
        console.log(chalk.gray('\n📁 Para incluir ficheiros no contexto:'));
        console.log(chalk.gray('  @file src/server.ts'));
        console.log(chalk.gray('  @file package.json'));
        console.log(chalk.gray('  @file ./README.md\n'));
        askQuestion();
        return;
      }

      // Parse @file mentions
      const { cleanedInput, contextFiles } = parseContext(input, process.cwd());
      
      if (contextFiles.length > 0) {
        console.log(chalk.gray(`📎 Ficheiros incluídos: ${contextFiles.map(f => f.path).join(', ')}`));
      }

      const chatMessages = buildMessagesWithContext(
        'Assistente de código especializado. Responde em Português.',
        cleanedInput,
        contextFiles,
        messages
      );

      process.stdout.write(chalk.green('IA  > '));
      let fullResponse = '';

      try {
        for await (const chunk of client.streamCompletion({ messages: chatMessages })) {
          process.stdout.write(chunk);
          fullResponse += chunk;
        }
        process.stdout.write('\n\n');
        
        // Add to history
        messages.push({ role: 'user', content: cleanedInput });
        messages.push({ role: 'assistant', content: fullResponse });
        
        // Trim history to avoid token bloat
        if (messages.length > 40) {
          messages.splice(0, 2);
        }
      } catch (err: any) {
        process.stdout.write('\n');
        if (err.response?.data?.code === 'INSUFFICIENT_CREDITS') {
          console.log(chalk.red(`❌ Créditos esgotados! Restantes: ${err.response.data.creditsRemaining?.toLocaleString()}`));
          console.log(chalk.yellow(`⬆️  Renova em: ${err.response.data.upgradeUrl}\n`));
        } else if (err.response?.data?.code === 'RATE_LIMIT_EXCEEDED') {
          console.log(chalk.red(`❌ Rate limit excedido. Aguarda ${err.response.data.resetIn}s\n`));
        } else {
          console.log(chalk.red(`Erro: ${err.response?.data?.error || err.message}\n`));
        }
      }

      askQuestion();
    });
  };

  askQuestion();
}
