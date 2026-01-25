import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { 
  FiHome, 
  FiUsers, 
  FiCalendar, 
  FiHelpCircle,
  FiDollarSign,
  FiChevronDown,
  FiChevronUp,
  FiMenu,
  FiEye,
  FiBell,
  FiZap,
  FiList,
  FiBarChart2,
  FiRepeat,
  FiVolumeX,
  FiTrash2,
  FiRefreshCw,
  FiInfo,
  FiLogOut,
  FiUser,
  FiMessageCircle
} from 'react-icons/fi';

interface Notification {
  id: number;
  leadName: string;
  date: string;
  time: string;
}

interface Conversation {
  phone: string;
  leadId?: number | null;
  leadName?: string | null;
  lastMessage: string;
  lastAt: string;
  unreadCount: number;
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [leadsMenuOpen, setLeadsMenuOpen] = useState(false);
  const [integrationsMenuOpen, setIntegrationsMenuOpen] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [activeNotificationTab, setActiveNotificationTab] = useState<'notificacoes' | 'atualizacoes'>('notificacoes');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [muted, setMuted] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [whatsappIntegrationActive, setWhatsappIntegrationActive] = useState(false);
  const [showConversationsModal, setShowConversationsModal] = useState(false);
  const [activeConversationTab, setActiveConversationTab] = useState<'unread' | 'all'>('unread');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Verificar se o menu de Leads deve estar aberto baseado na rota atual
  useEffect(() => {
    if (location.pathname.startsWith('/leads')) {
      setLeadsMenuOpen(true);
    }
    if (location.pathname.startsWith('/integrations') || location.pathname.startsWith('/entrada-saida')) {
      setIntegrationsMenuOpen(true);
    }
  }, [location.pathname]);

  // Buscar notificações de novos leads
  useEffect(() => {
    fetchNotifications();
    // Atualizar notificações a cada 30 segundos
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const refreshWhatsAppIntegration = () => {
    try {
      const saved = localStorage.getItem('whatsappIntegrations');
      if (!saved) {
        setWhatsappIntegrationActive(false);
        return;
      }
      const parsed = JSON.parse(saved);
      const hasActive = Array.isArray(parsed) && parsed.some((integration: any) => integration.status === 'active');
      setWhatsappIntegrationActive(hasActive);
    } catch (e) {
      setWhatsappIntegrationActive(false);
    }
  };

  useEffect(() => {
    refreshWhatsAppIntegration();
  }, []);

  useEffect(() => {
    if (!whatsappIntegrationActive) {
      setConversations([]);
      return;
    }
    fetchConversations();
    const interval = setInterval(fetchConversations, 30000);
    return () => clearInterval(interval);
  }, [whatsappIntegrationActive]);

  useEffect(() => {
    if (showConversationsModal) {
      fetchConversations();
    }
  }, [showConversationsModal]);

  // Fechar menu do usuário ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showUserMenu && !target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/leads?status=novo_lead');
      const recentLeads = response.data
        .filter((lead: any) => {
          // Filtrar leads criados nas últimas 24 horas
          const leadDate = new Date(lead.created_at);
          const now = new Date();
          const diffHours = (now.getTime() - leadDate.getTime()) / (1000 * 60 * 60);
          return diffHours <= 24;
        })
        .sort((a: any, b: any) => {
          // Ordenar por data de criação (mais recentes primeiro)
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        })
        .slice(0, 20) // Limitar a 20 notificações
        .map((lead: any) => {
          const date = new Date(lead.created_at);
          const day = date.getDate().toString().padStart(2, '0');
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          const year = date.getFullYear();
          const hours = date.getHours().toString().padStart(2, '0');
          const minutes = date.getMinutes().toString().padStart(2, '0');
          
          return {
            id: lead.id,
            leadName: lead.name,
            date: `${day}/${month}/${year}`,
            time: `${hours}:${minutes}`,
          };
        });
      
      setNotifications(recentLeads);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchConversations = async () => {
    if (!whatsappIntegrationActive) {
      setConversations([]);
      setConversationsLoading(false);
      return;
    }
    setConversationsLoading(true);
    try {
      const response = await api.get('/integrations/whatsapp/conversations');
      setConversations(response.data?.conversations || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setConversationsLoading(false);
    }
  };

  const formatConversationTime = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    if (diffMinutes < 1) return 'agora';
    if (diffMinutes < 60) return `há ${diffMinutes} min`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `há ${diffHours} h`;
    return date.toLocaleDateString('pt-BR');
  };

  const handleOpenConversation = async (conversation: Conversation) => {
    try {
      if (conversation.phone) {
        await api.post('/integrations/whatsapp/mark-read', { phone: conversation.phone });
      }
    } catch (error) {
      console.warn('Erro ao marcar conversa como lida:', error);
    } finally {
      setShowConversationsModal(false);
      if (conversation.leadId) {
        navigate(`/leads/${conversation.leadId}`);
      }
    }
  };

  const handleClearNotifications = () => {
    if (window.confirm('Tem certeza que deseja limpar todas as notificações?')) {
      setNotifications([]);
    }
  };

  const formatNotificationDate = (date: string, time: string) => {
    return `${date} - ${time}`;
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const leadsSubItems = [
    { path: '/leads', icon: FiList, label: 'Listagem' },
    { path: '/leads/andamento', icon: FiBarChart2, label: 'Andamento' },
  ];

  const integrationsSubItems = [
    { path: '/entrada-saida', icon: FiRepeat, label: 'Entrada & Saída' },
  ];

  const totalUnreadConversations = conversations.reduce((sum, item) => sum + (item.unreadCount || 0), 0);
  const unreadConversations = conversations.filter(item => item.unreadCount > 0);

  const menuItems = [
    { path: '/', icon: FiHome, label: 'Dashboard' },
    { icon: FiMessageCircle, label: 'Conversas', onClick: () => { refreshWhatsAppIntegration(); setShowConversationsModal(true); } },
    { path: '/leads', icon: FiUsers, label: 'Leads', hasDropdown: true, subItems: leadsSubItems },
    { path: '/appointments', icon: FiCalendar, label: 'Agendamentos' },
    { icon: FiZap, label: 'Integrações', hasDropdown: true, subItems: integrationsSubItems },
  ];

  const helpItems = [
    { icon: FiDollarSign, label: 'Indique e ganhe' },
    { icon: FiHelpCircle, label: 'Tutoriais' },
    { icon: FiHelpCircle, label: 'Suporte' },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-gray-100 flex flex-col transition-all duration-300 overflow-hidden`}>
        {/* Logo/Title at Top */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className={`flex items-center space-x-3 ${sidebarOpen ? 'block' : 'hidden'}`}>
              {/* Logo Image */}
              <img 
                src="/logo-bia.png" 
                alt="BIA Logo" 
                className="h-14 w-auto flex-shrink-0"
                onError={(e) => {
                  // Fallback se a imagem não for encontrada
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
              <h1 className="text-xl font-bold text-blue-600">Bia CRM</h1>
            </div>
            {/* Menu Toggle Button - Always visible */}
            <button 
              onClick={toggleSidebar}
              className="text-gray-700 hover:text-gray-900 flex-shrink-0"
            >
              <FiMenu className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* User Section */}
        <div className={`p-4 border-b border-gray-200 ${sidebarOpen ? 'block' : 'hidden'}`}>
          <div className="flex items-center space-x-2 text-gray-900">
            <FiHome className="w-5 h-5" />
            <span className="text-sm font-medium truncate">
              {user?.name?.toUpperCase().substring(0, 12)}...
            </span>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className={`flex-1 p-4 space-y-2 ${sidebarOpen ? 'block' : 'flex flex-col items-center space-y-2'}`}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.subItems && item.subItems.some(subItem => location.pathname === subItem.path));
            const isLeadsMenu = item.label === 'Leads';
            const isIntegrationsMenu = item.label === 'Integrações';
            const isMenuOpen = isLeadsMenu ? leadsMenuOpen : (isIntegrationsMenu ? integrationsMenuOpen : false);
            
            return (
              <div key={item.label}>
                <button
                  onClick={() => {
                    if (item.hasDropdown && item.subItems) {
                      if (isLeadsMenu) {
                        setLeadsMenuOpen(!leadsMenuOpen);
                      } else if (isIntegrationsMenu) {
                        setIntegrationsMenuOpen(!integrationsMenuOpen);
                      }
                    } else if (item.onClick) {
                      item.onClick();
                    } else if (item.path) {
                      navigate(item.path);
                    }
                  }}
                  className={`${sidebarOpen ? 'w-full flex items-center justify-between px-4 py-2' : 'w-10 h-10 flex items-center justify-center'} rounded-lg transition-colors ${
                    isActive && !isMenuOpen
                      ? 'bg-blue-600 text-white'
                      : isMenuOpen && (isLeadsMenu || isIntegrationsMenu)
                      ? 'bg-gray-200 text-gray-900'
                      : 'text-gray-700 hover:bg-gray-200'
                  }`}
                  title={!sidebarOpen ? item.label : ''}
                >
                  <div className={`flex items-center ${sidebarOpen ? 'space-x-3' : ''}`}>
                    <Icon className="w-5 h-5" />
                    {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
                  </div>
                  {sidebarOpen && item.hasDropdown && (
                    isMenuOpen ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />
                  )}
                </button>
                
                {/* Submenu Items */}
                {sidebarOpen && isMenuOpen && item.subItems && (
                  <div className="ml-4 mt-1 space-y-1">
                    {item.subItems.map((subItem) => {
                      const SubIcon = subItem.icon;
                      const isSubActive = location.pathname === subItem.path;
                      
                      return (
                        <button
                          key={subItem.path}
                          onClick={() => navigate(subItem.path)}
                          className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors ${
                            isSubActive
                              ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          <SubIcon className="w-4 h-4" />
                          <span className="text-sm font-medium">{subItem.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Help Section */}
        <div className={`p-4 border-t border-gray-200 ${sidebarOpen ? 'block' : 'flex flex-col items-center space-y-1'}`}>
          {sidebarOpen && <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Ajuda</div>}
          <div className={`${sidebarOpen ? 'space-y-1' : 'flex flex-col items-center space-y-1'}`}>
            {helpItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  className={`${sidebarOpen ? 'w-full flex items-center space-x-3 px-4 py-2' : 'w-10 h-10 flex items-center justify-center'} text-sm text-gray-700 hover:bg-gray-200 rounded-lg`}
                  title={!sidebarOpen ? item.label : ''}
                >
                  <Icon className="w-4 h-4" />
                  {sidebarOpen && <span>{item.label}</span>}
                </button>
              );
            })}
          </div>
          {sidebarOpen && (
            <div className="mt-4 text-xs text-gray-500">
              Atendimento de segunda à sexta das 09h às 18h.
            </div>
          )}
        </div>

        {/* Download App */}
        <div className={`p-4 border-t border-gray-200 ${sidebarOpen ? 'block' : 'flex flex-col items-center space-y-2'}`}>
          {sidebarOpen && (
            <div className="text-xs font-semibold text-gray-500 uppercase mb-2">
              Baixe o aplicativo
            </div>
          )}
          <div className={`${sidebarOpen ? 'space-y-2' : 'flex flex-col items-center space-y-2'}`}>
            <button 
              className={`${sidebarOpen ? 'w-full flex items-center space-x-2 px-4 py-2' : 'w-10 h-10 flex items-center justify-center'} text-sm text-gray-700 hover:bg-gray-200 rounded-lg border border-gray-300`}
              title={!sidebarOpen ? 'Google Play' : ''}
            >
              <span>📱</span>
              {sidebarOpen && <span>Google Play</span>}
            </button>
            <button 
              className={`${sidebarOpen ? 'w-full flex items-center space-x-2 px-4 py-2' : 'w-10 h-10 flex items-center justify-center'} text-sm text-gray-700 hover:bg-gray-200 rounded-lg border border-gray-300`}
              title={!sidebarOpen ? 'App Store' : ''}
            >
              <span>🍎</span>
              {sidebarOpen && <span>App Store</span>}
            </button>
          </div>
        </div>

        {/* Footer - Links sempre visíveis na sidebar */}
        <div className={`p-4 border-t border-gray-200 ${sidebarOpen ? 'block' : 'block'}`}>
          <div className="text-xs text-gray-500 space-y-1">
            {sidebarOpen ? (
              <>
                <div className="flex flex-wrap gap-2">
                  <Link
                    to="/user-data-deletion"
                    className="hover:text-primary-600 transition-colors underline"
                  >
                    Exclusão de Dados do Usuário
                  </Link>
                  <span>•</span>
                  <Link 
                    to="/terms-of-service" 
                    className="hover:text-primary-600 transition-colors underline"
                  >
                    Termos de Serviço
                  </Link>
                  <span>•</span>
                  <Link 
                    to="/privacy-policy" 
                    className="hover:text-primary-600 transition-colors underline"
                  >
                    Política de Privacidade
                  </Link>
                  <span>•</span>
                  <Link 
                    to="/bncconsultoria" 
                    className="hover:text-primary-600 transition-colors underline"
                  >
                    BNC Consultoria
                  </Link>
                </div>
                <div>Bia CRM - Gestão de leads para imobiliárias</div>
                <div>© 2024 All Rights Reserved</div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Link
                  to="/user-data-deletion"
                  className="hover:text-primary-600 transition-colors"
                  title="Exclusão de Dados do Usuário"
                >
                  🗑️
                </Link>
                <Link 
                  to="/terms-of-service" 
                  className="hover:text-primary-600 transition-colors"
                  title="Termos de Serviço"
                >
                  📄
                </Link>
                <Link 
                  to="/privacy-policy" 
                  className="hover:text-primary-600 transition-colors"
                  title="Política de Privacidade"
                >
                  🔒
                </Link>
                <Link 
                  to="/bncconsultoria" 
                  className="hover:text-primary-600 transition-colors"
                  title="BNC Consultoria em IA"
                >
                  🚀
                </Link>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-white">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
          {/* Left: Actions */}
          <div className="flex items-center space-x-4" />

          {/* Right: Icons and User */}
          <div className="flex items-center space-x-4">
            <button
              className="relative text-gray-700 hover:text-gray-900"
              onClick={() => {
                refreshWhatsAppIntegration();
                setShowConversationsModal(true);
              }}
              title="Conversas"
            >
              <FiEye className="w-5 h-5" />
              {totalUnreadConversations > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                  {totalUnreadConversations > 99 ? '99+' : totalUnreadConversations}
                </span>
              )}
            </button>
            <button 
              onClick={() => setShowNotificationsModal(true)}
              className="relative text-gray-700 hover:text-gray-900"
            >
              <FiBell className="w-5 h-5" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                  {notifications.length > 9 ? '9+' : notifications.length}
                </span>
              )}
            </button>
            <div className="relative user-menu-container">
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <span className="text-sm">Olá, {user?.name?.toUpperCase()}</span>
                <FiChevronDown className={`w-4 h-4 transition-transform ${showUserMenu ? 'transform rotate-180' : ''}`} />
              </button>
              
              {/* Menu Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="py-2">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <FiLogOut className="w-4 h-4" />
                      <span>Sair</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div 
              className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold cursor-pointer hover:bg-blue-700 transition-colors user-menu-container"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>
        
        {/* Content Area */}
        <div className="flex-1 overflow-auto bg-gray-50">
          <Outlet />
        </div>
        
        {/* Footer Fixo - Links sempre visíveis */}
        <footer className="bg-white border-t border-gray-200 px-6 py-3 flex-shrink-0">
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-gray-500">
            <Link 
              to="/terms-of-service" 
              className="hover:text-primary-600 transition-colors underline"
            >
              Termos de Serviço
            </Link>
            <span className="text-gray-300">•</span>
            <Link 
              to="/privacy-policy" 
              className="hover:text-primary-600 transition-colors underline"
            >
              Política de Privacidade
            </Link>
            <span className="text-gray-300">•</span>
            <Link 
              to="/bncconsultoria" 
              className="hover:text-primary-600 transition-colors underline"
            >
              BNC Consultoria em IA
            </Link>
            <span className="text-gray-300">•</span>
            <span>Bia CRM - Gestão de leads para imobiliárias</span>
            <span className="text-gray-300">•</span>
            <span>© 2024 All Rights Reserved</span>
          </div>
        </footer>
      </main>

      {/* Conversas Drawer */}
      {showConversationsModal && (
        <div
          className="fixed inset-0 z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowConversationsModal(false);
            }
          }}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header do Modal */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-900">Conversas</h2>
                {totalUnreadConversations > 0 && (
                  <span className="w-5 h-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                    {totalUnreadConversations > 99 ? '99+' : totalUnreadConversations}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchConversations}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Atualizar"
                  disabled={!whatsappIntegrationActive}
                >
                  <FiRefreshCw className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setShowConversationsModal(false)}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <span className="text-xl">×</span>
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveConversationTab('unread')}
                className={`flex-1 px-4 py-3 text-sm font-medium relative ${
                  activeConversationTab === 'unread'
                    ? 'text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                disabled={!whatsappIntegrationActive}
              >
                <div className="flex items-center justify-center gap-2">
                  <span>Não lidas</span>
                  {totalUnreadConversations > 0 && (
                    <span className="w-5 h-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                      {totalUnreadConversations > 99 ? '99+' : totalUnreadConversations}
                    </span>
                  )}
                </div>
                {activeConversationTab === 'unread' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
                )}
              </button>
              <button
                onClick={() => setActiveConversationTab('all')}
                className={`flex-1 px-4 py-3 text-sm font-medium relative ${
                  activeConversationTab === 'all'
                    ? 'text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                disabled={!whatsappIntegrationActive}
              >
                Todas
                {activeConversationTab === 'all' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
                )}
              </button>
            </div>

            {/* Conteúdo */}
            <div className="flex-1 overflow-y-auto p-4">
              {!whatsappIntegrationActive ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <FiMessageCircle className="w-12 h-12 mb-4 opacity-50" />
                  <p className="text-sm text-center">
                    A integração com o WhatsApp não foi criada.
                  </p>
                </div>
              ) : conversationsLoading ? (
                <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                  Carregando conversas...
                </div>
              ) : (
                <>
                  {(activeConversationTab === 'unread' ? unreadConversations : conversations).length > 0 ? (
                    <div className="space-y-3">
                      {(activeConversationTab === 'unread' ? unreadConversations : conversations).map((conversation) => (
                        <button
                          key={`${conversation.phone}-${conversation.lastAt}`}
                          onClick={() => handleOpenConversation(conversation)}
                          className="w-full bg-gray-50 rounded-lg p-4 flex items-start gap-3 text-left hover:bg-gray-100 transition-colors"
                        >
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600 flex-shrink-0">
                            <FiMessageCircle className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="text-sm font-semibold text-gray-900 truncate">
                                {conversation.leadName || conversation.phone}
                              </h3>
                              <span className="text-xs text-gray-500 whitespace-nowrap">
                                {formatConversationTime(conversation.lastAt)}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                              {conversation.lastMessage || 'Sem mensagem'}
                            </p>
                          </div>
                          {conversation.unreadCount > 0 && (
                            <span className="w-6 h-6 bg-red-500 rounded-full text-xs text-white flex items-center justify-center flex-shrink-0">
                              {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                      <FiMessageCircle className="w-12 h-12 mb-4 opacity-50" />
                      <p className="text-sm">
                        {activeConversationTab === 'unread' ? 'Nenhuma conversa não lida' : 'Nenhuma conversa encontrada'}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Notificações */}
      {showNotificationsModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-end z-50 p-4 pt-20"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowNotificationsModal(false);
            }
          }}
        >
          <div 
            className="bg-white rounded-lg shadow-xl w-full max-w-md h-[calc(100vh-6rem)] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header do Modal */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-900">Notificações</h2>
                {notifications.length > 0 && (
                  <span className="w-5 h-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                    {notifications.length > 9 ? '9+' : notifications.length}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMuted(!muted)}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  title={muted ? 'Ativar som' : 'Silenciar'}
                >
                  <FiVolumeX className="w-5 h-5" />
                </button>
                <button
                  onClick={handleClearNotifications}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Limpar todas"
                >
                  <FiTrash2 className="w-5 h-5" />
                </button>
                <button
                  onClick={fetchNotifications}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Atualizar"
                >
                  <FiRefreshCw className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setShowNotificationsModal(false)}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <span className="text-xl">×</span>
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveNotificationTab('notificacoes')}
                className={`flex-1 px-4 py-3 text-sm font-medium relative ${
                  activeNotificationTab === 'notificacoes'
                    ? 'text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <span>Notificações</span>
                  {notifications.length > 0 && (
                    <span className="w-5 h-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                      {notifications.length > 9 ? '9+' : notifications.length}
                    </span>
                  )}
                </div>
                {activeNotificationTab === 'notificacoes' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
                )}
              </button>
              <button
                onClick={() => setActiveNotificationTab('atualizacoes')}
                className={`flex-1 px-4 py-3 text-sm font-medium relative ${
                  activeNotificationTab === 'atualizacoes'
                    ? 'text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Atualizações
                {activeNotificationTab === 'atualizacoes' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
                )}
              </button>
            </div>

            {/* Conteúdo das Notificações */}
            <div className="flex-1 overflow-y-auto p-4">
              {activeNotificationTab === 'notificacoes' ? (
                notifications.length > 0 ? (
                  <div className="space-y-3">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className="bg-blue-50 rounded-lg p-4 flex items-start gap-3"
                      >
                        <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <FiInfo className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900 mb-1">
                            Novo cliente cadastrado! - {formatNotificationDate(notification.date, notification.time)}
                          </p>
                          <p className="text-sm text-gray-700">
                            Novo(a) Cliente! <strong>{notification.leadName}</strong> acabou de chegar!
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <FiBell className="w-12 h-12 mb-4 opacity-50" />
                    <p className="text-sm">Nenhuma notificação</p>
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <FiBell className="w-12 h-12 mb-4 opacity-50" />
                  <p className="text-sm">Nenhuma atualização</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

