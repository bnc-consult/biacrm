import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import TrialExpiredModal from '../components/TrialExpiredModal';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [trialExpired, setTrialExpired] = useState(false);
  const [trialMessage, setTrialMessage] = useState('');
  const [planInactive, setPlanInactive] = useState(false);
  const [planMessage, setPlanMessage] = useState('');
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [codeMessage, setCodeMessage] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStep, setForgotStep] = useState<'email' | 'code' | 'reset'>('email');
  const [forgotCode, setForgotCode] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotSecondsLeft, setForgotSecondsLeft] = useState(50);
  const [forgotCountdownId, setForgotCountdownId] = useState<number | null>(null);
  const {
    login,
    requestRegisterCode,
    confirmRegister,
    requestPasswordResetCode,
    verifyPasswordResetCode,
    confirmPasswordReset
  } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    return () => {
      if (forgotCountdownId) {
        window.clearInterval(forgotCountdownId);
      }
    };
  }, [forgotCountdownId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (isRegister) {
        setIsSendingCode(true);
        setCodeError('');
        setCodeMessage('');
        await requestRegisterCode(name, email);
        setShowCodeModal(true);
        setCodeMessage('Codigo enviado para o email da empresa.');
      } else {
        await login(email, password);
        navigate('/');
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      if (err.response?.data?.code === 'TRIAL_EXPIRED') {
        setTrialExpired(true);
        setTrialMessage(err.response?.data?.message || 'Seu periodo de trial expirou. Escolha um plano para continuar.');
        return;
      }
      if (err.response?.data?.code === 'PLAN_INACTIVE') {
        setPlanInactive(true);
        setPlanMessage(err.response?.data?.message || 'Sua empresa nao possui plano ativo no BIACRM.');
        return;
      }
      // Mostrar mensagem de erro mais específica
      const errorMessage = err.response?.data?.message || 
                          err.message || 
                          (isRegister ? 'Erro ao criar conta. Verifique se a API está funcionando.' : 'Erro ao fazer login');
      setError(errorMessage);
      
      // Se for erro de rede, mostrar mensagem mais útil
      if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
        setError('Não foi possível conectar ao servidor. Verifique se a API está online.');
      }
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleConfirmCode = async () => {
    setCodeError('');
    setError('');
    try {
      await confirmRegister(name, email, password, verificationCode.trim());
      setShowCodeModal(false);
      navigate('/');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Codigo incorreto ou expirado.';
      setCodeError(errorMessage);
    }
  };

  const handleResendCode = async () => {
    setCodeError('');
    setCodeMessage('');
    setIsSendingCode(true);
    try {
      await requestRegisterCode(name, email);
      setCodeMessage('Codigo reenviado para o email da empresa.');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Falha ao reenviar codigo.';
      setCodeError(errorMessage);
    } finally {
      setIsSendingCode(false);
    }
  };

  const startForgotCountdown = () => {
    if (forgotCountdownId) {
      window.clearInterval(forgotCountdownId);
    }
    setForgotSecondsLeft(50);
    const id = window.setInterval(() => {
      setForgotSecondsLeft((prev) => (prev > 1 ? prev - 1 : 1));
    }, 1000);
    setForgotCountdownId(id);
  };

  const handleForgotRequest = async () => {
    setForgotError('');
    setForgotMessage('');
    try {
      await requestPasswordResetCode(forgotEmail.trim());
      setForgotStep('code');
      setForgotMessage('Codigo enviado para o email da empresa.');
      startForgotCountdown();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Falha ao enviar codigo.';
      setForgotError(errorMessage);
    }
  };

  const handleForgotResend = async () => {
    setForgotError('');
    setForgotMessage('');
    try {
      await requestPasswordResetCode(forgotEmail.trim());
      setForgotMessage('Codigo reenviado para o email da empresa.');
      startForgotCountdown();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Falha ao reenviar codigo.';
      setForgotError(errorMessage);
    }
  };

  const handleForgotConfirmCode = async () => {
    setForgotError('');
    if (!forgotCode.trim()) {
      setForgotError('Informe o codigo.');
      return;
    }
    try {
      await verifyPasswordResetCode(forgotEmail.trim(), forgotCode.trim());
      setForgotStep('reset');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Codigo incorreto.';
      setForgotError(errorMessage);
    }
  };

  const handleForgotReset = async () => {
    setForgotError('');
    setForgotMessage('');
    if (!forgotNewPassword || !forgotConfirmPassword) {
      setForgotError('Preencha os campos de senha.');
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError('As senhas nao conferem.');
      return;
    }
    try {
      await confirmPasswordReset(forgotEmail.trim(), forgotCode.trim(), forgotNewPassword);
      setForgotMessage('Senha atualizada com sucesso. Faça login.');
      setShowForgotModal(false);
      setForgotStep('email');
      setForgotEmail('');
      setForgotCode('');
      setForgotNewPassword('');
      setForgotConfirmPassword('');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Codigo incorreto.';
      setForgotError(errorMessage);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <TrialExpiredModal open={trialExpired} message={trialMessage} />
      {planInactive && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Plano inativo</h3>
            <p className="mt-2 text-sm text-gray-600">{planMessage}</p>
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setPlanInactive(false)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => {
                  window.location.href = '/landingpage';
                }}
                className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
              >
                Ver planos
              </button>
            </div>
          </div>
        </div>
      )}
      {showCodeModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600 text-white">B</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Confirmar email</h3>
                <p className="text-xs text-gray-500">Cadastro da empresa</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-gray-600">
              Digite o codigo enviado para o email da empresa.
            </p>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">Codigo</label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Digite o codigo"
              />
            </div>
            {codeMessage && <div className="mt-3 text-sm text-green-600">{codeMessage}</div>}
            {codeError && <div className="mt-3 text-sm text-red-600">{codeError}</div>}
            <div className="mt-5 flex items-center justify-between">
              <button
                type="button"
                onClick={handleResendCode}
                className="text-sm text-primary-600 hover:text-primary-500 disabled:opacity-60"
                disabled={isSendingCode}
              >
                Reenviar codigo
              </button>
              <button
                type="button"
                onClick={handleConfirmCode}
                className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
      {showForgotModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600 text-white">B</div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Esqueci minha senha</h3>
                  <p className="text-xs text-gray-500">Recuperacao de acesso</p>
                </div>
              </div>
              <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-500">
                {forgotStep === 'email' ? '1/3' : forgotStep === 'code' ? '2/3' : '3/3'}
              </span>
            </div>
            {forgotStep === 'email' && (
              <>
                <p className="mt-2 text-sm text-gray-600">Informe o email da empresa para receber o codigo.</p>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700">Email da empresa</label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="empresa@email.com"
                  />
                </div>
                {forgotError && <div className="mt-3 text-sm text-red-600">{forgotError}</div>}
                <div className="mt-5 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleForgotRequest}
                    className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
                  >
                    Enviar codigo
                  </button>
                </div>
              </>
            )}
            {forgotStep === 'code' && (
              <>
                <p className="mt-2 text-sm text-gray-600">Digite o codigo enviado para o email.</p>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700">Codigo</label>
                  <input
                    type="text"
                    value={forgotCode}
                    onChange={(e) => setForgotCode(e.target.value)}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Digite o codigo"
                  />
                </div>
                {forgotMessage && <div className="mt-3 text-sm text-green-600">{forgotMessage}</div>}
                {forgotError && <div className="mt-3 text-sm text-red-600">{forgotError}</div>}
                <div className="mt-3 text-xs text-gray-400">Expira em {forgotSecondsLeft}s</div>
                <div className="mt-5 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleForgotResend}
                    className="text-sm text-primary-600 hover:text-primary-500"
                  >
                    Re-enviar codigo por email
                  </button>
                  <button
                    type="button"
                    onClick={handleForgotConfirmCode}
                    className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
                  >
                    Validar codigo
                  </button>
                </div>
              </>
            )}
            {forgotStep === 'reset' && (
              <>
                <p className="mt-2 text-sm text-gray-600">Defina sua nova senha.</p>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700">Nova senha</label>
                  <input
                    type="password"
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700">Redigite a nova senha</label>
                  <input
                    type="password"
                    value={forgotConfirmPassword}
                    onChange={(e) => setForgotConfirmPassword(e.target.value)}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                {forgotError && <div className="mt-3 text-sm text-red-600">{forgotError}</div>}
                {forgotMessage && <div className="mt-3 text-sm text-green-600">{forgotMessage}</div>}
                <div className="mt-5 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleForgotReset}
                    className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
                  >
                    Atualizar senha
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            {isRegister ? 'Criar Conta para a Empresa' : 'Entrar no CRM BIA'}
          </h2>
          {isRegister && (
            <p className="mt-2 text-center text-sm text-gray-500">
              Conta trial com validade de 7 dias. Apos esse periodo, sera necessario escolher um plano.
            </p>
          )}
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          {isRegister && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nome da Empresa
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Nome da empresa"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email da Empresa
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="empresa@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="Sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-60"
              disabled={isRegister && isSendingCode}
            >
              {isRegister ? (isSendingCode ? 'Enviando codigo...' : 'Criar Conta para a Empresa') : 'Entrar'}
            </button>
          </div>
          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="text-sm text-primary-600 hover:text-primary-500"
            >
              {isRegister ? 'Já tem conta? Faça login' : 'Não tem conta? Registre-se'}
            </button>
          </div>
          {!isRegister && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(true);
                  setForgotStep('email');
                  setForgotError('');
                  setForgotMessage('');
                }}
                className="text-sm text-primary-600 hover:text-primary-500"
              >
                Esqueci minha senha
              </button>
            </div>
          )}
        </form>
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-500">
            <Link
              to="/user-data-deletion"
              className="hover:text-primary-600 transition-colors"
            >
              Exclusão de Dados do Usuário
            </Link>
            <span className="text-gray-300">•</span>
            <Link
              to="/terms-of-service"
              className="hover:text-primary-600 transition-colors"
            >
              Termos de Serviço
            </Link>
            <span className="text-gray-300">•</span>
            <Link
              to="/privacy-policy"
              className="hover:text-primary-600 transition-colors"
            >
              Política de Privacidade
            </Link>
            <span className="text-gray-300">•</span>
            <Link
              to="/bncconsultoria"
              className="hover:text-primary-600 transition-colors"
            >
              BNC Consultoria em IA
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

