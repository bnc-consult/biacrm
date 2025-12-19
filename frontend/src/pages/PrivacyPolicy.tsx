import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-8 md:p-12">
        <div className="mb-8">
          <Link to="/login" className="text-primary-600 hover:text-primary-700 mb-4 inline-block">
            ← Voltar para o login
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Política de Privacidade</h1>
          <p className="text-gray-600">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
        </div>

        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introdução</h2>
            <p className="text-gray-700 mb-4">
              O BIA CRM ("nós", "nosso" ou "aplicativo") está comprometido em proteger sua privacidade. 
              Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos suas 
              informações pessoais quando você usa nosso serviço.
            </p>
            <p className="text-gray-700 mb-4">
              Ao usar o BIA CRM, você concorda com a coleta e uso de informações de acordo com esta política.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Informações que Coletamos</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">2.1. Informações Fornecidas por Você</h3>
            <p className="text-gray-700 mb-4">
              Coletamos informações que você nos fornece diretamente, incluindo:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2 ml-4">
              <li><strong>Informações da Conta:</strong> Nome, endereço de email, senha (criptografada)</li>
              <li><strong>Dados de Leads:</strong> Informações de contatos e leads que você adiciona ou importa</li>
              <li><strong>Dados de Integração:</strong> Tokens de acesso e configurações de integrações com plataformas de terceiros</li>
              <li><strong>Dados de Uso:</strong> Preferências, configurações e outras informações relacionadas ao uso do serviço</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">2.2. Informações Coletadas Automaticamente</h3>
            <p className="text-gray-700 mb-4">
              Quando você usa nosso serviço, coletamos automaticamente certas informações, incluindo:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2 ml-4">
              <li><strong>Dados de Log:</strong> Endereço IP, tipo de navegador, páginas visitadas, data e hora de acesso</li>
              <li><strong>Cookies e Tecnologias Similares:</strong> Usamos cookies para melhorar sua experiência e analisar o uso do serviço</li>
              <li><strong>Informações do Dispositivo:</strong> Tipo de dispositivo, sistema operacional, identificadores únicos</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">2.3. Informações de Plataformas de Terceiros</h3>
            <p className="text-gray-700 mb-4">
              Quando você conecta integrações com plataformas de terceiros (como Facebook, Instagram), 
              coletamos informações autorizadas por essas plataformas, incluindo:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2 ml-4">
              <li>Dados de perfil público</li>
              <li>Leads e formulários de leads</li>
              <li>Informações de páginas e contas conectadas</li>
              <li>Tokens de acesso (armazenados de forma segura e criptografada)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Como Usamos Suas Informações</h2>
            <p className="text-gray-700 mb-4">
              Usamos as informações coletadas para:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2 ml-4">
              <li><strong>Fornecer o Serviço:</strong> Processar e gerenciar suas solicitações, sincronizar dados de integrações</li>
              <li><strong>Melhorar o Serviço:</strong> Analisar o uso para melhorar funcionalidades e experiência do usuário</li>
              <li><strong>Comunicação:</strong> Enviar notificações sobre o serviço, atualizações e suporte</li>
              <li><strong>Segurança:</strong> Detectar e prevenir fraudes, abusos e atividades ilegais</li>
              <li><strong>Conformidade Legal:</strong> Cumprir obrigações legais e responder a solicitações legais</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Compartilhamento de Informações</h2>
            <p className="text-gray-700 mb-4">
              Não vendemos, alugamos ou compartilhamos suas informações pessoais com terceiros, exceto nas seguintes circunstâncias:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2 ml-4">
              <li><strong>Prestadores de Serviços:</strong> Compartilhamos com provedores de serviços que nos ajudam a operar o serviço (hospedagem, análise, etc.), sujeitos a acordos de confidencialidade</li>
              <li><strong>Plataformas Integradas:</strong> Quando você autoriza integrações, compartilhamos dados necessários conforme suas autorizações</li>
              <li><strong>Requisitos Legais:</strong> Quando exigido por lei, ordem judicial ou processo legal</li>
              <li><strong>Proteção de Direitos:</strong> Para proteger nossos direitos, propriedade ou segurança, ou de nossos usuários</li>
              <li><strong>Com Seu Consentimento:</strong> Quando você nos dá permissão explícita para compartilhar</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Segurança dos Dados</h2>
            <p className="text-gray-700 mb-4">
              Implementamos medidas de segurança técnicas e organizacionais para proteger suas informações:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2 ml-4">
              <li><strong>Criptografia:</strong> Dados sensíveis são criptografados em trânsito (HTTPS) e em repouso</li>
              <li><strong>Autenticação:</strong> Senhas são armazenadas usando hash seguro (nunca em texto plano)</li>
              <li><strong>Acesso Limitado:</strong> Apenas pessoal autorizado tem acesso aos dados</li>
              <li><strong>Monitoramento:</strong> Monitoramos continuamente para detectar e prevenir acessos não autorizados</li>
              <li><strong>Backups Seguros:</strong> Realizamos backups regulares com proteção adequada</li>
            </ul>
            <p className="text-gray-700 mb-4">
              No entanto, nenhum método de transmissão pela Internet ou armazenamento eletrônico é 100% seguro. 
              Embora nos esforcemos para proteger suas informações, não podemos garantir segurança absoluta.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Retenção de Dados</h2>
            <p className="text-gray-700 mb-4">
              Mantemos suas informações pessoais apenas pelo tempo necessário para:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2 ml-4">
              <li>Fornecer e melhorar nosso serviço</li>
              <li>Cumprir obrigações legais</li>
              <li>Resolver disputas e fazer cumprir nossos acordos</li>
            </ul>
            <p className="text-gray-700 mb-4">
              Quando você exclui sua conta, excluímos ou anonimizamos suas informações pessoais, 
              exceto quando a retenção é necessária para fins legais ou legítimos de negócios.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Seus Direitos</h2>
            <p className="text-gray-700 mb-4">
              De acordo com a LGPD (Lei Geral de Proteção de Dados), você tem os seguintes direitos:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2 ml-4">
              <li><strong>Acesso:</strong> Solicitar acesso às suas informações pessoais</li>
              <li><strong>Correção:</strong> Solicitar correção de dados inexatos ou incompletos</li>
              <li><strong>Exclusão:</strong> Solicitar exclusão de suas informações pessoais</li>
              <li><strong>Portabilidade:</strong> Solicitar uma cópia de seus dados em formato estruturado</li>
              <li><strong>Oposição:</strong> Opor-se ao processamento de suas informações pessoais</li>
              <li><strong>Revogação de Consentimento:</strong> Revogar consentimento para processamento de dados</li>
            </ul>
            <p className="text-gray-700 mb-4">
              Para exercer esses direitos, entre em contato conosco através do email: 
              <a href="mailto:privacidade@biacrm.com" className="text-primary-600 hover:text-primary-700 ml-1">privacidade@biacrm.com</a>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Cookies e Tecnologias de Rastreamento</h2>
            <p className="text-gray-700 mb-4">
              Usamos cookies e tecnologias similares para:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2 ml-4">
              <li>Manter você conectado ao serviço</li>
              <li>Lembrar suas preferências</li>
              <li>Analisar o uso do serviço</li>
              <li>Melhorar a segurança</li>
            </ul>
            <p className="text-gray-700 mb-4">
              Você pode controlar cookies através das configurações do seu navegador. 
              No entanto, desabilitar cookies pode afetar a funcionalidade do serviço.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Integrações com Terceiros</h2>
            <p className="text-gray-700 mb-4">
              Quando você conecta integrações com plataformas de terceiros (Facebook, Instagram, etc.), 
              essas plataformas têm suas próprias políticas de privacidade. Recomendamos que você revise 
              as políticas de privacidade dessas plataformas.
            </p>
            <p className="text-gray-700 mb-4">
              Ao autorizar uma integração, você nos permite acessar e processar dados conforme necessário 
              para fornecer a funcionalidade de integração. Você pode revogar essas autorizações a qualquer 
              momento através das configurações de integração.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Privacidade de Menores</h2>
            <p className="text-gray-700 mb-4">
              O BIA CRM não é destinado a menores de 18 anos. Não coletamos intencionalmente informações 
              pessoais de menores. Se descobrirmos que coletamos informações de um menor, tomaremos medidas 
              para excluir essas informações imediatamente.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Transferências Internacionais</h2>
            <p className="text-gray-700 mb-4">
              Seus dados podem ser transferidos e mantidos em servidores localizados fora do Brasil. 
              Ao usar nosso serviço, você consente com essa transferência. Garantimos que medidas 
              adequadas de segurança sejam implementadas para proteger seus dados.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Alterações nesta Política</h2>
            <p className="text-gray-700 mb-4">
              Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos você sobre 
              alterações significativas publicando a nova política nesta página e atualizando a data 
              de "Última atualização". Recomendamos que você revise esta política periodicamente.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Contato</h2>
            <p className="text-gray-700 mb-4">
              Se você tiver dúvidas, preocupações ou solicitações relacionadas a esta Política de Privacidade 
              ou ao tratamento de seus dados pessoais, entre em contato conosco:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="text-gray-700 mb-2">
                <strong>Email:</strong> <a href="mailto:privacidade@biacrm.com" className="text-primary-600 hover:text-primary-700">privacidade@biacrm.com</a>
              </p>
              <p className="text-gray-700 mb-2">
                <strong>Email Geral:</strong> <a href="mailto:contato@biacrm.com" className="text-primary-600 hover:text-primary-700">contato@biacrm.com</a>
              </p>
            </div>
          </section>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Esta Política de Privacidade está em conformidade com a LGPD (Lei Geral de Proteção de Dados - Lei nº 13.709/2018) 
              e outras leis aplicáveis de proteção de dados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

