import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import LeadDetail from './pages/LeadDetail';
import LeadsAndamento from './pages/LeadsAndamento';
import FunnelConfig from './pages/FunnelConfig';
import Integrations from './pages/Integrations';
import Appointments from './pages/Appointments';
import AiAssistant from './pages/AiAssistant';
import LandingPage from './pages/LandingPage';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import UserDataDeletion from './pages/UserDataDeletion';
import BNCConsultoria from './pages/BNCConsultoria';
import Layout from './components/Layout';
import TrialExpiredModal from './components/TrialExpiredModal';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/login" />;
}

function AppRoutes() {
  const { trialExpired, trialMessage } = useAuth();
  return (
    <>
      <TrialExpiredModal
        open={trialExpired}
        message={trialMessage || 'Seu periodo de trial expirou. Escolha um plano para continuar.'}
      />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/user-data-deletion" element={<UserDataDeletion />} />
        <Route path="/bncconsultoria" element={<BNCConsultoria />} />
        <Route path="/landingpage" element={<LandingPage />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="leads" element={<Leads />} />
          <Route path="leads/andamento" element={<LeadsAndamento />} />
          <Route path="leads/andamento/:funnelId" element={<LeadsAndamento />} />
          <Route path="leads/:id" element={<LeadDetail />} />
          <Route path="funnel-config" element={<FunnelConfig />} />
          <Route path="entrada-saida" element={<Integrations />} />
          <Route path="appointments" element={<Appointments />} />
          <Route path="ai" element={<AiAssistant />} />
        </Route>
      </Routes>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;

