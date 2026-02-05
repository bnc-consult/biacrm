import { useEffect, useState } from 'react';
import api from '../services/api';
import { FiRefreshCw, FiFilter, FiHelpCircle, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

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

export default function Dashboard() {
  const [funnelData, setFunnelData] = useState<FunnelData[]>([]);
  const [summary, setSummary] = useState<Summary>({ semAtendimento: 0, vendasGanhas: 0, finalizados: 0 });
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('dashboard-theme');
    return saved === 'light' ? 'light' : 'dark';
  });
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    origin: '',
    status: '',
    userId: '',
    product: '',
  });
  const [originOptions, setOriginOptions] = useState<string[]>([]);
  const [originSummary, setOriginSummary] = useState<Array<{ origin: string; count: number }>>([]);
  const [userOptions, setUserOptions] = useState<Array<{ id: number; name: string }>>([]);
  const [productOptions, setProductOptions] = useState<string[]>([]);
  const [chartViewIndex, setChartViewIndex] = useState(0);

  useEffect(() => {
    fetchFunnelData();
    fetchOriginOptions();
    fetchUserOptions();
    fetchProductOptions();
  }, []);

  useEffect(() => {
    localStorage.setItem('dashboard-theme', theme);
  }, [theme]);

  const fetchFunnelData = async (nextFilters?: typeof filters) => {
    const activeFilters = nextFilters ?? filters;
    try {
      const params = new URLSearchParams();
      if (activeFilters.startDate) {
        params.set('startDate', activeFilters.startDate);
      }
      if (activeFilters.endDate) {
        params.set('endDate', activeFilters.endDate);
      }
      if (activeFilters.origin) {
        params.set('origin', activeFilters.origin);
      }
      if (activeFilters.status) {
        params.set('status', activeFilters.status);
      }
      if (activeFilters.userId) {
        params.set('userId', activeFilters.userId);
      }
      if (activeFilters.product) {
        params.set('product', activeFilters.product);
      }
      const query = params.toString();
      const response = await api.get(`/dashboard/funnel${query ? `?${query}` : ''}`);
      const rawData = response.data.funnel;
      setSummary(response.data.summary);
      
      // Calcular percentuais sempre em relação ao total de leads
      const calculatedData = calculatePercentages(rawData);
      setFunnelData(calculatedData);
    } catch (error) {
      console.error('Error fetching funnel data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOriginOptions = async () => {
    try {
      const response = await api.get('/dashboard/leads-by-origin');
      const rawItems = Array.isArray(response.data) ? response.data : [];
      const normalized = rawItems
        .map((item: any) => ({
          origin: item?.origin,
          count: Number(item?.count ?? item?.total ?? item?.leads ?? 0),
        }))
        .filter((item: any) => Boolean(item.origin));
      setOriginSummary(normalized);
      setOriginOptions(Array.from(new Set(normalized.map((item) => item.origin))));
    } catch (error) {
      console.error('Error fetching origin options:', error);
    }
  };

  const fetchUserOptions = async () => {
    try {
      const response = await api.get('/dashboard/users');
      const options = Array.isArray(response.data) ? response.data : [];
      setUserOptions(options);
    } catch (error) {
      console.error('Error fetching user options:', error);
    }
  };

  const fetchProductOptions = async () => {
    try {
      const response = await api.get('/dashboard/products');
      const options = Array.isArray(response.data) ? response.data : [];
      setProductOptions(options);
    } catch (error) {
      console.error('Error fetching product options:', error);
    }
  };

  const calculatePercentages = (data: FunnelData[]): FunnelData[] => {
    // Garantir que os dados estejam na ordem correta
    const orderedData = statusOrder.map(status => {
      const item = data.find(item => item.status === status);
      return item ? { ...item, count: item.count || 0 } : { status, count: 0, conversionRate: '0,00' };
    });

    // % em relação ao total de leads (soma de todas as etapas)
    const totalLeads = orderedData.reduce((sum, item) => sum + (item.count || 0), 0);
    
    return orderedData.map((item, index) => {
      // Calcular porcentagem em relação ao total de leads
      const percentage = totalLeads > 0 ? (item.count / totalLeads) * 100 : 0;
      return {
        ...item,
        conversionRate: percentage.toFixed(2).replace('.', ','),
      };
    });
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchFunnelData();
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleApplyFilters = () => {
    const nextFilters = {
      startDate: filters.startDate,
      endDate: filters.endDate,
      origin: filters.origin,
      status: filters.status,
      userId: filters.userId,
      product: filters.product,
    };
    setLoading(true);
    setShowFiltersModal(false);
    fetchFunnelData(nextFilters);
  };

  const handleClearFilters = () => {
    const cleared = { startDate: '', endDate: '', origin: '', status: '', userId: '', product: '' };
    setFilters(cleared);
    setLoading(true);
    setShowFiltersModal(false);
    fetchFunnelData(cleared);
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

  const totalLeads = funnelData.reduce((sum, item) => sum + (item.count || 0), 0);
  const conversasAtuais = funnelData.find((item) => item.status === 'em_contato')?.count || 0;
  const leadsAtivos = Math.max(totalLeads - summary.finalizados - summary.vendasGanhas, 0);
  const leadsPerdidos = Math.max(summary.finalizados - summary.vendasGanhas, 0);
  const leadsSemTarefas = summary.semAtendimento;
  const originCards = originSummary.length
    ? originSummary
    : [
        { origin: 'WhatsApp Cloud API', count: 0 },
        { origin: 'Bate-papo online', count: 0 },
        { origin: 'Outros', count: 0 },
      ];
  const isDark = theme === 'dark';
  const pageTheme = isDark ? 'bg-[#0b2238] text-slate-100' : 'bg-gray-50 text-gray-900';
  const cardTheme = isDark ? 'bg-[#0f2f4a] border-[#1b4461]' : 'bg-white border-gray-200';
  const cardSoft = isDark ? 'bg-[#0b233b] border-[#1b4461]' : 'bg-gray-100 border-gray-200';
  const cardBorder = isDark ? 'border-[#1b4461]' : 'border-gray-200';
  const textMuted = isDark ? 'text-slate-400' : 'text-gray-500';
  const textSubtle = isDark ? 'text-slate-300' : 'text-gray-600';
  const textTitle = isDark ? 'text-slate-200' : 'text-gray-800';
  const textStrong = isDark ? 'text-slate-100' : 'text-gray-900';
  const buttonOutline = isDark
    ? 'border-[#1b4461] text-slate-100 hover:bg-[#0f2f4a]'
    : 'border-gray-300 text-gray-700 hover:bg-gray-100';
  const funnelBar = isDark ? 'bg-blue-900 text-white' : 'bg-blue-600 text-white';
  const funnelText = isDark ? 'text-blue-100' : 'text-blue-50';
  const chartViews = [
    { id: 'bars', label: 'Barras' },
    { id: 'funnel', label: 'Funil' }
  ];
  const activeChartView = chartViews[chartViewIndex % chartViews.length];

  return (
    <div className={`min-h-full p-6 ${pageTheme}`}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className={`text-sm ${textSubtle}`}>Visao geral de leads e conversas</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={toggleTheme}
            className={`flex items-center gap-3 rounded-full border px-3 py-2 text-xs font-semibold ${buttonOutline}`}
            aria-label="Alternar modo claro/escuro"
          >
            <span>{isDark ? 'Modo escuro' : 'Modo claro'}</span>
            <span className={`relative inline-flex h-5 w-10 items-center rounded-full ${isDark ? 'bg-slate-700' : 'bg-gray-300'}`}>
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${isDark ? 'translate-x-5' : 'translate-x-1'}`}
              />
            </span>
          </button>
          <button
            onClick={() => setShowFiltersModal(true)}
            className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm ${buttonOutline}`}
          >
            <FiFilter className="w-4 h-4" />
            Filtros
          </button>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            <FiRefreshCw className="w-4 h-4" />
            Atualizar agora
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-4 space-y-4">
          <div className={`rounded-2xl border p-5 ${cardTheme}`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className={`text-sm font-semibold ${textTitle}`}>Mensagens recebidas</h2>
                <p className={`text-xs ${textMuted}`}>{totalLeads} esta semana</p>
              </div>
              <span className="text-2xl font-semibold text-emerald-400">{totalLeads}</span>
            </div>
            <div className="mt-4 space-y-3">
              {originCards.map((origin) => (
                <div key={origin.origin} className={`flex items-center justify-between rounded-lg border px-3 py-2 ${cardSoft}`}>
                  <span className={`text-xs ${textSubtle}`}>{origin.origin}</span>
                  <span className={`text-xs font-semibold ${textStrong}`}>{origin.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className={`rounded-2xl border p-4 ${cardTheme}`}>
              <p className={`text-xs ${textMuted}`}>Leads ganhos</p>
              <p className="mt-3 text-2xl font-semibold text-emerald-400">{summary.vendasGanhas}</p>
              <p className={`text-xs ${textMuted}`}>R$0</p>
            </div>
            <div className={`rounded-2xl border p-4 ${cardTheme}`}>
              <p className={`text-xs ${textMuted}`}>Leads ativos</p>
              <p className="mt-3 text-2xl font-semibold text-indigo-300">{leadsAtivos}</p>
              <p className={`text-xs ${textMuted}`}>R$0</p>
            </div>
            <div className={`rounded-2xl border p-4 ${cardTheme}`}>
              <p className={`text-xs ${textMuted}`}>Leads perdidos</p>
              <p className="mt-3 text-2xl font-semibold text-rose-300">{leadsPerdidos}</p>
              <p className={`text-xs ${textMuted}`}>R$0</p>
            </div>
            <div className={`rounded-2xl border p-4 ${cardTheme}`}>
              <p className={`text-xs ${textMuted}`}>Leads sem tarefas</p>
              <p className="mt-3 text-2xl font-semibold text-indigo-300">{leadsSemTarefas}</p>
              <p className={`text-xs ${textMuted}`}>R$0</p>
            </div>
          </div>
        </div>

        <div className="xl:col-span-8 space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className={`rounded-2xl border p-5 ${cardTheme}`}>
              <p className={`text-xs ${textMuted}`}>Conversas atuais</p>
              <p className="mt-3 text-3xl font-semibold text-indigo-300">{conversasAtuais}</p>
              <p className={`text-xs ${textMuted}`}>esta semana</p>
            </div>
            <div className={`rounded-2xl border p-5 ${cardTheme}`}>
              <p className={`text-xs ${textMuted}`}>Chats sem respostas</p>
              <p className="mt-3 text-3xl font-semibold text-emerald-400">{summary.semAtendimento}</p>
              <p className={`text-xs ${textMuted}`}>esta semana</p>
            </div>
            <div className={`rounded-2xl border p-5 ${cardTheme}`}>
              <p className={`text-xs ${textMuted}`}>Fontes de lead</p>
              <div className={`mt-5 flex h-24 items-center justify-center rounded-2xl border border-dashed text-xs ${cardBorder} ${textMuted}`}>
                Dados insuficientes para exibir
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className={`rounded-2xl border p-5 ${cardTheme}`}>
              <p className={`text-xs ${textMuted}`}>Tempo de resposta</p>
              <p className="mt-3 text-3xl font-semibold text-emerald-400">0</p>
              <p className={`text-xs ${textMuted}`}>esta semana</p>
            </div>
            <div className={`rounded-2xl border p-5 ${cardTheme}`}>
              <p className={`text-xs ${textMuted}`}>Mais tempo esperando</p>
              <p className="mt-3 text-3xl font-semibold text-indigo-300">0</p>
              <p className={`text-xs ${textMuted}`}>esta semana</p>
            </div>
            <div className={`rounded-2xl border p-5 ${cardTheme}`}>
              <p className={`text-xs ${textMuted}`}>Tarefas</p>
              <p className="mt-3 text-3xl font-semibold text-indigo-300">0</p>
              <p className={`text-xs ${textMuted}`}>esta semana</p>
            </div>
          </div>

          <div className={`rounded-2xl border p-5 ${cardTheme}`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className={`text-sm font-semibold ${textTitle}`}>Funil de vendas</h2>
                <p className={`text-xs ${textMuted}`}>Percentuais sobre o total de leads</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setChartViewIndex((prev) => (prev - 1 + chartViews.length) % chartViews.length)}
                  className={`rounded-full border p-1 ${buttonOutline}`}
                  aria-label="Visualizacao anterior"
                >
                  <FiChevronLeft className="w-4 h-4" />
                </button>
                <span className={`text-xs font-semibold ${textMuted}`}>{activeChartView.label}</span>
                <button
                  type="button"
                  onClick={() => setChartViewIndex((prev) => (prev + 1) % chartViews.length)}
                  className={`rounded-full border p-1 ${buttonOutline}`}
                  aria-label="Proxima visualizacao"
                >
                  <FiChevronRight className="w-4 h-4" />
                </button>
                <FiHelpCircle className={`w-4 h-4 ${textMuted}`} />
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {activeChartView.id === 'bars' && statusOrder.map((status, index) => {
                const data = funnelData.find((item) => item.status === status);
                const count = data?.count || 0;
                let conversionRate = data?.conversionRate || '0,00';
                if (conversionRate.includes('.')) {
                  conversionRate = conversionRate.replace('.', ',');
                }

                const maxCount = Math.max(...statusOrder.map((stage) => {
                  const stageData = funnelData.find((item) => item.status === stage);
                  return stageData?.count || 0;
                }), 1);
                const countBasedWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;
                const funnelMultiplier = Math.max(1 - (index * 0.12), 0.3);
                const finalWidth = Math.max(countBasedWidth * funnelMultiplier, count > 0 ? 25 : 0);

                const label = statusLabels[status];
                let displayLabel = label;
                if (count === 1 && label.endsWith('s') && !label.endsWith('ss')) {
                  displayLabel = label.slice(0, -1);
                }

                return (
                  <div key={status} className="relative">
                    <div
                      className={`flex items-center rounded-lg transition-all duration-300 hover:shadow-lg ${funnelBar}`}
                      style={{ width: `${finalWidth}%`, minHeight: '50px' }}
                    >
                      <div className={`flex-shrink-0 px-4 py-2 text-xs font-semibold uppercase tracking-wide ${funnelText}`}>
                        {count} {displayLabel}
                      </div>
                      <div className="flex-1" />
                      <div className={`flex-shrink-0 px-4 py-2 text-xs font-semibold ${funnelText}`}>
                        {conversionRate}%
                      </div>
                    </div>
                  </div>
                );
              })}

              {activeChartView.id === 'funnel' && (
                <div className="flex flex-col items-center gap-3">
                  {statusOrder.map((status, index) => {
                    const data = funnelData.find((item) => item.status === status);
                    const count = data?.count || 0;
                    let conversionRate = data?.conversionRate || '0,00';
                    if (conversionRate.includes('.')) {
                      conversionRate = conversionRate.replace('.', ',');
                    }

                    const maxCount = Math.max(...statusOrder.map((stage) => {
                      const stageData = funnelData.find((item) => item.status === stage);
                      return stageData?.count || 0;
                    }), 1);
                    const countBasedWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;
                    const funnelMultiplier = Math.max(1 - (index * 0.12), 0.3);
                    const finalWidth = Math.max(countBasedWidth * funnelMultiplier, count > 0 ? 28 : 0);

                    const label = statusLabels[status];
                    let displayLabel = label;
                    if (count === 1 && label.endsWith('s') && !label.endsWith('ss')) {
                      displayLabel = label.slice(0, -1);
                    }

                    return (
                      <div
                        key={status}
                        className={`relative flex flex-col items-center justify-center px-4 py-2 text-xs font-semibold text-center ${funnelText}`}
                        style={{
                          width: `${finalWidth}%`,
                          minWidth: '40%',
                          backgroundColor: isDark ? '#1e3a8a' : '#2563eb',
                          borderRadius: '10px',
                          clipPath: 'polygon(0 0, 100% 0, 92% 100%, 8% 100%)'
                        }}
                      >
                        <span className="uppercase tracking-wide">{count} {displayLabel}</span>
                        <span className="mt-1">{conversionRate}%</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showFiltersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Filtros do dashboard</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data inicial</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data final</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                >
                  <option value="">Todos</option>
                  {statusOrder.map((status) => (
                    <option key={status} value={status}>
                      {statusLabels[status]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Origem</label>
                <select
                  value={filters.origin}
                  onChange={(e) => setFilters((prev) => ({ ...prev, origin: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                >
                  <option value="">Todas</option>
                  {originOptions.map((origin) => (
                    <option key={origin} value={origin}>
                      {origin}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Responsável</label>
                <select
                  value={filters.userId}
                  onChange={(e) => setFilters((prev) => ({ ...prev, userId: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                >
                  <option value="">Todos</option>
                  <option value="unassigned">Sem responsável</option>
                  {userOptions.map((user) => (
                    <option key={user.id} value={String(user.id)}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Produto</label>
                <select
                  value={filters.product}
                  onChange={(e) => setFilters((prev) => ({ ...prev, product: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                >
                  <option value="">Todos</option>
                  {productOptions.map((product) => (
                    <option key={product} value={product}>
                      {product}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowFiltersModal(false)}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 text-sm rounded-lg border border-blue-600 text-blue-600 hover:bg-blue-50"
              >
                Limpar
              </button>
              <button
                onClick={handleApplyFilters}
                className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

