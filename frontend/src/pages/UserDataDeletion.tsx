import { Link } from 'react-router-dom';

export default function UserDataDeletion() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-8 md:p-12">
        <div className="mb-8">
          <Link to="/login" className="text-primary-600 hover:text-primary-700 mb-4 inline-block">
            ← Voltar para o login
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Exclusão de Dados do Usuário</h1>
          <p className="text-gray-600">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
        </div>

        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Como solicitar a exclusão</h2>
            <p className="text-gray-700 mb-4">
              Você pode solicitar a exclusão dos seus dados pessoais enviando um email para:
              <a
                href="mailto:privacidade@biacrm.com"
                className="text-primary-600 hover:text-primary-700 ml-1"
              >
                privacidade@biacrm.com
              </a>
            </p>
            <p className="text-gray-700 mb-4">
              No email, informe obrigatoriamente:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2 ml-4">
              <li><strong>Nome completo</strong></li>
              <li><strong>Email da conta</strong> usada no BIA CRM</li>
              <li><strong>Assunto:</strong> "Exclusão de Dados - BIA CRM"</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Prazo de atendimento</h2>
            <p className="text-gray-700 mb-4">
              Após o recebimento do pedido, realizaremos a exclusão dos dados em até 30 dias.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. O que será excluído</h2>
            <p className="text-gray-700 mb-4">
              A exclusão inclui dados da conta, informações de leads e integrações vinculadas.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Exceções legais</h2>
            <p className="text-gray-700 mb-4">
              Alguns dados podem ser mantidos para cumprimento de obrigações legais, regulatórias ou
              prevenção a fraudes, quando aplicável.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
