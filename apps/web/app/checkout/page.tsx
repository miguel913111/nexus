'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { PLANS, PlanType, getCreditsWithBonus } from '@nexus-ia/types';
import { loadFlutterwaveScript, getFlutterwaveConfig } from '@/lib/flutterwave';

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Carregando...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const planKey = (searchParams.get('plan') || 'starter') as PlanType;
  const plan = PLANS[planKey];
  const total = getCreditsWithBonus(planKey);

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [txRef, setTxRef] = useState('');

  useEffect(() => {
    loadFlutterwaveScript().catch(console.error);
  }, []);

  const handlePayment = async () => {
    if (!email || !name) {
      alert('Preenche email e nome');
      return;
    }

    setLoading(true);
    const config = getFlutterwaveConfig(planKey, plan.priceKZ, email, name);
    
    try {
      const FlutterwaveCheckout = (window as any).FlutterwaveCheckout;
      if (!FlutterwaveCheckout) {
        alert('Erro ao carregar Flutterwave. Recarrega a página.');
        return;
      }

      FlutterwaveCheckout({
        ...config,
        callback: (response: any) => {
          console.log('Payment response:', response);
          setTxRef(response.tx_ref);
          setSuccess(true);
          setLoading(false);
        },
        onclose: () => {
          setLoading(false);
        },
      });
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold mb-4">Pagamento Recebido! 🎉</h1>
          <p className="text-slate-400 mb-2">
            Obrigado pela compra! A tua API key será enviada para:
          </p>
          <p className="text-nexus-400 font-semibold mb-6">{email}</p>
          <p className="text-sm text-slate-500 mb-8">
            Referência: {txRef}
          </p>
          <Link href="/dashboard" className="inline-block px-6 py-3 bg-nexus-600 hover:bg-nexus-700 rounded-lg font-medium transition">
            Ir para Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-lg mx-auto px-6 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>

        <h1 className="text-3xl font-bold mb-2">Checkout</h1>
        <p className="text-slate-400 mb-8">Plano {plan.name}</p>

        <div className="bg-slate-900 rounded-xl border border-slate-700 p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <span className="text-slate-400">Plano</span>
            <span className="font-semibold">{plan.name}</span>
          </div>
          <div className="flex justify-between items-center mb-4">
            <span className="text-slate-400">Créditos</span>
            <span className="font-semibold">{total.toLocaleString()} tokens</span>
          </div>
          <div className="border-t border-slate-700 pt-4 flex justify-between items-center">
            <span className="text-lg font-semibold">Total</span>
            <span className="text-2xl font-bold text-nexus-400">{plan.priceKZ.toLocaleString()} Kz</span>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Nome completo</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-nexus-500 text-white"
              placeholder="João Silva"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-nexus-500 text-white"
              placeholder="joao@email.ao"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Telemóvel (opcional)</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-nexus-500 text-white"
              placeholder="+244 9XX XXX XXX"
            />
          </div>

          <button
            onClick={handlePayment}
            disabled={loading}
            className="w-full py-4 bg-nexus-600 hover:bg-nexus-700 disabled:opacity-50 rounded-lg font-semibold text-lg transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                A processar...
              </>
            ) : (
              `Pagar ${plan.priceKZ.toLocaleString()} Kz`
            )}
          </button>

          <p className="text-xs text-slate-500 text-center">
            Pagamento seguro via Flutterwave. Aceita Unitel Money, cartão e transferência.
          </p>
        </div>
      </div>
    </div>
  );
}
