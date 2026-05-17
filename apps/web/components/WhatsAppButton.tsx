'use client';

import { MessageCircle } from 'lucide-react';

const WHATSAPP_NUMBER = '2449XXXXXXXX';
const WHATSAPP_MESSAGE = 'Olá! Preciso de ajuda com a NEXUS IA.';

export default function WhatsAppButton() {
  return (
    <a
      href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105"
      aria-label="Suporte WhatsApp"
      title="Suporte WhatsApp"
    >
      <MessageCircle className="w-7 h-7" />
    </a>
  );
}
