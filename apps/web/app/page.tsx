'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Code2, Zap, Shield, Globe, ChevronRight, Terminal, Cpu } from 'lucide-react';
import { PLANS, getCreditsWithBonus, PlanType } from '@nexus-ia/types';

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const plans = [
    { key: 'teste' as PlanType, color: 'border-gray-600' },
    { key: 'starter' as PlanType, color: 'border-nexus-500' },
    { key: 'pro' as PlanType, color: 'border-purple-500' },
    { key: 'team' as PlanType, color: 'border-amber-500' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Navbar */}
      <nav className={`fixed top-0 w-full z-50 transition-all ${scrolled ? 'bg-slate-950/90 backdrop-blur border-b border-slate-800' : ''}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 className="w-8 h-8 text-nexus-500" />
            <span className="text-xl font-bold">NEXUS IA</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#planos" className="text-sm text-slate-400 hover:text-white transition">Planos</a>
            <a href="#editor" className="text-sm text-slate-400 hover:text-white transition">Editor</a>
            <Link href="/dashboard" className="text-sm text-slate-400 hover:text-white transition">Dashboard</Link>
            <Link href="/editor" className="px-4 py-2 bg-nexus-600 hover:bg-nexus-700 rounded-lg text-sm font-medium transition">
              Experimentar
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-nexus-950 border border-nexus-800 text-nexus-400 text-sm mb-8">
            <Cpu className="w-4 h-4" />
            Powered by Kimi K2.6
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Programa com IA em<br />
            <span className="text-nexus-500">Português</span> 🇦🇴
          </h1>
          <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
            O primeiro IDE com inteligência artificial feito para Angola. 
            Paga em Kwanzas. Sem cartão internacional. Sem complicações.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/editor" className="px-8 py-4 bg-nexus-600 hover:bg-nexus-700 rounded-xl font-semibold text-lg transition flex items-center gap-2">
              <Terminal className="w-5 h-5" />
              Abrir Editor Online
            </Link>
            <a href="#planos" className="px-8 py-4 bg-slate-800 hover:bg-slate-700 rounded-xl font-semibold text-lg transition">
              Ver Planos
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-slate-900/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Zap className="w-8 h-8 text-amber-400" />}
              title="Kimi K2.6"
              desc="O modelo de IA mais avançado para código, com compreensão de contexto de 128K tokens."
            />
            <FeatureCard 
              icon={<Shield className="w-8 h-8 text-emerald-400" />}
              title="Seguro"
              desc="As tuas API keys nunca são expostas. Rate limiting e logs de todas as requests."
            />
            <FeatureCard 
              icon={<Globe className="w-8 h-8 text-nexus-400" />}
              title="Para Angola"
              desc="Paga com Unitel Money ou cartão local. Suporte em Português. Preços em Kwanzas."
            />
          </div>
        </div>
      </section>

      {/* IDE Preview */}
      <section id="editor" className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">IDE no Browser</h2>
            <p className="text-slate-400">Programa diretamente no navegador, sem instalar nada.</p>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-900 overflow-hidden shadow-2xl">
            <div className="flex items-center gap-2 px-4 py-3 bg-slate-800 border-b border-slate-700">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <span className="text-sm text-slate-400 ml-4">nexus-ide.ao - index.ts</span>
            </div>
            <div className="grid grid-cols-4 h-96">
              <div className="col-span-3 p-4 font-mono text-sm text-slate-300">
                <pre>{`// Pede à IA para gerar código
import { createServer } from "http";

// @nexus-ia: Gera um servidor REST
const server = createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ message: "Olá de Angola! 🇦🇴" }));
});

server.listen(3000, () => {
  console.log("Servidor a rodar na porta 3000");
});`}</pre>
              </div>
              <div className="border-l border-slate-700 bg-slate-800/50 p-4">
                <div className="text-xs font-semibold text-slate-500 mb-3">🤖 NEXUS CHAT</div>
                <div className="space-y-3 text-sm">
                  <div className="bg-slate-700/50 rounded-lg p-2 text-slate-300">
                    Gera um servidor HTTP simples
                  </div>
                  <div className="bg-nexus-900/50 rounded-lg p-2 text-nexus-300">
                    ✅ Código gerado! O servidor escuta na porta 3000 e responde com JSON.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="planos" className="py-20 bg-slate-900/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Planos</h2>
            <p className="text-slate-400">Escolhe o que melhor se adapta às tuas necessidades.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map(({ key, color }) => {
              const plan = PLANS[key];
              const total = getCreditsWithBonus(key);
              return (
                <div key={key} className={`rounded-xl border ${color} bg-slate-900 p-6 flex flex-col`}>
                  <h3 className="text-lg font-bold mb-1">{plan.name}</h3>
                  <div className="text-3xl font-bold mb-4">
                    {plan.priceKZ === 0 ? 'Grátis' : `${plan.priceKZ.toLocaleString()} Kz`}
                  </div>
                  <div className="text-sm text-slate-400 mb-4">
                    {plan.credits.toLocaleString()} tokens
                    {plan.bonus > 0 && (
                      <span className="text-emerald-400"> +{plan.bonus}% bónus = {total.toLocaleString()}</span>
                    )}
                  </div>
                  <ul className="space-y-2 text-sm text-slate-300 mb-6 flex-1">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <ChevronRight className="w-4 h-4 text-nexus-500" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link 
                    href={key === 'teste' ? '/editor' : `/checkout?plan=${key}`}
                    className={`w-full py-3 rounded-lg font-medium text-center transition ${
                      key === 'pro' 
                        ? 'bg-nexus-600 hover:bg-nexus-700 text-white' 
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    }`}
                  >
                    {key === 'teste' ? 'Experimentar' : 'Subscrever'}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Code2 className="w-6 h-6 text-nexus-500" />
            <span className="font-semibold">NEXUS IA</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/terms" className="text-sm text-slate-400 hover:text-white transition">Termos</Link>
            <Link href="/privacy" className="text-sm text-slate-400 hover:text-white transition">Privacidade</Link>
            <Link href="/refund" className="text-sm text-slate-400 hover:text-white transition">Reembolso</Link>
            <a
              href="https://wa.me/2449XXXXXXXX?text=Ol%C3%A1!%20Preciso%20de%20ajuda%20com%20a%20NEXUS%20IA."
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-emerald-400 hover:text-emerald-300 transition"
            >
              Suporte WhatsApp
            </a>
          </div>
          <p className="text-sm text-slate-500">
            © 2026 NEXUS IA, LDA. Angola 🇦🇴
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700">
      <div className="mb-4">{icon}</div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-slate-400 text-sm">{desc}</p>
    </div>
  );
}
