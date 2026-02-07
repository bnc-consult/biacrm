import { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { IconType } from 'react-icons';
import api from '../services/api';
import { 
  FiHome, 
  FiBriefcase,
  FiUsers, 
  FiCalendar, 
  FiHelpCircle,
  FiDollarSign,
  FiChevronDown,
  FiChevronUp,
  FiChevronLeft,
  FiChevronRight,
  FiMenu,
  FiEye,
  FiBell,
  FiZap,
  FiList,
  FiBarChart2,
  FiRepeat,
  FiVolumeX,
  FiTrash2,
  FiShield,
  FiLock,
  FiRefreshCw,
  FiX,
  FiInfo,
  FiLogOut,
  FiUser,
  FiUserPlus,
  FiPlus,
  FiEdit2,
  FiMessageCircle,
  FiCpu,
  FiStar
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

interface Collaborator {
  id: number;
  name: string;
  email: string;
  created_at?: string;
}

interface WhiteListItem {
  id: number;
  name?: string | null;
  phone: string;
}

interface FunnelItem {
  id: number;
  name: string;
  statusOrder?: string[];
  isPrimary?: boolean;
}

interface SecurityAdmin {
  id: number;
  name: string;
  email: string;
  role: string;
  companyId?: number | null;
  companyName?: string | null;
  isActive: boolean;
}

interface SecurityCompany {
  id: number;
  name: string;
  email?: string | null;
  planType?: string | null;
  planActive: boolean;
  createdAt?: string | null;
}

type MenuSubItem = {
  path?: string;
  icon: IconType;
  label: string;
  onClick?: () => void;
  onPrimaryAction?: () => void;
  primaryActionIcon?: IconType;
  primaryActionTitle?: string;
  primaryActionActive?: boolean;
  primaryActionDisabled?: boolean;
  onAction?: () => void;
  actionIcon?: IconType;
  actionTitle?: string;
  onSecondaryAction?: () => void;
  secondaryActionIcon?: IconType;
  secondaryActionTitle?: string;
};

type MenuItem = {
  path?: string;
  icon: IconType;
  label: string;
  onClick?: () => void;
  hasDropdown?: boolean;
  subItems?: MenuSubItem[];
};

const normalizePhone = (value?: string) => String(value || '').replace(/\D/g, '');
const getInitials = (value: string) => {
  const parts = value.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const normalizedRole = String(user?.role || '').toLowerCase();
  const isAdmin = normalizedRole === 'admin';
  const isGestor = normalizedRole === 'gestor';
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
  const [conversationsOpen, setConversationsOpen] = useState(false);
  const conversationsCloseTimer = useRef<number | null>(null);
  const whitelistCloseTimer = useRef<number | null>(null);
  const [activeConversationTab, setActiveConversationTab] = useState<'unread' | 'all'>('unread');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [whatsappAvatars, setWhatsappAvatars] = useState<Record<string, string | null>>({});
  const [showCollaboratorModal, setShowCollaboratorModal] = useState(false);
  const [collaboratorName, setCollaboratorName] = useState('');
  const [collaboratorEmail, setCollaboratorEmail] = useState('');
  const [collaboratorPassword, setCollaboratorPassword] = useState('');
  const [collaboratorError, setCollaboratorError] = useState('');
  const [collaboratorSuccess, setCollaboratorSuccess] = useState('');
  const [collaboratorLoading, setCollaboratorLoading] = useState(false);
  const [collaboratorAction, setCollaboratorAction] = useState<'create' | 'update' | 'delete' | null>(null);
  const [collaboratorLimit, setCollaboratorLimit] = useState<number | null>(null);
  const [collaboratorCount, setCollaboratorCount] = useState<number | null>(null);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [collaboratorIndex, setCollaboratorIndex] = useState(0);
  const [isCreateMode, setIsCreateMode] = useState(true);
  const [showWhitelistModal, setShowWhitelistModal] = useState(false);
  const [whitelistOpen, setWhitelistOpen] = useState(false);
  const [whitelistName, setWhitelistName] = useState('');
  const [whitelistPhone, setWhitelistPhone] = useState('');
  const [whitelistItems, setWhitelistItems] = useState<WhiteListItem[]>([]);
  const [whitelistError, setWhitelistError] = useState('');
  const [whitelistSuccess, setWhitelistSuccess] = useState('');
  const [whitelistLoading, setWhitelistLoading] = useState(false);
  const [whitelistFetching, setWhitelistFetching] = useState(false);
  const [whitelistDeletingId, setWhitelistDeletingId] = useState<number | null>(null);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [securityOpen, setSecurityOpen] = useState(false);
  const securityCloseTimer = useRef<number | null>(null);
  const [securityAdmins, setSecurityAdmins] = useState<SecurityAdmin[]>([]);
  const [securityCompanies, setSecurityCompanies] = useState<SecurityCompany[]>([]);
  const [securityLoading, setSecurityLoading] = useState(false);
  const [securityError, setSecurityError] = useState('');
  const [securityUpdatingId, setSecurityUpdatingId] = useState<number | null>(null);
  const [securityDeletingId, setSecurityDeletingId] = useState<number | null>(null);
  const [securityDeletingLeadsId, setSecurityDeletingLeadsId] = useState<number | null>(null);
  const [securityDeletingCompanyId, setSecurityDeletingCompanyId] = useState<number | null>(null);
  const [securityDeletingCompanyLeadsId, setSecurityDeletingCompanyLeadsId] = useState<number | null>(null);
  const [securityTab, setSecurityTab] = useState<'admin' | 'gestor' | 'atendente' | 'companies'>('admin');
  const [securityCompanyFilter, setSecurityCompanyFilter] = useState<'all' | 'none' | number>('all');
  const [funnels, setFunnels] = useState<FunnelItem[]>([]);
  const [funnelsLoading, setFunnelsLoading] = useState(false);
  const [funnelsError, setFunnelsError] = useState('');
  const [showRenameFunnelModal, setShowRenameFunnelModal] = useState(false);
  const [renameFunnelId, setRenameFunnelId] = useState<number | null>(null);
  const [renameFunnelName, setRenameFunnelName] = useState('');
  const [renameFunnelError, setRenameFunnelError] = useState('');
  const [renameFunnelLoading, setRenameFunnelLoading] = useState(false);
  const [showDeleteFunnelModal, setShowDeleteFunnelModal] = useState(false);
  const [deleteFunnelId, setDeleteFunnelId] = useState<number | null>(null);
  const [deleteFunnelName, setDeleteFunnelName] = useState('');
  const [deleteFunnelError, setDeleteFunnelError] = useState('');
  const [deleteFunnelLoading, setDeleteFunnelLoading] = useState(false);

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

  useEffect(() => {
    if (!whatsappIntegrationActive) {
      setWhatsappAvatars({});
      return;
    }
    const items = conversations
      .map((item) => ({
        phone: item.phone,
        key: normalizePhone(item.phone)
      }))
      .filter((item) => item.key);
    const missing = items.filter((item) => !(item.key in whatsappAvatars));
    if (missing.length === 0) return;

    let cancelled = false;
    const fetchAvatars = async () => {
      const results = await Promise.all(
        missing.map(async (item) => {
          try {
            const response = await api.get('/integrations/whatsapp/profile-picture', { params: { phone: item.phone } });
            return { key: item.key, url: response.data?.url || null };
          } catch (error) {
            return { key: item.key, url: null };
          }
        })
      );
      if (cancelled) return;
      setWhatsappAvatars(prev => {
        const next = { ...prev };
        results.forEach(({ key, url }) => {
          next[key] = url;
        });
        return next;
      });
    };

    fetchAvatars();
    return () => {
      cancelled = true;
    };
  }, [conversations, whatsappIntegrationActive, whatsappAvatars]);

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
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();
    const timeFormatter = new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
    const time = timeFormatter.format(date);
    if (isToday) {
      return `Hoje, ${time}`;
    }
    const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    return `${dateFormatter.format(date)}, ${time}`;
  };

  const handleOpenConversation = async (conversation: Conversation) => {
    try {
      if (conversation.phone) {
        await api.post('/integrations/whatsapp/mark-read', { phone: conversation.phone });
      }
    } catch (error) {
      console.warn('Erro ao marcar conversa como lida:', error);
    } finally {
      handleCloseConversations();
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

  const handleOpenConversations = () => {
    if (conversationsCloseTimer.current) {
      window.clearTimeout(conversationsCloseTimer.current);
      conversationsCloseTimer.current = null;
    }
    refreshWhatsAppIntegration();
    setShowConversationsModal(true);
    requestAnimationFrame(() => setConversationsOpen(true));
  };

  const handleCloseConversations = () => {
    setConversationsOpen(false);
    conversationsCloseTimer.current = window.setTimeout(() => {
      setShowConversationsModal(false);
      conversationsCloseTimer.current = null;
    }, 250);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const fetchCompanyPlan = async () => {
    try {
      const response = await api.get('/company/plan');
      setCollaboratorLimit(response.data.maxCollaborators ?? null);
      setCollaboratorCount(response.data.currentCollaborators ?? null);
    } catch (error) {
      console.error('Erro ao buscar plano da empresa:', error);
    }
  };

  const fetchCollaborators = async () => {
    try {
      const response = await api.get('/company/collaborators');
      const list = response.data?.collaborators || [];
      setCollaborators(list);
      setCollaboratorCount(typeof response.data?.count === 'number' ? response.data.count : list.length);
      return list as Collaborator[];
    } catch (error) {
      console.error('Erro ao buscar colaboradores:', error);
      return [];
    }
  };

  const resetCollaboratorForm = () => {
    setCollaboratorName('');
    setCollaboratorEmail('');
    setCollaboratorPassword('');
  };

  const handleOpenCollaborators = async () => {
    setCollaboratorError('');
    setCollaboratorSuccess('');
    resetCollaboratorForm();
    setShowCollaboratorModal(true);
    await fetchCompanyPlan();
    const list = await fetchCollaborators();
    if (list.length > 0) {
      setCollaboratorIndex(0);
      setIsCreateMode(false);
    } else {
      setIsCreateMode(true);
    }
  };

  const handleCreateCollaborator = async () => {
    setCollaboratorError('');
    setCollaboratorSuccess('');
    if (!collaboratorName || !collaboratorEmail || !collaboratorPassword) {
      setCollaboratorError('Preencha nome, email e senha do colaborador.');
      return;
    }
    setCollaboratorLoading(true);
    setCollaboratorAction('create');
    try {
      const response = await api.post('/company/collaborators', {
        name: collaboratorName,
        email: collaboratorEmail,
        password: collaboratorPassword
      });
      setCollaboratorSuccess(response.data?.message || 'Colaborador cadastrado com sucesso.');
      await fetchCollaborators();
      await fetchCompanyPlan();
      setIsCreateMode(true);
      resetCollaboratorForm();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Erro ao cadastrar colaborador.';
      setCollaboratorError(errorMessage);
    } finally {
      setCollaboratorLoading(false);
      setCollaboratorAction(null);
    }
  };

  const handleUpdateCollaborator = async () => {
    setCollaboratorError('');
    setCollaboratorSuccess('');
    const active = collaborators[collaboratorIndex];
    if (!active) {
      setCollaboratorError('Selecione um colaborador para alterar.');
      return;
    }
    if (!collaboratorName || !collaboratorEmail) {
      setCollaboratorError('Preencha nome e email do colaborador.');
      return;
    }
    setCollaboratorLoading(true);
    setCollaboratorAction('update');
    try {
      const payload: { name?: string; email?: string; password?: string } = {
        name: collaboratorName,
        email: collaboratorEmail
      };
      if (collaboratorPassword) {
        payload.password = collaboratorPassword;
      }
      const response = await api.put(`/company/collaborators/${active.id}`, payload);
      setCollaboratorSuccess(response.data?.message || 'Colaborador atualizado com sucesso.');
      await fetchCollaborators();
      setCollaboratorPassword('');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Erro ao atualizar colaborador.';
      setCollaboratorError(errorMessage);
    } finally {
      setCollaboratorLoading(false);
      setCollaboratorAction(null);
    }
  };

  const handleDeleteCollaborator = async () => {
    setCollaboratorError('');
    setCollaboratorSuccess('');
    const active = collaborators[collaboratorIndex];
    if (!active) {
      setCollaboratorError('Selecione um colaborador para excluir.');
      return;
    }
    if (!window.confirm('Deseja realmente excluir este colaborador?')) {
      return;
    }
    setCollaboratorLoading(true);
    setCollaboratorAction('delete');
    try {
      const response = await api.delete(`/company/collaborators/${active.id}`);
      setCollaboratorSuccess(response.data?.message || 'Colaborador excluído com sucesso.');
      const list = await fetchCollaborators();
      await fetchCompanyPlan();
      if (list.length === 0) {
        setIsCreateMode(true);
        setCollaboratorIndex(0);
        resetCollaboratorForm();
      } else {
        setCollaboratorIndex((prev) => Math.min(prev, list.length - 1));
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Erro ao excluir colaborador.';
      setCollaboratorError(errorMessage);
    } finally {
      setCollaboratorLoading(false);
      setCollaboratorAction(null);
    }
  };

  const handlePreviousCollaborator = () => {
    if (collaborators.length === 0) return;
    setIsCreateMode(false);
    setCollaboratorIndex((prev) => (prev - 1 + collaborators.length) % collaborators.length);
  };

  const handleNextCollaborator = () => {
    if (collaborators.length === 0) return;
    setIsCreateMode(false);
    setCollaboratorIndex((prev) => (prev + 1) % collaborators.length);
  };

  const handleCreateMode = () => {
    setIsCreateMode(true);
    setCollaboratorError('');
    setCollaboratorSuccess('');
    resetCollaboratorForm();
  };

  const fetchFunnels = async () => {
    setFunnelsLoading(true);
    try {
      const response = await api.get('/funnels');
      const list = Array.isArray(response.data) ? response.data : [];
      const normalized = list.map((item: any) => ({
        ...item,
        isPrimary: item?.isPrimary ?? item?.is_primary ?? false
      }));
      setFunnels(normalized);
      setFunnelsError('');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Erro ao carregar funis.';
      setFunnelsError(message);
      setFunnels([]);
    } finally {
      setFunnelsLoading(false);
    }
  };

  const handleCreateFunnel = async () => {
    try {
      const response = await api.post('/funnels');
      const created = response.data;
      await fetchFunnels();
      if (created?.id) {
        navigate(`/leads/andamento/${created.id}`);
      }
      setLeadsMenuOpen(true);
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Erro ao criar funil.';
      setFunnelsError(message);
    }
  };

  const handleOpenRenameFunnel = (funnel: FunnelItem) => {
    setRenameFunnelId(funnel.id);
    setRenameFunnelName(funnel.name || '');
    setRenameFunnelError('');
    setShowRenameFunnelModal(true);
  };

  const handleSetPrimaryFunnel = async (funnel: FunnelItem) => {
    if (!funnel?.id || funnel.isPrimary) return;
    try {
      await api.put(`/funnels/${funnel.id}`, { isPrimary: true, is_primary: true });
      await fetchFunnels();
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Erro ao definir funil principal.';
      setFunnelsError(message);
    }
  };

  const handleRenameFunnel = async () => {
    if (!renameFunnelId) return;
    const nextName = renameFunnelName.trim();
    if (!nextName) {
      setRenameFunnelError('Informe o nome do funil.');
      return;
    }
    setRenameFunnelLoading(true);
    setRenameFunnelError('');
    try {
      await api.put(`/funnels/${renameFunnelId}`, { name: nextName });
      await fetchFunnels();
      setShowRenameFunnelModal(false);
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Erro ao renomear funil.';
      setRenameFunnelError(message);
    } finally {
      setRenameFunnelLoading(false);
    }
  };

  const handleOpenDeleteFunnel = (funnel: FunnelItem) => {
    setDeleteFunnelId(funnel.id);
    setDeleteFunnelName(funnel.name || '');
    setDeleteFunnelError('');
    setShowDeleteFunnelModal(true);
  };

  const handleDeleteFunnel = async () => {
    if (!deleteFunnelId) return;
    setDeleteFunnelLoading(true);
    setDeleteFunnelError('');
    try {
      await api.delete(`/funnels/${deleteFunnelId}`);
      await fetchFunnels();
      setShowDeleteFunnelModal(false);
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Erro ao excluir funil.';
      setDeleteFunnelError(message);
    } finally {
      setDeleteFunnelLoading(false);
    }
  };

  const handleOpenWhitelist = () => {
    if (whitelistCloseTimer.current) {
      window.clearTimeout(whitelistCloseTimer.current);
      whitelistCloseTimer.current = null;
    }
    setWhitelistError('');
    setWhitelistSuccess('');
    setShowWhitelistModal(true);
    requestAnimationFrame(() => setWhitelistOpen(true));
  };

  const handleCloseWhitelist = () => {
    setWhitelistOpen(false);
    whitelistCloseTimer.current = window.setTimeout(() => {
      setShowWhitelistModal(false);
      whitelistCloseTimer.current = null;
    }, 250);
  };

  const fetchWhitelist = async () => {
    setWhitelistFetching(true);
    try {
      const response = await api.get('/leads/whitelist');
      setWhitelistItems(Array.isArray(response.data) ? response.data : []);
      setWhitelistError('');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Erro ao carregar white list.';
      setWhitelistError(message);
    } finally {
      setWhitelistFetching(false);
    }
  };

  const handleCreateWhitelist = async () => {
    const phoneDigits = whitelistPhone.replace(/\D/g, '');
    if (!phoneDigits) {
      setWhitelistError('Informe um número de celular válido.');
      return;
    }
    setWhitelistLoading(true);
    setWhitelistError('');
    setWhitelistSuccess('');
    try {
      await api.post('/leads/whitelist', {
        phone: phoneDigits,
        name: whitelistName.trim() || null
      });
      setWhitelistName('');
      setWhitelistPhone('');
      setWhitelistSuccess('Número adicionado à white list.');
      await fetchWhitelist();
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Erro ao salvar número.';
      setWhitelistError(message);
    } finally {
      setWhitelistLoading(false);
    }
  };

  const handleDeleteWhitelist = async (itemId: number) => {
    if (!window.confirm('Deseja remover este número da white list?')) return;
    setWhitelistDeletingId(itemId);
    setWhitelistError('');
    setWhitelistSuccess('');
    try {
      await api.delete(`/leads/whitelist/${itemId}`);
      setWhitelistSuccess('Número removido da white list.');
      await fetchWhitelist();
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Erro ao remover número.';
      setWhitelistError(message);
    } finally {
      setWhitelistDeletingId(null);
    }
  };

  const handleOpenSecurity = () => {
    if (securityCloseTimer.current) {
      window.clearTimeout(securityCloseTimer.current);
      securityCloseTimer.current = null;
    }
    setSecurityError('');
    setSecurityTab('admin');
    setShowSecurityModal(true);
    requestAnimationFrame(() => setSecurityOpen(true));
  };

  const handleCloseSecurity = () => {
    setSecurityOpen(false);
    securityCloseTimer.current = window.setTimeout(() => {
      setShowSecurityModal(false);
      securityCloseTimer.current = null;
    }, 250);
  };

  const fetchSecurityAdmins = async () => {
    setSecurityLoading(true);
    setSecurityError('');
    try {
      const response = await api.get('/security/admins');
      setSecurityAdmins(Array.isArray(response.data) ? response.data : []);
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Erro ao carregar administradores.';
      setSecurityError(message);
      setSecurityAdmins([]);
    } finally {
      setSecurityLoading(false);
    }
  };

  const fetchSecurityCompanies = async () => {
    setSecurityLoading(true);
    setSecurityError('');
    try {
      const response = await api.get('/security/companies');
      setSecurityCompanies(Array.isArray(response.data) ? response.data : []);
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Erro ao carregar empresas.';
      setSecurityError(message);
      setSecurityCompanies([]);
    } finally {
      setSecurityLoading(false);
    }
  };

  const handleToggleAdminStatus = async (admin: SecurityAdmin) => {
    setSecurityUpdatingId(admin.id);
    setSecurityError('');
    try {
      await api.patch(`/security/admins/${admin.id}/status`, { isActive: !admin.isActive });
      await fetchSecurityAdmins();
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Erro ao atualizar status.';
      setSecurityError(message);
    } finally {
      setSecurityUpdatingId(null);
    }
  };

  const handleRemoveAdminCompany = async (admin: SecurityAdmin) => {
    if (!window.confirm(`Deseja remover ${admin.name} da empresa?`)) return;
    setSecurityDeletingId(admin.id);
    setSecurityError('');
    try {
      await api.delete(`/security/admins/${admin.id}/company`);
      await fetchSecurityAdmins();
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Erro ao remover administrador.';
      setSecurityError(message);
    } finally {
      setSecurityDeletingId(null);
    }
  };

  const handleDeleteCompanyLeads = async (admin: SecurityAdmin) => {
    if (!admin.companyId) {
      setSecurityError('Empresa não vinculada ao administrador.');
      return;
    }
    const companyName = admin.companyName || 'esta empresa';
    const confirmMessage =
      `ATENÇÃO! Esta ação excluirá definitivamente todos os leads e informações relacionadas de ${companyName}. ` +
      'Esta ação não pode ser desfeita. Deseja continuar?';
    if (!window.confirm(confirmMessage)) return;
    setSecurityDeletingLeadsId(admin.id);
    setSecurityError('');
    try {
      await api.delete(`/security/admins/${admin.id}/leads`);
      await fetchSecurityAdmins();
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Erro ao excluir leads da empresa.';
      setSecurityError(message);
    } finally {
      setSecurityDeletingLeadsId(null);
    }
  };

  const handleDeleteCompany = async (company: SecurityCompany) => {
    const companyName = company.name || 'esta empresa';
    const confirmMessage =
      `ATENÇÃO! Esta ação excluirá definitivamente a empresa ${companyName} e todos os dados relacionados. ` +
      'Esta ação não pode ser desfeita. Deseja continuar?';
    if (!window.confirm(confirmMessage)) return;
    setSecurityDeletingCompanyId(company.id);
    setSecurityError('');
    try {
      await api.delete(`/security/companies/${company.id}`);
      await fetchSecurityCompanies();
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Erro ao excluir empresa.';
      setSecurityError(message);
    } finally {
      setSecurityDeletingCompanyId(null);
    }
  };

  const handleDeleteCompanyLeadsFromCompany = async (company: SecurityCompany) => {
    const companyName = company.name || 'esta empresa';
    const confirmMessage =
      `ATENÇÃO! Esta ação excluirá definitivamente todos os leads e informações relacionadas de ${companyName}. ` +
      'Esta ação não pode ser desfeita. Deseja continuar?';
    if (!window.confirm(confirmMessage)) return;
    setSecurityDeletingCompanyLeadsId(company.id);
    setSecurityError('');
    try {
      await api.delete(`/security/companies/${company.id}/leads`);
      await fetchSecurityCompanies();
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Erro ao excluir leads da empresa.';
      setSecurityError(message);
    } finally {
      setSecurityDeletingCompanyLeadsId(null);
    }
  };

  useEffect(() => {
    if (!showCollaboratorModal) return;
    if (!isCreateMode && collaborators.length > 0) {
      const active = collaborators[collaboratorIndex];
      if (active) {
        setCollaboratorName(active.name || '');
        setCollaboratorEmail(active.email || '');
        setCollaboratorPassword('');
      }
    }
  }, [collaborators, collaboratorIndex, isCreateMode, showCollaboratorModal]);

  useEffect(() => {
    if (showWhitelistModal) {
      fetchWhitelist();
    }
  }, [showWhitelistModal]);

  useEffect(() => {
    if (showSecurityModal) {
      fetchSecurityAdmins();
      fetchSecurityCompanies();
    }
  }, [showSecurityModal]);

  useEffect(() => {
    if (user) {
      fetchFunnels();
    }
  }, [user]);

  const funnelSubItems: MenuSubItem[] = funnels.length
    ? funnels.map((funnel) => ({
        path: `/leads/andamento/${funnel.id}`,
        icon: FiBarChart2,
        label: funnel.name || 'Funil',
        onPrimaryAction: isAdmin ? () => handleSetPrimaryFunnel(funnel) : undefined,
        primaryActionIcon: FiStar,
        primaryActionTitle: funnel.isPrimary ? 'Funil principal' : 'Definir como funil principal',
        primaryActionActive: !!funnel.isPrimary,
        primaryActionDisabled: !isAdmin,
        onAction: isAdmin ? () => handleOpenRenameFunnel(funnel) : undefined,
        actionIcon: isAdmin ? FiEdit2 : undefined,
        actionTitle: isAdmin ? 'Renomear funil' : undefined,
        onSecondaryAction: isAdmin ? () => handleOpenDeleteFunnel(funnel) : undefined,
        secondaryActionIcon: isAdmin ? FiTrash2 : undefined,
        secondaryActionTitle: isAdmin ? 'Excluir funil' : undefined,
      }))
    : [{ path: '/leads/andamento', icon: FiBarChart2, label: 'Funil 1' }];

  const leadsSubItems: MenuSubItem[] = [
    { path: '/leads', icon: FiList, label: 'Listagem' },
    ...funnelSubItems,
    ...(isAdmin
      ? [{ icon: FiPlus, label: 'Adicionar funil', onClick: handleCreateFunnel }]
      : []),
    ...(isAdmin
      ? [{ icon: FiShield, label: 'White List', onClick: handleOpenWhitelist }]
      : []),
  ];

  const integrationsSubItems: MenuSubItem[] = [
    { path: '/entrada-saida', icon: FiRepeat, label: 'Entrada & Saída' },
  ];

  const totalUnreadConversations = conversations.reduce((sum, item) => sum + (item.unreadCount || 0), 0);
  const unreadConversations = conversations.filter(item => item.unreadCount > 0);
  const isLimitReached =
    collaboratorLimit !== null &&
    collaboratorCount !== null &&
    collaboratorCount >= collaboratorLimit;
  const isArchitecture = Boolean(user?.isArchitecture);

  const menuItems: MenuItem[] = [
    { path: '/', icon: FiHome, label: 'Dashboard' },
    { path: '/ai', icon: FiCpu, label: 'BIA Inteligência' },
    { icon: FiMessageCircle, label: 'Conversas', onClick: handleOpenConversations },
    { path: '/leads', icon: FiUsers, label: 'Leads', hasDropdown: true, subItems: leadsSubItems },
    { path: '/appointments', icon: FiCalendar, label: 'Agendamentos' },
    { icon: FiZap, label: 'Integrações', hasDropdown: true, subItems: integrationsSubItems },
  ];

  if (isAdmin || isGestor) {
    const integrationsIndex = menuItems.findIndex(item => item.label === 'Integrações');
    const insertIndex = integrationsIndex >= 0 ? integrationsIndex + 1 : menuItems.length;
    menuItems.splice(insertIndex, 0, {
      icon: FiUserPlus,
      label: 'Colaboradores',
      onClick: handleOpenCollaborators
    });
  }

  if (isArchitecture) {
    menuItems.push({
      icon: FiLock,
      label: 'Segurança',
      onClick: handleOpenSecurity
    });
  }


  const helpItems: Array<{
    icon: IconType;
    label: string;
    href?: string;
    onClick?: () => void;
  }> = [
    { icon: FiHelpCircle, label: 'Conheça nossos Planos', href: '/landingpage' },
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
            <FiBriefcase className="w-5 h-5" />
            <span className="text-sm font-medium truncate">
              {(user?.companyName || user?.name || '').toUpperCase().substring(0, 12)}...
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
                  title={item.label}
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
                      const isSubActive = subItem.path ? location.pathname === subItem.path : false;
                      const PrimaryActionIcon = subItem.primaryActionIcon;
                      const ActionIcon = subItem.actionIcon;
                      const SecondaryActionIcon = subItem.secondaryActionIcon;
                      
                      return (
                        <div key={subItem.path || subItem.label} className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              if (subItem.onClick) {
                                subItem.onClick();
                                return;
                              }
                              if (subItem.path) {
                                navigate(subItem.path);
                              }
                            }}
                            className={`flex-1 flex items-center justify-start text-left gap-3 px-4 py-2 rounded-lg transition-colors whitespace-nowrap overflow-hidden ${
                              isSubActive
                                ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                            title={subItem.label}
                          >
                            <SubIcon className="w-4 h-4" />
                            <span
                              className="text-sm font-medium text-left flex-1 min-w-0"
                              style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                            >
                              {subItem.label}
                            </span>
                          </button>
                          {PrimaryActionIcon && (subItem.onPrimaryAction || subItem.primaryActionDisabled === true) && (
                            <button
                              type="button"
                              onClick={subItem.onPrimaryAction}
                              disabled={!subItem.onPrimaryAction || subItem.primaryActionDisabled}
                              className={`p-2 rounded-lg transition-colors ${
                                subItem.primaryActionActive
                                  ? 'text-yellow-400'
                                  : 'text-gray-300'
                              } ${
                                subItem.onPrimaryAction && !subItem.primaryActionDisabled
                                  ? 'hover:text-yellow-500 hover:bg-yellow-50'
                                  : 'cursor-not-allowed'
                              }`}
                              title={subItem.primaryActionActive ? 'Funil principal' : 'Definir como funil principal'}
                              aria-label={subItem.primaryActionActive ? 'Funil principal' : 'Definir como funil principal'}
                              aria-pressed={subItem.primaryActionActive}
                            >
                              <PrimaryActionIcon className={`w-4 h-4 ${subItem.primaryActionActive ? 'fill-current' : ''}`} />
                            </button>
                          )}
                          {subItem.onAction && ActionIcon && (
                            <button
                              type="button"
                              onClick={subItem.onAction}
                              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                              title={subItem.actionTitle || 'Ação'}
                            >
                              <ActionIcon className="w-4 h-4" />
                            </button>
                          )}
                          {subItem.onSecondaryAction && SecondaryActionIcon && (
                            <button
                              type="button"
                              onClick={subItem.onSecondaryAction}
                              className="p-2 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50"
                              title={subItem.secondaryActionTitle || 'Excluir'}
                            >
                              <SecondaryActionIcon className="w-4 h-4" />
                            </button>
                          )}
                        </div>
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
              const content = (
                <>
                  <Icon className="w-4 h-4" />
                  {sidebarOpen && <span>{item.label}</span>}
                </>
              );

              if (item.href) {
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    className={`${sidebarOpen ? 'w-full flex items-center space-x-3 px-4 py-2' : 'w-10 h-10 flex items-center justify-center'} text-sm text-gray-700 hover:bg-gray-200 rounded-lg`}
                    title={!sidebarOpen ? item.label : ''}
                  >
                    {content}
                  </a>
                );
              }

              return (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className={`${sidebarOpen ? 'w-full flex items-center space-x-3 px-4 py-2' : 'w-10 h-10 flex items-center justify-center'} text-sm text-gray-700 hover:bg-gray-200 rounded-lg`}
                  title={!sidebarOpen ? item.label : ''}
                >
                  {content}
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
              onClick={handleOpenConversations}
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
          className="fixed inset-y-0 right-0 z-50"
          style={{ left: sidebarOpen ? '16rem' : '4rem' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseConversations();
            }
          }}
        >
          <div
            className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
              conversationsOpen ? 'opacity-100' : 'opacity-0'
            }`}
          />
          <div
            className={`absolute left-0 top-0 h-full w-full max-w-md bg-white shadow-xl flex flex-col transform transition-transform duration-300 ease-out ${
              conversationsOpen ? 'translate-x-0' : '-translate-x-8'
            }`}
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
                  onClick={handleCloseConversations}
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
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden border border-blue-200 flex-shrink-0">
                            {(() => {
                              const phoneKey = normalizePhone(conversation.phone);
                              const avatarUrl = phoneKey ? whatsappAvatars[phoneKey] : null;
                              if (avatarUrl) {
                                return <img src={avatarUrl} alt="Foto do lead" className="w-full h-full object-cover" />;
                              }
                              const label = conversation.leadName || conversation.phone || 'Lead';
                              return (
                                <span className="text-blue-700 text-xs font-semibold">
                                  {getInitials(label)}
                                </span>
                              );
                            })()}
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

      {showCollaboratorModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCollaboratorModal(false);
            }
          }}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600 text-white">B</div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Colaboradores</h3>
                  <p className="text-xs text-gray-500">Limite conforme o plano</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePreviousCollaborator}
                  disabled={collaborators.length === 0}
                  className="rounded-md border border-gray-200 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-50"
                  title="Colaborador anterior"
                >
                  <FiChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextCollaborator}
                  disabled={collaborators.length === 0}
                  className="rounded-md border border-gray-200 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-50"
                  title="Próximo colaborador"
                >
                  <FiChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {collaboratorLimit !== null && collaboratorCount !== null && (
              <div className="mt-3 text-xs text-gray-500">
                Colaboradores cadastrados: {collaboratorCount}/{collaboratorLimit}
                {!isCreateMode && collaborators.length > 0 && (
                  <span className="ml-2">• Visualizando {collaboratorIndex + 1} de {collaborators.length}</span>
                )}
              </div>
            )}

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome do colaborador</label>
                <input
                  type="text"
                  value={collaboratorName}
                  onChange={(e) => setCollaboratorName(e.target.value)}
                  disabled={isLimitReached && isCreateMode}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email de acesso</label>
                <input
                  type="email"
                  value={collaboratorEmail}
                  onChange={(e) => setCollaboratorEmail(e.target.value)}
                  disabled={isLimitReached && isCreateMode}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Senha</label>
                <input
                  type="password"
                  value={collaboratorPassword}
                  onChange={(e) => setCollaboratorPassword(e.target.value)}
                  disabled={isLimitReached && isCreateMode}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:text-gray-500"
                />
              </div>
            </div>

            {collaboratorError && <div className="mt-3 text-sm text-red-600">{collaboratorError}</div>}
            {collaboratorSuccess && <div className="mt-3 text-sm text-green-600">{collaboratorSuccess}</div>}
            {isLimitReached && isCreateMode && (
              <div className="mt-3 text-xs text-gray-500">
                Limite do plano atingido. Exclua um colaborador para cadastrar outro.
              </div>
            )}

            <div className="mt-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCreateMode}
                  className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-100 disabled:opacity-60"
                  disabled={collaboratorLoading || isLimitReached}
                >
                  Novo
                </button>
                <button
                  type="button"
                  onClick={handleDeleteCollaborator}
                  className="rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
                  disabled={isCreateMode || collaborators.length === 0 || collaboratorLoading}
                >
                  {collaboratorAction === 'delete' ? 'Excluindo...' : 'Excluir'}
                </button>
                <button
                  type="button"
                  onClick={handleUpdateCollaborator}
                  className="rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-60"
                  disabled={isCreateMode || collaborators.length === 0 || collaboratorLoading}
                >
                  {collaboratorAction === 'update' ? 'Salvando...' : 'Alterar'}
                </button>
              </div>
              <button
                type="button"
                onClick={() => setShowCollaboratorModal(false)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCreateCollaborator}
                className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
                disabled={collaboratorLoading || !isCreateMode || isLimitReached}
              >
                {collaboratorAction === 'create' ? 'Salvando...' : 'Cadastrar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showWhitelistModal && (
        <div
          className="fixed inset-y-0 right-0 z-50"
          style={{ left: sidebarOpen ? '16rem' : '4rem' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseWhitelist();
            }
          }}
        >
          <div
            className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
              whitelistOpen ? 'opacity-100' : 'opacity-0'
            }`}
          />
          <div
            className={`absolute left-0 top-0 h-full w-full max-w-lg bg-white shadow-xl flex flex-col transform transition-transform duration-300 ease-out ${
              whitelistOpen ? 'translate-x-0' : '-translate-x-8'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 p-4 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">White List</h3>
                <p className="text-xs text-gray-500">
                  Números cadastrados aqui não geram leads automaticamente.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseWhitelist}
                className="text-gray-500 hover:text-gray-700"
                title="Fechar"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nome do lead (opcional)</label>
                  <input
                    type="text"
                    value={whitelistName}
                    onChange={(e) => setWhitelistName(e.target.value)}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Número de celular</label>
                  <input
                    type="text"
                    value={whitelistPhone}
                    onChange={(e) => setWhitelistPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              {whitelistError && (
                <div className="mt-3 text-sm text-red-600">
                  {whitelistError}
                  {whitelistError.toLowerCase().includes('empresa não vinculada') && (
                    <div className="text-xs text-red-500 mt-1">
                      Vincule o usuário a uma empresa para usar a white list.
                    </div>
                  )}
                </div>
              )}
              {whitelistSuccess && <div className="mt-3 text-sm text-green-600">{whitelistSuccess}</div>}

              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseWhitelist}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleCreateWhitelist}
                  className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
                  disabled={whitelistLoading}
                >
                  {whitelistLoading ? 'Salvando...' : 'Adicionar'}
                </button>
              </div>

              <div className="mt-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Números cadastrados</h4>
                {whitelistFetching ? (
                  <div className="text-sm text-gray-500">Carregando...</div>
                ) : whitelistItems.length === 0 ? (
                  <div className="text-sm text-gray-500">Nenhum número cadastrado.</div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {whitelistItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-3 rounded-md border border-gray-200 px-3 py-2">
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {item.name ? item.name : 'Sem nome'}
                          </div>
                          <div className="text-xs text-gray-500">{item.phone}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteWhitelist(item.id)}
                          disabled={whitelistDeletingId === item.id}
                          className="text-red-600 hover:text-red-700 disabled:opacity-60"
                          title="Remover"
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showSecurityModal && (
        <div
          className="fixed inset-y-0 right-0 z-50"
          style={{ left: sidebarOpen ? '16rem' : '4rem' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseSecurity();
            }
          }}
        >
          <div
            className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
              securityOpen ? 'opacity-100' : 'opacity-0'
            }`}
          />
          <div
            className={`absolute left-0 top-0 h-full w-full max-w-lg bg-white shadow-xl flex flex-col transform transition-transform duration-300 ease-out ${
              securityOpen ? 'translate-x-0' : '-translate-x-8'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 p-4 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Segurança</h3>
                <p className="text-xs text-gray-500">Administradores, empresas e status.</p>
              </div>
              <button
                type="button"
                onClick={handleCloseSecurity}
                className="text-gray-500 hover:text-gray-700"
                title="Fechar"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 pt-4">
              <div className="flex items-center gap-3 border-b border-gray-200">
                <button
                  type="button"
                  onClick={() => setSecurityTab('admin')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    securityTab === 'admin'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Administradores
                </button>
                <button
                  type="button"
                  onClick={() => setSecurityTab('gestor')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    securityTab === 'gestor'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Gestores
                </button>
                <button
                  type="button"
                  onClick={() => setSecurityTab('atendente')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    securityTab === 'atendente'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Colaboradores
                </button>
                <button
                  type="button"
                  onClick={() => setSecurityTab('companies')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    securityTab === 'companies'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Empresas
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {securityError && (
                <div className="mb-4 text-sm text-red-600">{securityError}</div>
              )}
              {securityLoading ? (
                <div className="text-sm text-gray-500">
                  {securityTab === 'companies' ? 'Carregando empresas...' : 'Carregando administradores...'}
                </div>
              ) : securityTab === 'companies' ? (
                securityCompanies.length === 0 ? (
                  <div className="text-sm text-gray-500">Nenhuma empresa encontrada.</div>
                ) : (
                  <div className="space-y-3">
                    {securityCompanies.map((company) => (
                      <div key={company.id} className="rounded-lg border border-gray-200 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-gray-900 truncate">
                              {company.name}
                            </div>
                            {company.email && (
                              <div className="text-xs text-gray-500 truncate">{company.email}</div>
                            )}
                            <div className="mt-2 text-xs text-gray-600">
                              Plano: {company.planType || 'Não informado'}
                            </div>
                            <div className="mt-1 text-xs">
                              Status:{' '}
                              <span className={company.planActive ? 'text-emerald-600' : 'text-red-600'}>
                                {company.planActive ? 'Ativo' : 'Inativo'}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <button
                              type="button"
                              onClick={() => handleDeleteCompany(company)}
                              disabled={securityDeletingCompanyId === company.id}
                              className="px-3 py-1 text-xs rounded-md border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-60"
                            >
                              Excluir Empresa
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCompanyLeadsFromCompany(company)}
                              disabled={securityDeletingCompanyLeadsId === company.id}
                              className="px-3 py-1 text-xs rounded-md border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-60"
                            >
                              Excluir Leads
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <>
                  {(securityTab === 'gestor' || securityTab === 'atendente') && (
                    <div className="mb-4">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Filtrar por empresa
                      </label>
                      <select
                        value={String(securityCompanyFilter)}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === 'all' || value === 'none') {
                            setSecurityCompanyFilter(value);
                          } else {
                            const numeric = Number(value);
                            setSecurityCompanyFilter(Number.isNaN(numeric) ? 'all' : numeric);
                          }
                        }}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="all">Todas as empresas</option>
                        <option value="none">Sem empresa</option>
                        {securityCompanies.map((company) => (
                          <option key={company.id} value={company.id}>
                            {company.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {securityAdmins
                    .filter((admin) => admin.role === securityTab)
                    .filter((admin) => {
                      if (securityTab !== 'gestor' && securityTab !== 'atendente') return true;
                      if (securityCompanyFilter === 'all') return true;
                      if (securityCompanyFilter === 'none') return !admin.companyId;
                      return Number(admin.companyId) === securityCompanyFilter;
                    }).length === 0 ? (
                    <div className="text-sm text-gray-500">Nenhum usuário encontrado.</div>
                  ) : (
                    <div className="space-y-3">
                      {securityAdmins
                        .filter((admin) => admin.role === securityTab)
                        .filter((admin) => {
                          if (securityTab !== 'gestor' && securityTab !== 'atendente') return true;
                          if (securityCompanyFilter === 'all') return true;
                          if (securityCompanyFilter === 'none') return !admin.companyId;
                          return Number(admin.companyId) === securityCompanyFilter;
                        })
                        .map((admin) => (
                      <div key={admin.id} className="rounded-lg border border-gray-200 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-gray-900 truncate">
                              {admin.name || admin.email}
                            </div>
                            <div className="text-xs text-gray-500 truncate">{admin.email}</div>
                            <div className="mt-2 text-xs text-gray-600">
                              Empresa: {admin.companyName || 'Sem empresa'}
                            </div>
                            <div className="mt-1 text-xs">
                              Status:{' '}
                              <span className={admin.isActive ? 'text-emerald-600' : 'text-red-600'}>
                                {admin.isActive ? 'Ativo' : 'Inativo'}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <button
                              type="button"
                              onClick={() => handleToggleAdminStatus(admin)}
                              disabled={securityUpdatingId === admin.id}
                              className="px-3 py-1 text-xs rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                            >
                              {admin.isActive ? 'Desativar' : 'Ativar'}
                            </button>
                            {(securityTab === 'admin' || securityTab === 'gestor') && (
                              <button
                                type="button"
                                onClick={() => handleRemoveAdminCompany(admin)}
                                disabled={securityDeletingId === admin.id}
                                className="px-3 py-1 text-xs rounded-md border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-60"
                              >
                                Excluir da empresa
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showRenameFunnelModal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowRenameFunnelModal(false);
            }
          }}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-gray-900">Renomear funil</h3>
              <button
                type="button"
                onClick={() => setShowRenameFunnelModal(false)}
                className="text-gray-500 hover:text-gray-700"
                title="Fechar"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">Nome do funil</label>
              <input
                type="text"
                value={renameFunnelName}
                onChange={(e) => setRenameFunnelName(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
              {renameFunnelError && (
                <div className="mt-2 text-sm text-red-600">{renameFunnelError}</div>
              )}
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowRenameFunnelModal(false)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleRenameFunnel}
                className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
                disabled={renameFunnelLoading}
              >
                {renameFunnelLoading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteFunnelModal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDeleteFunnelModal(false);
            }
          }}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-gray-900">Excluir funil</h3>
              <button
                type="button"
                onClick={() => setShowDeleteFunnelModal(false)}
                className="text-gray-500 hover:text-gray-700"
                title="Fechar"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 text-sm text-gray-700">
              Deseja realmente excluir o funil <strong>{deleteFunnelName || 'selecionado'}</strong> e
              todos os leads que estão nele?
            </div>
            {deleteFunnelError && (
              <div className="mt-3 text-sm text-red-600">{deleteFunnelError}</div>
            )}
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteFunnelModal(false)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteFunnel}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
                disabled={deleteFunnelLoading}
              >
                {deleteFunnelLoading ? 'Excluindo...' : 'Excluir'}
              </button>
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

