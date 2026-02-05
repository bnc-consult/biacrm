import { useEffect, useState } from 'react';
import api from '../services/api';
import { FiCpu, FiSend } from 'react-icons/fi';

type Message = { role: 'user' | 'assistant'; content: string };
type OpenAiIntegration = {
  id: number;
  title: string;
  model?: string;
  status: 'active' | 'inactive';
  api_key_masked?: string | null;
};

export default function AiAssistant() {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [integrations, setIntegrations] = useState<OpenAiIntegration[]>([]);
  const [integrationLoading, setIntegrationLoading] = useState(true);
  const [integrationError, setIntegrationError] = useState<string | null>(null);
  const fetchIntegrations = async () => {
    setIntegrationLoading(true);
    setIntegrationError(null);
    try {
      const response = await api.get('/ai/integrations');
      setIntegrations(response.data?.integrations || []);
    } catch (err: any) {
      console.error('Erro ao carregar integrações OpenAI:', err);
      setIntegrationError(err?.response?.data?.message || 'Erro ao carregar integrações OpenAI.');
    } finally {
      setIntegrationLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const activeIntegration = integrations.find((item) => item.status === 'active') || null;

  const handleAsk = async () => {
    const trimmed = question.trim();
    if (!trimmed || loading) return;
    if (!activeIntegration) {
      setError('Integre uma IA para usar a inteligência artificial.');
      return;
    }
    setError(null);
    setQuestion('');
    const nextHistory: Message[] = [...messages, { role: 'user', content: trimmed }];
    setMessages(nextHistory);
    setLoading(true);
    try {
      const response = await api.post('/ai/ask', {
        question: trimmed,
        history: nextHistory.slice(-6)
      });
      const answer = response.data?.answer || 'Não foi possível gerar a resposta.';
      setMessages((prev) => [...prev, { role: 'assistant', content: answer }]);
    } catch (err: any) {
      console.error('Erro ao consultar IA:', err);
      setError(err?.response?.data?.message || 'Erro ao consultar a IA.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-full">
      <div className="mb-6 flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center">
          <FiCpu className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">BIA Inteligência</h1>
          <p className="text-sm text-gray-600">
            Pergunte qualquer coisa sobre os leads cadastrados e receba respostas rápidas.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="space-y-4">
          {integrationLoading ? (
            <div className="text-sm text-gray-500">Carregando integração de IA...</div>
          ) : activeIntegration ? (
            <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">
              Integração ativa: {activeIntegration.title} ({activeIntegration.model || 'gpt-4o-mini'}).
            </div>
          ) : (
            <div className="text-sm text-orange-700 bg-orange-50 border border-orange-200 rounded-lg p-3">
              Integração de IA não configurada. Acesse a página de integrações para conectar a IA desejada.
            </div>
          )}
          <div className="text-sm text-gray-500">
            Exemplos: “Quantos leads chegaram esta semana?”, “Quais são as origens mais frequentes?”,
            “Liste os leads mais recentes com status proposta.”
          </div>

          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 max-h-[420px] overflow-y-auto">
            {messages.length === 0 ? (
              <div className="text-sm text-gray-500">Faça sua primeira pergunta acima.</div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg, idx) => (
                  <div
                    key={`${msg.role}-${idx}`}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] px-4 py-2 rounded-lg text-sm ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-800'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="text-sm text-gray-500">A IA está pensando...</div>
                )}
              </div>
            )}
          </div>

          {integrationError && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
              {integrationError}
            </div>
          )}
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
              {error}
            </div>
          )}

          <div className="flex items-end gap-3">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={3}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Digite sua pergunta sobre os leads..."
              disabled={!activeIntegration}
            />
            <button
              onClick={handleAsk}
              disabled={loading || !question.trim() || !activeIntegration}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <FiSend className="w-4 h-4" />
              Perguntar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
