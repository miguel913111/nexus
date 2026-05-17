// @ts-nocheck
import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { generateInvoiceData, generateInvoiceHtml } from '../services/invoice';
import { AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

// GET /v1/invoices - list user's invoices
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const payments = db.prepare(`
      SELECT id, plan, amount_kz, flutterwave_ref, status, created_at, paid_at
      FROM payments
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(userId);

    const user = db.prepare(`
      SELECT name, email FROM users WHERE id = ?
    `).get(userId);

    const invoices = (payments || []).map((payment: any, index: number) => {
      const invoice = generateInvoiceData(
        {
          id: payment.id,
          userId,
          plan: payment.plan,
          amountKZ: payment.amount_kz,
          flutterwaveRef: payment.flutterwave_ref,
          status: payment.status,
          createdAt: payment.created_at,
          paidAt: payment.paid_at,
        },
        user?.name || '',
        user?.email || '',
        index
      );
      return {
        id: payment.id,
        invoiceNumber: invoice.invoiceNumber,
        date: invoice.date,
        planName: invoice.planName,
        amountKZ: invoice.amountKZ,
        totalKZ: invoice.totalKZ,
        status: payment.status,
        flutterwaveRef: payment.flutterwave_ref,
      };
    });

    res.json({ invoices });
  } catch (err: any) {
    logger.error('Error listing invoices:', err);
    res.status(500).json({ error: 'Erro ao listar faturas' });
  }
});

// GET /v1/invoices/:id - get specific invoice
router.get('/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const invoiceId = req.params.id;

    let payment = db.prepare(`
      SELECT id, plan, amount_kz, flutterwave_ref, status, created_at, paid_at, user_id
      FROM payments
      WHERE id = ? AND user_id = ?
    `).get(invoiceId, userId);

    // In-memory fallback because simple JSON DB matcher may not handle AND
    if (payment && payment.user_id !== userId) {
      payment = null;
    }

    if (!payment) {
      return res.status(404).json({ error: 'Fatura não encontrada' });
    }

    const user = db.prepare(`
      SELECT name, email FROM users WHERE id = ?
    `).get(userId);

    const invoice = generateInvoiceData(
      {
        id: payment.id,
        userId,
        plan: payment.plan,
        amountKZ: payment.amount_kz,
        flutterwaveRef: payment.flutterwave_ref,
        status: payment.status,
        createdAt: payment.created_at,
        paidAt: payment.paid_at,
      },
      user?.name || '',
      user?.email || '',
      0
    );

    res.json({ invoice });
  } catch (err: any) {
    logger.error('Error getting invoice:', err);
    res.status(500).json({ error: 'Erro ao obter fatura' });
  }
});

// POST /v1/invoices/:id/download - generate downloadable HTML invoice
router.post('/:id/download', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const invoiceId = req.params.id;

    let payment = db.prepare(`
      SELECT id, plan, amount_kz, flutterwave_ref, status, created_at, paid_at, user_id
      FROM payments
      WHERE id = ? AND user_id = ?
    `).get(invoiceId, userId);

    // In-memory fallback because simple JSON DB matcher may not handle AND
    if (payment && payment.user_id !== userId) {
      payment = null;
    }

    if (!payment) {
      return res.status(404).json({ error: 'Fatura não encontrada' });
    }

    const user = db.prepare(`
      SELECT name, email FROM users WHERE id = ?
    `).get(userId);

    const invoice = generateInvoiceData(
      {
        id: payment.id,
        userId,
        plan: payment.plan,
        amountKZ: payment.amount_kz,
        flutterwaveRef: payment.flutterwave_ref,
        status: payment.status,
        createdAt: payment.created_at,
        paidAt: payment.paid_at,
      },
      user?.name || '',
      user?.email || '',
      0
    );

    const html = generateInvoiceHtml(invoice);

    res.setHeader('Content-Type', 'text/html');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="fatura-${invoice.invoiceNumber}.html"`
    );
    res.send(html);
  } catch (err: any) {
    logger.error('Error generating invoice download:', err);
    res.status(500).json({ error: 'Erro ao gerar fatura' });
  }
});

export { router as invoicesRouter };
