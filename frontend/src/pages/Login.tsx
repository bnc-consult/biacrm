import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (isRegister) {
        await register(name, email, password);
      } else {
        await login(email, password);
      }
      navigate('/');
    } catch (err: any) {
      console.error('Auth error:', err);
      // Mostrar mensagem de erro mais específica
      const errorMessage = err.response?.data?.message || 
                          err.message || 
                          (isRegister ? 'Erro ao criar conta. Verifique se a API está funcionando.' : 'Erro ao fazer login');
      setError(errorMessage);
      
      // Se for erro de rede, mostrar mensagem mais útil
      if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
        setError('Não foi possível conectar ao servidor. Verifique se a API está online.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            {isRegister ? 'Criar conta' : 'Entrar no CRM BIA'}
          </h2>
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
                Nome
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="seu@email.com"
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
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              {isRegister ? 'Criar conta' : 'Entrar'}
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
        </form>
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-500">
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

