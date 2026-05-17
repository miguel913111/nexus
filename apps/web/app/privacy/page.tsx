// @ts-nocheck
import type { Metadata } from 'next';
import Link from 'next/link';
import { Code2, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Política de Privacidade - NEXUS IA',
  description: 'Política de Privacidade da NEXUS IA, LDA. Proteção de dados pessoais em conformidade com o RGPD.',
};

export default function PrivacyPage() {
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
        <h1 className="text-3xl font-bold mb-8">Política de Privacidade</h1>
        <p className="text-slate-400 mb-8">Última atualização: 16 de Maio de 2026</p>

        <div className="space-y-8 text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Introdução</h2>
            <p>
              A <strong>NEXUS IA, LDA</strong> respeita a tua privacidade e está comprometida em proteger os teus
              dados pessoais. Esta Política de Privacidade explica como recolhemos, utilizamos, armazenamos e
              protegemos as tuas informações quando utilizas a nossa plataforma de programação assistida por IA.
              Cumprimos o Regulamento Geral sobre a Proteção de Dados (RGPD/GDPR) para utilizadores na União Europeia
              e em Portugal, bem como a legislação angolana aplicável.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Responsável pelo Tratamento</h2>
            <p>
              <strong>Entidade:</strong> NEXUS IA, LDA<br />
              <strong>País:</strong> Angola<br />
              <strong>Email:</strong>{' '}
              <a href="mailto:privacy@nexus-ia.ao" className="text-nexus-400 hover:underline">privacy@nexus-ia.ao</a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Dados que Recolhemos</h2>
            <p className="mb-3">Recolhemos os seguintes tipos de dados pessoais:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li><strong>Identificação:</strong> nome completo, endereço de email;</li>
              <li><strong>Contacto:</strong> número de telemóvel (opcional);</li>
              <li><strong>Dados de utilização:</strong> logs de acesso, endpoints utilizados, tokens consumidos, erros;</li>
              <li><strong>Dados técnicos:</strong> endereço IP, tipo de navegador, sistema operativo, identificadores de dispositivo;</li>
              <li><strong>Dados de pagamento:</strong> referências de transação (não armazenamos dados de cartão de crédito).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Base Legal para o Tratamento</h2>
            <p className="mb-3">Tratamos os teus dados com base nas seguintes justificações legais:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li><strong>Execução de contrato:</strong> prestação dos serviços de IA que subscreveste;</li>
              <li><strong>Consentimento:</strong> envio de comunicações de marketing (sempre revogável);</li>
              <li><strong>Obrigação legal:</strong> cumprimento de obrigações fiscais e regulamentares;</li>
              <li><strong>Interesses legítimos:</strong> segurança da plataforma, prevenção de fraude e melhoria do serviço.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Finalidades do Tratamento</h2>
            <p className="mb-3">Utilizamos os teus dados para:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li>Criar e gerir a tua conta de utilizador;</li>
              <li>Processar pagamentos e emitir faturas/recibos;</li>
              <li>Prestar suporte técnico e atendimento ao cliente;</li>
              <li>Monitorizar a utilização do serviço para fins de faturação e limites de uso;</li>
              <li>Enviar notificações importantes sobre a conta ou alterações no serviço;</li>
              <li>Garantir a segurança e integridade da plataforma.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Cookies e Tecnologias Semelhantes</h2>
            <p className="mb-3">
              A NEXUS IA utiliza cookies e tecnologias semelhantes para melhorar a experiência de navegação,
              analisar o tráfego e personalizar conteúdos. Os tipos de cookies que utilizamos incluem:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li><strong>Cookies essenciais:</strong> necessários ao funcionamento da plataforma (autenticação, segurança);</li>
              <li><strong>Cookies analíticos:</strong> ajudam-nos a compreender como os visitantes interagem com o site;</li>
              <li><strong>Cookies de preferências:</strong> memorizam as tuas configurações e escolhas.</li>
            </ul>
            <p className="mt-3">
              Podes gerir as tuas preferências de cookies através das configurações do teu navegador.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Armazenamento e Segurança</h2>
            <p>
              Os teus dados são armazenados em servidores seguros com medidas técnicas e organizacionais
              adequadas (encriptação em trânsito e em repouso, controlo de acessos, monitorização contínua).
              Conservamos os dados apenas pelo tempo necessário às finalidades descritas ou por obrigação legal.
              Após esse período, os dados são eliminados ou anonimizados.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Partilha de Dados</h2>
            <p className="mb-3">
              Não vendemos os teus dados pessoais a terceiros. Partilhamos dados apenas com:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li><strong>Processadores de pagamento:</strong> Flutterwave e Unitel Money (para processar transações);</li>
              <li><strong>Fornecedores de infraestrutura:</strong> serviços de alojamento e computação em nuvem;</li>
              <li><strong>Autoridades competentes:</strong> quando exigido por lei ou ordem judicial.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Transferências Internacionais</h2>
            <p>
              Alguns dos nossos subcontratantes podem estar localizados fora de Angola ou da União Europeia.
              Nesses casos, garantimos que as transferências são efetuadas com salvaguardas adequadas
              (cláusulas contratuais-tipo da Comissão Europeia ou outras medidas reconhecidas).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. Os Teus Direitos</h2>
            <p className="mb-3">
              Nos termos do RGPD e legislação angolana, tens os seguintes direitos:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li><strong>Direito de acesso:</strong> obter cópia dos teus dados pessoais;</li>
              <li><strong>Direito de retificação:</strong> corrigir dados inexatos ou incompletos;</li>
              <li><strong>Direito ao apagamento (&quot;direito a ser esquecido&quot;):</strong> solicitar a eliminação dos teus dados;</li>
              <li><strong>Direito à portabilidade:</strong> receber os dados num formato estruturado e de leitura automática;</li>
              <li><strong>Direito de oposição:</strong> opor-te ao tratamento para fins de marketing;</li>
              <li><strong>Direito de limitação:</strong> solicitar a restrição do tratamento em determinadas circunstâncias.</li>
            </ul>
            <p className="mt-3">
              Para exerceres os teus direitos, contacta-nos através de{' '}
              <a href="mailto:privacy@nexus-ia.ao" className="text-nexus-400 hover:underline">privacy@nexus-ia.ao</a>.
              Responderemos no prazo de 30 dias.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">11. Retenção de Dados</h2>
            <p>
              Conservamos os dados da conta enquanto a conta estiver ativa. Após o encerramento,
              os dados pessoais são mantidos pelo período exigido por lei (por exemplo, obrigações fiscais
              durante 5 anos) e posteriormente eliminados de forma segura.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">12. Alterações a esta Política</h2>
            <p>
              Podemos atualizar esta Política de Privacidade periodicamente. Publicaremos a versão atualizada
              nesta página com a data da última revisão. Recomendamos que consultes esta página regularmente.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">13. Contacto</h2>
            <p>
              Para questões sobre privacidade ou para exercer os teus direitos, contacta o nosso Encarregado
              de Proteção de Dados (DPO) através de{' '}
              <a href="mailto:privacy@nexus-ia.ao" className="text-nexus-400 hover:underline">privacy@nexus-ia.ao</a>.
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
