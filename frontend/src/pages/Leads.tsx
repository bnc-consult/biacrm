import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
  FiSearch, 
  FiPlus, 
  FiUpload, 
  FiFilter, 
  FiDownload, 
  FiSettings,
  FiEye,
  FiChevronUp,
  FiChevronDown,
  FiList,
  FiX,
  FiRefreshCw,
  FiFileText,
  FiTrash2
} from 'react-icons/fi';

interface Lead {
  id: number;
  name: string;
  phone: string;
  email?: string;
  status: string;
  origin: string;
  product?: string;
  created_at: string;
  isNew?: boolean;
  custom_data?: any;
}

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
  
  // Mapear os status do backend para os status de exibição
  const statusMap: Record<string, string> = {
    'novo_lead': 'sem_atendimento',
    'em_contato': 'em_atendimento',
    'proposta_enviada': 'visita_agendada',
    'perdido': 'perdido',
  };
  
  return statusMap[lead.status] || lead.status;
};

const statusConfig: Record<string, { label: string; bgColor: string; textColor: string }> = {
  sem_atendimento: { label: 'Sem Atendimento', bgColor: 'bg-red-100', textColor: 'text-red-800' },
  em_atendimento: { label: 'Em Atendimento', bgColor: 'bg-blue-100', textColor: 'text-blue-800' },
  visita_concluida: { label: 'Visita Concluída', bgColor: 'bg-green-100', textColor: 'text-green-800' },
  visita_agendada: { label: 'Visita Agendada', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' },
  proposta: { label: 'Proposta', bgColor: 'bg-orange-100', textColor: 'text-orange-800' },
  venda_ganha: { label: 'Venda Ganha', bgColor: 'bg-green-100', textColor: 'text-green-800' },
  perdido: { label: 'Perdido', bgColor: 'bg-orange-100', textColor: 'text-orange-800' },
};

interface ImportTask {
  id: string;
  createdAt: string;
  queue: string;
  interval: string;
  savedLeads: string;
  errorLeads: string;
  status: 'em_progresso' | 'concluido' | 'erro';
}

export default function Leads() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLeads, setSelectedLeads] = useState<number[]>([]);
  const [sortConfig, setSortConfig] = useState<{ column: string; direction: 'asc' | 'desc' } | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showImportOptions, setShowImportOptions] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Estados para o modal de cadastro de Lead
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    origin: 'manual',
    notes: ''
  });
  const [formError, setFormError] = useState<string | null>(null);
  
  // Mock data para importações
  const [importTasks, setImportTasks] = useState<ImportTask[]>([
    {
      id: '1',
      createdAt: '07/11/2025, 22:25',
      queue: '--',
      interval: 'Sem intervalo',
      savedLeads: '7 / 8',
      errorLeads: '--',
      status: 'em_progresso',
    },
  ]);

  // Função para criar novo Lead
  const handleCreateLead = async () => {
    setFormError(null);
    
    if (!formData.name.trim() || !formData.phone.trim()) {
      setFormError('Nome e telefone são obrigatórios');
      return;
    }

    setIsSaving(true);
    try {
      const response = await api.post('/leads', {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        origin: formData.origin,
        notes: formData.notes.trim() || undefined,
        status: 'novo_lead'
      });

      // Atualizar lista de leads
      await fetchLeads();
      
      // Fechar modal e limpar formulário
      setShowAddLeadModal(false);
      setFormData({
        name: '',
        phone: '',
        email: '',
        origin: 'manual',
        notes: ''
      });
      setFormError(null);
    } catch (error: any) {
      console.error('Erro ao criar lead:', error);
      setFormError(error.response?.data?.message || 'Erro ao criar lead. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileImport = async (file: File, fileType: 'csv' | 'excel') => {
    setIsImporting(true);
    setImportMessage(null);
    
    try {
      let fileToUpload = file;
      
      // Se for Excel, precisamos converter para CSV ou usar uma biblioteca
      // Por enquanto, vamos apenas aceitar CSV e mostrar mensagem para Excel
      if (fileType === 'excel') {
        // Para Excel, você precisaria de uma biblioteca como xlsx
        // Por enquanto, vamos mostrar uma mensagem
        setImportMessage({ 
          type: 'error', 
          text: 'Importação de Excel ainda não está disponível. Por favor, converta para CSV primeiro.' 
        });
        setIsImporting(false);
        return;
      }

      const formData = new FormData();
      formData.append('file', fileToUpload);

      const response = await api.post('/leads/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Adicionar nova importação à lista
      const now = new Date();
      const formattedDate = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}, ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      const newTask: ImportTask = {
        id: Date.now().toString(),
        createdAt: formattedDate,
        queue: '--',
        interval: 'Sem intervalo',
        savedLeads: `${response.data.total} / ${response.data.total}`,
        errorLeads: '--',
        status: 'concluido',
      };

      setImportTasks([newTask, ...importTasks]);
      setImportMessage({ 
        type: 'success', 
        text: response.data.message || `${response.data.total} leads importados com sucesso!` 
      });

      // Atualizar lista de leads
      await fetchLeads();

      // Fechar modal após 2 segundos
      setTimeout(() => {
        setShowImportOptions(false);
        setShowImportModal(false);
        setImportMessage(null);
      }, 2000);

    } catch (error: any) {
      console.error('Erro ao importar:', error);
      setImportMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Erro ao importar arquivo. Verifique o formato e tente novamente.' 
      });
    } finally {
      setIsImporting(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const response = await api.get('/leads');
      const leadsData = response.data.map((lead: any) => ({
        ...lead,
        isNew: Math.random() > 0.3, // Simular alguns leads novos
      }));
      setLeads(leadsData);
    } catch (error) {
      console.error('Error fetching leads:', error);
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
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day} ${month} ${year}, ${hours}:${minutes}`;
  };

  const handleSort = (column: string) => {
    setSortConfig(prev => {
      if (prev?.column === column) {
        return { column, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { column, direction: 'asc' };
    });
  };

  const sortedLeads = [...leads].sort((a, b) => {
    if (!sortConfig) return 0;
    
    let aValue: any = a[sortConfig.column as keyof Lead];
    let bValue: any = b[sortConfig.column as keyof Lead];
    
    if (sortConfig.column === 'created_at') {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    }
    
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }
    
    if (sortConfig.direction === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const filteredLeads = sortedLeads.filter(lead =>
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.phone.includes(searchTerm) ||
    (lead.email && lead.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeads(filteredLeads.map(lead => lead.id));
    } else {
      setSelectedLeads([]);
    }
  };

  const handleSelectLead = (leadId: number, checked: boolean) => {
    if (checked) {
      setSelectedLeads([...selectedLeads, leadId]);
    } else {
      setSelectedLeads(selectedLeads.filter(id => id !== leadId));
    }
  };

  const getSortIcon = (column: string) => {
    if (sortConfig?.column === column) {
      return sortConfig.direction === 'asc' 
        ? <FiChevronUp className="w-4 h-4" />
        : <FiChevronDown className="w-4 h-4" />;
    }
    return <FiChevronUp className="w-4 h-4 opacity-30" />;
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700">Carregando leads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-full">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
            <p className="text-sm text-gray-600 mt-1">
              Mostrando {filteredLeads.length} de {leads.length}
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <FiList className="w-4 h-4" />
              <span>Ordem</span>
            </button>
            <button 
              onClick={() => setShowAddLeadModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <FiPlus className="w-4 h-4" />
              <span>Adicionar +</span>
            </button>
            <button 
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <FiUpload className="w-4 h-4" />
              <span>Importações</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <FiFilter className="w-4 h-4" />
              <span>Filtros</span>
            </button>
            <button className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <FiDownload className="w-4 h-4" />
            </button>
            <button className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <FiSettings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <FiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Pesquisar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center gap-1 text-sm font-semibold text-gray-700 hover:text-gray-900"
                  >
                    Nome
                    {getSortIcon('name')}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Telefone</th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('product')}
                    className="flex items-center gap-1 text-sm font-semibold text-gray-700 hover:text-gray-900"
                  >
                    Produto
                    {getSortIcon('product')}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Criado em</th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('status')}
                    className="flex items-center gap-1 text-sm font-semibold text-gray-700 hover:text-gray-900"
                  >
                    Status
                    {getSortIcon('status')}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredLeads.map((lead) => {
                const displayStatus = getDisplayStatus(lead);
                const status = statusConfig[displayStatus] || statusConfig.sem_atendimento;
                return (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedLeads.includes(lead.id)}
                        onChange={(e) => handleSelectLead(lead.id, e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{lead.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{lead.phone}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{lead.product || '--'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatDate(lead.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.bgColor} ${status.textColor}`}>
                          {status.label}
                        </span>
                        {lead.isNew && (
                          <span className="px-2 py-0.5 bg-yellow-200 text-yellow-800 text-xs font-medium rounded">
                            Novo!
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button 
                        onClick={() => navigate(`/leads/${lead.id}`)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <FiEye className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Load More Button */}
      <div className="mt-6 flex justify-center">
        <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Carregar mais
        </button>
      </div>

      {/* Modal de Importação */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Importação de Clientes</h2>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setShowImportOptions(false);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Action Buttons */}
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => setShowImportOptions(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <FiFileText className="w-4 h-4" />
                  <span>Adicionar Importação</span>
                </button>
                <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <FiRefreshCw className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Table */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Data criação</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        <div className="flex items-center gap-1">
                          Fila / Corretor
                          <FiChevronUp className="w-4 h-4 opacity-30" />
                        </div>
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Intervalo</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Leads salvos</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Leads com erro</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {importTasks.map((task) => (
                      <tr key={task.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">{task.createdAt}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{task.queue}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{task.interval}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{task.savedLeads}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className="px-2 py-1 bg-green-50 text-green-700 rounded">
                            {task.errorLeads}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded">
                            {task.status === 'em_progresso' ? 'Em progresso' : task.status === 'concluido' ? 'Concluído' : 'Erro'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button className="text-red-600 hover:text-red-700">
                            <FiTrash2 className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Help Text */}
              <div className="mt-4 text-sm text-gray-600">
                Tem alguma dúvida?{' '}
                <a href="#" className="text-blue-600 hover:text-blue-700 underline">
                  acesse aqui nosso tutorial!
                </a>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-4 p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setShowImportOptions(false);
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Fechar
              </button>
              <button
                onClick={() => setShowImportOptions(true)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Importar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Opções de Importação (Excel/CSV) */}
      {showImportOptions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Selecione o formato</h3>
                <button
                  onClick={() => {
                    if (!isImporting) {
                      setShowImportOptions(false);
                      setImportMessage(null);
                    }
                  }}
                  disabled={isImporting}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
              
              <p className="text-sm text-gray-600 mb-6">
                Escolha o formato do arquivo que deseja importar
              </p>

              {/* Mensagem de feedback */}
              {importMessage && (
                <div className={`mb-4 p-4 rounded-lg ${
                  importMessage.type === 'success' 
                    ? 'bg-green-50 text-green-800 border border-green-200' 
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{importMessage.text}</span>
                  </div>
                </div>
              )}

              {isImporting && !importMessage && (
                <div className="mb-4 p-4 bg-blue-50 text-blue-800 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-sm font-medium">Importando arquivo...</span>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.xlsx,.xls';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        handleFileImport(file, 'excel');
                      }
                    };
                    input.click();
                  }}
                  disabled={isImporting}
                  className="w-full flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <FiFileText className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-gray-900">Excel</div>
                      <div className="text-sm text-gray-600">.xlsx, .xls</div>
                    </div>
                  </div>
                  <FiChevronUp className="w-5 h-5 text-gray-400 transform -rotate-90" />
                </button>

                <button
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.csv';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        handleFileImport(file, 'csv');
                      }
                    };
                    input.click();
                  }}
                  disabled={isImporting}
                  className="w-full flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FiFileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-gray-900">CSV</div>
                      <div className="text-sm text-gray-600">.csv</div>
                    </div>
                  </div>
                  <FiChevronUp className="w-5 h-5 text-gray-400 transform -rotate-90" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cadastro de Lead */}
      {showAddLeadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Cadastrar Novo Lead</h2>
              <button
                onClick={() => {
                  setShowAddLeadModal(false);
                  setFormData({
                    name: '',
                    phone: '',
                    email: '',
                    origin: 'manual',
                    notes: ''
                  });
                  setFormError(null);
                }}
                disabled={isSaving}
                className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {formError && (
                <div className="mb-4 p-4 bg-red-50 text-red-800 rounded-lg border border-red-200">
                  <span className="text-sm font-medium">{formError}</span>
                </div>
              )}

              <div className="space-y-4">
                {/* Nome */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nome completo"
                    disabled={isSaving}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Telefone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(00) 00000-0000"
                    disabled={isSaving}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@exemplo.com"
                    disabled={isSaving}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Origem */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Origem
                  </label>
                  <select
                    value={formData.origin}
                    onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                    disabled={isSaving}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="manual">Manual</option>
                    <option value="facebook">Facebook</option>
                    <option value="instagram">Instagram</option>
                    <option value="google_ads">Google Ads</option>
                    <option value="tiktok">TikTok</option>
                    <option value="site">Site</option>
                    <option value="indicacao">Indicação</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>

                {/* Notas */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notas
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Observações sobre o lead..."
                    rows={3}
                    disabled={isSaving}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-4 p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowAddLeadModal(false);
                  setFormData({
                    name: '',
                    phone: '',
                    email: '',
                    origin: 'manual',
                    notes: ''
                  });
                  setFormError(null);
                }}
                disabled={isSaving}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateLead}
                disabled={isSaving || !formData.name.trim() || !formData.phone.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSaving && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                {isSaving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
