import { useState } from 'react';
import { FiFilter, FiCalendar, FiFolder } from 'react-icons/fi';

export default function Appointments() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedBroker, setSelectedBroker] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('hoje');

  // Mock data - em produção viria de uma API
  const summaryData = {
    hoje: 0,
    estaSemana: 0,
    proximasSemanas: 0,
    atrasados: 0,
    semAcao: 8,
  };

  const getFilterLabel = () => {
    switch (selectedFilter) {
      case 'hoje':
        return 'Hoje - 0';
      case 'estaSemana':
        return 'Esta semana - 0';
      case 'proximasSemanas':
        return 'Próximas semanas - 0';
      case 'atrasados':
        return 'Atrasados - 0';
      case 'semAcao':
        return 'Sem ação - 8';
      default:
        return 'Hoje - 0';
    }
  };

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
              <option value="broker1">Corretor 1</option>
              <option value="broker2">Corretor 2</option>
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
              <option value="product1">Produto 1</option>
              <option value="product2">Produto 2</option>
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
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {/* Empty State */}
              <tr>
                <td colSpan={5} className="px-6 py-16">
                  <div className="flex flex-col items-center justify-center">
                    <FiFolder className="w-16 h-16 text-gray-300 mb-4" />
                    <p className="text-gray-500 text-sm">Não há dados</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

