import { Link } from 'react-router-dom';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-8 md:p-12">
        <div className="mb-8">
          <Link to="/login" className="text-primary-600 hover:text-primary-700 mb-4 inline-block">
            ← Voltar para o login
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Termos de Serviço</h1>
          <p className="text-gray-600">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
        </div>

        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Aceitação dos Termos</h2>
            <p className="text-gray-700 mb-4">
              Ao acessar e usar o BIA CRM, você concorda em cumprir e estar vinculado aos seguintes termos e condições de uso. 
              Se você não concorda com qualquer parte destes termos, não deve usar nosso serviço.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Descrição do Serviço</h2>
            <p className="text-gray-700 mb-4">
              O BIA CRM é uma plataforma de gerenciamento de relacionamento com clientes (CRM) que permite aos usuários:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2 ml-4">
              <li>Gerenciar leads e contatos de clientes</li>
              <li>Integrar com plataformas de marketing digital (Facebook, Instagram, etc.)</li>
              <li>Rastrear funis de vendas e conversões</li>
              <li>Agendar e gerenciar compromissos</li>
              <li>Acessar e sincronizar dados de leads de plataformas integradas</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Conta do Usuário</h2>
            <p className="text-gray-700 mb-4">
              Para usar o BIA CRM, você precisa criar uma conta fornecendo informações precisas e completas. 
              Você é responsável por:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2 ml-4">
              <li>Manter a segurança de sua conta e senha</li>
              <li>Todas as atividades que ocorrem sob sua conta</li>
              <li>Notificar-nos imediatamente sobre qualquer uso não autorizado</li>
              <li>Fornecer informações precisas e atualizadas</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Uso Aceitável</h2>
            <p className="text-gray-700 mb-4">
              Você concorda em usar o BIA CRM apenas para fins legais e de acordo com estes Termos. 
              Você não deve:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2 ml-4">
              <li>Usar o serviço para qualquer propósito ilegal ou não autorizado</li>
              <li>Violar qualquer lei local, estadual, nacional ou internacional</li>
              <li>Transmitir qualquer vírus, malware ou código malicioso</li>
              <li>Tentar obter acesso não autorizado a qualquer parte do serviço</li>
              <li>Interferir ou interromper o funcionamento do serviço</li>
              <li>Usar o serviço para enviar spam ou comunicações não solicitadas</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Integrações com Terceiros</h2>
            <p className="text-gray-700 mb-4">
              O BIA CRM oferece integrações com plataformas de terceiros, incluindo Facebook e Instagram. 
              Ao usar essas integrações:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2 ml-4">
              <li>Você autoriza o BIA CRM a acessar seus dados nessas plataformas conforme necessário</li>
              <li>Você concorda em cumprir os termos de serviço das plataformas de terceiros</li>
              <li>Você é responsável por garantir que tem permissão para acessar e usar esses dados</li>
              <li>O BIA CRM não é responsável pelas políticas ou práticas de plataformas de terceiros</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Propriedade Intelectual</h2>
            <p className="text-gray-700 mb-4">
              Todo o conteúdo do BIA CRM, incluindo design, texto, gráficos, logotipos, ícones e software, 
              é propriedade do BIA CRM ou de seus fornecedores de conteúdo e está protegido por leis de 
              direitos autorais e outras leis de propriedade intelectual.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Seus Dados</h2>
            <p className="text-gray-700 mb-4">
              Você mantém todos os direitos sobre os dados que você insere ou importa no BIA CRM. 
              Você nos concede uma licença para usar, armazenar e processar esses dados conforme 
              necessário para fornecer o serviço. Consulte nossa Política de Privacidade para 
              mais informações sobre como tratamos seus dados.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Limitação de Responsabilidade</h2>
            <p className="text-gray-700 mb-4">
              O BIA CRM é fornecido "como está" e "conforme disponível". Não garantimos que:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2 ml-4">
              <li>O serviço será ininterrupto, seguro ou livre de erros</li>
              <li>Os resultados obtidos do uso do serviço serão precisos ou confiáveis</li>
              <li>Qualquer defeito ou erro será corrigido</li>
            </ul>
            <p className="text-gray-700 mb-4">
              Em nenhuma circunstância seremos responsáveis por quaisquer danos indiretos, incidentais, 
              especiais, consequenciais ou punitivos resultantes do uso ou incapacidade de usar o serviço.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Modificações do Serviço</h2>
            <p className="text-gray-700 mb-4">
              Reservamo-nos o direito de modificar, suspender ou descontinuar qualquer aspecto do serviço 
              a qualquer momento, com ou sem aviso prévio. Não seremos responsáveis perante você ou qualquer 
              terceiro por qualquer modificação, suspensão ou descontinuação do serviço.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Rescisão</h2>
            <p className="text-gray-700 mb-4">
              Podemos encerrar ou suspender sua conta e acesso ao serviço imediatamente, sem aviso prévio, 
              por qualquer motivo, incluindo se você violar estes Termos. Após a rescisão, seu direito de 
              usar o serviço cessará imediatamente.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Modificações dos Termos</h2>
            <p className="text-gray-700 mb-4">
              Reservamo-nos o direito de modificar estes Termos a qualquer momento. As alterações entrarão 
              em vigor imediatamente após a publicação. Seu uso continuado do serviço após as alterações 
              constitui sua aceitação dos novos Termos.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Lei Aplicável</h2>
            <p className="text-gray-700 mb-4">
              Estes Termos serão regidos e interpretados de acordo com as leis do Brasil, sem dar efeito 
              a qualquer princípio de conflitos de leis.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Contato</h2>
            <p className="text-gray-700 mb-4">
              Se você tiver alguma dúvida sobre estes Termos de Serviço, entre em contato conosco através 
              do email: <a href="mailto:contato@biacrm.com" className="text-primary-600 hover:text-primary-700">contato@biacrm.com</a>
            </p>
          </section>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Ao usar o BIA CRM, você reconhece que leu, entendeu e concorda em ficar vinculado a estes Termos de Serviço.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}






