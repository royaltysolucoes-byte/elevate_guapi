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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [totalNaoLidas, setTotalNaoLidas] = useState(0);
  const [showNotificacoes, setShowNotificacoes] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState<{ [key: string]: boolean }>({});
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [ultimaPaginaRegistrada, setUltimaPaginaRegistrada] = useState<string>('');
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    fetchProfile();
    fetchNotificacoes();
    
    // Carregar preferência do menu do localStorage
    const savedCollapsed = localStorage.getItem('sidebarCollapsed');
    if (savedCollapsed !== null) {
      setSidebarCollapsed(savedCollapsed === 'true');
    }
    
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
    
    // Abre automaticamente o submenu se a página atual estiver dentro dele
    const equipamentosPaths = ['/dashboard/lista-pc', '/dashboard/impressoras', '/dashboard/relogios-ponto', '/dashboard/celulares'];
    const redePaths = ['/dashboard/gestao-ip', '/dashboard/consulta-ip', '/dashboard/conectividades', '/dashboard/servidores'];
    const gestaoPaths = ['/dashboard/tarefas', '/dashboard/documentos', '/dashboard/gpos', '/dashboard/automacoes'];
    const credenciaisPaths = ['/dashboard/emails', '/dashboard/senhas'];
    
    if (equipamentosPaths.some(path => pathname === path)) {
      setOpenSubmenus(prev => ({ ...prev, equipamentos: true }));
    }
    if (redePaths.some(path => pathname === path)) {
      setOpenSubmenus(prev => ({ ...prev, rede: true }));
    }
    if (gestaoPaths.some(path => pathname === path)) {
      setOpenSubmenus(prev => ({ ...prev, gestao: true }));
    }
    if (credenciaisPaths.some(path => pathname === path)) {
      setOpenSubmenus(prev => ({ ...prev, credenciais: true }));
    }
    
    // Registrar acesso à página no log de auditoria (evitar duplicatas)
    if (user && pathname && pathname !== ultimaPaginaRegistrada && pathname.startsWith('/dashboard')) {
      const nomePagina = getNomePagina(pathname);
      setUltimaPaginaRegistrada(pathname);
      registrarAcessoPagina(pathname, nomePagina);
    }
    
    // Show loading on page change with a delay to prevent flickering
    const loadingTimer = setTimeout(() => {
      setPageLoading(true);
    }, 50); // Show loading after 50ms
    
    // Hide loading after a longer time to ensure visibility
    const hideTimer = setTimeout(() => {
      setPageLoading(false);
    }, 800); // Hide loading after 800ms
    
    return () => {
      clearTimeout(loadingTimer);
      clearTimeout(hideTimer);
    };
  }, [pathname, sidebarOpen, user]);

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

  const getNomePagina = (path: string): string => {
    const nomes: { [key: string]: string } = {
      '/dashboard': 'Dashboard',
      '/dashboard/lista-pc': 'Lista de PC',
      '/dashboard/impressoras': 'Impressoras',
      '/dashboard/relogios-ponto': 'Relógios de Ponto',
      '/dashboard/celulares': 'Celulares',
      '/dashboard/gestao-ip': 'Gestão de IP',
      '/dashboard/consulta-ip': 'Consulta IP',
      '/dashboard/conectividades': 'Conectividade',
      '/dashboard/servidores': 'Servidores',
      '/dashboard/tarefas': 'Tarefas',
      '/dashboard/documentos': 'Documentos',
      '/dashboard/gpos': 'GPOs',
      '/dashboard/automacoes': 'Automações',
      '/dashboard/emails': 'Emails',
      '/dashboard/senhas': 'Senhas',
      '/dashboard/usuarios': 'Usuários',
      '/dashboard/parametros': 'Parâmetros',
      '/dashboard/auditoria': 'Auditoria',
      '/dashboard/perfil': 'Perfil',
      '/dashboard/trocar-senha': 'Trocar Senha',
    };
    return nomes[path] || path.replace('/dashboard/', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const registrarAcessoPagina = async (path: string, nomePagina: string) => {
    if (!user) return;
    
    try {
      // Determinar se é uma página sensível
      const paginasSensiveis = ['/dashboard/emails', '/dashboard/senhas', '/dashboard/usuarios', '/dashboard/auditoria'];
      const sensivel = paginasSensiveis.includes(path);

      await fetch('/api/auditoria/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acao: 'acessar',
          entidade: 'pagina',
          entidadeId: path,
          descricao: `Acessou a página: ${nomePagina}`,
          nivelAcesso: user.nivelAcesso || 'admin',
          sensivel,
        }),
      });
    } catch (error) {
      // Não bloquear a navegação se o log falhar
      console.error('Error logging page access:', error);
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

  const toggleSubmenu = (key: string) => {
    // Se o menu estiver recolhido, expandir primeiro
    if (sidebarCollapsed) {
      setSidebarCollapsed(false);
      localStorage.setItem('sidebarCollapsed', 'false');
      // Aguardar um pouco para a animação antes de abrir o submenu
      setTimeout(() => {
        setOpenSubmenus(prev => ({
          ...prev,
          [key]: !prev[key]
        }));
      }, 100);
    } else {
      setOpenSubmenus(prev => ({
        ...prev,
        [key]: !prev[key]
      }));
    }
  };

  const toggleSidebarCollapse = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', String(newState));
    // Fechar submenus quando recolher
    if (newState) {
      setOpenSubmenus({});
    }
  };

  const isSubmenuActive = (paths: string[]) => {
    return paths.some(path => pathname === path);
  };

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
      <div className={`fixed left-0 top-0 h-full bg-[#282c34] shadow-2xl transform transition-all duration-300 ease-in-out z-50 md:z-40 md:translate-x-0 overflow-hidden overscroll-contain ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      } ${
        sidebarCollapsed ? 'w-16' : 'w-56'
      }`}
                style={{
        willChange: 'width'
      }}>
        <div className="p-3 pb-20 md:pb-24 min-h-full flex flex-col overflow-y-auto">
          {/* Toggle collapse button - Desktop only, no topo */}
          <div className="hidden md:flex justify-end mb-3">
            <button
              onClick={toggleSidebarCollapse}
              className="bg-[#282c34] border border-gray-700 text-gray-400 hover:text-white p-1.5 rounded-lg shadow-lg hover:bg-gray-700 transition"
              aria-label={sidebarCollapsed ? 'Expandir menu' : 'Recolher menu'}
            >
              <svg 
                className={`w-4 h-4 transition-transform duration-300 ${sidebarCollapsed ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
          
          <div className="flex items-center justify-center mb-4 md:mb-5 relative">
            {/* Logo Átomo - Estático */}
            <div className={`relative flex items-center justify-center transition-all duration-300 ${sidebarCollapsed ? 'w-8 h-8' : 'w-10 h-10'}`}>
              <svg className="w-full h-full" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Órbitas fixas */}
                <ellipse cx="32" cy="32" rx="24" ry="8" stroke="#4CAF50" strokeWidth="1.5" strokeOpacity="0.4" />
                <ellipse cx="32" cy="32" rx="24" ry="8" stroke="#4CAF50" strokeWidth="1.5" strokeOpacity="0.4" transform="rotate(60 32 32)" />
                <ellipse cx="32" cy="32" rx="24" ry="8" stroke="#4CAF50" strokeWidth="1.5" strokeOpacity="0.4" transform="rotate(120 32 32)" />
                
                {/* Núcleo central */}
                <circle cx="32" cy="32" r="4" fill="#4CAF50" />
                <circle cx="32" cy="32" r="6" fill="#4CAF50" fillOpacity="0.2" />
              </svg>
            </div>
            {/* Close button for mobile */}
            <button
              onClick={() => {
                if (window.innerWidth < 768) {
                  setSidebarOpen(false);
                }
              }}
              className="md:hidden absolute top-0 right-0 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-700 transition"
              aria-label="Fechar menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <nav className="space-y-1 flex-1">
            <div className="relative">
            <Link
              href="/dashboard"
                className={`flex items-center px-3 py-2 rounded-md transition group ${
                isActive('/dashboard')
                  ? 'bg-[#4CAF50] text-white shadow-sm'
                  : 'text-gray-300 hover:bg-gray-700/60'
                } ${sidebarCollapsed ? 'justify-center' : ''}`}
              onClick={() => {
                if (window.innerWidth < 768) {
                  setSidebarOpen(false);
                }
              }}
                onMouseEnter={() => setHoveredItem('dashboard')}
                onMouseLeave={() => setHoveredItem(null)}
            >
                <svg className={`w-4 h-4 ${sidebarCollapsed ? '' : 'mr-2.5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
                {!sidebarCollapsed && <span className="text-sm font-medium">Dashboard</span>}
            </Link>
              {sidebarCollapsed && hoveredItem === 'dashboard' && (
                <div className="absolute left-full ml-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg shadow-lg z-50 whitespace-nowrap">
                  Dashboard
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-800"></div>
                </div>
              )}
            </div>

            {/* Equipamentos */}
            <div className="relative">
              <button
                onClick={() => toggleSubmenu('equipamentos')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition group ${
                  isSubmenuActive(['/dashboard/lista-pc', '/dashboard/impressoras', '/dashboard/relogios-ponto', '/dashboard/celulares'])
                  ? 'bg-[#4CAF50] text-white shadow-sm'
                  : 'text-gray-300 hover:bg-gray-700/60'
                } ${sidebarCollapsed ? 'justify-center' : ''}`}
                onMouseEnter={() => setHoveredItem('equipamentos')}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <div className={`flex items-center ${sidebarCollapsed ? '' : 'flex-1'}`}>
                  <svg className={`w-4 h-4 ${sidebarCollapsed ? '' : 'mr-2.5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                  {!sidebarCollapsed && <span className="text-sm font-medium">Equipamentos</span>}
                </div>
                {!sidebarCollapsed && (
                  <svg 
                    className={`w-3.5 h-3.5 transition-transform ${openSubmenus.equipamentos ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </button>
              {sidebarCollapsed && hoveredItem === 'equipamentos' && (
                <div className="absolute left-full ml-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg shadow-lg z-50 whitespace-nowrap">
                  Equipamentos
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-800"></div>
                </div>
              )}
              {openSubmenus.equipamentos && !sidebarCollapsed && (
                <div className="ml-3 mt-0.5 space-y-0.5">
            <Link
              href="/dashboard/lista-pc"
                    className={`flex items-center px-3 py-1.5 rounded-md transition text-sm ${
                isActive('/dashboard/lista-pc')
                        ? 'bg-[#4CAF50]/20 text-[#4CAF50] font-medium'
                        : 'text-gray-400 hover:bg-gray-700/40'
              }`}
              onClick={() => {
                if (window.innerWidth < 768) {
                  setSidebarOpen(false);
                }
              }}
            >
                    <svg className="w-3.5 h-3.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
              Lista de PC
            </Link>
            <Link
                    href="/dashboard/impressoras"
                    className={`flex items-center px-3 py-1.5 rounded-md transition text-sm ${
                      isActive('/dashboard/impressoras')
                        ? 'bg-[#4CAF50]/20 text-[#4CAF50] font-medium'
                        : 'text-gray-400 hover:bg-gray-700/40'
              }`}
              onClick={() => {
                if (window.innerWidth < 768) {
                  setSidebarOpen(false);
                }
              }}
            >
                    <svg className="w-3.5 h-3.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
                    Impressoras
            </Link>
                <Link
                    href="/dashboard/relogios-ponto"
                    className={`flex items-center px-3 py-1.5 rounded-md transition text-sm ${
                      isActive('/dashboard/relogios-ponto')
                        ? 'bg-[#4CAF50]/20 text-[#4CAF50] font-medium'
                        : 'text-gray-400 hover:bg-gray-700/40'
                  }`}
                  onClick={() => {
                if (window.innerWidth < 768) {
                  setSidebarOpen(false);
                }
              }}
                >
                    <svg className="w-3.5 h-3.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                    Relógio de Ponto
                </Link>
                <Link
                    href="/dashboard/celulares"
                    className={`flex items-center px-3 py-1.5 rounded-md transition text-sm ${
                      isActive('/dashboard/celulares')
                        ? 'bg-[#4CAF50]/20 text-[#4CAF50] font-medium'
                        : 'text-gray-400 hover:bg-gray-700/40'
                  }`}
                  onClick={() => {
                if (window.innerWidth < 768) {
                  setSidebarOpen(false);
                }
              }}
                >
                    <svg className="w-3.5 h-3.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                    Celulares
                </Link>
                </div>
              )}
            </div>

            {/* Rede e IP */}
            <div className="relative">
              <button
                onClick={() => toggleSubmenu('rede')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition group ${
                  isSubmenuActive(['/dashboard/gestao-ip', '/dashboard/consulta-ip', '/dashboard/conectividades', '/dashboard/servidores'])
                  ? 'bg-[#4CAF50] text-white shadow-sm'
                  : 'text-gray-300 hover:bg-gray-700/60'
                } ${sidebarCollapsed ? 'justify-center' : ''}`}
                onMouseEnter={() => setHoveredItem('rede')}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <div className={`flex items-center ${sidebarCollapsed ? '' : 'flex-1'}`}>
                  <svg className={`w-4 h-4 ${sidebarCollapsed ? '' : 'mr-2.5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  {!sidebarCollapsed && <span className="text-sm font-medium">Rede e IP</span>}
                </div>
                {!sidebarCollapsed && (
                  <svg 
                    className={`w-3.5 h-3.5 transition-transform ${openSubmenus.rede ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </button>
              {sidebarCollapsed && hoveredItem === 'rede' && (
                <div className="absolute left-full ml-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg shadow-lg z-50 whitespace-nowrap">
                  Rede e IP
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-800"></div>
                </div>
              )}
              {openSubmenus.rede && !sidebarCollapsed && (
                <div className="ml-3 mt-0.5 space-y-0.5">
            <Link
                    href="/dashboard/gestao-ip"
                    className={`flex items-center px-3 py-1.5 rounded-md transition text-sm ${
                      isActive('/dashboard/gestao-ip')
                        ? 'bg-[#4CAF50]/20 text-[#4CAF50] font-medium'
                        : 'text-gray-400 hover:bg-gray-700/40'
              }`}
              onClick={() => {
                if (window.innerWidth < 768) {
                  setSidebarOpen(false);
                }
              }}
            >
                    <svg className="w-3.5 h-3.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
                    Gestão de IP
            </Link>
            <Link
                    href="/dashboard/consulta-ip"
                    className={`flex items-center px-3 py-1.5 rounded-md transition text-sm ${
                      isActive('/dashboard/consulta-ip')
                        ? 'bg-[#4CAF50]/20 text-[#4CAF50] font-medium'
                        : 'text-gray-400 hover:bg-gray-700/40'
              }`}
              onClick={() => {
                if (window.innerWidth < 768) {
                  setSidebarOpen(false);
                }
              }}
            >
                    <svg className="w-3.5 h-3.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
                    Consulta IP
            </Link>
            <Link
                    href="/dashboard/conectividades"
                    className={`flex items-center px-3 py-1.5 rounded-md transition text-sm ${
                      isActive('/dashboard/conectividades')
                        ? 'bg-[#4CAF50]/20 text-[#4CAF50] font-medium'
                        : 'text-gray-400 hover:bg-gray-700/40'
              }`}
              onClick={() => {
                if (window.innerWidth < 768) {
                  setSidebarOpen(false);
                }
              }}
            >
                    <svg className="w-3.5 h-3.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
              </svg>
                    Conectividade
            </Link>
            <Link
              href="/dashboard/servidores"
                    className={`flex items-center px-3 py-1.5 rounded-md transition text-sm ${
                isActive('/dashboard/servidores')
                        ? 'bg-[#4CAF50]/20 text-[#4CAF50] font-medium'
                        : 'text-gray-400 hover:bg-gray-700/40'
              }`}
              onClick={() => {
                if (window.innerWidth < 768) {
                  setSidebarOpen(false);
                }
              }}
            >
                    <svg className="w-3.5 h-3.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
              </svg>
              Servidores
            </Link>
                </div>
              )}
            </div>

            {/* Gestão */}
            <div className="relative">
              <button
                onClick={() => toggleSubmenu('gestao')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition group ${
                  isSubmenuActive(['/dashboard/tarefas', '/dashboard/documentos', '/dashboard/gpos', '/dashboard/automacoes'])
                  ? 'bg-[#4CAF50] text-white shadow-sm'
                  : 'text-gray-300 hover:bg-gray-700/60'
                } ${sidebarCollapsed ? 'justify-center' : ''}`}
                onMouseEnter={() => setHoveredItem('gestao')}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <div className={`flex items-center ${sidebarCollapsed ? '' : 'flex-1'}`}>
                  <svg className={`w-4 h-4 ${sidebarCollapsed ? '' : 'mr-2.5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  {!sidebarCollapsed && <span className="text-sm font-medium">Gestão</span>}
                </div>
                {!sidebarCollapsed && (
                  <svg 
                    className={`w-3.5 h-3.5 transition-transform ${openSubmenus.gestao ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </button>
              {sidebarCollapsed && hoveredItem === 'gestao' && (
                <div className="absolute left-full ml-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg shadow-lg z-50 whitespace-nowrap">
                  Gestão
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-800"></div>
                </div>
              )}
              {openSubmenus.gestao && !sidebarCollapsed && (
                <div className="ml-3 mt-0.5 space-y-0.5">
                  <Link
                    href="/dashboard/tarefas"
                    className={`flex items-center px-3 py-1.5 rounded-md transition text-sm ${
                      isActive('/dashboard/tarefas')
                        ? 'bg-[#4CAF50]/20 text-[#4CAF50] font-medium'
                        : 'text-gray-400 hover:bg-gray-700/40'
              }`}
              onClick={() => {
                if (window.innerWidth < 768) {
                  setSidebarOpen(false);
                }
              }}
            >
                    <svg className="w-3.5 h-3.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
                    Tarefas
            </Link>
            <Link
                    href="/dashboard/documentos"
                    className={`flex items-center px-3 py-1.5 rounded-md transition text-sm ${
                      isActive('/dashboard/documentos')
                        ? 'bg-[#4CAF50]/20 text-[#4CAF50] font-medium'
                        : 'text-gray-400 hover:bg-gray-700/40'
              }`}
              onClick={() => {
                if (window.innerWidth < 768) {
                  setSidebarOpen(false);
                }
              }}
            >
                    <svg className="w-3.5 h-3.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
                    Documentos
            </Link>
            <Link
                    href="/dashboard/gpos"
                    className={`flex items-center px-3 py-1.5 rounded-md transition text-sm ${
                      isActive('/dashboard/gpos')
                        ? 'bg-[#4CAF50]/20 text-[#4CAF50] font-medium'
                        : 'text-gray-400 hover:bg-gray-700/40'
              }`}
              onClick={() => {
                if (window.innerWidth < 768) {
                  setSidebarOpen(false);
                }
              }}
            >
                    <svg className="w-3.5 h-3.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
                    GPOs
            </Link>
            <Link
                    href="/dashboard/automacoes"
                    className={`flex items-center px-3 py-1.5 rounded-md transition text-sm ${
                      isActive('/dashboard/automacoes')
                        ? 'bg-[#4CAF50]/20 text-[#4CAF50] font-medium'
                        : 'text-gray-400 hover:bg-gray-700/40'
              }`}
              onClick={() => {
                if (window.innerWidth < 768) {
                  setSidebarOpen(false);
                }
              }}
            >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
                    Automações
                  </Link>
                </div>
              )}
            </div>

            {/* Credenciais - Apenas admin e analista (não suporte) */}
            {(user.isAdmin || user.nivelAcesso === 'admin' || user.nivelAcesso === 'analista') && (
              <div className="relative">
                <button
                  onClick={() => toggleSubmenu('credenciais')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition group ${
                    isSubmenuActive(['/dashboard/emails', '/dashboard/senhas'])
                  ? 'bg-[#4CAF50] text-white shadow-sm'
                  : 'text-gray-300 hover:bg-gray-700/60'
                  } ${sidebarCollapsed ? 'justify-center' : ''}`}
                  onMouseEnter={() => setHoveredItem('credenciais')}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <div className={`flex items-center ${sidebarCollapsed ? '' : 'flex-1'}`}>
                    <svg className={`w-4 h-4 ${sidebarCollapsed ? '' : 'mr-2.5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    {!sidebarCollapsed && <span className="text-sm font-medium">Credenciais</span>}
                  </div>
                  {!sidebarCollapsed && (
                    <svg 
                      className={`w-3.5 h-3.5 transition-transform ${openSubmenus.credenciais ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </button>
                {sidebarCollapsed && hoveredItem === 'credenciais' && (
                  <div className="absolute left-full ml-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg shadow-lg z-50 whitespace-nowrap">
                    Credenciais
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-800"></div>
                  </div>
                )}
                {openSubmenus.credenciais && !sidebarCollapsed && (
                  <div className="ml-3 mt-0.5 space-y-0.5">
                    <Link
                      href="/dashboard/emails"
                      className={`flex items-center px-3 py-1.5 rounded-md transition text-sm ${
                        isActive('/dashboard/emails')
                          ? 'bg-[#4CAF50]/20 text-[#4CAF50] font-medium'
                          : 'text-gray-400 hover:bg-gray-700/40'
              }`}
              onClick={() => {
                if (window.innerWidth < 768) {
                  setSidebarOpen(false);
                }
              }}
            >
                      <svg className="w-3.5 h-3.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
                      Emails
            </Link>
                    <Link
                      href="/dashboard/senhas"
                      className={`flex items-center px-3 py-1.5 rounded-md transition text-sm ${
                        isActive('/dashboard/senhas')
                          ? 'bg-[#4CAF50]/20 text-[#4CAF50] font-medium'
                          : 'text-gray-400 hover:bg-gray-700/40'
                      }`}
                      onClick={() => {
                        if (window.innerWidth < 768) {
                          setSidebarOpen(false);
                        }
                      }}
                    >
                      <svg className="w-3.5 h-3.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
                      Senhas
            </Link>
                  </div>
                )}
              </div>
            )}

            {/* Configurações - Admin e analista (mas analista não vê Usuários) */}
            {(user.isAdmin || user.nivelAcesso === 'admin' || user.nivelAcesso === 'analista') && (
              <div className="relative">
                <button
                  onClick={() => {
                    if (sidebarCollapsed) {
                      setSidebarCollapsed(false);
                      localStorage.setItem('sidebarCollapsed', 'false');
                      setTimeout(() => setShowConfigMenu(!showConfigMenu), 100);
                    } else {
                      setShowConfigMenu(!showConfigMenu);
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition group ${
                    isActive('/dashboard/usuarios') || isActive('/dashboard/parametros')
                      ? 'bg-[#4CAF50] text-white shadow-sm'
                      : 'text-gray-300 hover:bg-gray-700/60'
                  } ${sidebarCollapsed ? 'justify-center' : ''}`}
                  onMouseEnter={() => setHoveredItem('configuracoes')}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <div className={`flex items-center ${sidebarCollapsed ? '' : 'flex-1'}`}>
                    <svg className={`w-4 h-4 ${sidebarCollapsed ? '' : 'mr-2.5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                    {!sidebarCollapsed && <span className="text-sm font-medium">Configurações</span>}
                  </div>
                  {!sidebarCollapsed && (
                  <svg
                      className={`w-3.5 h-3.5 transition-transform ${
                      showConfigMenu ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  )}
                </button>
                {sidebarCollapsed && hoveredItem === 'configuracoes' && (
                  <div className="absolute left-full ml-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg shadow-lg z-50 whitespace-nowrap">
                    Configurações
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-800"></div>
                  </div>
                )}
                {showConfigMenu && !sidebarCollapsed && (
                  <div className="ml-3 mt-0.5 space-y-0.5">
                    {/* Usuários - Apenas admin */}
                    {(user.isAdmin || user.nivelAcesso === 'admin') && (
                    <Link
                      href="/dashboard/usuarios"
                      className={`flex items-center px-3 py-1.5 rounded-md transition text-sm w-full ${
                        isActive('/dashboard/usuarios')
                          ? 'bg-[#4CAF50]/20 text-[#4CAF50] font-medium'
                          : 'text-gray-400 hover:bg-gray-700/40'
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
                    )}
                    <Link
                      href="/dashboard/parametros"
                      className={`flex items-center px-3 py-1.5 rounded-md transition text-sm w-full ${
                        isActive('/dashboard/parametros')
                          ? 'bg-[#4CAF50]/20 text-[#4CAF50] font-medium'
                          : 'text-gray-400 hover:bg-gray-700/40'
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

            {/* Auditoria - Apenas admin */}
            {(user.isAdmin || user.nivelAcesso === 'admin') && (
              <div className="relative">
                <Link
                  href="/dashboard/auditoria"
                  className={`flex items-center px-3 py-2 rounded-md transition group ${
                    isActive('/dashboard/auditoria')
                      ? 'bg-[#4CAF50] text-white shadow-sm'
                      : 'text-gray-300 hover:bg-gray-700/60'
                  } ${sidebarCollapsed ? 'justify-center' : ''}`}
                  onClick={() => {
                    if (window.innerWidth < 768) {
                      setSidebarOpen(false);
                    }
                  }}
                  onMouseEnter={() => setHoveredItem('auditoria')}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <svg className={`w-4 h-4 ${sidebarCollapsed ? '' : 'mr-2.5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {!sidebarCollapsed && <span className="text-sm font-medium">Auditoria</span>}
                </Link>
                {sidebarCollapsed && hoveredItem === 'auditoria' && (
                  <div className="absolute left-full ml-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg shadow-lg z-50 whitespace-nowrap">
                    Auditoria
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-800"></div>
                  </div>
                )}
              </div>
            )}
          </nav>
        </div>

        {/* User Profile Section */}
        <div className="sticky bottom-0 left-0 right-0 p-3 border-t border-gray-700/50 bg-[#282c34] mt-auto">
          <div className="relative">
            <button
              onClick={() => {
                if (sidebarCollapsed) {
                  setSidebarCollapsed(false);
                  localStorage.setItem('sidebarCollapsed', 'false');
                  setTimeout(() => setShowProfileMenu(!showProfileMenu), 100);
                } else {
                  setShowProfileMenu(!showProfileMenu);
                }
              }}
              className={`w-full flex items-center px-3 py-2 rounded-md hover:bg-gray-700/60 transition group ${
                sidebarCollapsed ? 'justify-center' : ''
              }`}
              onMouseEnter={() => setHoveredItem('profile')}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <div className={`w-8 h-8 rounded-full bg-[#4CAF50] flex items-center justify-center flex-shrink-0 ${sidebarCollapsed ? '' : 'mr-2.5'}`}>
                <span className="text-white font-medium text-xs">
                  {user.fullName.charAt(0).toUpperCase()}
                </span>
              </div>
              {!sidebarCollapsed && (
                <>
              <div className="flex-1 text-left min-w-0">
                <p className="text-white font-medium text-xs truncate">{user.fullName}</p>
                <p className="text-gray-400 text-[10px] truncate">{user.funcao}</p>
              </div>
              <svg
                className={`w-4 h-4 text-gray-400 transition transform flex-shrink-0 ${
                  showProfileMenu ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
                </>
              )}
            </button>
            {sidebarCollapsed && hoveredItem === 'profile' && (
              <div className="absolute left-full ml-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg shadow-lg z-50 whitespace-nowrap">
                <p className="font-medium">{user.fullName}</p>
                <p className="text-xs text-gray-400">{user.funcao}</p>
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-800"></div>
              </div>
            )}

            {showProfileMenu && !sidebarCollapsed && (
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
            className="relative bg-[#282c34] hover:bg-[#323842] p-3 rounded-lg transition-all duration-200 border border-gray-700/50 hover:border-[#4CAF50]/50 group"
            aria-label="Notificações"
          >
            <svg className="w-6 h-6 text-gray-400 group-hover:text-[#4CAF50] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {totalNaoLidas > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#4CAF50] text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 shadow-lg shadow-[#4CAF50]/30">
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
              <div className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-96 md:w-[420px] bg-[#282c34] rounded-lg shadow-2xl border border-gray-700/50 max-h-[calc(100vh-8rem)] overflow-hidden z-50 backdrop-blur-sm">
                <div className="p-4 border-b border-gray-700/30 flex items-center justify-between bg-[#1e2228]/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#4CAF50]/10 flex items-center justify-center">
                      <svg className="w-4 h-4 text-[#4CAF50]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-sm">Notificações</h3>
                      {totalNaoLidas > 0 && (
                        <p className="text-gray-400 text-xs">{totalNaoLidas} não lida{totalNaoLidas > 1 ? 's' : ''}</p>
                      )}
                    </div>
                  </div>
                  {totalNaoLidas > 0 && (
                    <button
                      onClick={marcarTodasComoLidas}
                      className="text-[#4CAF50] text-xs font-medium hover:text-[#45a049] transition px-2 py-1 rounded hover:bg-[#4CAF50]/10"
                    >
                      Marcar todas
                    </button>
                  )}
                </div>
                <div className="overflow-y-auto max-h-[500px] custom-scrollbar">
                  {notificacoes.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-800/50 flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                      </div>
                      <p className="text-gray-400 text-sm">Nenhuma notificação</p>
                    </div>
                  ) : (
                    <div className="p-2">
                      {notificacoes.map((notif) => (
                        <div
                          key={notif._id}
                          className={`group relative p-3 mb-2 rounded-lg transition-all duration-200 cursor-pointer ${
                            !notif.lida 
                              ? 'bg-[#4CAF50]/5 border border-[#4CAF50]/20 hover:bg-[#4CAF50]/10 hover:border-[#4CAF50]/30' 
                              : 'bg-gray-800/30 border border-transparent hover:bg-gray-800/50'
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
                            <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 transition-all ${
                              !notif.lida 
                                ? 'bg-[#4CAF50] shadow-lg shadow-[#4CAF50]/50' 
                                : 'bg-transparent'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <p className={`text-sm font-semibold leading-tight ${
                                !notif.lida ? 'text-white' : 'text-gray-300'
                              }`}>
                                {notif.titulo}
                              </p>
                                {!notif.lida && (
                                  <span className="bg-[#4CAF50] text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0">
                                    Nova
                                  </span>
                                )}
                              </div>
                              <p className={`text-xs leading-relaxed mb-2 ${
                                !notif.lida ? 'text-gray-300' : 'text-gray-500'
                              }`}>
                                {notif.mensagem}
                              </p>
                              <div className="flex items-center gap-1.5 text-gray-500">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-[10px]">
                                {new Date(notif.createdAt).toLocaleString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                                </span>
                              </div>
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
      <div 
        className={`p-4 md:p-6 lg:p-8 pt-20 md:pt-6 lg:pt-8 min-h-screen relative transition-all duration-300 ease-in-out ${
          sidebarCollapsed 
            ? 'md:ml-16 md:w-[calc(100%-4rem)]' 
            : 'md:ml-56 md:w-[calc(100%-14rem)]'
        }`}
      >
        {pageLoading && (
          <div className="absolute inset-0 bg-[#1e2228]/80 backdrop-blur-sm z-50 flex items-center justify-center transition-opacity duration-200">
            <div className="text-center">
              {/* Logo Átomo Animado - Apenas órbitas girando */}
              <div className="relative w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-full h-full" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Órbitas girando */}
                  <g style={{ animation: 'rotate-orbit-1 8s linear infinite', transformOrigin: '32px 32px' }}>
                    <ellipse cx="32" cy="32" rx="24" ry="8" stroke="#4CAF50" strokeWidth="1.5" strokeOpacity="0.4" />
                  </g>
                  <g style={{ animation: 'rotate-orbit-2 10s linear infinite', transformOrigin: '32px 32px' }}>
                    <ellipse cx="32" cy="32" rx="24" ry="8" stroke="#4CAF50" strokeWidth="1.5" strokeOpacity="0.4" transform="rotate(60 32 32)" />
                  </g>
                  <g style={{ animation: 'rotate-orbit-3 12s linear infinite', transformOrigin: '32px 32px' }}>
                    <ellipse cx="32" cy="32" rx="24" ry="8" stroke="#4CAF50" strokeWidth="1.5" strokeOpacity="0.4" transform="rotate(120 32 32)" />
                  </g>
                  
                  {/* Núcleo central com pulse sutil */}
                  <circle cx="32" cy="32" r="4" fill="#4CAF50" className="animate-pulse" style={{ animationDuration: '4s' }} />
                  <circle cx="32" cy="32" r="6" fill="#4CAF50" fillOpacity="0.2" />
                </svg>
              </div>
              <p className="text-white text-lg font-semibold">Carregando...</p>
              <p className="text-gray-400 text-sm mt-2">Aguarde um momento</p>
            </div>
          </div>
        )}
        <div className={`transition-opacity duration-200 ${pageLoading ? 'opacity-30' : 'opacity-100'}`}>
        {children}
        </div>
      </div>
    </div>
  );
}

