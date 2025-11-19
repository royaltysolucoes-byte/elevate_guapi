'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

interface User {
  username: string;
  fullName: string;
  funcao: string;
  isAdmin: boolean;
  nivelAcesso?: string;
}

interface Notificacao {
  _id: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  tarefaId?: string;
  lida: boolean;
  createdAt: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showConfigMenu, setShowConfigMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [totalNaoLidas, setTotalNaoLidas] = useState(0);
  const [showNotificacoes, setShowNotificacoes] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    fetchProfile();
    fetchNotificacoes();
    
    // Polling para verificar novas notificações a cada 10 segundos
    const interval = setInterval(() => {
      fetchNotificacoes();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Fecha o sidebar em mobile/tablet quando muda de página
    if (sidebarOpen && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, [pathname]);

  // Fecha sidebar ao redimensionar para desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarOpen]);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/users/profile');
      if (!response.ok) {
        router.push('/');
        return;
      }
      const data = await response.json();
      setUser(data.user);
    } catch (error) {
      console.error('Error fetching profile:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.push('/');
  };

  const fetchNotificacoes = async () => {
    try {
      const response = await fetch('/api/notificacoes?apenasNaoLidas=false&limit=10');
      if (response.ok) {
        const data = await response.json();
        setNotificacoes(data.notificacoes);
        setTotalNaoLidas(data.totalNaoLidas);
      }
    } catch (error) {
      console.error('Error fetching notificacoes:', error);
    }
  };

  const marcarComoLida = async (notificacaoId: string) => {
    try {
      await fetch('/api/notificacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificacaoId }),
      });
      fetchNotificacoes();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const marcarTodasComoLidas = async () => {
    try {
      await fetch('/api/notificacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marcarTodas: true }),
      });
      fetchNotificacoes();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1e2228] flex items-center justify-center">
        <div className="text-gray-400">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isActive = (path: string) => pathname === path;

  return (
    <div className="min-h-screen bg-[#1e2228] w-full">
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 md:hidden bg-[#282c34] text-white p-2.5 rounded-lg shadow-lg hover:bg-gray-700 transition border border-gray-700/50"
        aria-label="Toggle menu"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {sidebarOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Overlay for mobile/tablet */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full w-64 bg-[#282c34] shadow-2xl transform transition-transform duration-300 ease-in-out z-50 md:z-40 md:translate-x-0 overflow-y-auto overscroll-contain ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div className="p-4 pb-24 md:pb-28 min-h-full flex flex-col">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h1 className="text-xl md:text-2xl font-bold">
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
            {/* Close button for mobile */}
            <button
              onClick={() => {
                if (window.innerWidth < 768) {
                  setSidebarOpen(false);
                }
              }}
              className="md:hidden text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-700 transition"
              aria-label="Fechar menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <nav className="space-y-1.5 md:space-y-2 flex-1">
            <Link
              href="/dashboard"
              className={`flex items-center px-4 py-3 rounded-lg transition ${
                isActive('/dashboard')
                  ? 'bg-[#4CAF50] text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
              onClick={() => {
                if (window.innerWidth < 768) {
                  setSidebarOpen(false);
                }
              }}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Dashboard
            </Link>

            <Link
              href="/dashboard/lista-pc"
              className={`flex items-center px-4 py-3 rounded-lg transition ${
                isActive('/dashboard/lista-pc')
                  ? 'bg-[#4CAF50] text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
              onClick={() => {
                if (window.innerWidth < 768) {
                  setSidebarOpen(false);
                }
              }}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
              Lista de PC
            </Link>

            <Link
              href="/dashboard/gestao-ip"
              className={`flex items-center px-4 py-3 rounded-lg transition ${
                isActive('/dashboard/gestao-ip')
                  ? 'bg-[#4CAF50] text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
              onClick={() => {
                if (window.innerWidth < 768) {
                  setSidebarOpen(false);
                }
              }}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Gestão de IP
            </Link>

            <Link
              href="/dashboard/consulta-ip"
              className={`flex items-center px-4 py-3 rounded-lg transition ${
                isActive('/dashboard/consulta-ip')
                  ? 'bg-[#4CAF50] text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
              onClick={() => {
                if (window.innerWidth < 768) {
                  setSidebarOpen(false);
                }
              }}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Consulta IP
            </Link>

            {(user.isAdmin || user.nivelAcesso === 'admin' || user.nivelAcesso === 'analista') && (
              <>
                <Link
                  href="/dashboard/emails"
                  className={`flex items-center px-4 py-3 rounded-lg transition ${
                    isActive('/dashboard/emails')
                      ? 'bg-[#4CAF50] text-white'
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                  onClick={() => {
                if (window.innerWidth < 768) {
                  setSidebarOpen(false);
                }
              }}
                >
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email
                </Link>

                <Link
                  href="/dashboard/senhas"
                  className={`flex items-center px-4 py-3 rounded-lg transition ${
                    isActive('/dashboard/senhas')
                      ? 'bg-[#4CAF50] text-white'
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                  onClick={() => {
                if (window.innerWidth < 768) {
                  setSidebarOpen(false);
                }
              }}
                >
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Senhas
                </Link>
              </>
            )}

            <Link
              href="/dashboard/impressoras"
              className={`flex items-center px-4 py-3 rounded-lg transition ${
                isActive('/dashboard/impressoras')
                  ? 'bg-[#4CAF50] text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
              onClick={() => {
                if (window.innerWidth < 768) {
                  setSidebarOpen(false);
                }
              }}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Impressoras
            </Link>

            <Link
              href="/dashboard/automacoes"
              className={`flex items-center px-4 py-3 rounded-lg transition ${
                isActive('/dashboard/automacoes')
                  ? 'bg-[#4CAF50] text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
              onClick={() => {
                if (window.innerWidth < 768) {
                  setSidebarOpen(false);
                }
              }}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Automações
            </Link>

            <Link
              href="/dashboard/relogios-ponto"
              className={`flex items-center px-4 py-3 rounded-lg transition ${
                isActive('/dashboard/relogios-ponto')
                  ? 'bg-[#4CAF50] text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
              onClick={() => {
                if (window.innerWidth < 768) {
                  setSidebarOpen(false);
                }
              }}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Relógio de Ponto
            </Link>

            <Link
              href="/dashboard/servidores"
              className={`flex items-center px-4 py-3 rounded-lg transition ${
                isActive('/dashboard/servidores')
                  ? 'bg-[#4CAF50] text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
              onClick={() => {
                if (window.innerWidth < 768) {
                  setSidebarOpen(false);
                }
              }}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
              </svg>
              Servidores
            </Link>

            <Link
              href="/dashboard/gpos"
              className={`flex items-center px-4 py-3 rounded-lg transition ${
                isActive('/dashboard/gpos')
                  ? 'bg-[#4CAF50] text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
              onClick={() => {
                if (window.innerWidth < 768) {
                  setSidebarOpen(false);
                }
              }}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              GPOs
            </Link>

            <Link
              href="/dashboard/conectividades"
              className={`flex items-center px-4 py-3 rounded-lg transition ${
                isActive('/dashboard/conectividades')
                  ? 'bg-[#4CAF50] text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
              onClick={() => {
                if (window.innerWidth < 768) {
                  setSidebarOpen(false);
                }
              }}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
              </svg>
              Conectividade
            </Link>

            <Link
              href="/dashboard/tarefas"
              className={`flex items-center px-4 py-3 rounded-lg transition ${
                isActive('/dashboard/tarefas')
                  ? 'bg-[#4CAF50] text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
              onClick={() => {
                if (window.innerWidth < 768) {
                  setSidebarOpen(false);
                }
              }}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              Tarefas
            </Link>

            <Link
              href="/dashboard/documentos"
              className={`flex items-center px-4 py-3 rounded-lg transition ${
                isActive('/dashboard/documentos')
                  ? 'bg-[#4CAF50] text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
              onClick={() => {
                if (window.innerWidth < 768) {
                  setSidebarOpen(false);
                }
              }}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Documentos
            </Link>

            <Link
              href="/dashboard/celulares"
              className={`flex items-center px-4 py-3 rounded-lg transition ${
                isActive('/dashboard/celulares')
                  ? 'bg-[#4CAF50] text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
              onClick={() => {
                if (window.innerWidth < 768) {
                  setSidebarOpen(false);
                }
              }}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Celulares
            </Link>

            {(user.isAdmin || user.nivelAcesso === 'admin') && (
              <div>
                <button
                  onClick={() => setShowConfigMenu(!showConfigMenu)}
                  className={`w-full flex items-center px-4 py-3 rounded-lg transition ${
                    isActive('/dashboard/usuarios') || isActive('/dashboard/parametros')
                      ? 'bg-[#4CAF50] text-white'
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Configurações
                  <svg
                    className={`w-5 h-5 ml-auto transition transform ${
                      showConfigMenu ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showConfigMenu && (
                  <div className="ml-4 mt-1 space-y-1">
                    <Link
                      href="/dashboard/usuarios"
                      className={`flex items-center px-4 py-2.5 rounded-lg transition text-sm w-full ${
                        isActive('/dashboard/usuarios')
                          ? 'bg-[#4CAF50]/20 text-[#4CAF50]'
                          : 'text-gray-400 hover:bg-gray-700'
                      }`}
                      onClick={() => {
                        setShowConfigMenu(false);
                        if (window.innerWidth < 768) {
                          setSidebarOpen(false);
                        }
                      }}
                    >
                      Usuários
                    </Link>
                    <Link
                      href="/dashboard/parametros"
                      className={`flex items-center px-4 py-2.5 rounded-lg transition text-sm w-full ${
                        isActive('/dashboard/parametros')
                          ? 'bg-[#4CAF50]/20 text-[#4CAF50]'
                          : 'text-gray-400 hover:bg-gray-700'
                      }`}
                      onClick={() => {
                        setShowConfigMenu(false);
                        if (window.innerWidth < 768) {
                          setSidebarOpen(false);
                        }
                      }}
                    >
                      Parâmetros
                    </Link>
                  </div>
                )}
              </div>
            )}
          </nav>
        </div>

        {/* User Profile Section */}
        <div className="sticky bottom-0 left-0 right-0 p-4 border-t border-gray-700 bg-[#282c34] mt-auto">
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-full flex items-center px-4 py-3 rounded-lg hover:bg-gray-700 transition"
            >
              <div className="w-10 h-10 rounded-full bg-[#4CAF50] flex items-center justify-center mr-3 flex-shrink-0">
                <span className="text-white font-semibold text-sm">
                  {user.fullName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-white font-medium text-sm truncate">{user.fullName}</p>
                <p className="text-gray-400 text-xs truncate">{user.funcao}</p>
              </div>
              <svg
                className={`w-5 h-5 text-gray-400 transition transform flex-shrink-0 ${
                  showProfileMenu ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showProfileMenu && (
              <div className="absolute bottom-full left-0 w-full mb-2 bg-gray-800 rounded-lg shadow-xl overflow-hidden z-10 min-w-[200px]">
                <Link
                  href="/dashboard/perfil"
                  className="block px-4 py-2.5 text-gray-300 hover:bg-gray-700 transition w-full"
                  onClick={() => {
                    setShowProfileMenu(false);
                    if (window.innerWidth < 768) {
                      setSidebarOpen(false);
                    }
                  }}
                >
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-sm">Editar Perfil</span>
                  </div>
                </Link>
                <Link
                  href="/dashboard/trocar-senha"
                  className="block px-4 py-2.5 text-gray-300 hover:bg-gray-700 transition w-full"
                  onClick={() => {
                    setShowProfileMenu(false);
                    if (window.innerWidth < 768) {
                      setSidebarOpen(false);
                    }
                  }}
                >
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    <span className="text-sm">Trocar Senha</span>
                  </div>
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 text-gray-300 hover:bg-gray-700 transition"
                >
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span className="text-sm">Sair</span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notificações Button - Fixed Top Right */}
      <div className="fixed top-4 right-4 z-30 md:z-50">
        <div className="relative">
          <button
            onClick={() => setShowNotificacoes(!showNotificacoes)}
            className="relative bg-[#282c34] hover:bg-gray-700 text-white p-2.5 md:p-3 rounded-lg shadow-lg transition-all border border-gray-700/50"
            aria-label="Notificações"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {totalNaoLidas > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#4CAF50] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                {totalNaoLidas > 9 ? '9+' : totalNaoLidas}
              </span>
            )}
          </button>

          {/* Dropdown de Notificações */}
          {showNotificacoes && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowNotificacoes(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-80 md:w-96 bg-[#282c34] rounded-lg shadow-2xl border border-gray-700/50 max-h-[calc(100vh-8rem)] overflow-hidden z-50">
                <div className="p-4 border-b border-gray-700/50 flex items-center justify-between">
                  <h3 className="text-white font-semibold">Notificações</h3>
                  {totalNaoLidas > 0 && (
                    <button
                      onClick={marcarTodasComoLidas}
                      className="text-[#4CAF50] text-xs hover:underline"
                    >
                      Marcar todas como lidas
                    </button>
                  )}
                </div>
                <div className="overflow-y-auto max-h-80">
                  {notificacoes.length === 0 ? (
                    <div className="p-6 text-center text-gray-400 text-sm">
                      Nenhuma notificação
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-700/50">
                      {notificacoes.map((notif) => (
                        <div
                          key={notif._id}
                          className={`p-4 hover:bg-gray-800/50 transition cursor-pointer ${
                            !notif.lida ? 'bg-gray-800/30' : ''
                          }`}
                          onClick={() => {
                            if (!notif.lida) {
                              marcarComoLida(notif._id);
                            }
                            if (notif.tarefaId) {
                              router.push(`/dashboard/tarefas`);
                              setShowNotificacoes(false);
                            }
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                              !notif.lida ? 'bg-[#4CAF50]' : 'bg-transparent'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-semibold mb-1 ${
                                !notif.lida ? 'text-white' : 'text-gray-300'
                              }`}>
                                {notif.titulo}
                              </p>
                              <p className="text-gray-400 text-xs mb-2">
                                {notif.mensagem}
                              </p>
                              <p className="text-gray-500 text-[10px]">
                                {new Date(notif.createdAt).toLocaleString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="md:ml-64 p-4 md:p-6 lg:p-8 pt-20 md:pt-6 lg:pt-8 min-h-screen w-full md:w-[calc(100%-16rem)]">
        {children}
      </div>
    </div>
  );
}

