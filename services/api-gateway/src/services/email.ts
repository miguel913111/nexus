// @ts-nocheck
import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';
import {
  welcomeEmailTemplate,
  paymentConfirmationTemplate,
  lowCreditsAlertTemplate,
  subscriptionReminderTemplate,
  invoiceEmailTemplate,
} from './email-templates';

const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@nexus-ia.ao';
const FROM_NAME = process.env.FROM_NAME || 'NEXUS IA';

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    logger.warn('[Email] Configuração SMTP incompleta. Emails não serão enviados.');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  return transporter;
}

async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const transport = getTransporter();
  if (!transport) {
    logger.info(`[Email] Simulado: ${subject} -> ${to}`);
    return true;
  }

  try {
    await transport.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to,
      subject,
      html,
    });
    logger.info(`[Email] Enviado: ${subject} -> ${to}`);
    return true;
  } catch (err: any) {
    logger.error('[Email] Erro ao enviar:', err.message);
    return false;
  }
}

export async function sendWelcomeEmail(
  to: string,
  name: string,
  apiKey: string,
  plan: string
): Promise<boolean> {
  const html = welcomeEmailTemplate(name, apiKey, plan);
  return sendEmail({
    to,
    subject: 'Bem-vindo à NEXUS IA — A sua Chave de API',
    html,
  });
}

export async function sendPaymentConfirmation(
  to: string,
  name: string,
  plan: string,
  amount: number,
  txRef: string
): Promise<boolean> {
  const html = paymentConfirmationTemplate(name, plan, amount, txRef);
  return sendEmail({
    to,
    subject: 'Pagamento Confirmado — NEXUS IA',
    html,
  });
}

export async function sendLowCreditsAlert(
  to: string,
  name: string,
  creditsRemaining: number
): Promise<boolean> {
  const html = lowCreditsAlertTemplate(name, creditsRemaining);
  return sendEmail({
    to,
    subject: 'Alerta: Créditos Quase a Esgotar — NEXUS IA',
    html,
  });
}

export async function sendSubscriptionReminder(
  to: string,
  name: string,
  daysLeft: number,
  plan: string
): Promise<boolean> {
  const html = subscriptionReminderTemplate(name, daysLeft, plan);
  return sendEmail({
    to,
    subject: `A sua Subscrição Expira em ${daysLeft} ${daysLeft === 1 ? 'Dia' : 'Dias'} — NEXUS IA`,
    html,
  });
}

export async function sendInvoiceEmail(
  to: string,
  name: string,
  invoiceData: any
): Promise<boolean> {
  const html = invoiceEmailTemplate(name, invoiceData);
  return sendEmail({
    to,
    subject: `Factura ${invoiceData.invoiceNumber} — NEXUS IA`,
    html,
  });
}
