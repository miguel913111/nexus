// @ts-nocheck
import { PaymentRecord, PlanType, PLANS, getCreditsWithBonus } from '@nexus-ia/types';

export interface InvoiceData {
  invoiceNumber: string;
  date: string;
  dueDate: string;
  companyName: string;
  companyAddress: string;
  companyNif: string;
  companyEmail: string;
  customerName: string;
  customerEmail: string;
  planName: string;
  planCredits: number;
  amountKZ: number;
  taxRate: number;
  taxAmountKZ: number;
  totalKZ: number;
  paymentMethod: string;
  flutterwaveRef: string;
  status: string;
}

function generateInvoiceNumber(date: string, index: number): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const seq = String(index + 1).padStart(3, '0');
  return `INV-${year}-${seq}`;
}

function detectPaymentMethod(flutterwaveRef: string): string {
  // Flutterwave refs often contain hints about the payment method
  if (!flutterwaveRef) return 'Unitel Money / Cartão';
  const ref = flutterwaveRef.toLowerCase();
  if (ref.includes('card') || ref.includes('visa') || ref.includes('master')) return 'Cartão de Crédito/Débito';
  if (ref.includes('mobile') || ref.includes('unitel') || ref.includes('mpesa') || ref.includes('wallet')) return 'Unitel Money';
  if (ref.includes('bank') || ref.includes('transfer')) return 'Transferência Bancária';
  return 'Unitel Money / Cartão';
}

export function generateInvoiceData(
  payment: PaymentRecord,
  customerName: string,
  customerEmail: string,
  index: number = 0
): InvoiceData {
  const plan = PLANS[payment.plan as PlanType];
  const planName = plan?.name || payment.plan;
  const planCredits = plan ? getCreditsWithBonus(payment.plan as PlanType) : 0;
  const taxRate = 0; // IVA - ajustar quando aplicável
  const taxAmountKZ = Math.round(payment.amountKZ * taxRate);
  const totalKZ = payment.amountKZ + taxAmountKZ;

  return {
    invoiceNumber: generateInvoiceNumber(payment.createdAt, index),
    date: new Date(payment.createdAt).toLocaleDateString('pt-AO'),
    dueDate: new Date(payment.paidAt || payment.createdAt).toLocaleDateString('pt-AO'),
    companyName: 'NEXUS IA, LDA',
    companyAddress: 'Luanda, Angola',
    companyNif: '5000XXXXXX',
    companyEmail: 'financeiro@nexus-ia.ao',
    customerName: customerName || 'Cliente',
    customerEmail: customerEmail || '—',
    planName,
    planCredits,
    amountKZ: payment.amountKZ,
    taxRate,
    taxAmountKZ,
    totalKZ,
    paymentMethod: detectPaymentMethod(payment.flutterwaveRef),
    flutterwaveRef: payment.flutterwaveRef,
    status: payment.status,
  };
}

export function generateInvoiceHtml(invoice: InvoiceData): string {
  return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fatura ${invoice.invoiceNumber} - NEXUS IA</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: #f8fafc;
      color: #0f172a;
      padding: 40px 20px;
    }
    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
      padding: 48px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 40px;
      padding-bottom: 24px;
      border-bottom: 2px solid #e2e8f0;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand-icon {
      width: 40px;
      height: 40px;
      background: #0284c7;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 18px;
    }
    .brand-name {
      font-size: 24px;
      font-weight: 700;
      color: #0f172a;
    }
    .brand-tagline {
      font-size: 12px;
      color: #64748b;
    }
    .invoice-meta {
      text-align: right;
    }
    .invoice-meta h2 {
      font-size: 14px;
      text-transform: uppercase;
      color: #64748b;
      margin-bottom: 8px;
      letter-spacing: 0.05em;
    }
    .invoice-number {
      font-size: 20px;
      font-weight: 700;
      color: #0284c7;
      margin-bottom: 4px;
    }
    .invoice-date {
      font-size: 13px;
      color: #475569;
    }
    .parties {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      margin-bottom: 40px;
    }
    .party h3 {
      font-size: 12px;
      text-transform: uppercase;
      color: #94a3b8;
      margin-bottom: 10px;
      letter-spacing: 0.05em;
    }
    .party p {
      font-size: 14px;
      line-height: 1.6;
      color: #334155;
    }
    .party .name {
      font-weight: 600;
      color: #0f172a;
      font-size: 15px;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 32px;
    }
    .items-table th {
      text-align: left;
      padding: 12px 16px;
      font-size: 11px;
      text-transform: uppercase;
      color: #64748b;
      background: #f1f5f9;
      border-bottom: 1px solid #e2e8f0;
      letter-spacing: 0.05em;
    }
    .items-table td {
      padding: 16px;
      font-size: 14px;
      border-bottom: 1px solid #f1f5f9;
      color: #334155;
    }
    .items-table tr:last-child td {
      border-bottom: none;
    }
    .totals {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 32px;
    }
    .totals-table {
      width: 300px;
    }
    .totals-table td {
      padding: 8px 0;
      font-size: 14px;
    }
    .totals-table td:first-child {
      color: #64748b;
      text-align: left;
    }
    .totals-table td:last-child {
      text-align: right;
      font-weight: 500;
      color: #0f172a;
    }
    .totals-table .grand-total td {
      font-size: 18px;
      font-weight: 700;
      color: #0284c7;
      border-top: 2px solid #e2e8f0;
      padding-top: 12px;
    }
    .payment-info {
      background: #f8fafc;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 32px;
    }
    .payment-info h3 {
      font-size: 12px;
      text-transform: uppercase;
      color: #94a3b8;
      margin-bottom: 12px;
      letter-spacing: 0.05em;
    }
    .payment-info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      font-size: 13px;
    }
    .payment-info-grid .label {
      color: #64748b;
    }
    .payment-info-grid .value {
      color: #0f172a;
      font-weight: 500;
    }
    .footer {
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
      border-top: 1px solid #f1f5f9;
      padding-top: 24px;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .status-success { background: #dcfce7; color: #166534; }
    .status-pending { background: #fef9c3; color: #854d0e; }
    .status-failed { background: #fee2e2; color: #991b1b; }
    @media print {
      body { background: white; padding: 0; }
      .invoice-container { box-shadow: none; padding: 0; }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <div class="brand">
        <div class="brand-icon">N</div>
        <div>
          <div class="brand-name">NEXUS IA</div>
          <div class="brand-tagline">Programação assistida por IA para Angola</div>
        </div>
      </div>
      <div class="invoice-meta">
        <h2>Fatura</h2>
        <div class="invoice-number">${invoice.invoiceNumber}</div>
        <div class="invoice-date">Data: ${invoice.date}</div>
      </div>
    </div>

    <div class="parties">
      <div class="party">
        <h3>De</h3>
        <p class="name">${invoice.companyName}</p>
        <p>${invoice.companyAddress}</p>
        <p>NIF: ${invoice.companyNif}</p>
        <p>${invoice.companyEmail}</p>
      </div>
      <div class="party">
        <h3>Para</h3>
        <p class="name">${invoice.customerName}</p>
        <p>${invoice.customerEmail}</p>
      </div>
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th>Descrição</th>
          <th>Créditos</th>
          <th>Preço Unit.</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong>Plano ${invoice.planName}</strong><br>
            <span style="font-size:12px;color:#64748b;">Subscrição mensal - NEXUS IA</span>
          </td>
          <td>${invoice.planCredits.toLocaleString('pt-AO')} tokens</td>
          <td>${invoice.amountKZ.toLocaleString('pt-AO')} Kz</td>
          <td>${invoice.amountKZ.toLocaleString('pt-AO')} Kz</td>
        </tr>
      </tbody>
    </table>

    <div class="totals">
      <table class="totals-table">
        <tr>
          <td>Subtotal</td>
          <td>${invoice.amountKZ.toLocaleString('pt-AO')} Kz</td>
        </tr>
        <tr>
          <td>IVA (${(invoice.taxRate * 100).toFixed(0)}%)</td>
          <td>${invoice.taxAmountKZ.toLocaleString('pt-AO')} Kz</td>
        </tr>
        <tr class="grand-total">
          <td>Total</td>
          <td>${invoice.totalKZ.toLocaleString('pt-AO')} Kz</td>
        </tr>
      </table>
    </div>

    <div class="payment-info">
      <h3>Informação de Pagamento</h3>
      <div class="payment-info-grid">
        <div>
          <span class="label">Método: </span>
          <span class="value">${invoice.paymentMethod}</span>
        </div>
        <div>
          <span class="label">Referência Flutterwave: </span>
          <span class="value">${invoice.flutterwaveRef}</span>
        </div>
        <div>
          <span class="label">Estado: </span>
          <span class="value">
            <span class="status-badge status-${invoice.status}">${invoice.status}</span>
          </span>
        </div>
        <div>
          <span class="label">Data de pagamento: </span>
          <span class="value">${invoice.dueDate}</span>
        </div>
      </div>
    </div>

    <div class="footer">
      <p>Obrigado por escolheres a NEXUS IA!</p>
      <p style="margin-top:6px;">Esta fatura foi gerada automaticamente e não necessita de assinatura.</p>
      <p style="margin-top:12px;">© 2026 NEXUS IA, LDA · Luanda, Angola · <a href="mailto:suporte@nexus-ia.ao" style="color:#0284c7;">suporte@nexus-ia.ao</a></p>
    </div>
  </div>
</body>
</html>`;
}
