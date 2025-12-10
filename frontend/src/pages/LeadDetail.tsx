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
  FiFileText,
  FiX
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
  custom_data?: any;
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

// Função para obter o status de exibição baseado no status do backend e displayStatus
const getDisplayStatus = (lead: Lead): string => {
  // Se o status é 'fechamento', verificar o displayStatus no custom_data
  if (lead.status === 'fechamento') {
    const displayStatus = lead.custom_data?.displayStatus;
    if (displayStatus === 'visita_concluida') {
      return 'visita_concluida';
    } else if (displayStatus === 'venda_ganha') {
      return 'venda_ganha';
    }
    // Se não tem displayStatus definido, usar 'venda_ganha' como padrão
    return 'venda_ganha';
  }
  
  // Se o status é 'perdido', verificar o displayStatus no custom_data
  if (lead.status === 'perdido') {
    const displayStatus = lead.custom_data?.displayStatus;
    if (displayStatus === 'proposta') {
      return 'proposta';
    }
    // Se não tem displayStatus definido, usar 'finalizado' como padrão
    return 'finalizado';
  }
  
  // Mapear os status do backend para os status de exibição
  const statusMap: Record<string, string> = {
    'novo_lead': 'sem_atendimento',
    'em_contato': 'em_atendimento',
    'proposta_enviada': 'visita_agendada',
  };
  
  return statusMap[lead.status] || lead.status;
};

// Função para converter status de exibição para status do backend
const getBackendStatus = (displayStatus: string, customData?: any): { status: string; custom_data?: any } => {
  const custom_data = customData || {};
  
  switch (displayStatus) {
    case 'sem_atendimento':
      return { status: 'novo_lead' };
    case 'em_atendimento':
      return { status: 'em_contato' };
    case 'visita_agendada':
      return { status: 'proposta_enviada' };
    case 'visita_concluida':
      return { 
        status: 'fechamento',
        custom_data: { ...custom_data, displayStatus: 'visita_concluida' }
      };
    case 'venda_ganha':
      return { 
        status: 'fechamento',
        custom_data: { ...custom_data, displayStatus: 'venda_ganha' }
      };
    case 'proposta':
      return { 
        status: 'perdido',
        custom_data: { ...custom_data, displayStatus: 'proposta' }
      };
    case 'finalizado':
      return { status: 'perdido' };
    default:
      return { status: displayStatus };
  }
};

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [scheduledContact, setScheduledContact] = useState('');
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);

  useEffect(() => {
    if (id && !isNaN(parseInt(id))) {
      fetchLeadDetail();
    } else {
      setLoading(false);
    }
  }, [id]);

  const parseLeadData = (leadData: any): Lead => {
    // Parse custom_data se for string
    let custom_data = leadData.custom_data;
    if (custom_data && typeof custom_data === 'string') {
      try {
        custom_data = JSON.parse(custom_data);
      } catch (e) {
        custom_data = {};
      }
    }
    return { ...leadData, custom_data };
  };

  const fetchLeadDetail = async () => {
    try {
      // Primeiro tenta buscar o lead específico
      try {
        const response = await api.get(`/leads/${id}`);
        const parsedLead = parseLeadData(response.data);
        setLead(parsedLead);
        
        const displayStatus = getDisplayStatus(parsedLead);
        const statusLabel = statusConfig[displayStatus]?.label || 'Sem Atendimento';
        
        // Simular timeline
        setTimeline([
          {
            id: 1,
            date: parsedLead.created_at,
            description: `Lead ${parsedLead.name} entrou no status ${statusLabel}`,
            source: 'SISTEMA',
          },
          {
            id: 2,
            date: parsedLead.created_at,
            description: `Importação: O cliente foi adicionado em: ${formatDateTime(parsedLead.created_at)}`,
            source: 'SISTEMA',
          },
        ]);
      } catch (error: any) {
        // Se não encontrar, busca na lista de leads
        if (error.response?.status === 404) {
          const leadsResponse = await api.get('/leads');
          const foundLead = leadsResponse.data.find((l: Lead) => l.id === parseInt(id || '0'));
          if (foundLead) {
            const parsedLead = parseLeadData(foundLead);
            setLead(parsedLead);
            
            const displayStatus = getDisplayStatus(parsedLead);
            const statusLabel = statusConfig[displayStatus]?.label || 'Sem Atendimento';
            
            setTimeline([
              {
                id: 1,
                date: parsedLead.created_at,
                description: `Lead ${parsedLead.name} entrou no status ${statusLabel}`,
                source: 'SISTEMA',
              },
              {
                id: 2,
                date: parsedLead.created_at,
                description: `Importação: O cliente foi adicionado em: ${formatDateTime(parsedLead.created_at)}`,
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

  const handleStatusChange = async (displayStatus: string) => {
    if (!lead) return;
    
    try {
      // Converter status de exibição para status do backend
      const backendData = getBackendStatus(displayStatus, lead.custom_data);
      
      // Atualizar no backend
      const response = await api.put(`/leads/${lead.id}`, {
        status: backendData.status,
        custom_data: backendData.custom_data
      });
      
      // Parsear e atualizar o lead com os dados retornados
      const parsedLead = parseLeadData(response.data);
      setLead(parsedLead);
      
      // Disparar evento customizado para atualizar outras telas (como Andamento)
      window.dispatchEvent(new CustomEvent('leadUpdated', { detail: { leadId: lead.id } }));
      
      // Adicionar evento à timeline
      setTimeline(prev => [
        {
          id: Date.now(),
          date: new Date().toISOString(),
          description: `Status alterado para: ${statusConfig[displayStatus]?.label || displayStatus}`,
          source: 'USUÁRIO',
        },
        ...prev
      ]);
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

  const handleAddNote = async () => {
    if (!lead) return;
    
    setNoteError(null);
    
    if (!noteText.trim()) {
      setNoteError('Por favor, digite uma nota');
      return;
    }

    setIsSavingNote(true);
    try {
      // Se já existe nota, adicionar a nova nota com quebra de linha
      const currentNotes = lead.notes || '';
      const newNotes = currentNotes 
        ? `${currentNotes}\n\n[${formatDateTime(new Date().toISOString())}] ${noteText.trim()}`
        : `[${formatDateTime(new Date().toISOString())}] ${noteText.trim()}`;

      const response = await api.put(`/leads/${lead.id}`, {
        notes: newNotes
      });

      setLead({ ...lead, notes: response.data.notes });
      setNoteText('');
      setShowNoteModal(false);
      setNoteError(null);
      
      // Atualizar timeline
      setTimeline(prev => [
        {
          id: Date.now(),
          date: new Date().toISOString(),
          description: `Nota adicionada: ${noteText.trim()}`,
          source: 'USUÁRIO',
        },
        ...prev
      ]);
    } catch (error: any) {
      console.error('Erro ao adicionar nota:', error);
      setNoteError(error.response?.data?.message || 'Erro ao salvar nota. Tente novamente.');
    } finally {
      setIsSavingNote(false);
    }
  };

  const formatNotes = (notes?: string) => {
    if (!notes) return [];
    return notes.split('\n\n').filter(note => note.trim());
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

  // Obter o status de exibição baseado no status do backend
  const displayStatus = getDisplayStatus(lead);
  const currentStatus = statusConfig[displayStatus] || statusConfig.sem_atendimento;

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
                  <div className="mt-1 space-y-2">
                    {lead.notes ? (
                      <div className="space-y-2">
                        {formatNotes(lead.notes).map((note, index) => (
                          <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{note}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">Nenhuma nota adicionada ainda.</p>
                    )}
                    <button 
                      onClick={() => setShowNoteModal(true)}
                      className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
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
                  <button 
                    onClick={() => setShowNoteModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
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
                {statusOptions.map((status) => {
                  const isSelected = displayStatus === status.id;
                  return (
                    <button
                      key={status.id}
                      onClick={() => handleStatusChange(status.id)}
                      className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                        isSelected
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
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Adicionar Nota */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Adicionar Nota</h2>
              <button
                onClick={() => {
                  setShowNoteModal(false);
                  setNoteText('');
                  setNoteError(null);
                }}
                disabled={isSavingNote}
                className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {noteError && (
                <div className="mb-4 p-4 bg-red-50 text-red-800 rounded-lg border border-red-200">
                  <span className="text-sm font-medium">{noteError}</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nota
                  </label>
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Digite sua nota aqui..."
                    rows={6}
                    disabled={isSavingNote}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    A nota será salva com data e hora automaticamente.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-4 p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowNoteModal(false);
                  setNoteText('');
                  setNoteError(null);
                }}
                disabled={isSavingNote}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddNote}
                disabled={isSavingNote || !noteText.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
              >
                {isSavingNote && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                {isSavingNote ? 'Salvando...' : 'Salvar Nota'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

