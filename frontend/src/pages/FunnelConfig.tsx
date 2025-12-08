import { useState } from 'react';
import { FiEdit2, FiPlus, FiX, FiChevronDown, FiHelpCircle } from 'react-icons/fi';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface FunnelStage {
  id: string;
  name: string;
  color: string;
  order: number;
  showInFunnel: boolean;
  requiredFields: string[];
  importantFields: string[];
  autoDestination: boolean;
}

// Mapeamento entre nomes das etapas e IDs de status usados no LeadsAndamento
const stageNameToStatusId: Record<string, string> = {
  'Sem Atendimento': 'novo_lead',
  'Em Atendimento': 'em_contato',
  'Visita Concluída': 'visita_concluida',
  'Visita Agendada': 'visita_agendada',
  'Proposta': 'proposta',
  'Venda Ganha': 'venda_ganha',
  'Perdido': 'perdido',
};

const defaultStages: FunnelStage[] = [
  { id: '1', name: 'Sem Atendimento', color: '#ef4444', order: 1, showInFunnel: true, requiredFields: [], importantFields: [], autoDestination: false },
  { id: '2', name: 'Em Atendimento', color: '#3b82f6', order: 2, showInFunnel: true, requiredFields: [], importantFields: [], autoDestination: false },
  { id: '3', name: 'Visita Concluída', color: '#14b8a6', order: 3, showInFunnel: true, requiredFields: [], importantFields: [], autoDestination: false },
  { id: '4', name: 'Visita Agendada', color: '#60a5fa', order: 4, showInFunnel: true, requiredFields: [], importantFields: [], autoDestination: false },
  { id: '5', name: 'Proposta', color: '#f97316', order: 5, showInFunnel: true, requiredFields: [], importantFields: [], autoDestination: false },
  { id: '6', name: 'Venda Ganha', color: '#22c55e', order: 6, showInFunnel: true, requiredFields: [], importantFields: [], autoDestination: false },
];

function SortableStageItem({ stage, index, onEdit, totalStages }: { stage: FunnelStage; index: number; onEdit: (id: string) => void; totalStages: number }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stage.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
    >
      {/* Drag Handle - não mostrar no primeiro e último */}
      {index > 0 && index < totalStages - 1 && (
        <div
          {...attributes}
          {...listeners}
          className="text-gray-400 cursor-move flex flex-col gap-0.5"
        >
          <div className="w-1 h-1 rounded-full bg-gray-400"></div>
          <div className="w-1 h-1 rounded-full bg-gray-400"></div>
          <div className="w-1 h-1 rounded-full bg-gray-400"></div>
        </div>
      )}
      {index === 0 && <div className="w-5"></div>}
      
      {/* Color Indicator */}
      <div
        className="w-4 h-4 rounded flex-shrink-0"
        style={{ backgroundColor: stage.color }}
      />
      
      {/* Stage Name */}
      <div className="flex-1 text-gray-900 font-medium">
        {stage.name}
      </div>
      
      {/* Edit Icon */}
      <button
        onClick={() => onEdit(stage.id)}
        className="text-gray-400 hover:text-gray-600 transition-colors"
      >
        <FiEdit2 className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function FunnelConfig() {
  // Carregar ordem salva do localStorage ou usar default
  const loadStages = (): FunnelStage[] => {
    const saved = localStorage.getItem('funnelStagesOrder');
    if (saved) {
      try {
        const savedStages = JSON.parse(saved);
        // Garantir que todos os stages default estão presentes
        const stageMap = new Map(savedStages.map((s: FunnelStage) => [s.name, s]));
        return defaultStages.map(defaultStage => {
          const saved = stageMap.get(defaultStage.name);
          return saved ? { ...defaultStage, ...saved } : defaultStage;
        }).sort((a, b) => a.order - b.order);
      } catch (e) {
        console.error('Error loading saved stages:', e);
      }
    }
    return defaultStages;
  };

  const [stages, setStages] = useState<FunnelStage[]>(() => {
    const loaded = loadStages();
    // Salvar ordem inicial se não existir
    if (!localStorage.getItem('funnelStatusOrder')) {
      const statusOrder = loaded
        .map(stage => stageNameToStatusId[stage.name])
        .filter(Boolean);
      localStorage.setItem('funnelStatusOrder', JSON.stringify(statusOrder));
      localStorage.setItem('funnelStagesOrder', JSON.stringify(loaded));
    }
    return loaded;
  });
  const [editingStage, setEditingStage] = useState<FunnelStage | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    nameInFunnel: '',
    showInFunnel: true,
    requiredFields: [] as string[],
    importantFields: [] as string[],
    autoDestination: false,
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setStages((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        const newItems = arrayMove(items, oldIndex, newIndex);
        // Atualizar a ordem dos itens
        const updatedItems = newItems.map((item, index) => ({
          ...item,
          order: index + 1,
        }));
        
        // Salvar ordem no localStorage
        localStorage.setItem('funnelStagesOrder', JSON.stringify(updatedItems));
        
        // Salvar ordem de status IDs para uso no LeadsAndamento
        const statusOrder = updatedItems
          .map(stage => stageNameToStatusId[stage.name])
          .filter(Boolean); // Remove undefined values
        localStorage.setItem('funnelStatusOrder', JSON.stringify(statusOrder));
        
        // Disparar evento customizado para atualizar outras páginas na mesma aba
        window.dispatchEvent(new Event('funnelOrderChanged'));
        
        return updatedItems;
      });
    }
  };

  const handleEdit = (stageId: string) => {
    if (stageId === 'finalizado') {
      // Criar uma etapa temporária para "Finalizado"
      const finalizadoStage: FunnelStage = {
        id: 'finalizado',
        name: 'Finalizado',
        color: '#1f2937',
        order: 999,
        showInFunnel: true,
        requiredFields: [],
        importantFields: [],
        autoDestination: false,
      };
      setEditingStage(finalizadoStage);
      setEditForm({
        title: 'Finalizado',
        nameInFunnel: 'Finalizado',
        showInFunnel: true,
        requiredFields: [],
        importantFields: [],
        autoDestination: false,
      });
    } else {
      const stage = stages.find(s => s.id === stageId);
      if (stage) {
        setEditingStage(stage);
        setEditForm({
          title: stage.name,
          nameInFunnel: stage.name,
          showInFunnel: stage.showInFunnel,
          requiredFields: stage.requiredFields,
          importantFields: stage.importantFields,
          autoDestination: stage.autoDestination,
        });
      }
    }
  };

  const handleCloseModal = () => {
    setEditingStage(null);
  };

  const handleSave = () => {
    if (editingStage) {
      const updatedStages = stages.map(stage => 
        stage.id === editingStage.id
          ? {
              ...stage,
              name: editForm.title,
              showInFunnel: editForm.showInFunnel,
              requiredFields: editForm.requiredFields,
              importantFields: editForm.importantFields,
              autoDestination: editForm.autoDestination,
            }
          : stage
      );
      setStages(updatedStages);
      
      // Salvar ordem atualizada
      localStorage.setItem('funnelStagesOrder', JSON.stringify(updatedStages));
      const statusOrder = updatedStages
        .map(stage => stageNameToStatusId[stage.name])
        .filter(Boolean);
      localStorage.setItem('funnelStatusOrder', JSON.stringify(statusOrder));
      
      // Disparar evento customizado para atualizar outras páginas na mesma aba
      window.dispatchEvent(new Event('funnelOrderChanged'));
      
      handleCloseModal();
    }
  };

  const handleDelete = () => {
    if (editingStage) {
      const updatedStages = stages.filter(stage => stage.id !== editingStage.id);
      setStages(updatedStages);
      handleCloseModal();
    }
  };

  const handleAddStage = () => {
    const newStage: FunnelStage = {
      id: Date.now().toString(),
      name: 'Nova Etapa',
      color: '#6b7280',
      order: stages.length + 1,
      showInFunnel: true,
      requiredFields: [],
      importantFields: [],
      autoDestination: false,
    };
    setStages([...stages, newStage]);
  };

  return (
    <div className="p-8 bg-gray-50 min-h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard e funil</h1>
        <p className="text-sm text-gray-600">
          Configure cada etapa do funil separadamente clicando na etapa.
        </p>
      </div>

      {/* Funnel Stages List */}
      <div className="bg-white rounded-lg shadow-md p-6 max-h-[calc(100vh-250px)] overflow-y-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={stages.map((stage) => stage.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {stages.map((stage, index) => (
                <SortableStageItem
                  key={stage.id}
                  stage={stage}
                  index={index}
                  onEdit={handleEdit}
                  totalStages={stages.length}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {/* Add More Stages Button */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={handleAddStage}
            className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
          >
            <span className="text-sm">Adicionar mais etapas.</span>
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors">
              <FiPlus className="w-5 h-5" />
            </div>
          </button>
        </div>

        {/* Finalizado Stage */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg">
            {/* Color Indicator - Dark Gray/Black */}
            <div className="w-4 h-4 rounded bg-gray-800 flex-shrink-0" />
            
            {/* Stage Name */}
            <div className="flex-1 text-gray-900 font-medium">
              Finalizado
            </div>
            
            {/* Edit Icon */}
            <button
              onClick={() => handleEdit('finalizado')}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FiEdit2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Edit Stage Modal */}
      {editingStage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Editar etapa</h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Título Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título:
                </label>
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded flex-shrink-0"
                    style={{ backgroundColor: editingStage.color }}
                  />
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700">Exibir no funil:</span>
                    <button
                      onClick={() => setEditForm({ ...editForm, showInFunnel: !editForm.showInFunnel })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        editForm.showInFunnel ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          editForm.showInFunnel ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Nome no Funil Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome no Funil
                </label>
                <input
                  type="text"
                  value={editForm.nameInFunnel}
                  onChange={(e) => setEditForm({ ...editForm, nameInFunnel: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Campos obrigatórios Section */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">Campos obrigatórios</h3>
                <p className="text-xs text-gray-600 mb-3">
                  Campos obrigatórios para o lead entrar nesta etapa.
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white">
                      <option>Selecionar tipo de campo customizável</option>
                    </select>
                    <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                  <button className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors">
                    <FiPlus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Campos importantes Section */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">Campos importantes</h3>
                <p className="text-xs text-gray-600 mb-3">
                  Campos que o usuário pode preencher, mas não são obrigatórios.
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white">
                      <option>Selecionar tipo de campo customizável</option>
                    </select>
                    <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                  <button className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors">
                    <FiPlus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">Etapa de Destino Automática</span>
                <button
                  onClick={() => setEditForm({ ...editForm, autoDestination: !editForm.autoDestination })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    editForm.autoDestination ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      editForm.autoDestination ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <FiHelpCircle className="w-4 h-4 text-gray-400" />
                <a href="#" className="text-sm text-blue-600 hover:text-blue-700">
                  Campos personalizados
                </a>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Apagar etapa
                </button>
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

