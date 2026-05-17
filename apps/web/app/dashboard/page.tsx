'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Code2, Copy, Check, Key, CreditCard, BarChart3, AlertTriangle, Github, FileText, Download } from 'lucide-react';
import { apiFetch, getInvoices, downloadInvoice } from '@/lib/api';
import WhatsAppSupport from '@/components/WhatsAppSupport';

export default function DashboardPage() {
  const [apiKey, setApiKey] = useState('');
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const githubKey = params.get('api_key');
    const githubEmail = params.get('email');
    if (githubKey) {
      localStorage.setItem('nexus_api_key', githubKey);
      if (githubEmail) localStorage.setItem('nexus_user_email', githubEmail);
      setApiKey(githubKey);
      loadStatus(githubKey);
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }
    const storedKey = localStorage.getItem('nexus_api_key');
    if (storedKey) {
      setApiKey(storedKey);
      loadStatus(storedKey);
      loadInvoices();
    } else {
      setLoading(false);
      setInvoicesLoading(false);
    }
  }, []);

  const loadStatus = async (key: string) => {
    try {
      const data = await apiFetch('/chat/status');
      setStatus(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadInvoices = async () => {
    try {
      const data = await getInvoices();
      setInvoices(data.invoices || []);
    } catch (err) {
      console.error(err);
    } finally {
      setInvoicesLoading(false);
    }
  };

  const saveApiKey = () => {
    localStorage.setItem('nexus_api_key', apiKey);
    loadStatus(apiKey);
  };

  const copyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!apiKey && !loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6">
        <div className="max-w-md w-full space-y-4">
          <div className="flex items-center gap-2 mb-8 justify-center">
            <Code2 className="w-8 h-8 text-nexus-500" />
            <span className="text-2xl font-bold">NEXUS IA</span>
          </div>
          <div className="bg-slate-900 rounded-xl border border-slate-700 p-6">
            <h1 className="text-xl font-bold mb-4">Dashboard</h1>
            <p className="text-slate-400 mb-4">Insere a tua API Key para veres o estado da conta.</p>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="nx-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-nexus-500 text-white mb-4"
            />
            <button
              onClick={saveApiKey}
              className="w-full py-3 bg-nexus-600 hover:bg-nexus-700 rounded-lg font-medium transition"
            >
              Entrar
            </button>
            <div className="mt-4 flex items-center gap-2">
              <div className="flex-1 h-px bg-slate-700" />
              <span className="text-xs text-slate-500">ou</span>
              <div className="flex-1 h-px bg-slate-700" />
            </div>
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/v1', '') || 'http://localhost:3000'}/v1/auth/github`}
              className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-sm font-medium transition"
            >
              <Github className="w-4 h-4" />
              Entrar com GitHub
            </a>
            <p className="text-sm text-slate-500 mt-4 text-center">
              Não tens API key? <Link href="/" className="text-nexus-400 hover:underline">Compra um plano</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">A carregar...</div>
      </div>
    );
  }

  const pct = status?.alerts?.creditsPercentage || 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 className="w-6 h-6 text-nexus-500" />
            <span className="font-semibold">NEXUS IA</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/editor" className="text-sm text-slate-400 hover:text-white transition">Editor</Link>
            <Link href="/" className="text-sm text-slate-400 hover:text-white transition">Site</Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-8">Dashboard</h1>

        <div className="bg-slate-900 rounded-xl border border-slate-700 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Key className="w-5 h-5 text-nexus-500" />
            <h2 className="font-semibold">API Key</h2>
          </div>
          <div className="flex gap-2">
            <code className="flex-1 px-4 py-3 bg-slate-800 rounded-lg text-sm font-mono text-nexus-400 truncate">
              {apiKey}
            </code>
            <button onClick={copyKey} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition">
              {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
          <div className="mt-4 flex gap-4 text-sm">
            <Link href="/editor" className="text-nexus-400 hover:underline">Abrir Editor Online →</Link>
            <span className="text-slate-600">|</span>
            <span className="text-slate-500">CLI: <code className="text-slate-300">nexus login --key {apiKey.slice(0,12)}...</code></span>
          </div>
        </div>

        {status?.alerts?.lowCredits && (
          <div className="bg-red-950/50 border border-red-800 rounded-xl p-4 mb-6 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <div>
              <p className="font-medium text-red-400">Créditos baixos ({pct}%)</p>
              <p className="text-sm text-red-300"><Link href="/" className="underline">Renova o teu plano</Link></p>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <div className="bg-slate-900 rounded-xl border border-slate-700 p-6">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="w-5 h-5 text-emerald-500" />
              <h2 className="font-semibold">Créditos</h2>
            </div>
            <div className="text-3xl font-bold mb-2">{status?.user?.credits?.remaining?.toLocaleString() || 0}</div>
            <div className="text-sm text-slate-400">de {status?.user?.credits?.total?.toLocaleString() || 0} tokens</div>
            <div className="mt-4 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${pct < 10 ? 'bg-red-500' : pct < 25 ? 'bg-yellow-500' : 'bg-emerald-500'}`}
                style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
            </div>
          </div>

          <div className="bg-slate-900 rounded-xl border border-slate-700 p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-nexus-500" />
              <h2 className="font-semibold">Plano</h2>
            </div>
            <div className="text-2xl font-bold mb-1 uppercase">{status?.user?.plan || '—'}</div>
            <div className="text-sm text-slate-400">
              Expira: {status?.user?.expiresAt ? new Date(status.user.expiresAt).toLocaleDateString('pt-AO') : '—'}
            </div>
          </div>

          <div className="bg-slate-900 rounded-xl border border-slate-700 p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-purple-500" />
              <h2 className="font-semibold">Uso (mês)</h2>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Requests</span>
                <span className="font-medium">{status?.usageThisMonth?.requests?.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Tokens</span>
                <span className="font-medium">{status?.usageThisMonth?.tokens?.toLocaleString() || 0}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <WhatsAppSupport />
          <div className="bg-slate-900 rounded-xl border border-slate-700 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Github className="w-5 h-5 text-white" />
              <h2 className="font-semibold">Entrar com GitHub</h2>
            </div>
            <p className="text-sm text-slate-400 mb-4">
              Acede com a tua conta GitHub para começares a usar a NEXUS IA sem precisares de criar password.
            </p>
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/v1', '') || 'http://localhost:3000'}/v1/auth/github`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-sm font-medium transition"
            >
              <Github className="w-4 h-4" />
              Continuar com GitHub
            </a>
          </div>
        </div>

        <div className="bg-slate-900 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-nexus-500" />
            <h2 className="font-semibold">Faturas</h2>
          </div>
          {invoicesLoading ? (
            <div className="text-slate-400 text-sm">A carregar faturas...</div>
          ) : invoices.length === 0 ? (
            <div className="text-slate-500 text-sm">Nenhuma fatura encontrada.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-700">
                    <th className="pb-3 font-medium">Nº Fatura</th>
                    <th className="pb-3 font-medium">Data</th>
                    <th className="pb-3 font-medium">Plano</th>
                    <th className="pb-3 font-medium">Montante</th>
                    <th className="pb-3 font-medium">Estado</th>
                    <th className="pb-3 font-medium text-right">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv: any) => (
                    <tr key={inv.id} className="border-b border-slate-800 last:border-0">
                      <td className="py-3 font-mono text-nexus-400">{inv.invoiceNumber}</td>
                      <td className="py-3 text-slate-300">{inv.date}</td>
                      <td className="py-3 text-slate-300">{inv.planName}</td>
                      <td className="py-3 text-slate-300">{inv.totalKZ.toLocaleString('pt-AO')} Kz</td>
                      <td className="py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          inv.status === 'success'
                            ? 'bg-emerald-950 text-emerald-400'
                            : inv.status === 'pending'
                            ? 'bg-yellow-950 text-yellow-400'
                            : 'bg-red-950 text-red-400'
                        }`}>
                          {inv.status === 'success' ? 'Pago' : inv.status === 'pending' ? 'Pendente' : 'Falhou'}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => downloadInvoice(inv.id)}
                          className="inline-flex items-center gap-1 text-nexus-400 hover:text-nexus-300 transition text-xs"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
