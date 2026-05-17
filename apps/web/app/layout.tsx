import type { Metadata } from 'next';
import './globals.css';
import WhatsAppButton from '@/components/WhatsAppButton';

export const metadata: Metadata = {
  title: 'NEXUS IA - IDE com Kimi K2.6 para Angola',
  description: 'Programação assistida por IA em Português. Paga em Kwanzas.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt">
      <body className="antialiased">
        {children}
        <WhatsAppButton />
      </body>
    </html>
  );
}
