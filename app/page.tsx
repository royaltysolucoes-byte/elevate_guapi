'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [requiresCaptcha, setRequiresCaptcha] = useState(false);
  const [captchaQuestion, setCaptchaQuestion] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
          captchaAnswer: requiresCaptcha ? Number(captchaAnswer) : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.requiresCaptcha) {
          setRequiresCaptcha(true);
          setCaptchaQuestion(data.captchaQuestion || '');
          setCaptchaAnswer('');
        }
        if (data.attemptsLeft !== undefined) {
          setAttemptsLeft(data.attemptsLeft);
        }
        setError(data.error || 'Erro ao fazer login');
        setLoading(false);
        return;
      }

      // Login successful - reset everything
      setRequiresCaptcha(false);
      setCaptchaAnswer('');
      setAttemptsLeft(null);
      router.push('/dashboard');
    } catch (error) {
      setError('Erro ao conectar com o servidor');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#282c34] via-[#1e2228] to-[#282c34]">
        {/* Network Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(rgba(76, 175, 80, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(76, 175, 80, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        ></div>
        <div className="absolute inset-0">
          {/* Floating orbs */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#4CAF50]/10 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#4CAF50]/5 rounded-full blur-3xl animate-float animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-3/4 left-3/4 w-64 h-64 bg-[#4CAF50]/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }}></div>
        </div>
      </div>

      {/* Left Side - Information */}
      <div className="hidden lg:flex flex-[1] flex-col justify-center items-end p-8 relative z-10">
        <div className="max-w-lg w-full pr-8">
          <h1 className="text-5xl lg:text-6xl font-bold mb-3">
            <span className="text-white">Elevate</span>{' '}
            <span 
              style={{
                background: 'linear-gradient(90deg, #ffffff 0%, #4CAF50 50%, #ffffff 100%)',
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                animation: 'gradient-shift 3s ease infinite'
              }}
            >
              Control
            </span>
          </h1>
          <p className="text-2xl text-gray-300 mb-4">
            Bem-vindo à <span className="text-[#4CAF50]">Plataforma de Gestão</span>
          </p>
          <p className="text-gray-400 text-lg leading-relaxed mb-6">
            Gestão inteligente para administração de TI empresarial. 
            Simplifique processos, aumente produtividade e controle total sobre sua infraestrutura.
          </p>
          
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-[#4CAF50]/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-[#4CAF50]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Gestão Inteligente</h3>
                <p className="text-gray-400">Dashboard completo com métricas em tempo real</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-[#4CAF50]/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-[#4CAF50]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Segurança Avançada</h3>
                <p className="text-gray-400">Autenticação robusta e controle de acesso</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-[#4CAF50]/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-[#4CAF50]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Alta Performance</h3>
                <p className="text-gray-400">Interface rápida e responsiva</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-[1] flex items-center justify-start p-4 md:p-8 lg:pl-4 relative z-10">
        <div className="w-full max-w-md bg-[#1e2228]/80 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-6 md:p-10 shadow-2xl">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">
              Faça Login
            </h2>
            <p className="text-gray-400">
              Acesse sua conta para continuar
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-500 px-4 py-3 rounded-lg text-sm">
                {error}
                {attemptsLeft !== null && attemptsLeft > 0 && (
                  <p className="mt-1 text-xs">Tentativas restantes: {attemptsLeft}</p>
                )}
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-white text-sm font-medium mb-2">
                Usuário
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-600 rounded-lg bg-[#363f4a] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent transition"
                  placeholder="Digite seu usuário"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-white text-sm font-medium mb-2">
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-600 rounded-lg bg-[#363f4a] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent transition"
                  placeholder="Digite sua senha"
                  required
                />
              </div>
            </div>

            {requiresCaptcha && (
              <div className="bg-[#4CAF50]/10 border border-[#4CAF50]/30 rounded-lg p-4">
                <label htmlFor="captcha" className="block text-white text-sm font-medium mb-2">
                  Verificação de Segurança
                </label>
                <div className="space-y-2">
                  <p className="text-gray-300 text-sm">
                    Resolva: <span className="font-mono text-lg font-bold text-[#4CAF50]">{captchaQuestion} = ?</span>
                  </p>
                  <input
                    id="captcha"
                    type="number"
                    value={captchaAnswer}
                    onChange={(e) => setCaptchaAnswer(e.target.value)}
                    className="block w-full px-4 py-2.5 border border-gray-600 rounded-lg bg-[#363f4a] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent transition"
                    placeholder="Digite a resposta"
                    required
                    autoComplete="off"
                  />
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#4CAF50] hover:bg-[#45a049] text-white font-semibold py-3 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#4CAF50]/20 hover:shadow-xl hover:shadow-[#4CAF50]/30 transform hover:scale-[1.02]"
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center text-sm text-gray-400">
            <p>© 2025 Elevate Soluções</p>
            <div className="mt-2 space-x-4">
              <a href="#" className="hover:text-[#4CAF50] transition">Política de Privacidade</a>
              <span>•</span>
              <a href="#" className="hover:text-[#4CAF50] transition">Suporte</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
