// @ts-nocheck
import type { Metadata } from 'next';
import Link from 'next/link';
import { Code2, ArrowLeft, Clock, XCircle, CheckCircle, Mail } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Política de Reembolso - NEXUS IA',
  description: 'Política de Reembolso da NEXUS IA, LDA. Condições de reembolso para planos e créditos.',
};

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 className="w-6 h-6 text-nexus-500" />
            <span className="font-semibold">NEXUS IA</span>
          </div>
          <Link href="/" className="text-sm text-slate-400 hover:text-white transition inline-flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-8">Política de Reembolso</h1>
        <p className="text-slate-400 mb-8">Última atualização: 16 de Maio de 2026</p>

        <div className="space-y-8 text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Âmbito</h2>
            <p>
              A presente Política de Reembolso aplica-se a todos os pagamentos efetuados na plataforma NEXUS IA,
              operada pela <strong>NEXUS IA, LDA</strong>, sediada em Angola. Ao efetuares uma compra,
              aceitas as condições aqui descritas.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Créditos Utilizados</h2>
            <div className="flex items-start gap-3 bg-slate-900 border border-slate-700 rounded-xl p-5">
              <XCircle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-white">Não são efetuados reembolsos de créditos já utilizados.</p>
                <p className="text-slate-400 mt-1">
                  Uma vez que os tokens/créditos sejam consumidos para gerar respostas da IA, processar código
                  ou realizar outras operações na plataforma, o montante correspondente não é reembolsável.
                  Isto deve-se à natureza imediata e irreversível do processamento de IA.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Planos Não Utilizados</h2>
            <div className="flex items-start gap-3 bg-slate-900 border border-slate-700 rounded-xl p-5">
              <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-white">Reembolso disponível no prazo de 7 dias.</p>
                <p className="text-slate-400 mt-1">
                  Se adquiriste um plano e ainda não utilizaste nenhum crédito associado, podes solicitar
                  reembolso total no prazo de <strong>7 (sete) dias</strong> a contar da data de confirmação
                  do pagamento. O reembolso será processado através do mesmo meio de pagamento utilizado
                  na compra (Flutterwave ou Unitel Money).
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Processo de Solicitação</h2>
            <div className="flex items-start gap-3 bg-slate-900 border border-slate-700 rounded-xl p-5">
              <Mail className="w-6 h-6 text-nexus-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-white">Contacta o suporte.</p>
                <p className="text-slate-400 mt-1">
                  Para solicitar um reembolso, envia um email para{' '}
                  <a href="mailto:suporte@nexus-ia.ao" className="text-nexus-400 hover:underline">suporte@nexus-ia.ao</a>{' '}
                  com o assunto &quot;Solicitação de Reembolso&quot; e inclui:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-slate-400">
                  <li>O email associado à tua conta;</li>
                  <li>A referência da transação (tx_ref ou flw_ref);</li>
                  <li>O motivo do reembolso (opcional, mas ajuda-nos a melhorar).</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Prazos de Processamento</h2>
            <div className="flex items-start gap-3 bg-slate-900 border border-slate-700 rounded-xl p-5">
              <Clock className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-white">Até 14 dias úteis.</p>
                <p className="text-slate-400 mt-1">
                  Após recebermos a tua solicitação, analisaremos o pedido no prazo de 5 dias úteis.
                  Se aprovado, o reembolso será processado no prazo de <strong>14 dias úteis</strong>.
                  O tempo de disponibilização dos fundos pode variar consoante o método de pagamento
                  e a instituição financeira.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Exceções</h2>
            <p className="mb-3">Não serão concedidos reembolsos nas seguintes situações:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li>Conta suspensa ou terminada por violação dos Termos de Serviço;</li>
              <li>Créditos parcialmente ou totalmente consumidos;</li>
              <li>Solicitações efetuadas após o prazo de 7 dias para planos não utilizados;</li>
              <li>Fraudes detectadas ou tentativas de abuso do sistema de reembolso.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Alterações a esta Política</h2>
            <p>
              A NEXUS IA, LDA reserva-se o direito de alterar esta Política de Reembolso a qualquer momento.
              As alterações serão publicadas nesta página e, se significativas, notificaremos os utilizadores
              por email ou através da plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Contacto</h2>
            <p>
              Para esclarecimentos adicionais sobre reembolsos, contacta-nos através de{' '}
              <a href="mailto:suporte@nexus-ia.ao" className="text-nexus-400 hover:underline">suporte@nexus-ia.ao</a>.
            </p>
          </section>
        </div>
      </main>

      <footer className="py-8 border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-6 text-center text-sm text-slate-500">
          © 2026 NEXUS IA, LDA. Angola 🇦🇴
        </div>
      </footer>
    </div>
  );
}
