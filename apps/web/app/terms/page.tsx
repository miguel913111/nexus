// @ts-nocheck
import type { Metadata } from 'next';
import Link from 'next/link';
import { Code2, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Termos de Serviço - NEXUS IA',
  description: 'Termos de Serviço da NEXUS IA, LDA. Plataforma de programação assistida por IA para Angola.',
};

export default function TermsPage() {
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
        <h1 className="text-3xl font-bold mb-8">Termos de Serviço</h1>
        <p className="text-slate-400 mb-8">Última atualização: 16 de Maio de 2026</p>

        <div className="space-y-8 text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Identificação da Empresa</h2>
            <p>
              A presente plataforma, doravante designada por &quot;NEXUS IA&quot;, é operada pela <strong>NEXUS IA, LDA</strong>,
              sociedade comercial constituída e em funcionamento em Angola.
              Ao acederes ou utilizares os nossos serviços, concordas em ficar vinculado pelos presentes Termos de Serviço.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Descrição do Serviço</h2>
            <p>
              A NEXUS IA é uma plataforma de programação assistida por inteligência artificial (IA) dirigida a
              programadores e empresas em Angola. O serviço inclui acesso a um IDE online, API de chat/completion,
              e ferramentas de geração e análise de código. Os serviços são prestados sob a forma de
              subscrições mensais com créditos em tokens.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Elegibilidade</h2>
            <p>
              Para utilizares a NEXUS IA, deves ter pelo menos 18 anos de idade ou a autorização de um tutor legal.
              Ao criares uma conta, declaras que as informações fornecidas são verdadeiras, completas e atualizadas.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Registo e Conta</h2>
            <p>
              É da tua responsabilidade manter a confidencialidade da tua API key e credenciais de acesso.
              Não deves partilhar a tua conta com terceiros. A NEXUS IA reserva-se o direito de suspender ou terminar
              contas que partilhem credenciais ou utilizem o serviço de forma fraudulenta.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Planos e Pagamentos</h2>
            <p className="mb-3">
              Os planos são cobrados em <strong>Kwanzas Angolanos (KZ)</strong>. Os pagamentos são processados através de
              <strong> Flutterwave</strong> e <strong>Unitel Money</strong>.
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li>Os preços apresentados incluem IVA quando aplicável.</li>
              <li>A subscrição é válida por 30 dias a contar da data de pagamento confirmado.</li>
              <li>Os créditos (tokens) não utilizados não são transferíveis para o mês seguinte, salvo indicação em contrário.</li>
              <li>A NEXUS IA pode alterar os preços dos planos, notificando os utilizadores com antecedência mínima de 15 dias.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Política de Reembolso</h2>
            <p>
              Não efetuamos reembolso de créditos já utilizados. Para planos não utilizados, podes solicitar
              reembolso no prazo de 7 (sete) dias após a compra, contactando o suporte através do email
              <a href="mailto:suporte@nexus-ia.ao" className="text-nexus-400 hover:underline"> suporte@nexus-ia.ao</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Utilização Aceitável</h2>
            <p className="mb-3">É expressamente proibido:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li>Utilizar o serviço para gerar código malicioso, malware, ou conteúdo ilegal;</li>
              <li>Fazer reverse engineering, descompilar ou tentar aceder ao código-fonte da plataforma;</li>
              <li>Realizar ataques de força bruta, scraping automatizado, ou outras atividades que comprometam a estabilidade do serviço;</li>
              <li>Revender, sublicenciar ou distribuir os créditos/token sem autorização expressa;</li>
              <li>Utilizar o serviço de forma a violar direitos de propriedade intelectual de terceiros.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Propriedade Intelectual</h2>
            <p>
              Todo o conteúdo gerado pelo utilizador através da plataforma pertence ao utilizador.
              A NEXUS IA não reivindica direitos de propriedade sobre o código gerado.
              No entanto, o utilizador concede à NEXUS IA uma licença limitada para processar o conteúdo
              estritamente necessário à prestação do serviço.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Limitação de Responsabilidade</h2>
            <p>
              A NEXUS IA fornece o serviço &quot;no estado em que se encontra&quot;. Não garantimos que o serviço
              será ininterrupto, seguro ou isento de erros. A NEXUS IA não será responsável por quaisquer
              danos indiretos, incidentais ou consequenciais resultantes da utilização ou incapacidade de utilização
              do serviço, exceto em casos de dolo ou negligência grave.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. Rescisão</h2>
            <p>
              A NEXUS IA reserva-se o direito de suspender ou terminar a tua conta, sem aviso prévio,
              em caso de violação dos presentes Termos. Podes cancelar a tua conta a qualquer momento
              contactando o suporte. Após a rescisão, os teus dados serão tratados de acordo com a nossa
              Política de Privacidade.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">11. Alterações aos Termos</h2>
            <p>
              Podemos atualizar estes Termos periodicamente. As alterações entrarão em vigor após publicação
              na plataforma. O uso continuado do serviço após alterações constitui aceitação dos novos Termos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">12. Lei Aplicável e Jurisdição</h2>
            <p>
              Estes Termos são regidos pelas leis da República de Angola. Qualquer litígio decorrente
              do uso do serviço será submetido à jurisdição dos tribunais angolanos competentes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">13. Contacto</h2>
            <p>
              Para questões sobre estes Termos, contacta-nos através de{' '}
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
