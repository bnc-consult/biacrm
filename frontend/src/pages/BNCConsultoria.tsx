import { Link } from 'react-router-dom';
import { useEffect } from 'react';

export default function BNCConsultoria() {
  // Adicionar meta tag de verificação do Facebook
  useEffect(() => {
    // Verificar se a meta tag já existe
    let metaTag = document.querySelector('meta[name="facebook-domain-verification"]');
    
    if (!metaTag) {
      // Criar e adicionar a meta tag
      metaTag = document.createElement('meta');
      metaTag.setAttribute('name', 'facebook-domain-verification');
      metaTag.setAttribute('content', 'se76b1cuuopprxdrquw37hsbxjeuyj');
      document.head.appendChild(metaTag);
    } else {
      // Atualizar se já existir
      metaTag.setAttribute('content', 'se76b1cuuopprxdrquw37hsbxjeuyj');
    }

    // Limpar ao desmontar o componente (opcional, mas mantém a tag para verificação)
    return () => {
      // Não removemos a meta tag ao sair da página, pois o Facebook precisa encontrá-la
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-gray-900">BNC Consultoria em IA</h1>
            </div>
            <nav className="hidden md:flex space-x-6">
              <a href="#solucoes" className="text-gray-700 hover:text-primary-600 transition-colors">Nossas Soluções</a>
              <a href="#quem-somos" className="text-gray-700 hover:text-primary-600 transition-colors">Quem Somos</a>
              <a href="#contato" className="text-gray-700 hover:text-primary-600 transition-colors">Fale Conosco</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Transforme Seu Negócio com Inteligência Artificial
          </h2>
          <p className="text-xl md:text-2xl mb-8 text-blue-100">
            Soluções personalizadas de IA para diversos setores do mercado brasileiro
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="#contato" 
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Agendar Diagnóstico Gratuito
            </a>
            <a 
              href="#solucoes" 
              className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
            >
              Conhecer Mais Soluções
            </a>
          </div>
        </div>
      </section>

      {/* Quem Somos */}
      <section id="quem-somos" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Quem Somos: Inovação e Expertise em Inteligência Artificial</h2>
          <div className="prose prose-lg max-w-none text-gray-700">
            <p className="mb-4">
              A BNC Consultoria em IA foi fundada com um propósito claro: democratizar o acesso à tecnologia de ponta em inteligência artificial para diversos setores do mercado brasileiro. Acreditamos que toda empresa, independentemente do porte, merece ter ao seu alcance ferramentas que transformam desafios em oportunidades.
            </p>
            <p>
              Nossa missão é criar soluções personalizadas que não apenas otimizam processos, mas que ampliam resultados de forma mensurável e sustentável. Atuamos com ética, transparência e foco absoluto no sucesso dos nossos clientes, construindo parcerias duradouras baseadas em confiança e resultados concretos.
            </p>
          </div>
        </div>
      </section>

      {/* Por Que IA */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Por Que a Inteligência Artificial é o Futuro dos Negócios?
          </h2>
          <p className="text-center text-gray-700 mb-12 max-w-3xl mx-auto">
            O mundo corporativo está passando por uma revolução tecnológica sem precedentes. A inteligência artificial não é mais uma promessa distante, mas uma realidade presente que está redefinindo a forma como as empresas operam e competem no mercado.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Automatização Inteligente</h3>
              <p className="text-gray-700">
                IA automatiza tarefas repetitivas e operacionais, reduzindo custos operacionais e aumentando a produtividade em até 40%, segundo estudos da McKinsey.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Decisões Baseadas em Dados</h3>
              <p className="text-gray-700">
                Permite decisões mais rápidas e precisas através de análise avançada de dados, identificando padrões invisíveis ao olho humano.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Vantagem Competitiva</h3>
              <p className="text-gray-700">
                Empresas que adotam IA ganham diferencial competitivo significativo, promovendo inovação contínua e adaptação ágil às mudanças do mercado.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Nossas Soluções */}
      <section id="solucoes" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">
            Nossas Soluções: IA e Agentes Inteligentes para Diversos Setores
          </h2>
          <p className="text-center text-gray-700 mb-12 max-w-3xl mx-auto">
            Desenvolvemos soluções customizadas de inteligência artificial que atendem às necessidades específicas de cada segmento. Nossa expertise abrange múltiplos setores, sempre com foco em resultados práticos e mensuráveis.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Autoescolas</h3>
              <ul className="text-gray-700 space-y-2">
                <li>• Sistemas de agendamento automatizado</li>
                <li>• Análise inteligente de desempenho dos alunos</li>
                <li>• Atendimento via chatbot disponível 24/7 para responder dúvidas e agilizar matrículas</li>
              </ul>
            </div>
            
            <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Jurídico</h3>
              <ul className="text-gray-700 space-y-2">
                <li>• Automação avançada de análise documental</li>
                <li>• Revisão de contratos com processamento de linguagem natural (NLP)</li>
                <li>• Suporte inteligente a decisões jurídicas estratégicas</li>
              </ul>
            </div>
            
            <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Construtoras</h3>
              <ul className="text-gray-700 space-y-2">
                <li>• Monitoramento inteligente de obras em tempo real</li>
                <li>• Previsão de riscos através de dados históricos</li>
                <li>• Otimização logística com IA preditiva para máxima eficiência</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">
            Como Funciona: Tecnologia de Ponta Integrada ao Seu Negócio
          </h2>
          
          <div className="mt-8 mb-8 bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Nossa Abordagem Tecnológica</h3>
            <p className="text-gray-700 mb-4">
              Utilizamos IA limitada (ANI - Artificial Narrow Intelligence) e agentes inteligentes especializados para executar tarefas específicas com precisão excepcional. Cada solução é desenhada para resolver desafios reais do seu negócio.
            </p>
            <p className="text-gray-700">
              Integramos as mais avançadas tecnologias disponíveis: machine learning para aprendizado contínuo, processamento de linguagem natural para compreensão de texto e fala, e automação robótica de processos (RPA) para otimização operacional.
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">01</div>
              <h3 className="font-semibold text-gray-900 mb-2">Análise de Necessidades</h3>
              <p className="text-sm text-gray-700">Mapeamento detalhado dos processos e identificação de oportunidades</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">02</div>
              <h3 className="font-semibold text-gray-900 mb-2">Desenvolvimento Personalizado</h3>
              <p className="text-sm text-gray-700">Criação de soluções sob medida usando tecnologias adequadas</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">03</div>
              <h3 className="font-semibold text-gray-900 mb-2">Integração Seamless</h3>
              <p className="text-sm text-gray-700">Implementação em plataformas intuitivas e fáceis de gerenciar</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">04</div>
              <h3 className="font-semibold text-gray-900 mb-2">Treinamento e Suporte</h3>
              <p className="text-sm text-gray-700">Capacitação da equipe e acompanhamento contínuo dos resultados</p>
            </div>
          </div>
        </div>
      </section>

      {/* Cases de Sucesso */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">
            Cases de Sucesso: Resultados Reais com a BNC Consultoria em IA
          </h2>
          <p className="text-center text-gray-700 mb-12 max-w-3xl mx-auto">
            Nada fala mais alto que resultados concretos. Conheça algumas histórias de transformação digital que ajudamos a construir, gerando impacto real e mensurável nos negócios dos nossos clientes.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Autoescola Teixeira</h3>
              <p className="text-gray-700 mb-2"><strong>Desafio:</strong> Atendimento manual sobrecarregado e dificuldade em gerenciar agendamentos.</p>
              <p className="text-gray-700 mb-2"><strong>Solução:</strong> Chatbot inteligente e sistema automatizado de gestão de alunos.</p>
              <p className="text-gray-700"><strong>Resultados:</strong> Redução de 30% no tempo de atendimento e aumento de 25% na satisfação dos alunos, medido por pesquisas NPS.</p>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Escritório Jurídico Felipe Santos</h3>
              <p className="text-gray-700 mb-2"><strong>Desafio:</strong> Análise manual de documentos consumia tempo excessivo da equipe.</p>
              <p className="text-gray-700 mb-2"><strong>Solução:</strong> Sistema de análise documental com NLP e revisão automatizada de contratos.</p>
              <p className="text-gray-700"><strong>Resultados:</strong> Diminuição de 40% no tempo de análise documental e redução significativa de erros humanos em revisões.</p>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Construtora Delta</h3>
              <p className="text-gray-700 mb-2"><strong>Desafio:</strong> Atrasos frequentes em cronogramas e dificuldade em prever riscos.</p>
              <p className="text-gray-700 mb-2"><strong>Solução:</strong> IA preditiva para otimização de cronogramas e monitoramento inteligente.</p>
              <p className="text-gray-700"><strong>Resultados:</strong> Evitou atrasos em 90% dos projetos, com economia média de R$ 150 mil por obra.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Diferencial */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">
            Nosso Diferencial: Atendimento Personalizado e Suporte Contínuo
          </h2>
          <p className="text-center text-gray-700 mb-12 max-w-3xl mx-auto">
            O que realmente nos diferencia no mercado não é apenas a tecnologia que utilizamos, mas a forma como nos relacionamos com nossos clientes. Entendemos que cada empresa é única, com desafios específicos que exigem soluções sob medida.
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Consultoria Dedicada</h3>
              <p className="text-sm text-gray-700">Equipe especializada para entender profundamente as necessidades específicas de cada cliente e desenhar a solução ideal.</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Treinamento Completo</h3>
              <p className="text-sm text-gray-700">Workshops práticos e programas de capacitação para garantir que sua equipe aproveite ao máximo as soluções implementadas.</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Suporte Técnico Ágil</h3>
              <p className="text-sm text-gray-700">Acompanhamento próximo com canal direto de comunicação e tempo de resposta otimizado para resolver qualquer questão.</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Evolução Constante</h3>
              <p className="text-sm text-gray-700">Atualizações regulares para acompanhar as evoluções tecnológicas e manter sua empresa sempre na vanguarda da inovação.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefícios */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">
            Benefícios para Sua Empresa
          </h2>
          <p className="text-center text-gray-700 mb-12 max-w-3xl mx-auto">
            Investir em inteligência artificial com a BNC Consultoria significa muito mais do que adotar tecnologia. É transformar fundamentalmente a forma como sua empresa opera, compete e cresce no mercado.
          </p>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-2xl">⚡</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Eficiência Operacional</h3>
                <p className="text-gray-700">Aumento significativo da eficiência operacional e redução de custos com processos mais ágeis e automatizados.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-2xl">😊</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Experiência do Cliente</h3>
                <p className="text-gray-700">Melhoria substancial na experiência do cliente com atendimento mais rápido, personalizado e disponível 24/7.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-2xl">🚀</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Agilidade nos Processos</h3>
                <p className="text-gray-700">Maior agilidade na execução de tarefas rotineiras, liberando sua equipe para focar em atividades estratégicas.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-2xl">📊</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Decisões Inteligentes</h3>
                <p className="text-gray-700">Tomada de decisão baseada em dados confiáveis e insights inteligentes gerados por análises preditivas avançadas.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Como Começar */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-4 text-center">
            Como Começar: Simples, Ágil e Seguro
          </h2>
          <p className="text-center text-blue-100 mb-12 max-w-3xl mx-auto">
            Dar o primeiro passo rumo à transformação digital da sua empresa é mais simples do que você imagina. Nosso processo foi desenhado para ser transparente, ágil e sem riscos, garantindo que você tenha total clareza desde o primeiro contato.
          </p>
          
          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-lg">
              <div className="text-3xl mb-3">🔍</div>
              <h3 className="text-lg font-semibold mb-2">Diagnóstico Gratuito</h3>
              <p className="text-sm text-blue-100">Realizamos um diagnóstico completo e sem custo para identificar as melhores oportunidades de aplicação de IA no seu negócio.</p>
            </div>
            
            <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-lg">
              <div className="text-3xl mb-3">📋</div>
              <h3 className="text-lg font-semibold mb-2">Proposta Personalizada</h3>
              <p className="text-sm text-blue-100">Elaboramos uma proposta detalhada com cronograma realista, metas claras e investimento transparente para sua aprovação.</p>
            </div>
            
            <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-lg">
              <div className="text-3xl mb-3">⚡</div>
              <h3 className="text-lg font-semibold mb-2">Implantação Rápida</h3>
              <p className="text-sm text-blue-100">Implementação ágil com acompanhamento próximo da nossa equipe e resultados mensuráveis desde as primeiras semanas.</p>
            </div>
            
            <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-lg">
              <div className="text-3xl mb-3">✅</div>
              <h3 className="text-lg font-semibold mb-2">Garantia de Resultados</h3>
              <p className="text-sm text-blue-100">Trabalhamos com métricas claras e compromisso com resultados. Seu sucesso é o nosso sucesso, e estamos ao seu lado em cada etapa da jornada de transformação digital.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contato */}
      <section id="contato" className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">
            Entre em Contato e Transforme Seu Negócio com a BNC Consultoria em IA
          </h2>
          <p className="text-center text-gray-700 mb-12">
            Estamos prontos para levar sua empresa ao próximo nível com soluções inteligentes de inteligência artificial. A transformação digital não precisa ser complexa ou arriscada quando você tem o parceiro certo ao seu lado.
          </p>
          
          <div className="bg-gray-50 p-8 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">Informações de Contato</h3>
            <div className="space-y-4 text-center">
              <div>
                <p className="text-gray-600 mb-1"><strong>E-mail:</strong></p>
                <a href="mailto:contato@bncconsultoria.com.br" className="text-blue-600 hover:text-blue-700">
                  contato@bncconsultoria.com.br
                </a>
              </div>
              <div>
                <p className="text-gray-600 mb-1"><strong>Telefone:</strong></p>
                <a href="tel:+5531999559719" className="text-blue-600 hover:text-blue-700">
                  (31) 99955-9719
                </a>
              </div>
              <div>
                <p className="text-gray-600 mb-1"><strong>Horário de Atendimento:</strong></p>
                <p className="text-gray-700">Segunda a Sexta, das 9h às 18h</p>
              </div>
            </div>
            
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="mailto:contato@bncconsultoria.com.br?subject=Agendar Diagnóstico Gratuito" 
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-center"
              >
                Agendar Diagnóstico Gratuito
              </a>
              <a 
                href="#solucoes" 
                className="bg-transparent border-2 border-blue-600 text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors text-center"
              >
                Conhecer Mais Soluções
              </a>
            </div>
          </div>
          
          <p className="text-center text-gray-600 mt-8 text-sm">
            A BNC Consultoria em IA é sua parceira estratégica para implementar inteligência artificial de forma prática, segura e com resultados comprovados. Junte-se às empresas que já estão na vanguarda da inovação tecnológica.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-400">© 2024 BNC Consultoria em IA. All Rights Reserved.</p>
            <p className="text-gray-500 text-sm mt-2">Made with ❤️</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

