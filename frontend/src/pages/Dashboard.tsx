import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { FiSettings, FiChevronDown, FiRefreshCw, FiFilter, FiHelpCircle } from 'react-icons/fi';

interface FunnelData {
  status: string;
  count: number;
  conversionRate: string;
}

interface Summary {
  semAtendimento: number;
  vendasGanhas: number;
  finalizados: number;
}

const statusLabels: Record<string, string> = {
  novo_lead: 'Sem Atendimento',
  em_contato: 'Em Atendimento',
  visita_agendada: 'Visita Agendada',
  visita_concluida: 'Visita Concluída',
  proposta: 'Proposta',
  venda_ganha: 'Venda Ganha',
};

// Ordem correta do funil: Sem Atendimento -> Em Atendimento -> Visita Agendada -> Visita Concluída -> Proposta -> Venda Ganha
const statusOrder = ['novo_lead', 'em_contato', 'visita_agendada', 'visita_concluida', 'proposta', 'venda_ganha'];

type PercentageCalculationType = 'previous' | 'total';

export default function Dashboard() {
  const navigate = useNavigate();
  const [funnelData, setFunnelData] = useState<FunnelData[]>([]);
  const [rawFunnelData, setRawFunnelData] = useState<FunnelData[]>([]);
  const [summary, setSummary] = useState<Summary>({ semAtendimento: 0, vendasGanhas: 0, finalizados: 0 });
  const [loading, setLoading] = useState(true);
  const [percentageType, setPercentageType] = useState<PercentageCalculationType>('previous');
  const [showPercentageDropdown, setShowPercentageDropdown] = useState(false);

  useEffect(() => {
    fetchFunnelData();
  }, []);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.relative')) {
        setShowPercentageDropdown(false);
      }
    };

    if (showPercentageDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showPercentageDropdown]);

  const fetchFunnelData = async () => {
    try {
      const response = await api.get('/dashboard/funnel');
      const rawData = response.data.funnel;
      setRawFunnelData(rawData);
      setSummary(response.data.summary);
      
      // Calcular percentuais baseado no tipo selecionado
      const calculatedData = calculatePercentages(rawData, percentageType);
      setFunnelData(calculatedData);
    } catch (error) {
      console.error('Error fetching funnel data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePercentages = (data: FunnelData[], type: PercentageCalculationType): FunnelData[] => {
    // Garantir que os dados estejam na ordem correta
    const orderedData = statusOrder.map(status => {
      const item = data.find(item => item.status === status);
      return item ? { ...item, count: item.count || 0 } : { status, count: 0, conversionRate: '0,00' };
    });

    if (type === 'previous') {
      // % em relação à etapa anterior
      return orderedData.map((item, index) => {
        if (index === 0) {
          // Primeira etapa não tem porcentagem em relação à anterior
          return { ...item, conversionRate: '0,00' };
        }
        
        // Calcular porcentagem em relação à etapa anterior
        const previousItem = orderedData[index - 1];
        const previousCount = previousItem?.count || 0;
        
        let percentage = 0;
        if (previousCount > 0) {
          percentage = (item.count / previousCount) * 100;
        }
        
        return {
          ...item,
          conversionRate: percentage.toFixed(2).replace('.', ','),
        };
      });
    } else {
      // % em relação ao total de leads (primeira etapa)
      const firstStage = orderedData[0];
      const totalLeads = firstStage?.count || 0;
      
      return orderedData.map((item, index) => {
        if (index === 0) {
          // Primeira etapa sempre 100% em relação ao total
          return { ...item, conversionRate: '100,00' };
        }
        
        // Calcular porcentagem em relação ao total de leads
        const percentage = totalLeads > 0 ? (item.count / totalLeads) * 100 : 0;
        return {
          ...item,
          conversionRate: percentage.toFixed(2).replace('.', ','),
        };
      });
    }
  };

  const handlePercentageTypeChange = (type: PercentageCalculationType) => {
    setPercentageType(type);
    setShowPercentageDropdown(false);
    
    // Recalcular percentuais a partir dos dados brutos
    const calculatedData = calculatePercentages(rawFunnelData, type);
    setFunnelData(calculatedData);
  };

  const getMaxCount = () => {
    return Math.max(...funnelData.map((item) => item.count), 1);
  };

  // const getWidthPercentage = (count: number) => {
  //   const max = getMaxCount();
  //   return max > 0 ? (count / max) * 100 : 0;
  // };

  const handleRefresh = () => {
    setLoading(true);
    fetchFunnelData();
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard e funil 2.0</h1>
      </div>

      {/* Action Buttons */}
      <div className="mb-8 flex space-x-4">
        <div className="relative">
          <button 
            onClick={() => setShowPercentageDropdown(!showPercentageDropdown)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <span>Cálculo da porcentagem</span>
            <FiChevronDown className={`w-4 h-4 transition-transform ${showPercentageDropdown ? 'rotate-180' : ''}`} />
          </button>
          
          {/* Dropdown Menu */}
          {showPercentageDropdown && (
            <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 min-w-[280px] z-10">
              <button
                onClick={() => handlePercentageTypeChange('previous')}
                className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                  percentageType === 'previous'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-900 hover:bg-gray-50'
                }`}
              >
                % em relação a etapa anterior
              </button>
              <button
                onClick={() => handlePercentageTypeChange('total')}
                className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                  percentageType === 'total'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-900 hover:bg-gray-50'
                }`}
              >
                % em relação ao total de leads
              </button>
            </div>
          )}
        </div>
        <button 
          onClick={() => navigate('/funnel-config')}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <FiSettings className="w-4 h-4" />
          <span>Configurar funil</span>
        </button>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Horizontal Funnel Visualization */}
        <div className="lg:col-span-3 bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="space-y-3">
            {statusOrder.map((status, index) => {
              const data = funnelData.find((item) => item.status === status);
              const count = data?.count || 0;
              let conversionRate = data?.conversionRate || '0,00';
              if (conversionRate.includes('.')) {
                conversionRate = conversionRate.replace('.', ',');
              }
              
              // Calcular largura do funil baseada na quantidade
              const maxCount = Math.max(...statusOrder.map(s => {
                const d = funnelData.find(item => item.status === s);
                return d?.count || 0;
              }), 1);
              
              // Largura baseada na quantidade relativa ao máximo
              const countBasedWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;
              
              // Aplicar efeito de funil: cada etapa subsequente tem largura reduzida
              // Primeira etapa: 100% da largura baseada no count
              // Segunda etapa: ~85% da largura baseada no count
              // E assim por diante
              const funnelMultiplier = Math.max(1 - (index * 0.12), 0.3); // Reduz 12% por etapa, mínimo 30%
              const finalWidth = Math.max(countBasedWidth * funnelMultiplier, count > 0 ? 25 : 0);
              
              // Determinar se deve mostrar porcentagem
              const isFirst = index === 0;
              const showPercentage = !isFirst || (isFirst && percentageType === 'total');
              
              // Nome do estágio com quantidade
              const label = statusLabels[status];
              // Ajustar para singular/plural
              let displayLabel = label;
              if (count === 1) {
                // Remover 's' do final se houver (lógica simples)
                if (label.endsWith('s') && !label.endsWith('ss')) {
                  displayLabel = label.slice(0, -1);
                }
              }
              
              return (
                <div key={status} className="relative">
                  <div
                    className="flex items-center bg-blue-900 text-white rounded-lg overflow-hidden transition-all duration-300 hover:shadow-lg"
                    style={{
                      width: `${finalWidth}%`,
                      minHeight: '55px',
                    }}
                  >
                    {/* Label à esquerda */}
                    <div className="flex-shrink-0 px-4 py-3 font-semibold text-sm whitespace-nowrap">
                      {count} {displayLabel}
                    </div>
                    
                    {/* Espaço flexível no meio */}
                    <div className="flex-1"></div>
                    
                    {/* Porcentagem à direita */}
                    {showPercentage && (
                      <div className="flex-shrink-0 px-4 py-3 text-sm font-medium">
                        {conversionRate}%
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side Controls */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-xs text-gray-600 mb-4">
              Dados atualizados á cada 5 minutos.
            </p>
            <div className="space-y-2">
              <button 
                onClick={handleRefresh}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <FiRefreshCw className="w-4 h-4" />
                <span>Atualizar agora</span>
              </button>
              <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 border border-gray-300">
                <FiFilter className="w-4 h-4" />
                <span>Filtros</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="bg-white rounded-lg shadow-md p-6 mt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">Sem atendimento:</span>
              <span className="text-sm font-semibold text-gray-900">{summary.semAtendimento}</span>
            </div>
            <FiHelpCircle className="w-4 h-4 text-gray-400" />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">Total de vendas ganhas:</span>
              <span className="text-sm font-semibold text-gray-900">{summary.vendasGanhas}</span>
            </div>
            <FiHelpCircle className="w-4 h-4 text-gray-400" />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">Finalizados:</span>
              <span className="text-sm font-semibold text-gray-900">{summary.finalizados}</span>
            </div>
            <FiHelpCircle className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Show More Information */}
      <div className="mt-6 text-center">
        <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mx-auto">
          <span>Exibir mais informações</span>
          <FiChevronDown className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

