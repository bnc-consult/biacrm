import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { FiPlay, FiChevronUp, FiChevronDown } from 'react-icons/fi';

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
}

// Configuração base das colunas
const baseStatusColumns = [
  { id: 'novo_lead', label: 'Sem Atendimento', color: '#ef4444', count: 0, backendStatus: 'novo_lead' },
  { id: 'em_contato', label: 'Em Atendimento', color: '#3b82f6', count: 0, backendStatus: 'em_contato' },
  { id: 'visita_agendada', label: 'Visita Agendada', color: '#60a5fa', count: 0, backendStatus: 'proposta_enviada' },
  { id: 'visita_concluida', label: 'Visita Concluída', color: '#14b8a6', count: 0, backendStatus: 'fechamento', displayStatus: 'visita_concluida' },
  { id: 'venda_ganha', label: 'Venda Ganha', color: '#22c55e', count: 0, backendStatus: 'fechamento', displayStatus: 'venda_ganha' },
  { id: 'perdido', label: 'Perdido', color: '#f97316', count: 0, backendStatus: 'perdido' },
];

// Função para obter colunas ordenadas conforme configuração do funil
const getOrderedStatusColumns = () => {
  const savedOrder = localStorage.getItem('funnelStatusOrder');
  if (savedOrder) {
    try {
      const order: string[] = JSON.parse(savedOrder);
      // Criar um mapa das colunas por ID
      const columnMap = new Map(baseStatusColumns.map(col => [col.id, col]));
      
      // Ordenar conforme a ordem salva, mantendo colunas não configuradas no final
      const ordered: typeof baseStatusColumns = [];
      const added = new Set<string>();
      
      // Adicionar colunas na ordem salva
      order.forEach(statusId => {
        const column = columnMap.get(statusId);
        if (column) {
          ordered.push(column);
          added.add(statusId);
        }
      });
      
      // Adicionar colunas que não estavam na ordem salva
      baseStatusColumns.forEach(column => {
        if (!added.has(column.id)) {
          ordered.push(column);
        }
      });
      
      return ordered;
    } catch (e) {
      console.error('Error loading saved status order:', e);
    }
  }
  return baseStatusColumns;
};

function LeadCard({ lead, isDraggingOver }: { lead: Lead; isDraggingOver?: boolean }) {
  const navigate = useNavigate();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id.toString() });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition || 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 1000 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
    pointerEvents: isDragging ? 'none' : 'auto',
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} - ${hours}:${minutes}`;
  };

  const handleViewLead = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/leads/${lead.id}`);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white rounded-lg shadow-sm p-4 mb-3 cursor-grab active:cursor-grabbing transition-all duration-300 ${
        isDragging 
          ? 'shadow-2xl scale-110 rotate-1 opacity-90' 
          : 'hover:shadow-md hover:scale-[1.02]'
      } ${isDraggingOver ? 'ring-2 ring-blue-400 ring-offset-2' : ''}`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-sm mb-1">{lead.name}</h3>
          <p className="text-xs text-gray-500 mb-1">{formatDate(lead.created_at)}</p>
          <p className="text-xs text-gray-400 line-through opacity-50">Texto oculto</p>
          {lead.user_name && (
            <p className="text-xs text-gray-600 mt-2 font-medium">{lead.user_name}</p>
          )}
        </div>
        <button 
          className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors flex-shrink-0"
          onClick={handleViewLead}
        >
          <FiPlay className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function StatusColumn({ 
  status, 
  leads,
  activeId 
}: { 
  status: typeof baseStatusColumns[0]; 
  leads: Lead[];
  activeId: string | null;
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
          {leads.map((lead) => (
            <LeadCard 
              key={lead.id} 
              lead={lead} 
              isDraggingOver={activeId === lead.id.toString()}
            />
          ))}
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
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [statusColumns, setStatusColumns] = useState(getOrderedStatusColumns());
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 1, // Muito reduzido para máxima fluidez
      },
    })
  );

  useEffect(() => {
    fetchLeads();
    
    // Atualizar ordem das colunas quando a configuração mudar
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'funnelStatusOrder') {
        setStatusColumns(getOrderedStatusColumns());
      }
    };
    
    // Listener para mudanças em outras abas
    window.addEventListener('storage', handleStorageChange);
    
    // Listener customizado para mudanças na mesma aba
    const handleCustomStorageChange = () => {
      setStatusColumns(getOrderedStatusColumns());
    };
    window.addEventListener('funnelOrderChanged', handleCustomStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('funnelOrderChanged', handleCustomStorageChange);
    };
  }, []);

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
    
    // Para outros status, encontrar a coluna correspondente
    return statusColumns.find(col => col.backendStatus === lead.status);
  };

  const getLeadsByStatus = (statusId: string) => {
    // Encontrar a coluna
    const column = statusColumns.find(col => col.id === statusId);
    if (!column) return [];
    
    // Filtrar leads pelo status do backend e displayStatus se aplicável
    let filteredLeads = leads.filter(lead => {
      // Primeiro verificar se o status do backend corresponde
      if (lead.status !== column.backendStatus) {
        return false;
      }
      
      // Se a coluna tem um displayStatus específico (visita_concluida ou venda_ganha),
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
      
      // Para outras colunas sem displayStatus, apenas verificar o backendStatus
      return true;
    });
    
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Andamento</h1>
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
                />
              </div>
            );
          })}
        </div>
      </DndContext>
    </div>
  );
}

