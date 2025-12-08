import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import {
  FiPhone,
  FiMessageCircle,
  FiMail,
  FiEye,
  FiEdit,
  FiTrash2,
  FiPlus,
  FiCalendar,
  FiTrendingUp,
  FiMic,
  FiAlertTriangle,
  FiFileText
} from 'react-icons/fi';

interface Lead {
  id: number;
  name: string;
  phone: string;
  email?: string;
  status: string;
  origin: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
  product?: string;
}

interface TimelineEvent {
  id: number;
  date: string;
  description: string;
  source: string;
}

const statusOptions = [
  { id: 'em_atendimento', label: 'Em Atendimento', color: '#3b82f6' },
  { id: 'visita_concluida', label: 'Visita Concluída', color: '#14b8a6' },
  { id: 'visita_agendada', label: 'Visita Agendada', color: '#60a5fa' },
  { id: 'proposta', label: 'Proposta', color: '#f97316' },
  { id: 'venda_ganha', label: 'Venda Ganha', color: '#22c55e' },
  { id: 'finalizado', label: 'Finalizado', color: '#1f2937' },
];

const statusConfig: Record<string, { label: string; color: string }> = {
  sem_atendimento: { label: 'Sem Atendimento', color: '#ec4899' },
  em_atendimento: { label: 'Em Atendimento', color: '#3b82f6' },
  visita_concluida: { label: 'Visita Concluída', color: '#14b8a6' },
  visita_agendada: { label: 'Visita Agendada', color: '#60a5fa' },
  proposta: { label: 'Proposta', color: '#f97316' },
  venda_ganha: { label: 'Venda Ganha', color: '#22c55e' },
  finalizado: { label: 'Finalizado', color: '#1f2937' },
};

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  // const navigate = useNavigate();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [scheduledContact, setScheduledContact] = useState('');

  useEffect(() => {
    if (id && !isNaN(parseInt(id))) {
      fetchLeadDetail();
    } else {
      setLoading(false);
    }
  }, [id]);

  const fetchLeadDetail = async () => {
    try {
      // Primeiro tenta buscar o lead específico
      try {
        const response = await api.get(`/leads/${id}`);
        setLead(response.data);
        
        // Simular timeline
        setTimeline([
          {
            id: 1,
            date: response.data.created_at,
            description: `Lead ${response.data.name} entrou no status ${statusConfig[response.data.status]?.label || 'Sem Atendimento'}`,
            source: 'SISTEMA',
          },
          {
            id: 2,
            date: response.data.created_at,
            description: `Importação: O cliente foi adicionado em: ${formatDateTime(response.data.created_at)}`,
            source: 'SISTEMA',
          },
        ]);
      } catch (error: any) {
        // Se não encontrar, busca na lista de leads
        if (error.response?.status === 404) {
          const leadsResponse = await api.get('/leads');
          const foundLead = leadsResponse.data.find((l: Lead) => l.id === parseInt(id || '0'));
          if (foundLead) {
            setLead(foundLead);
            setTimeline([
              {
                id: 1,
                date: foundLead.created_at,
                description: `Lead ${foundLead.name} entrou no status ${statusConfig[foundLead.status]?.label || 'Sem Atendimento'}`,
                source: 'SISTEMA',
              },
              {
                id: 2,
                date: foundLead.created_at,
                description: `Importação: O cliente foi adicionado em: ${formatDateTime(foundLead.created_at)}`,
                source: 'SISTEMA',
              },
            ]);
          } else {
            console.error('Lead not found');
          }
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error('Error fetching lead detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const months = [
      'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
      'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
    ];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!lead) return;
    try {
      await api.put(`/leads/${lead.id}`, { status: newStatus });
      setLead({ ...lead, status: newStatus });
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleWhatsApp = () => {
    if (lead) {
      const message = encodeURIComponent(`Olá ${lead.name}, tudo bem?`);
      window.open(`https://wa.me/${lead.phone.replace(/\D/g, '')}?text=${message}`, '_blank');
    }
  };

  if (loading || !lead) {
    return (
      <div className="p-8 flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700">Carregando detalhes do lead...</p>
        </div>
      </div>
    );
  }

  const currentStatus = statusConfig[lead.status] || statusConfig.sem_atendimento;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8">
        {/* Lead Header */}
        <div className="bg-blue-600 text-white rounded-lg p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold mb-2">{lead.name}</h1>
              <div className="text-sm text-blue-100 space-y-1">
                <p>Criado em: {formatDate(lead.created_at)} às {formatTime(lead.created_at)}</p>
                <p>Última conversão em: {formatDate(lead.updated_at || lead.created_at)} às {formatTime(lead.updated_at || lead.created_at)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-2 hover:bg-blue-700 rounded-lg transition-colors">
                <FiPhone className="w-5 h-5" />
              </button>
              <button 
                onClick={handleWhatsApp}
                className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
              >
                <FiMessageCircle className="w-5 h-5" />
              </button>
              <button className="p-2 hover:bg-blue-700 rounded-lg transition-colors">
                <FiMail className="w-5 h-5" />
              </button>
              <button className="p-2 hover:bg-blue-700 rounded-lg transition-colors">
                <FiEye className="w-5 h-5" />
              </button>
              <button className="p-2 hover:bg-blue-700 rounded-lg transition-colors">
                <FiEdit className="w-5 h-5" />
              </button>
              <button className="p-2 hover:bg-blue-700 rounded-lg transition-colors">
                <FiTrash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Detalhes da conversão */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Detalhes da conversão</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Origem</label>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-sm text-gray-900">Produto</span>
                    <span className="text-sm text-gray-500">•</span>
                    <div className="flex items-center gap-1">
                      <FiFileText className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-900">Importação</span>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Notas</label>
                  <div className="mt-1 flex items-center gap-2 text-gray-500">
                    <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                      <FiPlus className="w-4 h-4" />
                      <span className="text-sm">Adicionar nota</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Status de atendimento */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Status de atendimento</h2>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Sem agendamento de contato.</p>
                <div>
                  <span className="text-sm font-medium text-gray-700">Etapa do funil: </span>
                  <span 
                    className="px-3 py-1 rounded-full text-xs font-medium"
                    style={{ backgroundColor: `${currentStatus.color}20`, color: currentStatus.color }}
                  >
                    {currentStatus.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Campos personalizados */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Campos personalizados</h2>
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                    <span className="text-white font-bold text-sm">S</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">Smart Broker</span>
                </div>
                <p className="text-sm text-gray-600">
                  Análise inteligente de atendimento
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Ainda não temos informações sobre o perfil do lead.
                </p>
              </div>
            </div>

            {/* Próxima Ação Recomendada */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <FiTrendingUp className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-2">Próxima Ação Recomendada</h3>
                  <p className="text-sm text-gray-700">
                    Realize uma ligação para entender suas necessidades. Com as informações da conversa, poderemos gerar um primeiro resumo e a sugestão de ação.
                  </p>
                </div>
              </div>
            </div>

            {/* Linha do tempo */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Linha do tempo</h2>
              <div className="space-y-4">
                {timeline.map((event) => (
                  <div key={event.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      <div className="w-0.5 h-full bg-gray-200 mt-1"></div>
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">{event.description}</span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                          {event.source}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {formatDate(event.date)} às {formatTime(event.date)}
                      </p>
                    </div>
                  </div>
                ))}
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200">
                  <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    <FiMic className="w-4 h-4" />
                    <span className="text-sm">+ Adicionar nota</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Alert */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <FiAlertTriangle className="w-5 h-5 text-orange-600" />
                <span className="text-sm font-medium text-orange-900">
                  ▲ Lead sem ação agendada
                </span>
              </div>
            </div>

            {/* Programar contato */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-sm font-bold text-gray-900 mb-3">Programar contato</h3>
              <div className="relative">
                <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="datetime-local"
                  value={scheduledContact}
                  onChange={(e) => setScheduledContact(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Alterar status do lead */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-sm font-bold text-gray-900 mb-4">Alterar status do lead</h3>
              <div className="space-y-2">
                {statusOptions.map((status) => (
                  <button
                    key={status.id}
                    onClick={() => handleStatusChange(status.id)}
                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                      lead.status === status.id
                        ? 'bg-blue-50 border-2 border-blue-600'
                        : 'border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div
                      className="w-4 h-4 rounded flex-shrink-0"
                      style={{ backgroundColor: status.color }}
                    />
                    <span className="text-sm font-medium text-gray-900">{status.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

