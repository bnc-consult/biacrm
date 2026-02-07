import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  closestCorners,
  useSensor,
  useSensors,
  PointerSensor,
  useDroppable,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FiPlay, FiChevronUp, FiChevronDown, FiSettings, FiSearch } from 'react-icons/fi';

interface Lead {
  id: number;
  name: string;
  phone: string;
  email?: string;
  status: string;
  origin: string;
  created_at: string;
  user_name?: string;
  custom_data?: any;
  unread_count?: number;
  funnel_id?: number | null;
}

interface FunnelItem {
  id: number;
  name: string;
  statusOrder?: string[];
}

const normalizePhone = (phone?: string) => String(phone || '').replace(/\D/g, '');
const getInitials = (value: string) => {
  const parts = value.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

// Configuração base das colunas
const baseStatusColumns = [
  { id: 'novo_lead', label: 'Sem Atendimento', color: '#ef4444', count: 0, backendStatus: 'novo_lead' },
  { id: 'em_contato', label: 'Em Atendimento', color: '#3b82f6', count: 0, backendStatus: 'em_contato' },
  { id: 'visita_agendada', label: 'Visita Agendada', color: '#60a5fa', count: 0, backendStatus: 'proposta_enviada' },
  { id: 'visita_concluida', label: 'Visita Concluída', color: '#14b8a6', count: 0, backendStatus: 'fechamento', displayStatus: 'visita_concluida' },
  { id: 'proposta', label: 'Proposta', color: '#f97316', count: 0, backendStatus: 'perdido', displayStatus: 'proposta' },
  { id: 'venda_ganha', label: 'Venda Ganha', color: '#22c55e', count: 0, backendStatus: 'fechamento', displayStatus: 'venda_ganha' },
  { id: 'perdido', label: 'Perdido', color: '#f97316', count: 0, backendStatus: 'perdido' },
];

// Função para obter colunas ordenadas conforme configuração do funil
const getOrderedStatusColumns = (order?: string[]) => {
  if (!order || order.length === 0) {
    return baseStatusColumns;
  }
  const columnMap = new Map(baseStatusColumns.map(col => [col.id, col]));
  const ordered: typeof baseStatusColumns = [];
  const added = new Set<string>();
  order.forEach(statusId => {
    const column = columnMap.get(statusId);
    if (column) {
      ordered.push(column);
      added.add(statusId);
    }
  });
  baseStatusColumns.forEach(column => {
    if (!added.has(column.id)) {
      ordered.push(column);
    }
  });
  return ordered;
};

function LeadCard({
  lead,
  avatarUrl,
  isDraggingOver,
  onRename
}: {
  lead: Lead;
  avatarUrl?: string | null;
  isDraggingOver?: boolean;
  onRename?: (lead: Lead, nextName: string) => Promise<void>;
}) {
  const navigate = useNavigate();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id.toString() });
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState(lead.name || '');

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition || 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 1000 : 1,
    cursor: isDragging ? 'grabbing' : isEditing ? 'text' : 'grab',
    pointerEvents: isDragging ? 'none' : 'auto',
  };
  const unreadCount = lead.unread_count ?? 0;

  const getUserTimeZone = () => {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  };

  const parseLeadDate = (dateString: string) => {
    if (!dateString) return new Date(NaN);
    const hasTimezone = /[zZ]|[+-]\d{2}:\d{2}$/.test(dateString);
    if (hasTimezone) {
      return new Date(dateString);
    }
    const normalized = dateString.includes('T')
      ? dateString
      : dateString.replace(' ', 'T');
    return new Date(`${normalized}Z`);
  };

  const formatDate = (dateString: string) => {
    const date = parseLeadDate(dateString);
    if (Number.isNaN(date.getTime())) return dateString;
    const formatter = new Intl.DateTimeFormat('pt-BR', {
      timeZone: getUserTimeZone(),
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    return formatter.format(date).replace(',', ' -');
  };

  const handleViewLead = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/leads/${lead.id}`);
  };
  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDragging) return;
    setDraftName(lead.name || '');
    setIsEditing(true);
  };
  const handleCancelEdit = () => {
    setDraftName(lead.name || '');
    setIsEditing(false);
  };
  const handleSaveEdit = async () => {
    const trimmed = draftName.trim();
    if (!trimmed || trimmed === lead.name) {
      handleCancelEdit();
      return;
    }
    try {
      await onRename?.(lead, trimmed);
      setIsEditing(false);
    } catch (error) {
      console.error('Erro ao atualizar nome do lead:', error);
    }
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveEdit();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit();
    }
  };
  const dragAttributes = isEditing ? {} : attributes;
  const dragListeners = isEditing ? {} : listeners;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...dragAttributes}
      {...dragListeners}
      className={`bg-white rounded-lg shadow-sm p-4 mb-3 cursor-grab active:cursor-grabbing transition-all duration-300 ${
        isDragging 
          ? 'shadow-2xl scale-110 rotate-1 opacity-90' 
          : 'hover:shadow-md hover:scale-[1.02]'
      } ${isDraggingOver ? 'ring-2 ring-blue-400 ring-offset-2' : ''}`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-start gap-3 flex-1">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden border border-blue-200 flex-shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt={`Foto de ${lead.name}`} className="w-full h-full object-cover" />
            ) : (
              <span className="text-blue-700 text-xs font-semibold">
                {getInitials(lead.name || 'Lead')}
              </span>
            )}
          </div>
          <div className="flex-1">
            {isEditing ? (
              <input
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onBlur={handleSaveEdit}
                onKeyDown={handleKeyDown}
                autoFocus
                className="w-full px-2 py-1 border border-blue-300 rounded text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <h3
                onClick={handleStartEdit}
                className="font-semibold text-gray-900 text-sm mb-1 cursor-text"
              >
                {lead.name}
              </h3>
            )}
            <p className="text-xs text-gray-500 mb-1">{formatDate(lead.created_at)}</p>
            <p className="text-xs text-gray-400 line-through opacity-50">Texto oculto</p>
            {lead.user_name && (
              <p className="text-xs text-gray-600 mt-2 font-medium">{lead.user_name}</p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          <button 
            className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors"
            onClick={handleViewLead}
          >
            <FiPlay className="w-4 h-4" />
          </button>
          {unreadCount > 0 && (
            <span className="min-w-[24px] h-6 px-2 mt-1 rounded-full bg-red-500 text-white text-xs font-semibold flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusColumn({ 
  status, 
  leads,
  activeId,
  avatarByPhone,
  onRename
}: { 
  status: typeof baseStatusColumns[0]; 
  leads: Lead[];
  activeId: string | null;
  avatarByPhone: Record<string, string | null>;
  onRename: (lead: Lead, nextName: string) => Promise<void>;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: status.id,
  });

  return (
    <div 
      ref={setNodeRef} 
      className={`flex-1 min-w-[280px] bg-gray-50 rounded-lg p-4 transition-all duration-300 overflow-hidden ${
        isOver ? 'ring-2 ring-blue-500 ring-offset-2 bg-blue-50 scale-[1.02]' : ''
      }`}
    >
      {/* Column Header */}
      <div 
        className="text-white rounded-t-lg px-4 py-3 mb-4 font-semibold text-sm flex items-center justify-between"
        style={{ backgroundColor: status.color }}
      >
        <span>{status.label} ({leads.length})</span>
        <div className="flex flex-col gap-1">
          <FiChevronUp className="w-3 h-3 cursor-pointer opacity-80 hover:opacity-100" />
          <FiChevronDown className="w-3 h-3 cursor-pointer opacity-80 hover:opacity-100" />
        </div>
      </div>

      {/* Leads List */}
      <SortableContext
        items={leads.map(lead => lead.id.toString())}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2 max-h-[calc(100vh-250px)] overflow-y-auto overflow-x-hidden min-h-[100px]">
          {leads.map((lead) => {
            const phoneKey = normalizePhone(lead.phone);
            const avatarUrl = phoneKey ? avatarByPhone[phoneKey] : null;
            return (
              <LeadCard 
                key={lead.id} 
                lead={lead} 
                avatarUrl={avatarUrl}
                isDraggingOver={activeId === lead.id.toString()}
                onRename={onRename}
              />
            );
          })}
          {leads.length === 0 && (
            <div className={`text-center text-gray-400 text-sm py-8 transition-all duration-300 ${
              isOver ? 'text-blue-500 font-medium scale-105' : ''
            }`}>
              {isOver ? 'Solte aqui' : 'Nenhum lead nesta etapa'}
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export default function LeadsAndamento() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { funnelId } = useParams<{ funnelId?: string }>();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [statusColumns, setStatusColumns] = useState(getOrderedStatusColumns());
  const [whatsappAvatars, setWhatsappAvatars] = useState<Record<string, string | null>>({});
  const [funnels, setFunnels] = useState<FunnelItem[]>([]);
  const [activeFunnelId, setActiveFunnelId] = useState<number | null>(null);
  const [funnelName, setFunnelName] = useState('Funil 1');
  const [loadingFunnel, setLoadingFunnel] = useState(true);
  const [kanbanFilter, setKanbanFilter] = useState('');
  const defaultFunnelId = funnels.length > 0 ? Number(funnels[0].id) : null;
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 1, // Muito reduzido para máxima fluidez
      },
    })
  );

  const fetchFunnels = async () => {
    setLoadingFunnel(true);
    try {
      const response = await api.get('/funnels');
      const list = Array.isArray(response.data) ? response.data : [];
      setFunnels(list);
      const requestedId = funnelId ? Number(funnelId) : null;
      const active = requestedId
        ? list.find((item: FunnelItem) => Number(item.id) === requestedId)
        : list[0];
      if (active) {
        setActiveFunnelId(Number(active.id));
        setFunnelName(active.name || 'Funil');
        setStatusColumns(getOrderedStatusColumns(active.statusOrder));
      } else {
        setActiveFunnelId(null);
        setFunnelName('Funil 1');
        setStatusColumns(getOrderedStatusColumns());
      }
    } catch (error) {
      setFunnels([]);
      setActiveFunnelId(null);
      setFunnelName('Funil 1');
      setStatusColumns(getOrderedStatusColumns());
    } finally {
      setLoadingFunnel(false);
    }
  };

  useEffect(() => {
    fetchLeads();
    const refreshTimer = setInterval(fetchLeads, 5000);
    fetchFunnels();
    const handleCustomStorageChange = () => {
      fetchFunnels();
    };
    window.addEventListener('funnelOrderChanged', handleCustomStorageChange);
    
    // Listener para quando um lead é atualizado em outra tela (ex: LeadDetail)
    const handleLeadUpdated = () => {
      fetchLeads();
    };
    window.addEventListener('leadUpdated', handleLeadUpdated);
    
    return () => {
      window.removeEventListener('funnelOrderChanged', handleCustomStorageChange);
      window.removeEventListener('leadUpdated', handleLeadUpdated);
      clearInterval(refreshTimer);
    };
  }, []);

  useEffect(() => {
    fetchFunnels();
  }, [funnelId]);

  useEffect(() => {
    let hasActive = false;
    try {
      const saved = localStorage.getItem('whatsappIntegrations');
      if (!saved) return;
      const parsed = JSON.parse(saved);
      hasActive = Array.isArray(parsed) && parsed.some((integration: any) => integration.status === 'active');
    } catch (e) {
      console.error('Erro ao ler integração do WhatsApp:', e);
      return;
    }
    if (!hasActive) return;

    leads.forEach((lead) => {
      const phone = normalizePhone(lead.phone);
      if (!phone) return;
      if (Object.prototype.hasOwnProperty.call(whatsappAvatars, phone)) return;
      api.get('/integrations/whatsapp/profile-picture', { params: { phone: lead.phone } })
        .then((response) => {
          const url = response.data?.url || null;
          setWhatsappAvatars((prev) => ({ ...prev, [phone]: url }));
        })
        .catch(() => {
          setWhatsappAvatars((prev) => ({ ...prev, [phone]: null }));
        });
    });
  }, [leads, whatsappAvatars]);

  const fetchLeads = async () => {
    try {
      const response = await api.get('/leads');
      setLeads(response.data);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    // Adicionar classe ao body para prevenir seleção de texto durante o drag
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'grabbing';
  };

  const handleDragOver = (_event: DragOverEvent) => {
    // Este handler é usado para feedback visual durante o drag
    // A detecção de coluna é feita automaticamente pelo DndContext
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    // Resetar estilos do body sempre
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
    
    if (!over) {
      setTimeout(() => setActiveId(null), 100);
      return;
    }

    const leadId = parseInt(active.id as string);
    const overId = over.id as string;

    // Encontrar a coluna de destino
    let targetColumnId: string | null = null;

    // Se o over.id é uma coluna diretamente (soltou na área da coluna)
    const directColumn = statusColumns.find(col => col.id === overId);
    if (directColumn) {
      targetColumnId = directColumn.id;
    } else {
      // Se o over.id é um card, encontrar em qual coluna ele está
      // Precisamos encontrar a coluna pai do card
      const targetLead = leads.find(l => l.id.toString() === overId);
      if (targetLead) {
        const column = getColumnForLead(targetLead);
        if (column) {
          targetColumnId = column.id;
        }
      }
    }

    // Se não encontrou uma coluna válida, não fazer nada
    if (!targetColumnId) {
      setTimeout(() => setActiveId(null), 100);
      return;
    }

    // Verificar se o lead já está na coluna de destino
    const currentLead = leads.find(l => l.id === leadId);
    if (!currentLead) {
      setTimeout(() => setActiveId(null), 100);
      return;
    }

    const targetColumn = statusColumns.find(col => col.id === targetColumnId);
    if (!targetColumn) {
      setTimeout(() => setActiveId(null), 100);
      return;
    }

    // Se já está na mesma coluna, não fazer nada
    const currentColumn = getColumnForLead(currentLead);
    if (currentColumn?.id === targetColumn.id) {
      setTimeout(() => setActiveId(null), 100);
      return;
    }

    // Preparar dados para atualização
    const previousStatus = currentLead.status;
    const previousCustomData = currentLead.custom_data || {};
    
    // Se a coluna de destino tem displayStatus (visita_concluida ou venda_ganha),
    // precisamos armazenar isso no custom_data
    const newCustomData = { ...previousCustomData };
    if (targetColumn.displayStatus) {
      newCustomData.displayStatus = targetColumn.displayStatus;
    } else {
      // Se não tem displayStatus, remover do custom_data
      delete newCustomData.displayStatus;
    }

    // Pequeno delay para permitir que a animação de soltar seja visível
    setTimeout(() => {
      // Atualizar o estado local primeiro para feedback visual imediato com animação
    setLeads(prevLeads =>
      prevLeads.map(lead =>
        lead.id === leadId 
          ? { ...lead, status: targetColumn.backendStatus, custom_data: newCustomData } 
          : lead
      )
    );
      // Resetar activeId após um pequeno delay para permitir animação
      setActiveId(null);
    }, 200);

    try {
      // Atualizar o lead no backend
      await api.put(`/leads/${leadId}`, { 
        status: targetColumn.backendStatus,
        custom_data: newCustomData
      });
      
      // Disparar evento customizado para atualizar outras telas (ex: LeadDetail)
      window.dispatchEvent(new CustomEvent('leadUpdated', { detail: { leadId } }));
    } catch (error) {
      console.error('Error updating lead status:', error);
      // Em caso de erro, reverter o estado local
      setLeads(prevLeads =>
        prevLeads.map(lead =>
          lead.id === leadId 
            ? { ...lead, status: previousStatus, custom_data: previousCustomData } 
            : lead
        )
      );
      // Recarregar os leads para manter a consistência
      fetchLeads();
      setTimeout(() => setActiveId(null), 100);
    }
  };

  const handleRenameLead = async (lead: Lead, nextName: string) => {
    const trimmed = nextName.trim();
    if (!trimmed || trimmed === lead.name) return;
    const response = await api.put(`/leads/${lead.id}`, { name: trimmed });
    setLeads(prev => prev.map(item => (item.id === lead.id ? { ...item, ...response.data } : item)));
    window.dispatchEvent(new CustomEvent('leadUpdated', { detail: { leadId: lead.id } }));
  };

  // Função auxiliar para encontrar a coluna de um lead
  const getColumnForLead = (lead: Lead) => {
    // Se o lead tem status 'fechamento', verificar o displayStatus no custom_data
    if (lead.status === 'fechamento') {
      const displayStatus = lead.custom_data?.displayStatus;
      if (displayStatus === 'visita_concluida') {
        return statusColumns.find(col => col.id === 'visita_concluida');
      } else if (displayStatus === 'venda_ganha') {
        return statusColumns.find(col => col.id === 'venda_ganha');
      }
      // Se não tem displayStatus definido, usar 'venda_ganha' como padrão
      return statusColumns.find(col => col.id === 'venda_ganha');
    }
    
    // Se o lead tem status 'perdido', verificar o displayStatus no custom_data
    if (lead.status === 'perdido') {
      const displayStatus = lead.custom_data?.displayStatus;
      if (displayStatus === 'proposta') {
        return statusColumns.find(col => col.id === 'proposta');
      }
      // Se não tem displayStatus definido, usar 'perdido' como padrão
      return statusColumns.find(col => col.id === 'perdido');
    }
    
    // Para outros status, encontrar a coluna correspondente
    return statusColumns.find(col => col.backendStatus === lead.status);
  };

  const getLeadsByStatus = (statusId: string) => {
    // Encontrar a coluna
    const column = statusColumns.find(col => col.id === statusId);
    if (!column) return [];
    
    // Filtrar leads pelo status do backend e displayStatus se aplicável
    let filteredLeads = leads.filter(lead => {
      if (activeFunnelId) {
        if (lead.funnel_id && Number(lead.funnel_id) === Number(activeFunnelId)) {
          // ok
        } else if (!lead.funnel_id && defaultFunnelId && Number(activeFunnelId) === Number(defaultFunnelId)) {
          // leads sem funil vão para o primeiro funil
        } else {
          return false;
        }
      }
      // Primeiro verificar se o status do backend corresponde
      if (lead.status !== column.backendStatus) {
        return false;
      }
      
      // Se a coluna tem um displayStatus específico (visita_concluida, venda_ganha ou proposta),
      // verificar se o lead tem o mesmo displayStatus no custom_data
      if (column.displayStatus) {
        const leadDisplayStatus = lead.custom_data?.displayStatus;
        // Se o lead não tem displayStatus definido e estamos na coluna venda_ganha,
        // incluir o lead (comportamento padrão)
        if (!leadDisplayStatus && statusId === 'venda_ganha') {
          return true;
        }
        // Caso contrário, verificar se o displayStatus corresponde
        return leadDisplayStatus === column.displayStatus;
      }
      
      // Para colunas sem displayStatus, verificar se o lead também não tem displayStatus
      // (para evitar que leads com displayStatus apareçam em colunas que não o esperam)
      const leadDisplayStatus = lead.custom_data?.displayStatus;
      if (leadDisplayStatus) {
        // Se o lead tem displayStatus mas a coluna não espera um, não incluir
        return false;
      }
      
      // Para outras colunas sem displayStatus, apenas verificar o backendStatus
      return true;
    });

    const term = kanbanFilter.trim().toLowerCase();
    if (term) {
      filteredLeads = filteredLeads.filter((lead) => {
        const customData = lead.custom_data || {};
        const candidates = [
          lead.name,
          lead.phone,
          lead.email,
          customData?.cidade,
          customData?.interesse
        ]
          .filter(Boolean)
          .map((value: any) => String(value).toLowerCase());
        return candidates.some((value: string) => value.includes(term));
      });
    }
    
    // Garantir que não há duplicatas (por ID)
    const uniqueLeads = filteredLeads.filter((lead, index, self) =>
      index === self.findIndex(l => l.id === lead.id)
    );
    
    return uniqueLeads;
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700">Carregando andamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-full" style={{ overflow: activeId ? 'hidden' : 'visible' }}>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <h1 className="text-2xl font-bold text-gray-900 whitespace-nowrap">{funnelName}</h1>
          <div className="relative flex-1">
            <FiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={kanbanFilter}
              onChange={(e) => setKanbanFilter(e.target.value)}
              placeholder="Pesquisar..."
              className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        {user?.role === 'admin' && (
          <button
            onClick={() => {
              const param = activeFunnelId ? `?funnelId=${activeFunnelId}` : '';
              navigate(`/funnel-config${param}`);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            disabled={loadingFunnel}
          >
            <FiSettings className="w-4 h-4" />
            <span>Configurar funil</span>
          </button>
        )}
      </div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        autoScroll={{ threshold: { x: 0.2, y: 0.2 } }}
      >
        <div className="flex gap-4 pb-4 overflow-x-auto" style={{ overflowY: 'hidden' }}>
          {statusColumns.map((status) => {
            const columnLeads = getLeadsByStatus(status.id);
            return (
              <div
                key={status.id}
                data-status={status.id}
                className="flex-1 min-w-[280px] flex-shrink-0"
              >
                <StatusColumn
                  status={{ ...status, count: columnLeads.length }}
                  leads={columnLeads}
                  activeId={activeId}
                  avatarByPhone={whatsappAvatars}
                  onRename={handleRenameLead}
                />
              </div>
            );
          })}
        </div>
      </DndContext>
    </div>
  );
}

