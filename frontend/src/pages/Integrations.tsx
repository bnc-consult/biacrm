import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { FiPlus, FiSettings, FiInbox, FiMessageCircle, FiGlobe, FiX, FiHelpCircle, FiChevronDown, FiEdit, FiTrash2, FiChevronRight, FiCopy, FiTrash } from 'react-icons/fi';

type TabType = 'entradas' | 'saidas' | 'atualizacao' | 'produtos' | 'parceiros' | 'meta-api';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  status: 'active' | 'inactive';
  tab: TabType;
}

interface FacebookIntegration {
  id: string;
  title: string;
  accountName: string;
  accountEmail: string;
  connectedAt: string;
  status: 'active' | 'inactive';
}

interface TikTokIntegration {
  id: string;
  title: string;
  accountName: string;
  accountEmail: string;
  connectedAt: string;
  status: 'active' | 'inactive';
}

interface InstagramIntegration {
  id: string;
  title: string;
  accountName: string;
  accountEmail: string;
  connectedAt: string;
  status: 'active' | 'inactive';
}

interface GoogleAdsIntegration {
  id: string;
  title: string;
  accountName: string;
  accountEmail: string;
  connectedAt: string;
  status: 'active' | 'inactive';
}

interface WebhookIntegration {
  id: string;
  title: string;
  online: boolean;
  queue: string;
  queueName?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  type?: string;
  webhookUrl?: string;
}

const tabs = [
  { id: 'entradas' as TabType, label: 'Entradas de lead' },
  { id: 'saidas' as TabType, label: 'Saídas de lead' },
  { id: 'atualizacao' as TabType, label: 'Atualização do lead' },
  { id: 'produtos' as TabType, label: 'Produtos' },
  { id: 'parceiros' as TabType, label: 'Parceiros Oficiais' },
  { id: 'meta-api' as TabType, label: 'API de conversão Meta' },
];

const tabDescriptions: Record<TabType, string> = {
  entradas: 'Crie e configure os pontos de entrada de leads',
  saidas: 'Configure os pontos de saída de leads',
  atualizacao: 'Configure as atualizações automáticas de leads',
  produtos: 'Gerencie os produtos disponíveis',
  parceiros: 'Configure parceiros oficiais',
  'meta-api': 'Configure a API de conversão do Meta',
};

// Mock data - em produção viria de uma API
const integrations: Integration[] = [
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    description: 'Envie leads para o WhatsApp',
    icon: <FiMessageCircle className="w-6 h-6" />,
    status: 'active',
    tab: 'saidas',
  },
];

// Integrações disponíveis para adicionar
interface AvailableIntegration {
  id: string;
  name: string;
  icon: React.ReactNode;
  iconColor: string;
  bgColor: string;
}

const availableIntegrations: AvailableIntegration[] = [
  {
    id: 'webhook',
    name: 'Webhook',
    icon: (
      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="5" r="3.5" fill="currentColor" />
        <circle cx="5.5" cy="19" r="3.5" fill="currentColor" />
        <circle cx="18.5" cy="19" r="3.5" fill="currentColor" />
        <path d="M 12 8.5 Q 5.5 13 5.5 19" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M 12 8.5 Q 18.5 13 18.5 19" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M 5.5 19 Q 12 19 18.5 19" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
      </svg>
    ),
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: (
      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    id: 'google-ads',
    name: 'Google Ads',
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 250.9 312.8" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <rect id="SVGID_1_" width="250.9" height="312.8"/>
          <clipPath id="SVGID_2_">
            <use href="#SVGID_1_" style={{overflow: 'visible'}}/>
          </clipPath>
        </defs>
        <path style={{clipPath: 'url(#SVGID_2_)', fill: '#3C8BD9'}} d="M85.9,28.6c2.4-6.3,5.7-12.1,10.6-16.8c19.6-19.1,52-14.3,65.3,9.7c10,18.2,20.6,36,30.9,54
          c17.2,29.9,34.6,59.8,51.6,89.8c14.3,25.1-1.2,56.8-29.6,61.1c-17.4,2.6-33.7-5.4-42.7-21c-15.1-26.3-30.3-52.6-45.4-78.8
          c-0.3-0.6-0.7-1.1-1.1-1.6c-1.6-1.3-2.3-3.2-3.3-4.9c-6.7-11.8-13.6-23.5-20.3-35.2c-4.3-7.6-8.8-15.1-13.1-22.7
          c-3.9-6.8-5.7-14.2-5.5-22C83.6,36.2,84.1,32.2,85.9,28.6"/>
        <path style={{clipPath: 'url(#SVGID_2_)', fill: '#FABC04'}} d="M85.9,28.6c-0.9,3.6-1.7,7.2-1.9,11c-0.3,8.4,1.8,16.2,6,23.5C101,82,112,101,122.9,120c1,1.7,1.8,3.4,2.8,5
          c-6,10.4-12,20.7-18.1,31.1c-8.4,14.5-16.8,29.1-25.3,43.6c-0.4,0-0.5-0.2-0.6-0.5c-0.1-0.8,0.2-1.5,0.4-2.3
          c4.1-15,0.7-28.3-9.6-39.7c-6.3-6.9-14.3-10.8-23.5-12.1c-12-1.7-22.6,1.4-32.1,8.9c-1.7,1.3-2.8,3.2-4.8,4.2
          c-0.4,0-0.6-0.2-0.7-0.5c4.8-8.3,9.5-16.6,14.3-24.9C45.5,98.4,65.3,64,85.2,29.7C85.4,29.3,85.7,29,85.9,28.6"/>
        <path style={{clipPath: 'url(#SVGID_2_)', fill: '#34A852'}} d="M11.8,158c1.9-1.7,3.7-3.5,5.7-5.1c24.3-19.2,60.8-5.3,66.1,25.1c1.3,7.3,0.6,14.3-1.6,21.3
          c-0.1,0.6-0.2,1.1-0.4,1.7c-0.9,1.6-1.7,3.3-2.7,4.9c-8.9,14.7-22,22-39.2,20.9C20,225.4,4.5,210.6,1.8,191
          c-1.3-9.5,0.6-18.4,5.5-26.6c1-1.8,2.2-3.4,3.3-5.2C11.1,158.8,10.9,158,11.8,158"/>
        <path style={{clipPath: 'url(#SVGID_2_)', fill: '#FABC04'}} d="M11.8,158c-0.4,0.4-0.4,1.1-1.1,1.2c-0.1-0.7,0.3-1.1,0.7-1.6L11.8,158"/>
        <path style={{clipPath: 'url(#SVGID_2_)', fill: '#E1C025'}} d="M81.6,201c-0.4-0.7,0-1.2,0.4-1.7c0.1,0.1,0.3,0.3,0.4,0.4L81.6,201"/>
        <path style={{clipPath: 'url(#SVGID_2_)', fill: '#757575'}} d="M20.7,260.4C9.4,260.4,0,269.5,0,280.7c0,11.2,9.4,20.2,20.7,20.2c6.1,0,10.6-2,14.2-5.7
          c3.7-3.7,4.8-8.8,4.8-12.9c0-1.3-0.1-2.5-0.3-3.5H20.7v5.5H34c-0.4,3.1-1.4,5.4-3,7c-1.9,1.9-5,4.1-10.3,4.1
          c-8.2,0-14.6-6.6-14.6-14.7c0-8.1,6.4-14.7,14.6-14.7c4.4,0,7.7,1.7,10,4l3.9-3.9C31.3,262.9,26.9,260.4,20.7,260.4z M54.6,274.9
          c-7.1,0-13,5.5-13,13.2c0,7.6,5.8,13.2,13,13.2c7.2,0,13-5.6,13-13.2C67.6,280.5,61.7,274.9,54.6,274.9 M54.6,296.1
          c-3.9,0-7.3-3.3-7.3-8c0-4.7,3.4-8,7.3-8c3.9,0,7.3,3.2,7.3,8C61.9,292.8,58.5,296.1,54.6,296.1 M82.8,274.9c-7.2,0-13,5.5-13,13.2
          c0,7.6,5.8,13.2,13,13.2c7.1,0,13-5.6,13-13.2C95.8,280.5,90,274.9,82.8,274.9 M82.8,296.1c-3.9,0-7.3-3.3-7.3-8c0-4.7,3.4-8,7.3-8
          s7.3,3.2,7.3,8C90.1,292.8,86.8,296.1,82.8,296.1 M110.9,274.9c-6.5,0-12.4,5.7-12.4,13.1c0,7.3,5.9,13,12.4,13
          c3.1,0,5.5-1.4,6.8-3h0.2v1.9c0,5-2.6,7.7-6.9,7.7c-3.5,0-5.6-2.5-6.5-4.6l-5,2.1c1.4,3.5,5.2,7.7,11.5,7.7c6.7,0,12.3-4,12.3-13.6
          v-23.4h-5.4v2.1h-0.2C116.4,276.3,114,274.9,110.9,274.9 M111.4,295.9c-3.9,0-7.2-3.3-7.2-7.9c0-4.6,3.3-8,7.2-8
          c3.9,0,6.9,3.4,6.9,8C118.3,292.6,115.3,295.9,111.4,295.9 M127.5,262h5.7v38.6h-5.7V262z M148.5,274.9c-6.8,0-12.5,5.3-12.5,13.2
          c0,7.4,5.6,13.2,13.1,13.2c6.1,0,9.6-3.7,11-5.8l-4.5-3c-1.5,2.2-3.6,3.6-6.5,3.6c-3,0-5.1-1.3-6.4-4l17.7-7.3l-0.6-1.5
          C158.7,280.4,155.3,274.9,148.5,274.9 M141.7,287.7c-0.2-5.1,4-7.7,6.9-7.7c2.3,0,4.3,1.1,4.9,2.8L141.7,287.7z"/>
        <path style={{clipPath: 'url(#SVGID_2_)', fill: '#757575'}} d="M170.4,300l13.2-35.1h5.1l13.2,35.1h-5l-3.4-9.5h-14.7l-3.4,9.5H170.4z M180.3,286.3H192l-5.7-15.8h-0.2
          L180.3,286.3z"/>
        <path style={{clipPath: 'url(#SVGID_2_)', fill: '#757575'}} d="M206.5,297.1c-2.2-2.5-3.3-5.5-3.3-9.1c0-3.5,1.1-6.5,3.3-9.1c2.3-2.5,4.9-3.7,8.1-3.7c1.8,0,3.4,0.4,4.8,1.1
          c1.5,0.8,2.6,1.7,3.4,3h0.2l-0.2-3.3v-11.1h4.5V300h-4.3v-3.3h-0.2c-0.8,1.2-1.9,2.2-3.4,3s-3.1,1.1-4.8,1.1
          C211.4,300.8,208.7,299.6,206.5,297.1 M220.7,294.3c1.5-1.6,2.2-3.7,2.2-6.3c0-2.5-0.7-4.6-2.2-6.2c-1.4-1.6-3.2-2.4-5.4-2.4
          c-2.2,0-4,0.8-5.4,2.4c-1.5,1.6-2.2,3.7-2.2,6.2c0,2.5,0.7,4.6,2.2,6.2c1.5,1.6,3.3,2.4,5.4,2.4
          C217.5,296.7,219.3,295.9,220.7,294.3"/>
        <path style={{clipPath: 'url(#SVGID_2_)', fill: '#757575'}} d="M248.1,298.6c-1.8,1.4-4.1,2.2-6.9,2.2c-2.4,0-4.5-0.6-6.4-1.9c-1.8-1.3-3.1-2.9-3.9-5l4-1.7
          c0.6,1.4,1.4,2.6,2.6,3.4c1.1,0.8,2.4,1.2,3.7,1.2c1.4,0,2.6-0.3,3.6-0.9c1-0.6,1.4-1.4,1.4-2.2c0-1.5-1.2-2.7-3.5-3.4l-4.1-1
          c-4.7-1.2-7-3.4-7-6.8c0-2.2,0.9-3.9,2.7-5.3c1.8-1.3,4.1-2,6.8-2c2.1,0,4,0.5,5.8,1.5c1.7,1,2.9,2.4,3.6,4.1l-4,1.7
          c-0.5-1-1.2-1.8-2.2-2.4c-1-0.6-2.2-0.9-3.5-0.9c-1.2,0-2.2,0.3-3.2,0.9c-0.9,0.6-1.4,1.3-1.4,2.2c0,1.4,1.3,2.4,3.9,2.9l3.6,0.9
          c4.8,1.2,7.1,3.6,7.1,7.2C250.9,295.4,249.9,297.2,248.1,298.6"/>
      </svg>
    ),
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: (
      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    ),
    iconColor: 'text-pink-600',
    bgColor: 'bg-pink-50',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: (
      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    ),
    iconColor: 'text-blue-700',
    bgColor: 'bg-blue-50',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: (
      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
      </svg>
    ),
    iconColor: 'text-black',
    bgColor: 'bg-gray-50',
  },
  {
    id: 'site',
    name: 'Site',
    icon: <FiGlobe className="w-8 h-8" />,
    iconColor: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    icon: <FiMessageCircle className="w-8 h-8" />,
    iconColor: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    id: 'telegram',
    name: 'Telegram',
    icon: (
      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
      </svg>
    ),
    iconColor: 'text-blue-500',
    bgColor: 'bg-blue-50',
  },
];

interface IntegrationToken {
  id: string;
  title: string;
  endpoint: string;
  token: string;
  createdAt: string;
}

export default function Integrations() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('entradas');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [showFacebookModal, setShowFacebookModal] = useState(false);
  const [showFacebookAccountModal, setShowFacebookAccountModal] = useState(false);
  const [showFacebookPermissionsModal, setShowFacebookPermissionsModal] = useState(false);
  const [showFacebookLoginModal, setShowFacebookLoginModal] = useState(false);
  const [showUpdateLeadModal, setShowUpdateLeadModal] = useState(false);
  const [showTikTokModal, setShowTikTokModal] = useState(false);
  const [tiktokActiveTab, setTikTokActiveTab] = useState<'configuracoes' | 'autorizacao'>('configuracoes');
  const [showTikTokLoginModal, setShowTikTokLoginModal] = useState(false);
  const [showTikTokEditModal, setShowTikTokEditModal] = useState(false);
  const [tiktokEmail, setTikTokEmail] = useState('');
  const [tiktokPassword, setTikTokPassword] = useState('');
  const [tiktokTitle, setTikTokTitle] = useState('');
  const [tiktokIntegrations, setTikTokIntegrations] = useState<TikTokIntegration[]>([]);
  const [isTikTokLoggedIn, setIsTikTokLoggedIn] = useState(false);
  const [editingTikTokId, setEditingTikTokId] = useState<string | null>(null);
  const [showGoogleAdsModal, setShowGoogleAdsModal] = useState(false);
  const [showGoogleLoginModal, setShowGoogleLoginModal] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googlePassword, setGooglePassword] = useState('');
  const [googleAdsIntegrations, setGoogleAdsIntegrations] = useState<GoogleAdsIntegration[]>([]);
  const [editingGoogleAdsId, setEditingGoogleAdsId] = useState<string | null>(null);
  const [showInstagramModal, setShowInstagramModal] = useState(false);
  const [showInstagramLoginModal, setShowInstagramLoginModal] = useState(false);
  const [showInstagramEditModal, setShowInstagramEditModal] = useState(false);
  const [instagramEmail, setInstagramEmail] = useState('');
  const [instagramPassword, setInstagramPassword] = useState('');
  const [instagramTitle, setInstagramTitle] = useState('');
  const [instagramIntegrations, setInstagramIntegrations] = useState<InstagramIntegration[]>([]);
  const [isInstagramLoggedIn, setIsInstagramLoggedIn] = useState(false);
  const [editingInstagramId, setEditingInstagramId] = useState<string | null>(null);
  const [facebookTitle, setFacebookTitle] = useState('');
  const [selectedFacebookAccount, setSelectedFacebookAccount] = useState('');
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [facebookEmail, setFacebookEmail] = useState('');
  const [facebookPassword, setFacebookPassword] = useState('');
  const [facebookIntegrations, setFacebookIntegrations] = useState<FacebookIntegration[]>([]);
  const [isFacebookLoggedIn, setIsFacebookLoggedIn] = useState(false);
  const [webhookTitle, setWebhookTitle] = useState('');
  const [updateLeadTitle, setUpdateLeadTitle] = useState('');
  const [integrationToken, setIntegrationToken] = useState<IntegrationToken | null>(null);
  const [webhookOnline, setWebhookOnline] = useState(true);
  const [webhookQueue, setWebhookQueue] = useState('');
  const [showQueueDropdown, setShowQueueDropdown] = useState(false);
  const [webhookIntegrations, setWebhookIntegrations] = useState<WebhookIntegration[]>([]);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [editingWebhookId, setEditingWebhookId] = useState<string | null>(null);
  const [editingFacebookId, setEditingFacebookId] = useState<string | null>(null);
  const [pendingFacebookData, setPendingFacebookData] = useState<{ access_token: string; page_id: string; page_name?: string; expires_in?: number } | null>(null);

  // Filtrar integrações pela aba ativa
  const activeIntegrations = integrations.filter(integration => integration.tab === activeTab);

  // Gerar token e endpoint para integração
  const generateIntegrationToken = useCallback(async () => {
    try {
      const response = await api.post('/integrations/generate-token', {
        title: 'Atualização de Lead via API'
      });
      
      if (response.data.success) {
        setIntegrationToken(response.data.integration);
        // Salvar no localStorage
        localStorage.setItem('leadUpdateIntegrationToken', JSON.stringify(response.data.integration));
      }
    } catch (error: any) {
      console.error('Erro ao gerar token:', error);
      alert(error.response?.data?.message || 'Erro ao gerar token de integração');
    }
  }, []);

  // Carregar ou gerar token quando a aba "atualização do lead" for selecionada
  useEffect(() => {
    if (activeTab === 'atualizacao') {
      // Verificar se já existe um token salvo
      const savedToken = localStorage.getItem('leadUpdateIntegrationToken');
      if (savedToken) {
        try {
          const parsedToken = JSON.parse(savedToken);
          // Verificar se o endpoint está correto (não contém imobilead)
          if (parsedToken.endpoint && parsedToken.endpoint.includes('imobilead')) {
            // Token antigo com endpoint errado, gerar novo
            localStorage.removeItem('leadUpdateIntegrationToken');
            generateIntegrationToken();
          } else {
            setIntegrationToken(parsedToken);
          }
        } catch (e) {
          // Se houver erro ao parsear, gerar novo token
          localStorage.removeItem('leadUpdateIntegrationToken');
          generateIntegrationToken();
        }
      } else {
        // Gerar token automaticamente
        generateIntegrationToken();
      }
    }
  }, [activeTab, generateIntegrationToken]);

  // Resetar token
  const resetToken = async () => {
    if (window.confirm('Tem certeza que deseja resetar o token? O token atual não funcionará mais.')) {
      localStorage.removeItem('leadUpdateIntegrationToken');
      setIntegrationToken(null);
      await generateIntegrationToken();
    }
  };

  // Copiar texto para clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copiado para a área de transferência!');
  };

  // Carregar integrações do Facebook do backend
  const loadFacebookIntegrations = useCallback(async () => {
    try {
      console.log('📡 Buscando integrações do Facebook no backend...');
      const response = await api.get('/integrations/facebook/list');
      console.log('📥 Resposta do backend:', response.data);
      
      if (response.data.success) {
        const integrations = response.data.integrations || [];
        console.log(`📋 Encontradas ${integrations.length} integrações no backend`);
        
        if (integrations.length > 0) {
          // Converter formato do backend para formato do frontend
          const formattedIntegrations: FacebookIntegration[] = integrations.map((integration: any) => ({
            id: `fb_${integration.id}`,
            title: integration.title,
            accountName: integration.page_name || 'Conta Pessoal',
            accountEmail: user?.email || '',
            connectedAt: integration.created_at,
            status: integration.status || 'active'
          }));
          
          console.log('✅ Integrações formatadas:', formattedIntegrations);
          setFacebookIntegrations(formattedIntegrations);
          setIsFacebookLoggedIn(true);
          localStorage.setItem('facebookIntegrations', JSON.stringify(formattedIntegrations));
          console.log(`✅ ${formattedIntegrations.length} integrações do Facebook carregadas e exibidas`);
        } else {
          console.warn('⚠️ Nenhuma integração encontrada no backend');
          setFacebookIntegrations([]);
          setIsFacebookLoggedIn(false);
          localStorage.removeItem('facebookIntegrations');
        }
      } else {
        console.error('❌ Backend retornou success=false:', response.data);
      }
    } catch (error: any) {
      console.error('❌ Erro ao carregar integrações do Facebook do backend:', error);
      // Fallback para localStorage se o backend falhar
      const savedIntegrations = localStorage.getItem('facebookIntegrations');
      if (savedIntegrations) {
        try {
          const parsed = JSON.parse(savedIntegrations);
          console.log('📦 Carregando do localStorage:', parsed.length, 'integrações');
          setFacebookIntegrations(parsed);
          setIsFacebookLoggedIn(parsed.length > 0);
        } catch (e) {
          console.error('❌ Erro ao carregar integrações do Facebook do localStorage:', e);
        }
      }
    }
  }, [user?.email]);

  // Conectar conta do Facebook usando dados do OAuth
  const handleFacebookConnect = async (facebookData?: { access_token: string; page_id: string; page_name?: string; expires_in?: number }, titleOverride?: string) => {
    const titleToUse = titleOverride || facebookTitle;
    
    if (!titleToUse || !titleToUse.trim()) {
      alert('Por favor, preencha o título da integração primeiro');
      return;
    }

    // Usar dados pendentes do OAuth se não foram fornecidos diretamente
    const dataToUse = facebookData || pendingFacebookData;

    // Se não há dados do OAuth, significa que está sendo chamado sem autenticação válida
    if (!dataToUse || !dataToUse.access_token) {
      alert('Dados de autenticação do Facebook não fornecidos. Por favor, autorize novamente através do OAuth.');
      return;
    }

    // Se não houver page_id, o backend vai usar o ID do usuário como fallback
    // Isso permite criar integração mesmo sem páginas do Facebook

    try {
      // Validar token com o backend antes de salvar
      const response = await api.post('/integrations/facebook/connect', {
        title: titleToUse,
        access_token: dataToUse.access_token,
        page_id: dataToUse.page_id,
        page_name: dataToUse.page_name,
        expires_in: dataToUse.expires_in
      });

      if (!response.data.success) {
        throw new Error('Falha ao conectar conta do Facebook');
      }

      console.log('✅ Integração criada com sucesso no backend:', response.data);
      
      // Fechar modais primeiro
      setShowFacebookPermissionsModal(false);
      setShowFacebookAccountModal(false);
      setShowFacebookModal(false);
      setFacebookTitle('');
      setFacebookEmail('');
      setFacebookPassword('');
      setEditingFacebookId(null);
      setPendingFacebookData(null);
      
      // Mudar para a aba de entradas antes de recarregar
      setActiveTab('entradas');
      
      // Recarregar integrações do backend após criar/atualizar
      console.log('🔄 Recarregando integrações do backend...');
      await loadFacebookIntegrations();
      
      // Forçar atualização do componente
      // O React vai re-renderizar automaticamente quando setFacebookIntegrations for chamado
      console.log('✅ Processo de criação concluído. Aguardando atualização do estado...');
      
      // Aguardar um pouco para garantir que o estado foi atualizado
      setTimeout(() => {
        // Recarregar novamente para garantir que está sincronizado
        loadFacebookIntegrations().then(() => {
          console.log('✅ Integrações recarregadas após criação');
          alert('Conta do Facebook conectada com sucesso!');
        });
      }, 500);
    } catch (error: any) {
      console.error('Erro ao conectar Facebook:', error);
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Erro ao conectar conta do Facebook';
      alert('Erro ao conectar: ' + errorMessage);
    }
  };

  // Iniciar autenticação OAuth do Facebook
  const handleFacebookLogin = async () => {
    try {
      // Obter URL de autorização OAuth do Facebook
      const response = await api.get('/integrations/facebook/oauth/url');
      
      const { authUrl } = response.data;
      
      if (!authUrl) {
        throw new Error('URL de autorização não retornada pelo servidor');
      }
      
      // Fechar modal antes de redirecionar
      setShowFacebookLoginModal(false);
      setShowFacebookPermissionsModal(false);
      
      // Redirecionar para autorização OAuth do Facebook
      // O usuário verá uma tela de login do Facebook onde pode usar suas credenciais
      window.location.href = authUrl;
    } catch (error: any) {
      console.error('Erro ao iniciar conexão Facebook:', error);
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Erro ao iniciar conexão';
      
      // Mostrar mensagem de erro informativa
      if (errorMessage.includes('não configurado') || errorMessage.includes('Sistema não configurado')) {
        alert('Sistema não configurado. Entre em contato com o suporte técnico para configurar a integração com Facebook.');
      } else {
        alert('Erro ao conectar Facebook: ' + errorMessage);
      }
    }
  };

  // Conectar conta do TikTok
  const handleTikTokConnect = () => {
    const now = new Date();
    
    if (editingTikTokId) {
      // Atualizar integração existente
      const updatedIntegrations = tiktokIntegrations.map(integration =>
        integration.id === editingTikTokId
          ? { ...integration, title: tiktokTitle }
          : integration
      );
      setTikTokIntegrations(updatedIntegrations);
      localStorage.setItem('tiktokIntegrations', JSON.stringify(updatedIntegrations));
      alert('Integração do TikTok atualizada com sucesso!');
    } else {
      // Criar nova integração
      const newIntegration: TikTokIntegration = {
        id: `tiktok_${Date.now()}`,
        title: tiktokTitle || 'Integração TikTok',
        accountName: user?.name || 'Usuário',
        accountEmail: tiktokEmail || user?.email || '',
        connectedAt: now.toISOString(),
        status: 'active'
      };

      const updatedIntegrations = [...tiktokIntegrations, newIntegration];
      setTikTokIntegrations(updatedIntegrations);
      setIsTikTokLoggedIn(true);
      localStorage.setItem('tiktokLoggedIn', 'true');
      localStorage.setItem('tiktokIntegrations', JSON.stringify(updatedIntegrations));
      
      alert('Conta do TikTok conectada com sucesso!');
    }
    
    setShowTikTokLoginModal(false);
    setShowTikTokModal(false);
    setShowTikTokEditModal(false);
    setTikTokEmail('');
    setTikTokPassword('');
    setTikTokTitle('');
    setEditingTikTokId(null);
    
    // Mudar para a aba de entradas para mostrar a integração
    setActiveTab('entradas');
  };

  // Fazer login no TikTok
  const handleTikTokLogin = () => {
    if (!tiktokEmail.trim() || !tiktokPassword.trim()) {
      alert('Por favor, preencha o email e senha do TikTok');
      return;
    }

    // Simular login do TikTok
    // Em produção, isso seria uma chamada à API do TikTok
    setIsTikTokLoggedIn(true);
    localStorage.setItem('tiktokLoggedIn', 'true');
    setShowTikTokLoginModal(false);
    
    // Após login, conectar diretamente
    handleTikTokConnect();
  };

  // Verificar se está logado no TikTok e conectar ou solicitar login
  const handleTikTokContinue = () => {
    const savedTikTokLogin = localStorage.getItem('tiktokLoggedIn');
    if (savedTikTokLogin === 'true' && isTikTokLoggedIn) {
      // Já está logado, conectar diretamente
      handleTikTokConnect();
    } else {
      // Não está logado, mostrar modal de login
      setShowTikTokLoginModal(true);
    }
  };

  // Fazer login com conta do Google selecionada
  const handleGoogleAccountSelect = (email: string, name?: string) => {
    // Simular login do Google
    // Em produção, isso seria uma chamada à API do Google
    const now = new Date();
    
    if (editingGoogleAdsId) {
      // Atualizar integração existente
      const updatedIntegrations = googleAdsIntegrations.map(integration =>
        integration.id === editingGoogleAdsId
          ? { 
              ...integration, 
              accountName: name || integration.accountName,
              accountEmail: email,
              connectedAt: now.toISOString()
            }
          : integration
      );
      setGoogleAdsIntegrations(updatedIntegrations);
      localStorage.setItem('googleAdsIntegrations', JSON.stringify(updatedIntegrations));
      localStorage.setItem('googleAccountEmail', email);
      if (name) {
        localStorage.setItem('googleAccountName', name);
      }
      alert(`Integração do Google Ads atualizada com sucesso usando ${email}`);
    } else {
      // Criar nova integração
      const newIntegration: GoogleAdsIntegration = {
        id: `google_ads_${Date.now()}`,
        title: 'Integração Google Ads',
        accountName: name || 'Usuário Google',
        accountEmail: email,
        connectedAt: now.toISOString(),
        status: 'active'
      };

      const updatedIntegrations = [...googleAdsIntegrations, newIntegration];
      setGoogleAdsIntegrations(updatedIntegrations);
      localStorage.setItem('googleLoggedIn', 'true');
      localStorage.setItem('googleAccountEmail', email);
      localStorage.setItem('googleAdsIntegrations', JSON.stringify(updatedIntegrations));
      if (name) {
        localStorage.setItem('googleAccountName', name);
      }
      
      alert(`Login realizado com sucesso usando ${email}`);
    }
    
    setShowGoogleAdsModal(false);
    setEditingGoogleAdsId(null);
    
    // Mudar para a aba de entradas para mostrar a integração
    setActiveTab('entradas');
  };

  // Fazer login com outra conta (usuário e senha)
  const handleGoogleLogin = () => {
    if (!googleEmail.trim() || !googlePassword.trim()) {
      alert('Por favor, preencha o email e senha do Google');
      return;
    }

    // Simular login do Google
    // Em produção, isso seria uma chamada à API do Google
    const now = new Date();
    
    if (editingGoogleAdsId) {
      // Atualizar integração existente
      const updatedIntegrations = googleAdsIntegrations.map(integration =>
        integration.id === editingGoogleAdsId
          ? { 
              ...integration, 
              accountEmail: googleEmail,
              connectedAt: now.toISOString()
            }
          : integration
      );
      setGoogleAdsIntegrations(updatedIntegrations);
      localStorage.setItem('googleAdsIntegrations', JSON.stringify(updatedIntegrations));
      localStorage.setItem('googleAccountEmail', googleEmail);
      alert(`Integração do Google Ads atualizada com sucesso usando ${googleEmail}`);
    } else {
      // Criar nova integração
      const newIntegration: GoogleAdsIntegration = {
        id: `google_ads_${Date.now()}`,
        title: 'Integração Google Ads',
        accountName: 'Usuário Google',
        accountEmail: googleEmail,
        connectedAt: now.toISOString(),
        status: 'active'
      };

      const updatedIntegrations = [...googleAdsIntegrations, newIntegration];
      setGoogleAdsIntegrations(updatedIntegrations);
      localStorage.setItem('googleLoggedIn', 'true');
      localStorage.setItem('googleAccountEmail', googleEmail);
      localStorage.setItem('googleAdsIntegrations', JSON.stringify(updatedIntegrations));
      
      alert(`Login realizado com sucesso usando ${googleEmail}`);
    }
    
    setShowGoogleLoginModal(false);
    setShowGoogleAdsModal(false);
    setGoogleEmail('');
    setGooglePassword('');
    setEditingGoogleAdsId(null);
    
    // Mudar para a aba de entradas para mostrar a integração
    setActiveTab('entradas');
  };

  // Toggle status da integração do Facebook
  const handleToggleFacebookStatus = (id: string) => {
    const updatedIntegrations: FacebookIntegration[] = facebookIntegrations.map(integration =>
      integration.id === id
        ? { ...integration, status: (integration.status === 'active' ? 'inactive' : 'active') as 'active' | 'inactive' }
        : integration
    );
    setFacebookIntegrations(updatedIntegrations);
    localStorage.setItem('facebookIntegrations', JSON.stringify(updatedIntegrations));
  };

  // Excluir integração do Facebook
  const handleDeleteFacebook = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta integração do Facebook?')) {
      return;
    }

    try {
      // Extrair o ID numérico do formato "fb_{id}"
      const integrationId = id.replace('fb_', '');
      
      // Chamar API para deletar no backend
      await api.delete(`/integrations/facebook/${integrationId}`);
      
      // Remover do estado local após sucesso
      const updatedIntegrations = facebookIntegrations.filter(fb => fb.id !== id);
      setFacebookIntegrations(updatedIntegrations);
      localStorage.setItem('facebookIntegrations', JSON.stringify(updatedIntegrations));
      
      // Se não houver mais integrações, atualizar o estado de login
      if (updatedIntegrations.length === 0) {
        setIsFacebookLoggedIn(false);
        localStorage.removeItem('facebookLoggedIn');
      }
      
      // Recarregar integrações do backend para garantir sincronização
      await loadFacebookIntegrations();
      
      console.log('✅ Integração do Facebook excluída com sucesso');
    } catch (error: any) {
      console.error('Erro ao excluir integração do Facebook:', error);
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Erro ao excluir integração do Facebook';
      alert('Erro ao excluir: ' + errorMessage);
      
      // Recarregar integrações do backend para garantir que está sincronizado
      await loadFacebookIntegrations();
    }
  };

  // Duplicar integração do Facebook
  const handleCopyFacebook = (fbIntegration: FacebookIntegration) => {
    const now = new Date();
    const copiedIntegration: FacebookIntegration = {
      ...fbIntegration,
      id: `fb_${Date.now()}`,
      title: `${fbIntegration.title} (Cópia)`,
      connectedAt: now.toISOString(),
      status: fbIntegration.status, // Manter o status original
    };
    const updatedIntegrations = [...facebookIntegrations, copiedIntegration];
    setFacebookIntegrations(updatedIntegrations);
    localStorage.setItem('facebookIntegrations', JSON.stringify(updatedIntegrations));
  };

  // Editar integração do Facebook
  const handleEditFacebook = (id: string) => {
    const fbIntegration = facebookIntegrations.find(fb => fb.id === id);
    if (fbIntegration) {
      setFacebookTitle(fbIntegration.title);
      setEditingFacebookId(id);
      setShowFacebookModal(true);
    }
  };

  // Toggle status da integração do TikTok
  const handleToggleTikTokStatus = (id: string) => {
    const updatedIntegrations: TikTokIntegration[] = tiktokIntegrations.map(integration =>
      integration.id === id
        ? { ...integration, status: (integration.status === 'active' ? 'inactive' : 'active') as 'active' | 'inactive' }
        : integration
    );
    setTikTokIntegrations(updatedIntegrations);
    localStorage.setItem('tiktokIntegrations', JSON.stringify(updatedIntegrations));
  };

  // Excluir integração do TikTok
  const handleDeleteTikTok = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta integração do TikTok?')) {
      const updatedIntegrations = tiktokIntegrations.filter(tiktok => tiktok.id !== id);
      setTikTokIntegrations(updatedIntegrations);
      localStorage.setItem('tiktokIntegrations', JSON.stringify(updatedIntegrations));
      
      // Se não houver mais integrações, atualizar o estado de login
      if (updatedIntegrations.length === 0) {
        setIsTikTokLoggedIn(false);
        localStorage.removeItem('tiktokLoggedIn');
      }
    }
  };

  // Duplicar integração do TikTok
  const handleCopyTikTok = (tiktokIntegration: TikTokIntegration) => {
    const now = new Date();
    const copiedIntegration: TikTokIntegration = {
      ...tiktokIntegration,
      id: `tiktok_${Date.now()}`,
      title: `${tiktokIntegration.title} (Cópia)`,
      connectedAt: now.toISOString(),
      status: tiktokIntegration.status, // Manter o status original
    };
    const updatedIntegrations = [...tiktokIntegrations, copiedIntegration];
    setTikTokIntegrations(updatedIntegrations);
    localStorage.setItem('tiktokIntegrations', JSON.stringify(updatedIntegrations));
  };

  // Editar integração do TikTok
  const handleEditTikTok = (id: string) => {
    const tiktokIntegration = tiktokIntegrations.find(tiktok => tiktok.id === id);
    if (tiktokIntegration) {
      setTikTokTitle(tiktokIntegration.title);
      setEditingTikTokId(id);
      setShowTikTokEditModal(true);
    }
  };

  // Conectar conta do Instagram
  const handleInstagramConnect = async (instagramData?: { access_token: string; instagram_account_id: string; instagram_username?: string; expires_in?: number }) => {
    const now = new Date();
    
    if (editingInstagramId) {
      // Atualizar integração existente
      const updatedIntegrations = instagramIntegrations.map(integration =>
        integration.id === editingInstagramId
          ? { ...integration, title: instagramTitle }
          : integration
      );
      setInstagramIntegrations(updatedIntegrations);
      localStorage.setItem('instagramIntegrations', JSON.stringify(updatedIntegrations));
      alert('Integração do Instagram atualizada com sucesso!');
    } else {
      let newIntegration: InstagramIntegration;

      if (instagramData) {
        // Conectar via API do backend
        try {
          const response = await api.post('/integrations/instagram/connect', {
            title: instagramTitle || `Instagram - ${instagramData.instagram_username || 'Conta'}`,
            access_token: instagramData.access_token,
            instagram_account_id: instagramData.instagram_account_id,
            instagram_username: instagramData.instagram_username,
            expires_in: instagramData.expires_in
          });

          const integrationData = response.data.integration;
          newIntegration = {
            id: `instagram_${integrationData.id}`,
            title: integrationData.title,
            accountName: instagramData.instagram_username || 'Instagram',
            accountEmail: user?.email || '',
            connectedAt: integrationData.created_at || now.toISOString(),
            status: integrationData.status || 'active'
          };
        } catch (error: any) {
          console.error('Erro ao conectar Instagram via API:', error);
          // Fallback para criação local
          newIntegration = {
            id: `instagram_${Date.now()}`,
            title: instagramTitle || `Instagram - ${instagramData.instagram_username || 'Conta'}`,
            accountName: instagramData.instagram_username || 'Instagram',
            accountEmail: user?.email || '',
            connectedAt: now.toISOString(),
            status: 'active'
          };
        }
      } else {
        // Criar nova integração localmente
        newIntegration = {
          id: `instagram_${Date.now()}`,
          title: instagramTitle || 'Integração Instagram',
          accountName: user?.name || 'Usuário',
          accountEmail: instagramEmail || user?.email || '',
          connectedAt: now.toISOString(),
          status: 'active'
        };
      }

      const updatedIntegrations = [...instagramIntegrations, newIntegration];
      setInstagramIntegrations(updatedIntegrations);
      setIsInstagramLoggedIn(true);
      localStorage.setItem('instagramLoggedIn', 'true');
      localStorage.setItem('instagramIntegrations', JSON.stringify(updatedIntegrations));
      
      alert('Conta do Instagram conectada com sucesso!');
    }
    
    setShowInstagramLoginModal(false);
    setShowInstagramModal(false);
    setShowInstagramEditModal(false);
    setInstagramEmail('');
    setInstagramPassword('');
    setInstagramTitle('');
    setEditingInstagramId(null);
    
    // Mudar para a aba de entradas para mostrar a integração
    setActiveTab('entradas');
  };

  // Fazer login no Instagram (fluxo simplificado - apenas usuário e senha)
  const handleInstagramLogin = async () => {
    // Validar campos obrigatórios
    if (!instagramEmail) {
      alert('Por favor, informe o usuário do Instagram');
      return;
    }
    
    try {
      // Usar endpoint simplificado que aceita apenas username
      const response = await api.post('/integrations/instagram/connect-simple', {
        instagram_username: instagramEmail,
        instagram_password: instagramPassword // Armazenado mas não usado diretamente (OAuth necessário)
      });
      
      const { authUrl } = response.data;
      
      if (!authUrl) {
        throw new Error('URL de autorização não retornada pelo servidor');
      }
      
      // Fechar modal antes de redirecionar
      setShowInstagramLoginModal(false);
      
      // Redirecionar para autorização OAuth do Facebook/Instagram
      // O usuário verá uma tela de login do Facebook/Instagram onde pode usar suas credenciais
      window.location.href = authUrl;
    } catch (error: any) {
      console.error('Erro ao iniciar conexão Instagram:', error);
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Erro ao iniciar conexão';
      
      // Mostrar mensagem de erro informativa
      if (errorMessage.includes('não configurado') || errorMessage.includes('Sistema não configurado')) {
        alert('Sistema não configurado. Entre em contato com o suporte técnico para configurar a integração com Instagram.');
      } else {
        alert('Erro ao conectar Instagram: ' + errorMessage);
      }
    }
  };

  // Verificar se está logado no Instagram e conectar ou solicitar login
  const handleInstagramContinue = () => {
    const savedInstagramLogin = localStorage.getItem('instagramLoggedIn');
    if (savedInstagramLogin === 'true' && isInstagramLoggedIn) {
      // Já está logado, conectar diretamente
      handleInstagramConnect();
    } else {
      // Não está logado, mostrar modal de login
      setShowInstagramLoginModal(true);
    }
  };

  // Toggle status da integração do Instagram
  const handleToggleInstagramStatus = (id: string) => {
    const updatedIntegrations: InstagramIntegration[] = instagramIntegrations.map(integration =>
      integration.id === id
        ? { ...integration, status: (integration.status === 'active' ? 'inactive' : 'active') as 'active' | 'inactive' }
        : integration
    );
    setInstagramIntegrations(updatedIntegrations);
    localStorage.setItem('instagramIntegrations', JSON.stringify(updatedIntegrations));
  };

  // Excluir integração do Instagram
  const handleDeleteInstagram = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta integração do Instagram?')) {
      const updatedIntegrations = instagramIntegrations.filter(instagram => instagram.id !== id);
      setInstagramIntegrations(updatedIntegrations);
      localStorage.setItem('instagramIntegrations', JSON.stringify(updatedIntegrations));
      
      // Se não houver mais integrações, atualizar o estado de login
      if (updatedIntegrations.length === 0) {
        setIsInstagramLoggedIn(false);
        localStorage.removeItem('instagramLoggedIn');
      }
    }
  };

  // Duplicar integração do Instagram
  const handleCopyInstagram = (instagramIntegration: InstagramIntegration) => {
    const now = new Date();
    const copiedIntegration: InstagramIntegration = {
      ...instagramIntegration,
      id: `instagram_${Date.now()}`,
      title: `${instagramIntegration.title} (Cópia)`,
      connectedAt: now.toISOString(),
      status: instagramIntegration.status, // Manter o status original
    };
    const updatedIntegrations = [...instagramIntegrations, copiedIntegration];
    setInstagramIntegrations(updatedIntegrations);
    localStorage.setItem('instagramIntegrations', JSON.stringify(updatedIntegrations));
  };

  // Editar integração do Instagram
  const handleEditInstagram = (id: string) => {
    const instagramIntegration = instagramIntegrations.find(instagram => instagram.id === id);
    if (instagramIntegration) {
      setInstagramTitle(instagramIntegration.title);
      setEditingInstagramId(id);
      setShowInstagramEditModal(true);
    }
  };

  // Toggle status da integração do Google Ads
  const handleToggleGoogleAdsStatus = (id: string) => {
    const updatedIntegrations: GoogleAdsIntegration[] = googleAdsIntegrations.map(integration =>
      integration.id === id
        ? { ...integration, status: (integration.status === 'active' ? 'inactive' : 'active') as 'active' | 'inactive' }
        : integration
    );
    setGoogleAdsIntegrations(updatedIntegrations);
    localStorage.setItem('googleAdsIntegrations', JSON.stringify(updatedIntegrations));
  };

  // Excluir integração do Google Ads
  const handleDeleteGoogleAds = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta integração do Google Ads?')) {
      const updatedIntegrations = googleAdsIntegrations.filter(google => google.id !== id);
      setGoogleAdsIntegrations(updatedIntegrations);
      localStorage.setItem('googleAdsIntegrations', JSON.stringify(updatedIntegrations));
      
      // Se não houver mais integrações, atualizar o estado de login
      if (updatedIntegrations.length === 0) {
        localStorage.removeItem('googleLoggedIn');
        localStorage.removeItem('googleAccountEmail');
        localStorage.removeItem('googleAccountName');
      }
    }
  };

  // Duplicar integração do Google Ads
  const handleCopyGoogleAds = (googleAdsIntegration: GoogleAdsIntegration) => {
    const now = new Date();
    const copiedIntegration: GoogleAdsIntegration = {
      ...googleAdsIntegration,
      id: `google_ads_${Date.now()}`,
      title: `${googleAdsIntegration.title} (Cópia)`,
      connectedAt: now.toISOString(),
      status: googleAdsIntegration.status, // Manter o status original
    };
    const updatedIntegrations = [...googleAdsIntegrations, copiedIntegration];
    setGoogleAdsIntegrations(updatedIntegrations);
    localStorage.setItem('googleAdsIntegrations', JSON.stringify(updatedIntegrations));
  };

  // Editar integração do Google Ads
  const handleEditGoogleAds = (id: string) => {
    const googleAdsIntegration = googleAdsIntegrations.find(google => google.id === id);
    if (googleAdsIntegration) {
      // Abrir modal de seleção de contas do Google para reautenticar
      setEditingGoogleAdsId(id);
      setShowGoogleAdsModal(true);
    }
  };

  // Carregar integrações do Facebook ao montar o componente
  useEffect(() => {
    loadFacebookIntegrations();
  }, [loadFacebookIntegrations]);

  // Carregar integrações do TikTok salvas
  useEffect(() => {
    const savedIntegrations = localStorage.getItem('tiktokIntegrations');
    const savedLogin = localStorage.getItem('tiktokLoggedIn');
    if (savedIntegrations) {
      try {
        const parsed = JSON.parse(savedIntegrations);
        setTikTokIntegrations(parsed);
        setIsTikTokLoggedIn(savedLogin === 'true' && parsed.length > 0);
        console.log('Integrações do TikTok carregadas:', parsed);
      } catch (e) {
        console.error('Erro ao carregar integrações do TikTok:', e);
      }
    }
    if (savedLogin === 'true') {
      setIsTikTokLoggedIn(true);
    }
  }, []);

  // Carregar integrações do Google Ads salvas
  useEffect(() => {
    const savedIntegrations = localStorage.getItem('googleAdsIntegrations');
    if (savedIntegrations) {
      try {
        const parsed = JSON.parse(savedIntegrations);
        setGoogleAdsIntegrations(parsed);
        console.log('Integrações do Google Ads carregadas:', parsed);
      } catch (e) {
        console.error('Erro ao carregar integrações do Google Ads:', e);
      }
    }
  }, []);

  // Carregar integrações do Instagram salvas
  useEffect(() => {
    const savedIntegrations = localStorage.getItem('instagramIntegrations');
    const savedLogin = localStorage.getItem('instagramLoggedIn');
    if (savedIntegrations) {
      try {
        const parsed = JSON.parse(savedIntegrations);
        setInstagramIntegrations(parsed);
        setIsInstagramLoggedIn(savedLogin === 'true' && parsed.length > 0);
        console.log('Integrações do Instagram carregadas:', parsed);
      } catch (e) {
        console.error('Erro ao carregar integrações do Instagram:', e);
      }
    }
  }, []);

  // Processar callback do Instagram após OAuth
  useEffect(() => {
    const instagramSuccess = searchParams.get('instagram_success');
    const instagramError = searchParams.get('instagram_error');
    const accessToken = searchParams.get('access_token');
    const expiresIn = searchParams.get('expires_in');
    const accountsParam = searchParams.get('accounts');
    const warning = searchParams.get('warning');

    if (instagramSuccess === 'true' && accessToken && accountsParam !== null) {
      const processCallback = async () => {
        try {
          const accounts = accountsParam ? JSON.parse(decodeURIComponent(accountsParam)) : [];
          
          // Mostrar warning se houver
          if (warning) {
            alert(decodeURIComponent(warning));
          }
          
          if (accounts && accounts.length > 0) {
            // Usar a primeira conta Instagram disponível
            const firstAccount = accounts[0];
            
            // Usar page_access_token se disponível (token específico da página)
            const tokenToUse = firstAccount.page_access_token || accessToken;
            
            // Conectar a integração
            await handleInstagramConnect({
              access_token: tokenToUse,
              instagram_account_id: firstAccount.id,
              instagram_username: firstAccount.username || firstAccount.name,
              expires_in: expiresIn ? parseInt(expiresIn) : undefined
            });

            // Limpar parâmetros da URL
            const newParams = new URLSearchParams(searchParams);
            newParams.delete('instagram_success');
            newParams.delete('access_token');
            newParams.delete('expires_in');
            newParams.delete('accounts');
            newParams.delete('warning');
            setSearchParams(newParams, { replace: true });
          } else {
            // Não há contas Instagram, mas temos o token - usuário pode tentar buscar contas manualmente
            alert('Autorização realizada com sucesso, mas nenhuma conta Instagram Business foi encontrada.\n\nVerifique se sua página do Facebook está conectada a uma conta Instagram Business.\n\nVocê pode tentar buscar contas manualmente usando o token recebido.');
            
            // Limpar parâmetros da URL
            const newParams = new URLSearchParams(searchParams);
            newParams.delete('instagram_success');
            newParams.delete('access_token');
            newParams.delete('expires_in');
            newParams.delete('accounts');
            newParams.delete('warning');
            setSearchParams(newParams, { replace: true });
          }
        } catch (error: any) {
          console.error('Erro ao processar callback do Instagram:', error);
          alert('Erro ao processar dados do Instagram: ' + error.message);
          
          // Limpar parâmetros mesmo em caso de erro
          const newParams = new URLSearchParams(searchParams);
          newParams.delete('instagram_success');
          newParams.delete('access_token');
          newParams.delete('expires_in');
          newParams.delete('accounts');
          newParams.delete('warning');
          setSearchParams(newParams, { replace: true });
        }
      };

      processCallback();
    } else if (instagramError) {
      alert('Erro ao autorizar Instagram: ' + decodeURIComponent(instagramError));
      
      // Limpar parâmetros de erro
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('instagram_error');
      setSearchParams(newParams, { replace: true });
    }

    // Processar callback do Facebook OAuth
    const facebookSuccess = searchParams.get('facebook_success');
    const facebookError = searchParams.get('facebook_error');
    const facebookAccessToken = searchParams.get('access_token');
    const facebookExpiresIn = searchParams.get('expires_in');
    const facebookPages = searchParams.get('pages');
    const facebookWarning = searchParams.get('warning');

    // IMPORTANTE: Verificar erro ANTES de verificar sucesso
    if (facebookError) {
      const errorMessage = decodeURIComponent(facebookError);
      
      // Mostrar mensagem de erro mais clara
      alert(`❌ Erro na autenticação do Facebook\n\n${errorMessage}\n\nPor favor, verifique seu login e senha do Facebook e tente novamente.`);
      
      // Limpar parâmetros de erro
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('facebook_error');
      setSearchParams(newParams, { replace: true });
    } else if (facebookSuccess === 'true' && facebookAccessToken) {
      const processFacebookCallback = async () => {
        try {
          const pages = facebookPages ? JSON.parse(decodeURIComponent(facebookPages)) : [];
          const expiresIn = facebookExpiresIn ? parseInt(facebookExpiresIn) : undefined;

          // Se houver warning, mostrar ao usuário
          if (facebookWarning) {
            const warningMessage = decodeURIComponent(facebookWarning);
            console.warn('Facebook warning:', warningMessage);
          }

          // Se não houver páginas, permitir criar integração mesmo assim
          if (!pages || pages.length === 0) {
            // Criar integração usando o token do usuário diretamente
            // O backend vai usar o ID do usuário do Facebook como page_id
            const defaultTitle = 'Integração Facebook - Conta Pessoal';
            
            // Criar integração automaticamente com título padrão
            await handleFacebookConnect({
              access_token: facebookAccessToken,
              page_id: '',
              page_name: 'Conta Pessoal',
              expires_in: expiresIn
            }, defaultTitle);

            // Limpar parâmetros da URL
            const newParams = new URLSearchParams(searchParams);
            newParams.delete('facebook_success');
            newParams.delete('access_token');
            newParams.delete('expires_in');
            newParams.delete('pages');
            newParams.delete('warning');
            setSearchParams(newParams, { replace: true });
            
            return;
          }

          // Usar a primeira página disponível
          const firstPage = pages[0];
          
          // Validar se a página tem dados válidos
          if (!firstPage || !firstPage.id) {
            alert('❌ Erro: Dados da página inválidos. Por favor, verifique seu login e senha do Facebook e tente novamente.');
            
            const newParams = new URLSearchParams(searchParams);
            newParams.delete('facebook_success');
            newParams.delete('access_token');
            newParams.delete('expires_in');
            newParams.delete('pages');
            newParams.delete('warning');
            setSearchParams(newParams, { replace: true });
            return;
          }

          const pageAccessToken = firstPage.access_token || facebookAccessToken;

          // Criar título padrão baseado no nome da página
          const defaultTitle = `Integração Facebook - ${firstPage.name || 'Conta Pessoal'}`;

          // Criar integração automaticamente após autenticação bem-sucedida
          await handleFacebookConnect({
            access_token: pageAccessToken,
            page_id: firstPage.id,
            page_name: firstPage.name,
            expires_in: expiresIn
          }, defaultTitle);

          // Limpar parâmetros da URL
          const newParams = new URLSearchParams(searchParams);
          newParams.delete('facebook_success');
          newParams.delete('access_token');
          newParams.delete('expires_in');
          newParams.delete('pages');
          newParams.delete('warning');
          setSearchParams(newParams, { replace: true });
        } catch (error: any) {
          console.error('Erro ao processar callback do Facebook:', error);
          alert(`❌ Erro ao processar dados do Facebook\n\n${error.message}\n\nPor favor, verifique seu login e senha do Facebook e tente novamente.`);
          
          // Limpar parâmetros mesmo em caso de erro
          const newParams = new URLSearchParams(searchParams);
          newParams.delete('facebook_success');
          newParams.delete('access_token');
          newParams.delete('expires_in');
          newParams.delete('pages');
          newParams.delete('warning');
          setSearchParams(newParams, { replace: true });
        }
      };

      processFacebookCallback();
    } else if (facebookError) {
      alert('Erro ao autorizar Facebook: ' + decodeURIComponent(facebookError));
      
      // Limpar parâmetros de erro
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('facebook_error');
      setSearchParams(newParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Mock de filas disponíveis
  const availableQueues = [
    { id: '1', name: 'Fila Principal' },
    { id: '2', name: 'Fila Secundária' },
    { id: '3', name: 'Fila de Suporte' },
  ];

  const handleAddIntegration = (integrationId: string) => {
    if (integrationId === 'webhook') {
      setShowAddModal(false);
      // Resetar campos ao criar novo
      setWebhookTitle('');
      setWebhookOnline(true);
      setWebhookQueue('');
      setEditingWebhookId(null);
      // Gerar URL prévia para novo webhook
      const previewId = `webhook-${Date.now()}`;
      setWebhookUrl(generateWebhookUrl(previewId));
      setShowWebhookModal(true);
    } else if (integrationId === 'facebook') {
      setShowAddModal(false);
      setShowFacebookModal(true);
    } else if (integrationId === 'tiktok') {
      setShowAddModal(false);
      setShowTikTokModal(true);
      setTikTokActiveTab('configuracoes');
    } else if (integrationId === 'instagram') {
      setShowAddModal(false);
      handleInstagramContinue();
    } else if (integrationId === 'google-ads') {
      setShowAddModal(false);
      setShowGoogleAdsModal(true);
    } else {
      // Aqui você pode adicionar a lógica para adicionar outras integrações
      console.log('Adicionar integração:', integrationId);
      setShowAddModal(false);
    }
  };

  // Gerar URL do webhook
  const generateWebhookUrl = (id: string) => {
    try {
      // Gerar um ID único para a URL (similar ao formato da imagem)
      let urlId = id.replace('webhook-', '');
      if (!urlId) {
        // Gerar ID único se não tiver
        urlId = Date.now().toString(36) + Math.random().toString(36).substring(2, 15);
      }
      const baseUrl = (import.meta as any).env?.VITE_API_URL || 'https://app.biacrm.me';
      return `${baseUrl}/integrate-api/integracoes/webhook/${urlId}/`;
    } catch (error) {
      console.error('Erro ao gerar URL do webhook:', error);
      return 'https://app.biacrm.me/integrate-api/integracoes/webhook/';
    }
  };

  const handleCreateWebhook = () => {
    if (!webhookTitle.trim()) {
      alert('Por favor, preencha o título');
      return;
    }

    const now = new Date();
    let webhookId = editingWebhookId;
    if (!webhookId) {
      // Gerar um ID único para novo webhook (formato similar à imagem: 32 caracteres hex)
      const uniqueId = Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      webhookId = `webhook-${uniqueId}`;
    }
    const generatedUrl = generateWebhookUrl(webhookId);
    
    if (editingWebhookId) {
      // Atualizar webhook existente
      const updatedIntegrations = webhookIntegrations.map(w =>
        w.id === editingWebhookId
          ? {
              ...w,
              title: webhookTitle,
              online: webhookOnline,
              queue: webhookQueue,
              queueName: availableQueues.find(q => q.id === webhookQueue)?.name || '',
              updatedAt: now.toISOString(),
              webhookUrl: w.webhookUrl || generatedUrl
            }
          : w
      );
      setWebhookIntegrations(updatedIntegrations);
    } else {
      // Criar novo webhook
    const newWebhook: WebhookIntegration = {
        id: webhookId,
      title: webhookTitle,
      online: webhookOnline,
      queue: webhookQueue,
      queueName: availableQueues.find(q => q.id === webhookQueue)?.name || '',
      createdBy: user?.name?.toUpperCase() || 'USUÁRIO',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      type: 'N8N IA',
        webhookUrl: generatedUrl,
    };
    setWebhookIntegrations([...webhookIntegrations, newWebhook]);
      // Atualizar URL no estado para exibir após criar
      setWebhookUrl(generatedUrl);
    }
    
    // Resetar formulário e fechar modal
    setWebhookTitle('');
    setWebhookOnline(true);
    setWebhookQueue('');
    setWebhookUrl('');
    setEditingWebhookId(null);
    setShowWebhookModal(false);
  };

  const handleDeleteWebhook = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta integração?')) {
      setWebhookIntegrations(webhookIntegrations.filter(w => w.id !== id));
    }
  };

  const handleCopyWebhook = (webhook: WebhookIntegration) => {
    const now = new Date();
    const copiedWebhook: WebhookIntegration = {
      ...webhook,
      id: `webhook-${Date.now()}`,
      title: `${webhook.title} (Cópia)`,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    setWebhookIntegrations([...webhookIntegrations, copiedWebhook]);
  };

  const handleEditWebhook = (id: string) => {
    try {
    const webhook = webhookIntegrations.find(w => w.id === id);
    if (webhook) {
      setWebhookTitle(webhook.title);
      setWebhookOnline(webhook.online);
      setWebhookQueue(webhook.queue);
        try {
          setWebhookUrl(webhook.webhookUrl || generateWebhookUrl(webhook.id));
        } catch (error) {
          console.error('Erro ao gerar URL:', error);
          setWebhookUrl(webhook.webhookUrl || '');
        }
        setEditingWebhookId(id);
      setShowWebhookModal(true);
      }
    } catch (error) {
      console.error('Erro ao editar webhook:', error);
      alert('Erro ao abrir modal de edição');
    }
  };

  const handleToggleWebhookStatus = (id: string) => {
    setWebhookIntegrations(webhookIntegrations.map(w => 
      w.id === id ? { ...w, online: !w.online, updatedAt: new Date().toISOString() } : w
    ));
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
    return `${day} ${month}, ${year}`;
  };

  const handleCloseWebhookModal = () => {
    setShowWebhookModal(false);
    setWebhookTitle('');
    setWebhookOnline(true);
    setWebhookQueue('');
    setWebhookUrl('');
    setEditingWebhookId(null);
  };

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.relative')) {
        setShowQueueDropdown(false);
        setShowAccountDropdown(false);
      }
    };

    if (showQueueDropdown || showAccountDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showQueueDropdown, showAccountDropdown]);

  return (
    <div className="p-8 bg-gray-50 min-h-full">
      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Integrações</h1>
      </div>

      {/* Tabs Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 px-1 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div className="mb-6">
        <p className="text-sm text-gray-600">{tabDescriptions[activeTab]}</p>
      </div>

      {/* Action Buttons */}
      <div className="mb-8 flex items-center justify-end space-x-4">
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FiPlus className="w-5 h-5" />
          <span>Adicionar integração</span>
        </button>
        <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
          <FiSettings className="w-5 h-5" />
        </button>
      </div>

      {/* Content Area - Atualização do Lead */}
      {activeTab === 'atualizacao' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Section - API Integration */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Integre seu sistema ao nosso CRM enviando atualizações de leads via API
            </h2>

            {/* Endpoint */}
            <div className="mb-6">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Endpoint da API:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={integrationToken?.endpoint || ''}
                  readOnly
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm font-mono"
                />
                <button
                  onClick={() => integrationToken && copyToClipboard(integrationToken.endpoint)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  title="Copiar endpoint"
                  disabled={!integrationToken}
                >
                  <FiCopy className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Use a URL acima para enviar dados ao nosso CRM.
              </p>
            </div>

            {/* Token */}
            <div className="mb-6">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Seu Token de Acesso:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={integrationToken?.token || ''}
                  readOnly
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm font-mono"
                />
                <button
                  onClick={() => integrationToken && copyToClipboard(integrationToken.token)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  title="Copiar token"
                  disabled={!integrationToken}
                >
                  <FiCopy className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Utilize este token para autenticar suas requisições.
              </p>
            </div>

            {/* Reset Token Button */}
            <button
              onClick={resetToken}
              className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 mb-6"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Resetar token
            </button>

            {/* Help Link */}
            <div className="text-sm text-gray-600">
              Está com dúvidas? Acesse aqui o tutorial.{' '}
              <a
                href="https://biacrm.me/integracao-callback/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 underline"
              >
                https://biacrm.me/integracao-callback/
              </a>
            </div>
          </div>

          {/* Right Section - Example Data */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Exemplo de dados enviados
            </h2>

            <div className="bg-gray-800 rounded-lg p-4 relative">
              <button
                onClick={() => {
                  const exampleData = {
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${integrationToken?.token || 'seu_token_aqui'}`
                    },
                    body: {
                      observacao: 'Lead recebeu proposta',
                      nome_acao: 'Progresso da venda'
                    }
                  };
                  copyToClipboard(JSON.stringify(exampleData, null, 2));
                }}
                className="absolute top-4 right-4 px-3 py-1 bg-gray-700 text-white text-sm rounded hover:bg-gray-600 transition-colors flex items-center gap-2"
              >
                <FiCopy className="w-4 h-4" />
                Copiar
              </button>

              <div className="space-y-4 text-sm">
                {/* Headers */}
                <div>
                  <h3 className="text-white font-semibold mb-2">Headers:</h3>
                  <div className="bg-gray-900 rounded p-3 space-y-2">
                    <div className="flex items-start gap-4">
                      <span className="text-gray-400 font-mono min-w-[120px]">Content-Type:</span>
                      <span className="text-gray-300 font-mono">application/json</span>
                    </div>
                    <div className="flex items-start gap-4">
                      <span className="text-gray-400 font-mono min-w-[120px]">Authorization:</span>
                      <span className="text-gray-300 font-mono break-all">
                        {integrationToken?.token ? `Bearer ${integrationToken.token.substring(0, 50)}...` : 'Bearer seu_token_aqui'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div>
                  <h3 className="text-white font-semibold mb-2">Body:</h3>
                  <div className="bg-gray-900 rounded p-3">
                    <pre className="text-gray-300 font-mono text-xs overflow-x-auto">
{`{
  "observacao": "Lead recebeu proposta",
  "nome_acao": "Progresso da venda"
}`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (activeIntegrations.length > 0 || webhookIntegrations.length > 0 || facebookIntegrations.length > 0 || tiktokIntegrations.length > 0 || instagramIntegrations.length > 0 || googleAdsIntegrations.length > 0) ? (
        <div className="space-y-4">
          {/* Webhook Integrations */}
          {webhookIntegrations.length > 0 && (
            <div className="space-y-4">
              {webhookIntegrations.map((webhook) => (
                <div key={webhook.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-start justify-between">
                    {/* Left Side - Icons and Name */}
                    <div className="flex items-start gap-4 flex-1">
                      {/* Large Webhook Icon */}
                      <div className="w-16 h-16 bg-blue-50 rounded-lg flex items-center justify-center relative">
                        <svg className="w-10 h-10 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                          <circle cx="12" cy="5" r="3.5" fill="currentColor" />
                          <circle cx="5.5" cy="19" r="3.5" fill="currentColor" />
                          <circle cx="18.5" cy="19" r="3.5" fill="currentColor" />
                          <path d="M 12 8.5 Q 5.5 13 5.5 19" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
                          <path d="M 12 8.5 Q 18.5 13 18.5 19" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
                          <path d="M 5.5 19 Q 12 19 18.5 19" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
                        </svg>
                        {/* LED Verde/Vermelho */}
                        <div className="absolute -top-1 -right-1">
                          <div className="relative">
                            <div className={`w-3 h-3 rounded-full ${webhook.online ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
                            <div className={`absolute inset-0 w-3 h-3 rounded-full ${webhook.online ? 'bg-green-500' : 'bg-red-500'} opacity-75 animate-ping`}></div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Name and Details */}
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">{webhook.title}</h3>
                        <p className="text-sm text-gray-600 mb-1">Criado por: {webhook.createdBy}</p>
                        <p className="text-sm text-gray-600">Atualizado em: {formatDate(webhook.updatedAt)}</p>
                      </div>
                    </div>

                    {/* Right Side - Type and Status */}
                    <div className="flex flex-col items-end gap-3">
                      {webhook.type && (
                        <span className="text-sm font-medium text-gray-700">{webhook.type}</span>
                      )}
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          webhook.online
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {webhook.online ? 'Ativo' : 'Inativo'}
                        </span>
                        <button
                          onClick={() => handleToggleWebhookStatus(webhook.id)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            webhook.online ? 'bg-green-600' : 'bg-red-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              webhook.online ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleDeleteWebhook(webhook.id)}
                      className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors"
                      title="Excluir"
                    >
                      <FiTrash2 className="w-5 h-5 text-gray-600" />
                    </button>
                    <button
                      onClick={() => handleCopyWebhook(webhook)}
                      className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
                      title="Copiar"
                    >
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                      </svg>
                    </button>
                    <button
                      onClick={() => handleEditWebhook(webhook.id)}
                      className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
                      title="Editar"
                    >
                      <FiEdit className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Facebook Integrations */}
          {activeTab === 'entradas' && facebookIntegrations.length > 0 && (
            <div className="space-y-4">
              {facebookIntegrations.map((fbIntegration) => (
                <div key={fbIntegration.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Facebook Icon */}
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 relative">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                        {/* LED Verde/Vermelho */}
                        <div className="absolute -top-1 -right-1">
                          <div className="relative">
                            <div className={`w-3 h-3 rounded-full ${fbIntegration.status === 'active' ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
                            <div className={`absolute inset-0 w-3 h-3 rounded-full ${fbIntegration.status === 'active' ? 'bg-green-500' : 'bg-red-500'} opacity-75 animate-ping`}></div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Info */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{fbIntegration.title}</h3>
                        <p className="text-sm text-gray-600">Conta: {fbIntegration.accountName}</p>
                        <p className="text-sm text-gray-600">Email: {fbIntegration.accountEmail}</p>
                      </div>
                    </div>

                    {/* Status and Action */}
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          fbIntegration.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {fbIntegration.status === 'active' ? 'Ativo' : 'Inativo'}
                        </span>
                        <button
                          onClick={() => handleToggleFacebookStatus(fbIntegration.id)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            fbIntegration.status === 'active' ? 'bg-green-600' : 'bg-red-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              fbIntegration.status === 'active' ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      <button className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                        Configurar
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleDeleteFacebook(fbIntegration.id)}
                      className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors"
                      title="Excluir"
                    >
                      <FiTrash2 className="w-5 h-5 text-gray-600" />
                    </button>
                    <button
                      onClick={() => handleCopyFacebook(fbIntegration)}
                      className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
                      title="Copiar"
                    >
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                      </svg>
                    </button>
                    <button
                      onClick={() => handleEditFacebook(fbIntegration.id)}
                      className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
                      title="Editar"
                    >
                      <FiEdit className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TikTok Integrations */}
          {activeTab === 'entradas' && tiktokIntegrations.length > 0 && (
            <div className="space-y-4">
              {tiktokIntegrations.map((tiktokIntegration) => (
                <div key={tiktokIntegration.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* TikTok Icon */}
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-black relative">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                        </svg>
                        {/* LED Verde/Vermelho */}
                        <div className="absolute -top-1 -right-1">
                          <div className="relative">
                            <div className={`w-3 h-3 rounded-full ${tiktokIntegration.status === 'active' ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
                            <div className={`absolute inset-0 w-3 h-3 rounded-full ${tiktokIntegration.status === 'active' ? 'bg-green-500' : 'bg-red-500'} opacity-75 animate-ping`}></div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Info */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{tiktokIntegration.title}</h3>
                        <p className="text-sm text-gray-600">Conta: {tiktokIntegration.accountName}</p>
                        <p className="text-sm text-gray-600">Email: {tiktokIntegration.accountEmail}</p>
                      </div>
                    </div>

                    {/* Status and Action */}
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          tiktokIntegration.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {tiktokIntegration.status === 'active' ? 'Ativo' : 'Inativo'}
                        </span>
                        <button
                          onClick={() => handleToggleTikTokStatus(tiktokIntegration.id)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            tiktokIntegration.status === 'active' ? 'bg-green-600' : 'bg-red-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              tiktokIntegration.status === 'active' ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      <button className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                        Configurar
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleDeleteTikTok(tiktokIntegration.id)}
                      className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors"
                      title="Excluir"
                    >
                      <FiTrash2 className="w-5 h-5 text-gray-600" />
                    </button>
                    <button
                      onClick={() => handleCopyTikTok(tiktokIntegration)}
                      className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
                      title="Copiar"
                    >
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                      </svg>
                    </button>
                    <button
                      onClick={() => handleEditTikTok(tiktokIntegration.id)}
                      className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
                      title="Editar"
                    >
                      <FiEdit className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Instagram Integrations */}
          {activeTab === 'entradas' && instagramIntegrations.length > 0 && (
            <div className="space-y-4">
              {instagramIntegrations.map((instagramIntegration) => (
                <div key={instagramIntegration.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Instagram Icon */}
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-100 via-pink-100 to-orange-100 rounded-lg flex items-center justify-center relative">
                        <svg className="w-6 h-6 text-pink-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                        {/* LED Verde/Vermelho */}
                        <div className="absolute -top-1 -right-1">
                          <div className="relative">
                            <div className={`w-3 h-3 rounded-full ${instagramIntegration.status === 'active' ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
                            <div className={`absolute inset-0 w-3 h-3 rounded-full ${instagramIntegration.status === 'active' ? 'bg-green-500' : 'bg-red-500'} opacity-75 animate-ping`}></div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Info */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{instagramIntegration.title}</h3>
                        <p className="text-sm text-gray-600">{instagramIntegration.accountName}</p>
                        <p className="text-xs text-gray-500">
                          Conectado em {new Date(instagramIntegration.connectedAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>

                    {/* Status and Action */}
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          instagramIntegration.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {instagramIntegration.status === 'active' ? 'Ativo' : 'Inativo'}
                        </span>
                        <button
                          onClick={() => handleToggleInstagramStatus(instagramIntegration.id)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            instagramIntegration.status === 'active' ? 'bg-green-600' : 'bg-red-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              instagramIntegration.status === 'active' ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopyInstagram(instagramIntegration)}
                          className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
                          title="Copiar"
                        >
                          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                          </svg>
                        </button>
                        <button
                          onClick={() => handleEditInstagram(instagramIntegration.id)}
                          className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-pink-50 hover:border-pink-300 transition-colors"
                          title="Editar"
                        >
                          <FiEdit className="w-5 h-5 text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleDeleteInstagram(instagramIntegration.id)}
                          className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors"
                          title="Excluir"
                        >
                          <FiTrash2 className="w-5 h-5 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Google Ads Integrations */}
          {activeTab === 'entradas' && googleAdsIntegrations.length > 0 && (
            <div className="space-y-4">
              {googleAdsIntegrations.map((googleAdsIntegration) => (
                <div key={googleAdsIntegration.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Google Ads Icon */}
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-black relative overflow-hidden">
                        <svg className="w-8 h-8" viewBox="0 0 250.9 312.8" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <defs>
                            <rect id="SVGID_1_GA" width="250.9" height="312.8"/>
                            <clipPath id="SVGID_2_GA">
                              <use href="#SVGID_1_GA" style={{overflow: 'visible'}}/>
                            </clipPath>
                          </defs>
                          <path style={{clipPath: 'url(#SVGID_2_GA)', fill: '#3C8BD9'}} d="M85.9,28.6c2.4-6.3,5.7-12.1,10.6-16.8c19.6-19.1,52-14.3,65.3,9.7c10,18.2,20.6,36,30.9,54
                            c17.2,29.9,34.6,59.8,51.6,89.8c14.3,25.1-1.2,56.8-29.6,61.1c-17.4,2.6-33.7-5.4-42.7-21c-15.1-26.3-30.3-52.6-45.4-78.8
                            c-0.3-0.6-0.7-1.1-1.1-1.6c-1.6-1.3-2.3-3.2-3.3-4.9c-6.7-11.8-13.6-23.5-20.3-35.2c-4.3-7.6-8.8-15.1-13.1-22.7
                            c-3.9-6.8-5.7-14.2-5.5-22C83.6,36.2,84.1,32.2,85.9,28.6"/>
                          <path style={{clipPath: 'url(#SVGID_2_GA)', fill: '#FABC04'}} d="M85.9,28.6c-0.9,3.6-1.7,7.2-1.9,11c-0.3,8.4,1.8,16.2,6,23.5C101,82,112,101,122.9,120c1,1.7,1.8,3.4,2.8,5
                            c-6,10.4-12,20.7-18.1,31.1c-8.4,14.5-16.8,29.1-25.3,43.6c-0.4,0-0.5-0.2-0.6-0.5c-0.1-0.8,0.2-1.5,0.4-2.3
                            c4.1-15,0.7-28.3-9.6-39.7c-6.3-6.9-14.3-10.8-23.5-12.1c-12-1.7-22.6,1.4-32.1,8.9c-1.7,1.3-2.8,3.2-4.8,4.2
                            c-0.4,0-0.6-0.2-0.7-0.5c4.8-8.3,9.5-16.6,14.3-24.9C45.5,98.4,65.3,64,85.2,29.7C85.4,29.3,85.7,29,85.9,28.6"/>
                          <path style={{clipPath: 'url(#SVGID_2_GA)', fill: '#34A852'}} d="M11.8,158c1.9-1.7,3.7-3.5,5.7-5.1c24.3-19.2,60.8-5.3,66.1,25.1c1.3,7.3,0.6,14.3-1.6,21.3
                            c-0.1,0.6-0.2,1.1-0.4,1.7c-0.9,1.6-1.7,3.3-2.7,4.9c-8.9,14.7-22,22-39.2,20.9C20,225.4,4.5,210.6,1.8,191
                            c-1.3-9.5,0.6-18.4,5.5-26.6c1-1.8,2.2-3.4,3.3-5.2C11.1,158.8,10.9,158,11.8,158"/>
                        </svg>
                        {/* LED Verde/Vermelho */}
                        <div className="absolute -top-1 -right-1">
                          <div className="relative">
                            <div className={`w-3 h-3 rounded-full ${googleAdsIntegration.status === 'active' ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
                            <div className={`absolute inset-0 w-3 h-3 rounded-full ${googleAdsIntegration.status === 'active' ? 'bg-green-500' : 'bg-red-500'} opacity-75 animate-ping`}></div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Info */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{googleAdsIntegration.title}</h3>
                        <p className="text-sm text-gray-600">Conta: {googleAdsIntegration.accountName}</p>
                        <p className="text-sm text-gray-600">Email: {googleAdsIntegration.accountEmail}</p>
                      </div>
                    </div>

                    {/* Status and Action */}
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          googleAdsIntegration.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {googleAdsIntegration.status === 'active' ? 'Ativo' : 'Inativo'}
                        </span>
                        <button
                          onClick={() => handleToggleGoogleAdsStatus(googleAdsIntegration.id)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            googleAdsIntegration.status === 'active' ? 'bg-green-600' : 'bg-red-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              googleAdsIntegration.status === 'active' ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      <button className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                        Configurar
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleDeleteGoogleAds(googleAdsIntegration.id)}
                      className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors"
                      title="Excluir"
                    >
                      <FiTrash2 className="w-5 h-5 text-gray-600" />
                    </button>
                    <button
                      onClick={() => handleCopyGoogleAds(googleAdsIntegration)}
                      className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
                      title="Copiar"
                    >
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                      </svg>
                    </button>
                    <button
                      onClick={() => handleEditGoogleAds(googleAdsIntegration.id)}
                      className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
                      title="Editar"
                    >
                      <FiEdit className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Other Integrations */}
          {activeIntegrations.map((integration) => (
            <div key={integration.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* Icon */}
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                    {integration.icon}
                  </div>
                  
                  {/* Info */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{integration.name}</h3>
                    <p className="text-sm text-gray-600">{integration.description}</p>
                  </div>
                </div>

                {/* Status and Action */}
                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    integration.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {integration.status === 'active' ? 'Ativo' : 'Inativo'}
                  </span>
                  <button className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                    Configurar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-lg shadow-md p-12">
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            {/* Illustration */}
            <div className="relative mb-6">
              {/* Speech bubble with dots */}
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
                <div className="bg-gray-200 rounded-lg p-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  </div>
                </div>
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                  <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-200"></div>
                </div>
              </div>
              
              {/* Inbox icon */}
              <div className="relative">
                <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                  <FiInbox className="w-12 h-12 text-gray-400" />
                  {/* Document inside */}
                  <div className="absolute bottom-2 right-2 w-8 h-10 bg-gray-200 rounded-sm transform rotate-12"></div>
                </div>
              </div>
            </div>

            {/* Empty State Text */}
            <p className="text-gray-500 text-sm">Nenhuma integração cadastrada</p>
          </div>
        </div>
      )}

      {/* Modal Adicionar Integração */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Adicionar integração</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Selecione o tipo de integração que deseja adicionar
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {availableIntegrations.map((integration) => (
                  <button
                    key={integration.id}
                    onClick={() => handleAddIntegration(integration.id)}
                    className="flex flex-col items-center justify-center p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
                  >
                    <div className={`w-16 h-16 ${integration.bgColor} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${integration.iconColor}`}>
                      {integration.icon}
                    </div>
                    <span className="text-sm font-medium text-gray-900">{integration.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Configuração Facebook */}
      {showFacebookModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Adicionar uma nova integração</h2>
              <button
                onClick={() => setShowFacebookModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Campo Título */}
              <div className="mb-6">
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  * Título da integração:
                </label>
                <input
                  type="text"
                  value={facebookTitle}
                  onChange={(e) => setFacebookTitle(e.target.value)}
                  placeholder="Título da integração"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Steps */}
              <div className="space-y-4">
                {/* Step 1 - Conta do Facebook */}
                <div className="flex items-start gap-4 p-4 border-2 border-blue-500 rounded-lg bg-blue-50">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">1</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">Conta do Facebook</h3>
                    <p className="text-sm text-gray-600 mb-3">Escolha ou adicione contas do facebook</p>
                  </div>
                  <button 
                    onClick={() => {
                      if (facebookTitle.trim()) {
                        setShowFacebookAccountModal(true);
                      } else {
                        alert('Por favor, preencha o título da integração primeiro');
                      }
                    }}
                    className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <FiChevronRight className="w-5 h-5" />
                  </button>
                </div>

                {/* Step 2 - Página e Fila */}
                <div className="flex items-start gap-4 p-4 border-2 border-gray-200 rounded-lg">
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 font-semibold text-sm">2</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">Página e Fila</h3>
                    <p className="text-sm text-gray-600">Escolha quais páginas você deseja receber cadastros</p>
                  </div>
                </div>

                {/* Step 3 - Testar integração */}
                <div className="flex items-start gap-4 p-4 border-2 border-gray-200 rounded-lg">
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 font-semibold text-sm">3</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">Testar integração</h3>
                    <p className="text-sm text-gray-600">Clique aqui para abrir a ferramenta de teste do Facebook</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowFacebookModal(false);
                  setFacebookTitle('');
                  setPendingFacebookData(null);
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              {pendingFacebookData && (
                <button
                  onClick={() => {
                    if (facebookTitle.trim()) {
                      handleFacebookConnect();
                    } else {
                      alert('Por favor, preencha o título da integração primeiro');
                    }
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Conectar
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Seleção de Conta do Facebook */}
      {showFacebookAccountModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            {/* Modal Header */}
            <div className="flex items-center gap-4 p-4 bg-gray-800 text-white">
              <button
                onClick={() => setShowFacebookAccountModal(false)}
                className="text-white hover:text-gray-300 transition-colors"
              >
                <FiX className="w-6 h-6" />
              </button>
              <h2 className="text-lg font-semibold">1 - Adicione ou escolha uma conta do Facebook</h2>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Account Selection Section */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <FiChevronDown className="w-5 h-5 text-gray-600" />
                  <label className="text-sm font-medium text-gray-700">Escolha uma conta</label>
                </div>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowAccountDropdown(!showAccountDropdown)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between bg-white text-left"
                  >
                    <span className={selectedFacebookAccount ? 'text-gray-900' : 'text-gray-500'}>
                      {selectedFacebookAccount || 'Escolha uma conta'}
                    </span>
                    <FiChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showAccountDropdown ? 'transform rotate-180' : ''}`} />
                  </button>
                  {showAccountDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                      {/* Mock accounts - em produção viria de uma API */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFacebookAccount('Minha Conta Pessoal');
                          setShowAccountDropdown(false);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors"
                      >
                        <span className="text-sm text-gray-900">Minha Conta Pessoal</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFacebookAccount('Página Empresarial');
                          setShowAccountDropdown(false);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors"
                      >
                        <span className="text-sm text-gray-900">Página Empresarial</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-4 flex-wrap">
                <button
                  onClick={() => {
                    setShowFacebookPermissionsModal(true);
                  }}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Conectar uma nova conta
                </button>
                <button
                  onClick={() => {
                    // Aqui você pode implementar a lógica de excluir conta
                    if (selectedFacebookAccount) {
                      if (window.confirm(`Tem certeza que deseja excluir a conta "${selectedFacebookAccount}"?`)) {
                        setSelectedFacebookAccount('');
                        alert('Conta excluída com sucesso');
                      }
                    } else {
                      alert('Selecione uma conta para excluir');
                    }
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors flex items-center gap-2"
                >
                  <FiTrash className="w-5 h-5" />
                  Excluir uma conta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Permissões do Facebook */}
      {showFacebookPermissionsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center">
                  <span className="text-white font-bold text-lg">f</span>
                </div>
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center">
                  <div className="w-6 h-6 bg-white rounded"></div>
                </div>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                BiaCRM está solicitando acesso a:
              </h2>
            </div>

            {/* Modal Content */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {/* Permissions List */}
              <ul className="space-y-3 mb-4">
                <li className="flex items-start gap-2">
                  <span className="text-gray-400 mt-1">•</span>
                  <span className="text-sm text-gray-700">Nome e foto do perfil</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-400 mt-1">•</span>
                  <span className="text-sm text-gray-700">Endereço de email</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-400 mt-1">•</span>
                  <span className="text-sm text-gray-700">Gerencie anúncios das contas de anúncios às quais você tem acesso</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-400 mt-1">•</span>
                  <span className="text-sm text-gray-700">Gerenciar seu negócio</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-400 mt-1">•</span>
                  <span className="text-sm text-gray-700">Acessar leads para suas Páginas</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-400 mt-1">•</span>
                  <span className="text-sm text-gray-700">Ler o conteúdo publicado na Página</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-400 mt-1">•</span>
                  <span className="text-sm text-gray-700">Crie e gerencie anúncios para sua Página</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-400 mt-1">•</span>
                  <span className="text-sm text-gray-700">Gerenciar contas, configurações e webhooks de uma Página</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-400 mt-1">•</span>
                  <span className="text-sm text-gray-700">Mostrar uma lista das Páginas que você gerencia</span>
                </li>
              </ul>

              {/* Edit Access Link */}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  // Implementar lógica de editar acesso
                }}
                className="text-blue-600 hover:text-blue-700 text-sm underline mb-6 inline-block"
              >
                Editar acesso
              </a>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200">
              {/* Action Buttons */}
              <div className="space-y-3 mb-4">
                <button
                  onClick={() => {
                    // Iniciar autenticação OAuth do Facebook diretamente
                    setShowFacebookPermissionsModal(false);
                    handleFacebookLogin();
                  }}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Continuar como {user?.name || 'Usuário'}
                </button>
                <button
                  onClick={() => setShowFacebookPermissionsModal(false)}
                  className="w-full px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancelar
                </button>
              </div>

              {/* Disclaimer */}
              <p className="text-xs text-gray-600 text-center mb-2">
                Ao continuar, o BiaCRM receberá acesso contínuo às informações que você compartilhar, e a Meta registrará quando o BiaCRM acessar essas informações. Saiba mais sobre esse compartilhamento e suas configurações ativas.
              </p>
              <div className="text-center">
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    // Abrir política de privacidade
                  }}
                  className="text-xs text-blue-600 hover:text-blue-700 underline"
                >
                  Política de Privacidade e Termos de Serviço do BiaCRM
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Login Facebook */}
      {showFacebookLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center">
                  <span className="text-white font-bold text-lg">f</span>
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Login no Facebook</h2>
              </div>
              <button
                onClick={() => setShowFacebookLoginModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="space-y-4">
                {/* Email Field */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Email ou telefone
                  </label>
                  <input
                    type="text"
                    value={facebookEmail}
                    onChange={(e) => setFacebookEmail(e.target.value)}
                    placeholder="Email ou telefone"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Password Field */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Senha
                  </label>
                  <input
                    type="password"
                    value={facebookPassword}
                    onChange={(e) => setFacebookPassword(e.target.value)}
                    placeholder="Senha"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowFacebookLoginModal(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleFacebookLogin}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Entrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Atualização do Lead */}
      {showUpdateLeadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Adicionar uma nova integração</h2>
              <button
                onClick={() => setShowUpdateLeadModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Campo Título */}
              <div className="mb-6">
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  * Título da integração:
                </label>
                <input
                  type="text"
                  value={updateLeadTitle}
                  onChange={(e) => setUpdateLeadTitle(e.target.value)}
                  placeholder="Título da integração"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Botão para gerar token */}
              {!integrationToken && (
                <div className="mb-6">
                  <button
                    onClick={generateIntegrationToken}
                    className="w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Gerar Endpoint e Token
                  </button>
                </div>
              )}

              {/* Exibir endpoint e token quando gerados */}
              {integrationToken && (
                <div className="space-y-4">
                  {/* Endpoint */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Endpoint:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={integrationToken.endpoint}
                        readOnly
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm font-mono"
                      />
                      <button
                        onClick={() => copyToClipboard(integrationToken.endpoint)}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        title="Copiar endpoint"
                      >
                        <FiCopy className="w-5 h-5 text-gray-600" />
                      </button>
                    </div>
                  </div>

                  {/* Token */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Token de Acesso:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={integrationToken.token}
                        readOnly
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm font-mono"
                      />
                      <button
                        onClick={() => copyToClipboard(integrationToken.token)}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        title="Copiar token"
                      >
                        <FiCopy className="w-5 h-5 text-gray-600" />
                      </button>
                    </div>
                  </div>

                  {/* Informações de uso */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-blue-900 mb-2">Como usar:</h3>
                    <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                      <li>Use o endpoint acima para receber atualizações de leads</li>
                      <li>Inclua o token no header: <code className="bg-blue-100 px-1 rounded">Authorization: Bearer {integrationToken.token.substring(0, 20)}...</code></li>
                      <li>Ou use o header: <code className="bg-blue-100 px-1 rounded">X-API-Token: {integrationToken.token.substring(0, 20)}...</code></li>
                      <li>Envie um POST com o body: <code className="bg-blue-100 px-1 rounded">{"{ \"leadId\": \"123\", \"data\": {...} }"}</code></li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Steps */}
              {!integrationToken && (
                <div className="space-y-4 mt-6">
                  {/* Step 1 - Conta do Facebook */}
                  <div className="flex items-start gap-4 p-4 border-2 border-blue-500 rounded-lg bg-blue-50">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">1</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">Conta do Facebook</h3>
                      <p className="text-sm text-gray-600 mb-3">Escolha ou adicione contas do facebook</p>
                    </div>
                    <button className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors">
                      <FiChevronRight className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Step 2 - Página e Fila */}
                  <div className="flex items-start gap-4 p-4 border-2 border-gray-200 rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 font-semibold text-sm">2</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">Página e Fila</h3>
                      <p className="text-sm text-gray-600">Escolha quais páginas você deseja receber cadastros</p>
                    </div>
                  </div>

                  {/* Step 3 - Testar integração */}
                  <div className="flex items-start gap-4 p-4 border-2 border-gray-200 rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 font-semibold text-sm">3</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">Testar integração</h3>
                      <p className="text-sm text-gray-600">Clique aqui para abrir a ferramenta de teste do Facebook</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowUpdateLeadModal(false);
                  setIntegrationToken(null);
                  setUpdateLeadTitle('');
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Configuração Webhook */}
      {showWebhookModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Deseja fazer integração com Webhook?</h2>
              <button
                onClick={handleCloseWebhookModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Texto explicativo */}
              <div className="mb-6 flex items-start gap-2">
                <p className="text-sm text-gray-600 flex-1">
                  Para realizar integração com Webhook, basta registrar essa integração e configurar com a URL gerada abaixo!
                </p>
                <FiHelpCircle className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
              </div>

              {/* Campo Título */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Título:</label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700">Online:</span>
                    <button
                      onClick={() => setWebhookOnline(!webhookOnline)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        webhookOnline ? 'bg-green-600' : 'bg-red-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          webhookOnline ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  value={webhookTitle}
                  onChange={(e) => setWebhookTitle(e.target.value)}
                  placeholder="Título"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Campo Fila */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <label className="text-sm font-medium text-gray-700">Fila:</label>
                  <FiHelpCircle className="w-4 h-4 text-gray-400" />
                </div>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowQueueDropdown(!showQueueDropdown)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between bg-white text-left"
                  >
                    <span className={webhookQueue ? 'text-gray-900' : 'text-gray-500'}>
                      {webhookQueue 
                        ? availableQueues.find(q => q.id === webhookQueue)?.name 
                        : 'Selecione uma fila'}
                    </span>
                    <FiChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showQueueDropdown ? 'transform rotate-180' : ''}`} />
                  </button>
                  {showQueueDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                      {availableQueues.map((queue) => (
                        <button
                          key={queue.id}
                          type="button"
                          onClick={() => {
                            setWebhookQueue(queue.id);
                            setShowQueueDropdown(false);
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors"
                        >
                          <span className="text-sm text-gray-900">{queue.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Webhook URL Section */}
              <div className="mb-6">
                <p className="text-sm text-gray-700 mb-2">
                  Copie esta URL e utilize nas suas chamadas:
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={
                      (() => {
                        try {
                          if (webhookUrl) {
                            return webhookUrl;
                          }
                          if (editingWebhookId) {
                            return generateWebhookUrl(editingWebhookId);
                          }
                          // Sempre gerar uma URL prévia quando o modal estiver aberto
                          const previewId = `webhook-${Date.now()}`;
                          return generateWebhookUrl(previewId);
                        } catch (error) {
                          console.error('Erro ao gerar URL:', error);
                          return '';
                        }
                      })()
                    }
                    readOnly
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm font-mono"
                  />
                  <button
                    onClick={() => {
                      try {
                        let url = webhookUrl;
                        if (!url && editingWebhookId) {
                          url = generateWebhookUrl(editingWebhookId);
                        } else if (!url) {
                          const previewId = `webhook-${Date.now()}`;
                          url = generateWebhookUrl(previewId);
                        }
                        if (url) {
                          copyToClipboard(url);
                        }
                      } catch (error) {
                        console.error('Erro ao copiar URL:', error);
                        alert('Erro ao copiar URL');
                      }
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    title="Copiar URL"
                  >
                    <FiCopy className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-4 p-6 border-t border-gray-200">
              <button
                onClick={handleCloseWebhookModal}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Fechar
              </button>
              <button
                onClick={handleCreateWebhook}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal TikTok */}
      {showTikTokModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex">
            {/* Left Panel - TikTok Card */}
            <div className="w-80 bg-white border-r border-gray-200 p-6 flex flex-col">
              <div className="flex flex-col items-center mb-6">
                {/* TikTok Logo */}
                <div className="w-24 h-24 bg-black rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-16 h-16" fill="white" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">TikTok</h2>
                <p className="text-sm text-gray-600 text-center">
                  Rastreie, automatize e feche seus leads na Kommo
                </p>
              </div>
            </div>

            {/* Right Panel - Configuration */}
            <div className="flex-1 flex flex-col">
              {/* Header with Close Button */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center gap-6">
                  <button
                    onClick={() => setTikTokActiveTab('configuracoes')}
                    className={`px-4 py-2 font-medium transition-colors ${
                      tiktokActiveTab === 'configuracoes'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Configurações
                  </button>
                  <button
                    onClick={() => setTikTokActiveTab('autorizacao')}
                    className={`px-4 py-2 font-medium transition-colors ${
                      tiktokActiveTab === 'autorizacao'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Autorização
                  </button>
                </div>
                <button
                  onClick={() => setShowTikTokModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 p-6 overflow-y-auto">
                {tiktokActiveTab === 'configuracoes' && (
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">
                      Entre na sua conta Empresarial TikTok
                    </h3>
                    
                    <div className="space-y-4 text-gray-700 mb-8">
                      <p>
                        Para poder se conectar, sua conta TikTok Empresarial deve estar registrada fora da Europa, do Reino Unido ou da Suíça.
                      </p>
                      <p>
                        Se você está usando sua conta pessoal do TikTok, torne ela uma conta Empresarial indo no aplicativo TikTok {'>'} vá para Conta {'>'} toque em Mudar para Conta Empresarial. {'>'} toque em Mudar para Conta Empresarial.**
                      </p>
                    </div>

                    <button 
                      onClick={handleTikTokContinue}
                      className="w-full bg-black text-white rounded-lg px-6 py-4 flex items-center justify-center gap-3 hover:bg-gray-800 transition-colors font-medium"
                    >
                      <svg className="w-6 h-6" fill="white" viewBox="0 0 24 24">
                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                      </svg>
                      Continuar com TikTok
                    </button>
                  </div>
                )}

                {tiktokActiveTab === 'autorizacao' && (
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">
                      Autorização
                    </h3>
                    <p className="text-gray-700">
                      Conteúdo de autorização será exibido aqui.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Login TikTok */}
      {showTikTokLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-black rounded flex items-center justify-center">
                  <svg className="w-6 h-6" fill="white" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Login no TikTok</h2>
              </div>
              <button
                onClick={() => setShowTikTokLoginModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="space-y-4">
                {/* Email Field */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Email ou telefone
                  </label>
                  <input
                    type="text"
                    value={tiktokEmail}
                    onChange={(e) => setTikTokEmail(e.target.value)}
                    placeholder="Email ou telefone"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>

                {/* Password Field */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Senha
                  </label>
                  <input
                    type="password"
                    value={tiktokPassword}
                    onChange={(e) => setTikTokPassword(e.target.value)}
                    placeholder="Senha"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200">
              <button
                onClick={handleTikTokLogin}
                className="w-full px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
              >
                Entrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Login Instagram */}
      {showInstagramLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 rounded flex items-center justify-center">
                  <svg className="w-6 h-6" fill="white" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Login no Instagram</h2>
              </div>
              <button
                onClick={() => setShowInstagramLoginModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800">
                    <strong>Como funciona:</strong> Informe seu usuário do Instagram. 
                    Você será redirecionado para autorizar o acesso à sua conta Instagram Business através do Facebook.
                  </p>
                </div>
                
                {/* Username Field (obrigatório) */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Usuário do Instagram <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={instagramEmail}
                    onChange={(e) => setInstagramEmail(e.target.value)}
                    placeholder="Digite seu usuário do Instagram"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Você será redirecionado para autorizar o acesso.
                  </p>
                </div>

                {/* Password Field (opcional - para referência) */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Senha (opcional)
                  </label>
                  <input
                    type="password"
                    value={instagramPassword}
                    onChange={(e) => setInstagramPassword(e.target.value)}
                    placeholder="Senha (opcional - para referência)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Você usará suas credenciais na tela de autorização do Facebook/Instagram.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowInstagramLoginModal(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleInstagramLogin}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white rounded-lg hover:opacity-90 transition-opacity font-medium flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="white" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                Conectar Instagram
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edição TikTok */}
      {showTikTokEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editingTikTokId ? 'Editar integração do TikTok' : 'Adicionar uma nova integração'}
              </h2>
              <button
                onClick={() => {
                  setShowTikTokEditModal(false);
                  setEditingTikTokId(null);
                  setTikTokTitle('');
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Campo Título */}
              <div className="mb-6">
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  * Título da integração:
                </label>
                <input
                  type="text"
                  value={tiktokTitle}
                  onChange={(e) => setTikTokTitle(e.target.value)}
                  placeholder="Título da integração"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              {/* Steps */}
              <div className="space-y-4">
                {/* Step 1 - Conta do TikTok */}
                <div className="flex items-start gap-4 p-4 border-2 border-black rounded-lg bg-gray-50">
                  <div className="flex-shrink-0 w-8 h-8 bg-black rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">1</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">Conta do TikTok</h3>
                    <p className="text-sm text-gray-600 mb-3">Escolha ou adicione contas do TikTok</p>
                  </div>
                  <button 
                    onClick={() => {
                      if (tiktokTitle.trim()) {
                        handleTikTokContinue();
                      } else {
                        alert('Por favor, preencha o título da integração primeiro');
                      }
                    }}
                    className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <FiChevronRight className="w-5 h-5" />
                  </button>
                </div>

                {/* Step 2 - Página e Fila */}
                <div className="flex items-start gap-4 p-4 border-2 border-gray-200 rounded-lg">
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 font-semibold text-sm">2</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">Página e Fila</h3>
                    <p className="text-sm text-gray-600">Escolha quais páginas você deseja receber cadastros</p>
                  </div>
                </div>

                {/* Step 3 - Testar integração */}
                <div className="flex items-start gap-4 p-4 border-2 border-gray-200 rounded-lg">
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 font-semibold text-sm">3</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">Testar integração</h3>
                    <p className="text-sm text-gray-600">Clique aqui para abrir a ferramenta de teste do TikTok</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowTikTokEditModal(false);
                  setEditingTikTokId(null);
                  setTikTokTitle('');
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Google Ads - Seleção de Conta */}
      {showGoogleAdsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex">
            {/* Left Panel - Branding */}
            <div className="w-1/3 bg-gray-900 p-8 flex flex-col justify-between border-r border-gray-700">
              <div>
                <div className="flex items-center gap-2 mb-8">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <span className="text-white text-sm">Fazer Login com o Google</span>
                </div>
                
                <div className="mb-8">
                  <h2 className="text-white text-2xl font-normal mb-2">Escolha uma conta</h2>
                </div>
              </div>
            </div>

            {/* Right Panel - Account List */}
            <div className="flex-1 bg-white p-6 overflow-y-auto relative">
              <button
                onClick={() => {
                  setShowGoogleAdsModal(false);
                  setEditingGoogleAdsId(null);
                }}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FiX className="w-6 h-6" />
              </button>
              <div className="space-y-0">
                {/* Account 1 */}
                <button 
                  onClick={() => handleGoogleAccountSelect('bnovais.bn@gmail.com', 'Bernardo Novais')}
                  className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors border-b border-gray-200"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                    BN
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-gray-900">Bernardo Novais</div>
                    <div className="text-sm text-gray-600">bnovais.bn@gmail.com</div>
                  </div>
                </button>

                {/* Account 2 */}
                <button 
                  onClick={() => handleGoogleAccountSelect('muitagrana935@gmail.com')}
                  className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors border-b border-gray-200"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                    <span className="text-gray-700 font-semibold text-xs">BNC</span>
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm text-gray-600">muitagrana935@gmail.com</div>
                  </div>
                </button>

                {/* Account 3 */}
                <button 
                  onClick={() => handleGoogleAccountSelect('muitagranaassinantes@gmail.com')}
                  className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors border-b border-gray-200"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                    </svg>
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm text-gray-600">muitagranaassinantes@gmail.com</div>
                  </div>
                </button>

                {/* Account 4 */}
                <button 
                  onClick={() => handleGoogleAccountSelect('muitagranaassinantes.pacote2@gmail.com')}
                  className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors border-b border-gray-200"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                    </svg>
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm text-gray-600">muitagranaassinantes.pacote2@gmail.com</div>
                  </div>
                </button>

                {/* Account 5 */}
                <button 
                  onClick={() => handleGoogleAccountSelect('muitagranaassinantes.pacote3@gmail.com')}
                  className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors border-b border-gray-200"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                    </svg>
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm text-gray-600">muitagranaassinantes.pacote3@gmail.com</div>
                  </div>
                </button>

                {/* Account 6 */}
                <button 
                  onClick={() => handleGoogleAccountSelect('bncconsultorialtda@gmail.com', 'BNC Consultoria')}
                  className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors border-b border-gray-200"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                    <span className="text-gray-700 font-semibold text-xs">BNC</span>
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-gray-900">BNC Consultoria</div>
                    <div className="text-sm text-gray-600">bncconsultorialtda@gmail.com</div>
                  </div>
                </button>

                {/* Usar outra conta */}
                  <button 
                    onClick={() => {
                      setShowGoogleAdsModal(false);
                      setShowGoogleLoginModal(true);
                      // Manter editingGoogleAdsId ao abrir modal de login
                    }}
                  className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                    </svg>
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-gray-900">Usar outra conta</div>
                  </div>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Modal Login Google */}
      {showGoogleLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <h2 className="text-xl font-semibold text-gray-900">Login no Google</h2>
              </div>
              <button
                onClick={() => {
                  setShowGoogleLoginModal(false);
                  setGoogleEmail('');
                  setGooglePassword('');
                  setEditingGoogleAdsId(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="space-y-4">
                {/* Email Field */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Email ou telefone
                  </label>
                  <input
                    type="text"
                    value={googleEmail}
                    onChange={(e) => setGoogleEmail(e.target.value)}
                    placeholder="Email ou telefone"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Password Field */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Senha
                  </label>
                  <input
                    type="password"
                    value={googlePassword}
                    onChange={(e) => setGooglePassword(e.target.value)}
                    placeholder="Senha"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200">
              <button
                onClick={handleGoogleLogin}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Entrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

