import { useEffect, useMemo, useState } from 'react';
import { FiFilter, FiCalendar, FiFolder } from 'react-icons/fi';
import api from '../services/api';

interface Lead {
  id: number;
  name: string;
  phone: string;
  status: string;
  created_at: string;
  user_name?: string;
  custom_data?: any;
}

interface Appointment {
  id: number;
  lead_id: number | null;
  phone: string;
  message: string;
  scheduled_for: string;
  schedule_status: string;
  lead_name?: string | null;
  lead_status?: string | null;
  lead_custom_data?: any;
  user_name?: string | null;
}

const getDisplayStatus = (lead: Pick<Lead, 'status' | 'custom_data'>): string => {
  if (lead.status === 'fechamento') {
    const displayStatus = lead.custom_data?.displayStatus;
    if (displayStatus === 'visita_concluida') {
      return 'visita_concluida';
    }
    if (displayStatus === 'venda_ganha') {
      return 'venda_ganha';
    }
    return 'venda_ganha';
  }
  if (lead.status === 'perdido') {
    const displayStatus = lead.custom_data?.displayStatus;
    if (displayStatus === 'proposta') {
      return 'proposta';
    }
    return 'finalizado';
  }
  const statusMap: Record<string, string> = {
    novo_lead: 'sem_atendimento',
    em_contato: 'em_atendimento',
    proposta_enviada: 'visita_agendada'
  };
  return statusMap[lead.status] || lead.status;
};

export default function Appointments() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedBroker, setSelectedBroker] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('hoje');

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const leadsResponse = await api.get('/leads');
        setLeads(leadsResponse.data || []);
        setAppointments([]);
      } catch (error) {
        console.error('Erro ao carregar agendamentos:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const appointmentsWithLead = useMemo(() => {
    return leads
      .map((lead) => {
        const leadCustom = lead.custom_data || {};
        const visitScheduledAt = leadCustom?.visitScheduledAt;
        if (!visitScheduledAt) return null;
        const displayStatus = getDisplayStatus(lead);
        const product = leadCustom?.product || leadCustom?.produto || null;
        const visitDate = new Date(visitScheduledAt);
        const isPast = !Number.isNaN(visitDate.getTime()) && visitDate < new Date();
        return {
          id: lead.id,
          lead_id: lead.id,
          phone: lead.phone,
          message: '',
          scheduled_for: visitScheduledAt,
          schedule_status: 'pending',
          lead_name: lead.name,
          lead_status: lead.status,
          lead_custom_data: leadCustom,
          user_name: lead.user_name || null,
          leadName: lead.name || 'Lead sem nome',
          leadStatus: lead.status,
          displayStatus,
          leadCustomData: leadCustom,
          product,
          brokerName: lead.user_name || '—',
          isPast
        };
      })
      .filter((item): item is NonNullable<typeof item> => !!item)
      .filter((item) => item.displayStatus === 'visita_agendada')
      .sort((a, b) => {
        const timeA = new Date(a.scheduled_for).getTime();
        const timeB = new Date(b.scheduled_for).getTime();
        if (Number.isNaN(timeA) && Number.isNaN(timeB)) return 0;
        if (Number.isNaN(timeA)) return 1;
        if (Number.isNaN(timeB)) return -1;
        return timeA - timeB;
      });
  }, [leads]);

  const summaryData = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const dayOfWeek = startOfToday.getDay();
    const diffToMonday = (dayOfWeek + 6) % 7;
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - diffToMonday);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    let hoje = 0;
    let estaSemana = 0;
    let proximasSemanas = 0;
    let atrasados = 0;

    appointmentsWithLead.forEach((item) => {
      const scheduledAt = new Date(item.scheduled_for);
      if (Number.isNaN(scheduledAt.getTime())) return;
      if (scheduledAt >= startOfToday && scheduledAt < endOfToday) {
        hoje += 1;
      } else if (scheduledAt >= startOfWeek && scheduledAt < endOfWeek) {
        estaSemana += 1;
      } else if (scheduledAt >= endOfWeek) {
        proximasSemanas += 1;
      }
      if (scheduledAt < startOfToday && item.schedule_status === 'pending') {
        atrasados += 1;
      }
    });

    const leadWithAppointment = new Set(
      appointmentsWithLead.filter((item) => item.lead_id).map((item) => item.lead_id as number)
    );
    const semAcao = leads.filter((lead) => {
      const displayStatus = getDisplayStatus(lead);
      return displayStatus === 'sem_atendimento' && !leadWithAppointment.has(lead.id);
    }).length;

    return { hoje, estaSemana, proximasSemanas, atrasados, semAcao };
  }, [appointmentsWithLead, leads]);

  const getFilterLabel = () => {
    switch (selectedFilter) {
      case 'hoje':
        return `Hoje - ${summaryData.hoje}`;
      case 'estaSemana':
        return `Esta semana - ${summaryData.estaSemana}`;
      case 'proximasSemanas':
        return `Próximas semanas - ${summaryData.proximasSemanas}`;
      case 'atrasados':
        return `Atrasados - ${summaryData.atrasados}`;
      case 'semAcao':
        return `Sem ação - ${summaryData.semAcao}`;
      default:
        return `Hoje - ${summaryData.hoje}`;
    }
  };

  const filteredAppointments = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const dayOfWeek = startOfToday.getDay();
    const diffToMonday = (dayOfWeek + 6) % 7;
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - diffToMonday);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    if (selectedFilter === 'semAcao') {
      const scheduledLeadIds = new Set(
        appointmentsWithLead.filter((item) => item.lead_id).map((item) => item.lead_id as number)
      );
      return leads
        .filter((lead) => getDisplayStatus(lead) === 'sem_atendimento' && !scheduledLeadIds.has(lead.id))
        .map((lead) => {
          const leadCustom = lead.custom_data || {};
          const product = leadCustom?.product || leadCustom?.produto || null;
          return {
            id: lead.id,
            lead_id: lead.id,
            phone: lead.phone,
            message: '',
            scheduled_for: '',
            schedule_status: 'sem_acao',
            lead_name: lead.name,
            lead_status: lead.status,
            lead_custom_data: leadCustom,
            user_name: lead.user_name || null,
            leadName: lead.name || 'Lead sem nome',
            leadStatus: lead.status,
            displayStatus: getDisplayStatus(lead),
            leadCustomData: leadCustom,
            product,
            brokerName: lead.user_name || '—',
            isPast: false
          };
        });
    }

    return appointmentsWithLead.filter((item) => {
      const scheduledAt = new Date(item.scheduled_for);
      if (Number.isNaN(scheduledAt.getTime())) return false;

      if (selectedFilter === 'hoje' && !(scheduledAt >= startOfToday && scheduledAt < endOfToday)) {
        return false;
      }
      if (selectedFilter === 'estaSemana' && !(scheduledAt >= startOfWeek && scheduledAt < endOfWeek && scheduledAt >= endOfToday)) {
        return false;
      }
      if (selectedFilter === 'proximasSemanas' && scheduledAt < endOfWeek) {
        return false;
      }
      if (selectedFilter === 'atrasados' && !(scheduledAt < startOfToday && item.schedule_status === 'pending')) {
        return false;
      }
      if (startDate) {
        const start = new Date(`${startDate}T00:00:00`);
        if (scheduledAt < start) return false;
      }
      if (endDate) {
        const end = new Date(`${endDate}T23:59:59`);
        if (scheduledAt > end) return false;
      }
      if (selectedBroker && item.brokerName !== selectedBroker) return false;
      if (selectedProduct && (item.product || '').toLowerCase().indexOf(selectedProduct.toLowerCase()) === -1) {
        return false;
      }
      return true;
    });
  }, [appointmentsWithLead, selectedFilter, startDate, endDate, selectedBroker, selectedProduct, leads]);

  const brokerOptions = useMemo(() => {
    const options = Array.from(new Set(appointmentsWithLead.map((item) => item.brokerName).filter(Boolean)));
    return options.filter((name) => name && name !== '—');
  }, [appointmentsWithLead]);

  const productOptions = useMemo(() => {
    const options = Array.from(new Set(appointmentsWithLead.map((item) => item.product).filter(Boolean)));
    return options as string[];
  }, [appointmentsWithLead]);

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedBroker('');
    setSelectedProduct('');
    setSelectedFilter('hoje');
  };

  return (
    <div className="p-8 bg-gray-50 min-h-full">
      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Agendamentos</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <button
          onClick={() => setSelectedFilter('hoje')}
          className={`p-4 rounded-lg transition-all text-left ${
            selectedFilter === 'hoje'
              ? 'bg-blue-600 border-2 border-black text-white'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          <div className="text-2xl font-bold mb-1 text-white">{summaryData.hoje}</div>
          <div className="text-sm text-white">Hoje</div>
        </button>

        <button
          onClick={() => setSelectedFilter('estaSemana')}
          className={`p-4 rounded-lg transition-all text-left ${
            selectedFilter === 'estaSemana'
              ? 'bg-blue-600 border-2 border-black text-white'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          <div className="text-2xl font-bold mb-1 text-white">{summaryData.estaSemana}</div>
          <div className="text-sm text-white">Esta semana</div>
        </button>

        <button
          onClick={() => setSelectedFilter('proximasSemanas')}
          className={`p-4 rounded-lg transition-all text-left ${
            selectedFilter === 'proximasSemanas'
              ? 'bg-blue-600 border-2 border-black text-white'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          <div className="text-2xl font-bold mb-1 text-white">{summaryData.proximasSemanas}</div>
          <div className="text-sm text-white">Próximas semanas</div>
        </button>

        <button
          onClick={() => setSelectedFilter('atrasados')}
          className={`p-4 rounded-lg transition-all text-left ${
            selectedFilter === 'atrasados'
              ? 'bg-red-600 border-2 border-black text-white'
              : 'bg-red-600 text-white hover:bg-red-700'
          }`}
        >
          <div className="text-2xl font-bold mb-1 text-white">{summaryData.atrasados}</div>
          <div className="text-sm text-white">Atrasados</div>
        </button>

        <button
          onClick={() => setSelectedFilter('semAcao')}
          className={`p-4 rounded-lg transition-all text-left ${
            selectedFilter === 'semAcao'
              ? 'bg-orange-600 border-2 border-black text-white'
              : 'bg-orange-600 text-white hover:bg-orange-700'
          }`}
        >
          <div className="text-2xl font-bold mb-1 text-white">{summaryData.semAcao}</div>
          <div className="text-sm text-white">Sem ação</div>
        </button>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Filter Label */}
          <div className="text-sm font-medium text-gray-700">
            {getFilterLabel()}
          </div>

          {/* Date Filters */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Data inicial:</label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <FiCalendar className="text-gray-400" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Data final:</label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <FiCalendar className="text-gray-400" />
            </div>
          </div>

          {/* Broker Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Filtrar por Corretor:</label>
            <select
              value={selectedBroker}
              onChange={(e) => setSelectedBroker(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Todos</option>
              {brokerOptions.map((broker) => (
                <option key={broker} value={broker}>{broker}</option>
              ))}
            </select>
          </div>

          {/* Product Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Filtrar por Produto:</label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Todos</option>
              {productOptions.map((product) => (
                <option key={product} value={product}>{product}</option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 ml-auto">
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <FiFilter className="w-4 h-4" />
              <span>Filtrar</span>
            </button>
            <button
              onClick={handleClearFilters}
              className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FiCalendar className="w-4 h-4" />
              <span>Limpar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Cliente</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Produto</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Corretor</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Data atendimento</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-sm text-gray-500">
                    Carregando agendamentos...
                  </td>
                </tr>
              ) : filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16">
                    <div className="flex flex-col items-center justify-center">
                      <FiFolder className="w-16 h-16 text-gray-300 mb-4" />
                      <p className="text-gray-500 text-sm">Não há dados</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 text-sm text-gray-900">{item.leadName}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item.product || '--'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item.brokerName || '--'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {item.scheduled_for ? new Date(item.scheduled_for).toLocaleString('pt-BR') : '--'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {item.schedule_status === 'sem_acao'
                        ? 'Sem ação'
                        : item.isPast && item.schedule_status === 'pending'
                        ? 'Atrasada'
                        : (item.schedule_status === 'pending' ? 'Pendente' : item.schedule_status)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

