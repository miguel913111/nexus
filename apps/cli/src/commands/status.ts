import chalk from 'chalk';
import { NexusApiClient } from '@nexus-ia/core';
import { loadConfig } from './auth';

export async function statusCommand() {
  const config = loadConfig();
  if (!config.apiKey) {
    console.log(chalk.red('❌ Não autenticado. Corre: nexus login --key <tua-api-key>'));
    return;
  }

  try {
    const client = new NexusApiClient({ 
      apiKey: config.apiKey,
      baseURL: config.apiUrl
    });
    
    const status = await client.getStatus();
    
    console.log(chalk.blue.bold('\n📊 ESTADO DA CONTA NEXUS IA\n'));
    
    console.log(chalk.white(`Utilizador: ${status.user.name}`));
    console.log(chalk.white(`Email: ${status.user.email}`));
    console.log(chalk.white(`Plano: ${chalk.bold(status.user.plan.toUpperCase())}`));
    console.log(chalk.white(`Status: ${status.user.status === 'active' ? chalk.green('Ativo') : chalk.red(status.user.status)}`));
    
    const percent = status.alerts.creditsPercentage;
    const barColor = percent < 10 ? chalk.red : percent < 25 ? chalk.yellow : chalk.green;
    const bar = '█'.repeat(Math.round(percent / 5)) + '░'.repeat(20 - Math.round(percent / 5));
    
    console.log(chalk.white(`\n💰 Créditos:`));
    console.log(`  ${barColor(bar)} ${percent}%`);
    console.log(`  Restantes: ${barColor(status.user.credits.remaining.toLocaleString())}`);
    console.log(`  Usados: ${chalk.yellow(status.user.credits.used.toLocaleString())}`);
    console.log(`  Total: ${status.user.credits.total.toLocaleString()}`);
    
    // ALERTS
    if (status.alerts.lowCredits) {
      console.log(chalk.red.bold(`\n⚠️  ALERTA: Créditos baixos (${percent}%)!`));
      console.log(chalk.red(`  Renova o teu plano em: https://nexus-ia.ao/planos`));
      
      if (status.alerts.pending.length > 0) {
        console.log(chalk.gray(`  Alertas pendentes: ${status.alerts.pending.length}`));
      }
    }
    
    console.log(chalk.white(`\n📅 Assinatura:`));
    console.log(`  Expira: ${new Date(status.user.expiresAt).toLocaleDateString('pt-AO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`);
    
    console.log(chalk.white(`\n📈 Uso este mês:`));
    console.log(`  Requests: ${status.usageThisMonth.requests.toLocaleString()}`);
    console.log(`  Tokens: ${status.usageThisMonth.tokens.toLocaleString()}`);
    console.log(`  Créditos: ${status.usageThisMonth.credits.toLocaleString()}`);
    
    console.log(chalk.white(`\n⚡ Limites:`));
    console.log(`  Rate Limit: ${status.limits.rateLimitPerMin} req/min`);
    console.log(`  Max Tokens/Request: ${status.limits.maxTokensPerRequest.toLocaleString()}`);
    
    // Model fallback info
    console.log(chalk.gray(`\n🔄 Modelos disponíveis: deepinfra-kimi → openrouter-kimi → groq-llama → together-qwen`));
    console.log(chalk.gray(`   (fallback automático se um modelo falhar)\n`));
    
  } catch (err: any) {
    console.log(chalk.red(`❌ Erro: ${err.response?.data?.error || err.message}`));
  }
}
