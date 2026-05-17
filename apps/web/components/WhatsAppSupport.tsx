'use client';

import { MessageCircle, Clock, Phone } from 'lucide-react';

const WHATSAPP_NUMBER = '2449XXXXXXXX';
const WHATSAPP_MESSAGE = 'Olá! Preciso de ajuda com a NEXUS IA.';

export default function WhatsAppSupport() {
  return (
    <div className="bg-slate-900 rounded-xl border border-slate-700 p-6">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="w-5 h-5 text-emerald-500" />
        <h2 className="font-semibold">Suporte</h2>
      </div>

      <p className="text-sm text-slate-400 mb-4">
        Precisas de ajuda? Fala connosco pelo WhatsApp e respondemos o mais rápido possível.
      </p>

      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <Clock className="w-4 h-4 text-slate-500" />
          <span>Seg - Sex: 08h00 - 18h00</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <Phone className="w-4 h-4 text-slate-500" />
          <span>+244 9XX XXX XXX</span>
        </div>
      </div>

      <a
        href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 rounded-lg text-sm font-medium transition"
      >
        <MessageCircle className="w-4 h-4" />
        Abrir WhatsApp
      </a>
    </div>
  );
}
