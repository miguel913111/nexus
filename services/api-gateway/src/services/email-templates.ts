// @ts-nocheck

const BRAND_COLOR = '#2563eb';
const BRAND_COLOR_DARK = '#1d4ed8';
const BG_COLOR = '#f8fafc';
const CARD_BG = '#ffffff';
const TEXT_COLOR = '#1e293b';
const TEXT_MUTED = '#64748b';

const baseTemplate = (title: string, content: string) => `
<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    body { margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background-color: ${BG_COLOR}; color: ${TEXT_COLOR}; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .card { background: ${CARD_BG}; border-radius: 16px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .header { text-align: center; margin-bottom: 32px; }
    .logo { font-size: 28px; font-weight: 700; color: ${BRAND_COLOR}; letter-spacing: -0.5px; }
    .logo span { color: ${TEXT_COLOR}; }
    .tagline { font-size: 13px; color: ${TEXT_MUTED}; margin-top: 4px; }
    h1 { font-size: 24px; font-weight: 700; margin: 0 0 16px 0; color: ${TEXT_COLOR}; }
    h2 { font-size: 18px; font-weight: 600; margin: 24px 0 12px 0; color: ${TEXT_COLOR}; }
    p { font-size: 15px; line-height: 1.7; color: ${TEXT_MUTED}; margin: 0 0 16px 0; }
    .highlight { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0; }
    .api-key { font-family: 'SF Mono', Monaco, monospace; font-size: 18px; font-weight: 600; color: ${BRAND_COLOR}; background: #dbeafe; padding: 12px 20px; border-radius: 8px; display: inline-block; letter-spacing: 0.5px; word-break: break-all; }
    .btn { display: inline-block; background: ${BRAND_COLOR}; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 600; font-size: 15px; margin: 8px 4px; transition: background 0.2s; }
    .btn:hover { background: ${BRAND_COLOR_DARK}; }
    .btn-outline { display: inline-block; background: transparent; color: ${BRAND_COLOR} !important; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 600; font-size: 15px; border: 2px solid ${BRAND_COLOR}; margin: 8px 4px; }
    .btn-group { text-align: center; margin: 24px 0; }
    .divider { height: 1px; background: #e2e8f0; margin: 24px 0; }
    .footer { text-align: center; margin-top: 32px; }
    .footer p { font-size: 13px; color: #94a3b8; margin: 4px 0; }
    .footer a { color: ${TEXT_MUTED}; text-decoration: underline; }
    .info-box { background: #f1f5f9; border-radius: 10px; padding: 20px; margin: 16px 0; }
    .info-box p { margin: 6px 0; font-size: 14px; }
    .info-box strong { color: ${TEXT_COLOR}; }
    .steps { counter-reset: step; }
    .step { display: flex; align-items: flex-start; margin: 16px 0; }
    .step-number { flex-shrink: 0; width: 32px; height: 32px; background: ${BRAND_COLOR}; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; margin-right: 16px; }
    .step-content { flex: 1; }
    .step-content strong { display: block; color: ${TEXT_COLOR}; margin-bottom: 4px; font-size: 15px; }
    .step-content p { margin: 0; font-size: 14px; }
    ul { padding-left: 20px; }
    ul li { margin: 8px 0; color: ${TEXT_MUTED}; font-size: 15px; }
    .warning { background: #fffbeb; border: 1px solid #fcd34d; border-radius: 10px; padding: 20px; margin: 20px 0; }
    .warning p { color: #92400e; margin: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="logo">NEXUS <span>IA</span></div>
        <div class="tagline">Assistente de Código Inteligente para Angola</div>
      </div>
      ${content}
      <div class="divider"></div>
      <div class="footer">
        <p>NEXUS IA &mdash; Luanda, Angola</p>
        <p>Precisa de ajuda? Contacte-nos em <a href="mailto:suporte@nexus-ia.ao">suporte@nexus-ia.ao</a></p>
        <p>&copy; ${new Date().getFullYear()} NEXUS IA. Todos os direitos reservados.</p>
      </div>
    </div>
  </div>
</body>
</html>
`;

export function welcomeEmailTemplate(name: string, apiKey: string, plan: string): string {
  const planName = plan.charAt(0).toUpperCase() + plan.slice(1);
  return baseTemplate('Bem-vindo à NEXUS IA', `
    <h1>Bem-vindo, ${name}!</h1>
    <p>Obrigado por escolher a <strong>NEXUS IA</strong>. A sua conta foi criada com sucesso e está pronta a usar.</p>
    
    <div class="highlight">
      <p style="margin: 0 0 12px 0; font-size: 14px; color: ${TEXT_MUTED};">A sua Chave de API</p>
      <div class="api-key">${apiKey}</div>
      <p style="margin: 12px 0 0 0; font-size: 13px; color: ${TEXT_MUTED};">Guarde esta chave num local seguro. Não a partilhe com ninguém.</p>
    </div>

    <h2>Plano: ${planName}</h2>
    <p>Tem acesso a todas as funcionalidades do plano <strong>${planName}</strong>. Pode começar a utilizar a API imediatamente.</p>

    <h2>Comece agora</h2>
    <div class="btn-group">
      <a href="https://ide.nexus-ia.ao" class="btn" target="_blank">Abrir IDE Web</a>
      <a href="https://docs.nexus-ia.ao/cli" class="btn-outline" target="_blank">Descarregar CLI</a>
      <a href="https://marketplace.visualstudio.com/items?itemName=nexus-ia.vscode" class="btn-outline" target="_blank">Extensão VS Code</a>
    </div>

    <h2>Como utilizar</h2>
    <div class="steps">
      <div class="step">
        <div class="step-number">1</div>
        <div class="step-content">
          <strong>Instale a CLI</strong>
          <p>Descarregue a NEXUS CLI para interagir com a API directamente do terminal.</p>
        </div>
      </div>
      <div class="step">
        <div class="step-number">2</div>
        <div class="step-content">
          <strong>Configure a sua chave</strong>
          <p>Execute <code>nexus login --key ${apiKey}</code> ou defina a variável de ambiente <code>NEXUS_API_KEY</code>.</p>
        </div>
      </div>
      <div class="step">
        <div class="step-number">3</div>
        <div class="step-content">
          <strong>Comece a programar</strong>
          <p>Utilize <code>nexus chat "Crie uma função para..."</code> ou aceda à IDE Web.</p>
        </div>
      </div>
    </div>

    <div class="divider"></div>
    <p style="font-size: 13px;">Se tiver alguma dúvida, consulte a <a href="https://docs.nexus-ia.ao" target="_blank">documentação</a> ou contacte o nosso suporte.</p>
  `);
}

export function paymentConfirmationTemplate(name: string, plan: string, amount: number, txRef: string): string {
  const planName = plan.charAt(0).toUpperCase() + plan.slice(1);
  const amountFormatted = amount.toLocaleString('pt-AO');
  const date = new Date().toLocaleDateString('pt-AO', { day: '2-digit', month: 'long', year: 'numeric' });

  return baseTemplate('Pagamento Confirmado', `
    <h1>Pagamento Confirmado</h1>
    <p>Olá, <strong>${name}</strong>. O seu pagamento foi processado com sucesso.</p>

    <div class="info-box">
      <p><strong>Referência:</strong> ${txRef}</p>
      <p><strong>Data:</strong> ${date}</p>
      <p><strong>Plano:</strong> ${planName}</p>
      <p><strong>Valor:</strong> ${amountFormatted} Kz</p>
      <p><strong>Estado:</strong> <span style="color: #16a34a; font-weight: 600;">Pago</span></p>
    </div>

    <p>O seu plano <strong>${planName}</strong> está agora activo. Pode continuar a utilizar todos os recursos da NEXUS IA.</p>

    <div class="btn-group">
      <a href="https://dashboard.nexus-ia.ao" class="btn" target="_blank">Ver Dashboard</a>
      <a href="https://ide.nexus-ia.ao" class="btn-outline" target="_blank">Abrir IDE</a>
    </div>

    <p style="font-size: 13px; margin-top: 24px;">Guarde este email como comprovativo de pagamento. Se precisar de uma factura formal, responda a este email.</p>
  `);
}

export function lowCreditsAlertTemplate(name: string, creditsRemaining: number): string {
  return baseTemplate('Alerta de Créditos Baixos', `
    <h1>Créditos Quase a Esgotar</h1>
    <p>Olá, <strong>${name}</strong>. Queremos alertá-lo de que os seus créditos estão quase a terminar.</p>

    <div class="warning">
      <p><strong>Créditos restantes:</strong> ${creditsRemaining.toLocaleString('pt-AO')} tokens</p>
      <p style="margin-top: 8px;">Assim que os créditos esgotarem, o acesso à API será temporariamente suspenso até efectuar um novo pagamento.</p>
    </div>

    <p>Para evitar interrupções no seu trabalho, recomendamos que recarregue os seus créditos o mais breve possível.</p>

    <div class="btn-group">
      <a href="https://dashboard.nexus-ia.ao/billing" class="btn" target="_blank">Recarregar Créditos</a>
    </div>

    <p style="font-size: 13px; margin-top: 20px;">Se precisar de ajuda para escolher um plano, o nosso equipa de suporte está disponível em <a href="mailto:suporte@nexus-ia.ao">suporte@nexus-ia.ao</a>.</p>
  `);
}

export function subscriptionReminderTemplate(name: string, daysLeft: number, plan: string): string {
  const planName = plan.charAt(0).toUpperCase() + plan.slice(1);
  return baseTemplate('Lembrete de Subscrição', `
    <h1>A Sua Subscrição Expira em Breve</h1>
    <p>Olá, <strong>${name}</strong>. O seu plano <strong>${planName}</strong> expira em <strong>${daysLeft} ${daysLeft === 1 ? 'dia' : 'dias'}</strong>.</p>

    <div class="warning">
      <p>Para manter o acesso ininterrupto à NEXUS IA, renove a sua subscrição antes do prazo.</p>
    </div>

    <p>Se não renovar a tempo, o acesso à API será suspenso até que efectue um novo pagamento. Os seus dados e configurações permanecem seguros.</p>

    <div class="btn-group">
      <a href="https://dashboard.nexus-ia.ao/billing" class="btn" target="_blank">Renovar Subscrição</a>
    </div>

    <p style="font-size: 13px; margin-top: 20px;">Pode também fazer upgrade para um plano superior a qualquer momento e beneficiar de mais créditos e funcionalidades.</p>
  `);
}

export function invoiceEmailTemplate(name: string, invoiceData: any): string {
  const { invoiceNumber, amount, date, plan, downloadUrl } = invoiceData;
  const amountFormatted = amount.toLocaleString('pt-AO');
  const formattedDate = new Date(date).toLocaleDateString('pt-AO', { day: '2-digit', month: 'long', year: 'numeric' });

  return baseTemplate('Factura Disponível', `
    <h1>Factura Disponível</h1>
    <p>Olá, <strong>${name}</strong>. A sua factura está pronta para download.</p>

    <div class="info-box">
      <p><strong>Factura Nº:</strong> ${invoiceNumber}</p>
      <p><strong>Data:</strong> ${formattedDate}</p>
      <p><strong>Plano:</strong> ${plan}</p>
      <p><strong>Valor:</strong> ${amountFormatted} Kz</p>
    </div>

    <p>Pode descarregar a factura em PDF clicando no botão abaixo. A factura inclui todos os dados fiscais necessários para efeitos de contabilidade.</p>

    <div class="btn-group">
      <a href="${downloadUrl}" class="btn" target="_blank">Descarregar Factura PDF</a>
    </div>

    <p style="font-size: 13px; margin-top: 20px;">Se a factura contiver algum erro ou precisar de dados adicionais, por favor contacte-nos em <a href="mailto:suporte@nexus-ia.ao">suporte@nexus-ia.ao</a>.</p>
  `);
}
