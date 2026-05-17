import chalk from 'chalk';
import { NexusApiClient } from '@nexus-ia/core';
import { loadConfig } from './auth';

export async function usageCommand(options: { limit: string }) {
  const config = loadConfig();
  if (!config.apiKey) {
    console.log(chalk.red('❌ Não autenticado. Corre: nexus login'));
    return;
  }

  try {
    const client = new NexusApiClient({ 
      apiKey: config.apiKey,
      baseURL: config.apiUrl
    });
    
    const limit = parseInt(options.limit, 10);
    const data = await client.getUsage(limit);
    
    console.log(chalk.blue.bold(`\n📜 HISTÓRICO DE USO (últimos ${data.logs.length})\n`));
    
    if (data.logs.length === 0) {
      console.log(chalk.gray('Nenhum registo encontrado.\n'));
      return;
    }
    
    data.logs.forEach((log: any) => {
      const date = new Date(log.created_at).toLocaleString('pt-AO');
      const statusColor = log.status === 'success' ? chalk.green : chalk.red;
      const statusIcon = log.status === 'success' ? '✓' : '✗';
      
      console.log(`${statusColor(statusIcon)} ${chalk.gray(date)}`);
      console.log(`  Endpoint: ${log.endpoint}`);
      console.log(`  Tokens: ${log.tokens_total.toLocaleString()} (in: ${log.tokens_input}, out: ${log.tokens_output})`);
      console.log(`  Créditos: ${log.credits_deducted.toLocaleString()}`);
      if (log.error_message) {
        console.log(chalk.red(`  Erro: ${log.error_message}`));
      }
      console.log();
    });
    
    console.log(chalk.gray(`Total: ${data.pagination.total} registos`));
    
  } catch (err: any) {
    console.log(chalk.red(`❌ Erro: ${err.response?.data?.error || err.message}`));
  }
}
