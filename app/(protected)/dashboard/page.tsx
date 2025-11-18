'use client';

import { useEffect, useState } from 'react';

interface User {
  fullName: string;
  username: string;
  funcao: string;
}

interface Stats {
  totalUsers: number;
  totalPCs: number;
  totalIPs: number;
  totalEmails: number;
  totalSenhas: number;
  totalImpressoras: number;
  totalAutomacoes: number;
  totalRelogios: number;
  totalServidores: number;
  totalConectividades: number;
  totalCelulares: number;
}

interface TarefasStats {
  total: number;
  porStatus: { todo: number; 'in-progress': number; review: number; done: number };
  porPrioridade: { baixa: number; media: number; alta: number; urgente: number };
  atrasadas: number;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalPCs: 0,
    totalIPs: 0,
    totalEmails: 0,
    totalSenhas: 0,
    totalImpressoras: 0,
    totalAutomacoes: 0,
    totalRelogios: 0,
    totalServidores: 0,
    totalConectividades: 0,
    totalCelulares: 0,
  });
  const [tarefasStats, setTarefasStats] = useState<TarefasStats>({
    total: 0,
    porStatus: { todo: 0, 'in-progress': 0, review: 0, done: 0 },
    porPrioridade: { baixa: 0, media: 0, alta: 0, urgente: 0 },
    atrasadas: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchProfile();
    fetchStats();
  }, []);

  useEffect(() => {
    const handleFocus = () => fetchStats();
    const handleVisibilityChange = () => {
      if (!document.hidden) fetchStats();
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/users/profile');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async (isManualRefresh = false) => {
    try {
      const [
        usersRes,
        pcsRes,
        ipsRes,
        emailsRes,
        senhasRes,
        impressorasRes,
        automacoesRes,
        relogiosRes,
        servidoresRes,
        conectividadesRes,
        celularesRes,
        tarefasRes,
      ] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/computadores?page=1'),
        fetch('/api/ips?page=1'),
        fetch('/api/emails?page=1'),
        fetch('/api/senhas?page=1'),
        fetch('/api/impressoras?page=1'),
        fetch('/api/automacoes?page=1'),
        fetch('/api/relogios-ponto?page=1'),
        fetch('/api/servidores?page=1'),
        fetch('/api/conectividades?page=1'),
        fetch('/api/celulares?page=1'),
        fetch('/api/tarefas/stats'),
      ]);

      const statsData: Stats = {
        totalUsers: usersRes.ok ? (await usersRes.json()).users.length : 0,
        totalPCs: pcsRes.ok ? (await pcsRes.json()).pagination.total : 0,
        totalIPs: ipsRes.ok ? (await ipsRes.json()).pagination.total : 0,
        totalEmails: emailsRes.ok ? (await emailsRes.json()).pagination.total : 0,
        totalSenhas: senhasRes.ok ? (await senhasRes.json()).pagination.total : 0,
        totalImpressoras: impressorasRes.ok ? (await impressorasRes.json()).pagination.total : 0,
        totalAutomacoes: automacoesRes.ok ? (await automacoesRes.json()).pagination.total : 0,
        totalRelogios: relogiosRes.ok ? (await relogiosRes.json()).pagination.total : 0,
        totalServidores: servidoresRes.ok ? (await servidoresRes.json()).pagination.total : 0,
        totalConectividades: conectividadesRes.ok ? (await conectividadesRes.json()).pagination.total : 0,
        totalCelulares: celularesRes.ok ? (await celularesRes.json()).pagination.total : 0,
      };

      const tarefasData: TarefasStats = tarefasRes.ok
        ? (await tarefasRes.json()).stats
        : {
            total: 0,
            porStatus: { todo: 0, 'in-progress': 0, review: 0, done: 0 },
            porPrioridade: { baixa: 0, media: 0, alta: 0, urgente: 0 },
            atrasadas: 0,
          };

      setStats(statsData);
      setTarefasStats(tarefasData);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      if (isManualRefresh) {
        setRefreshing(false);
      }
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStats(true);
  };

  const totalItems =
    stats.totalUsers +
    stats.totalPCs +
    stats.totalIPs +
    stats.totalEmails +
    stats.totalSenhas +
    stats.totalImpressoras +
    stats.totalAutomacoes +
    stats.totalRelogios +
    stats.totalServidores +
    stats.totalConectividades +
    stats.totalCelulares;

  const statsData = [
    { label: 'Usuários', value: stats.totalUsers, icon: 'users', color: 'from-blue-500/20 to-cyan-500/10' },
    { label: 'Computadores', value: stats.totalPCs, icon: 'computers', color: 'from-purple-500/20 to-pink-500/10' },
    { label: 'IPs / VLANs', value: stats.totalIPs, icon: 'ips', color: 'from-cyan-500/20 to-blue-500/10' },
    { label: 'Emails', value: stats.totalEmails, icon: 'emails', color: 'from-orange-500/20 to-red-500/10' },
    { label: 'Senhas', value: stats.totalSenhas, icon: 'passwords', color: 'from-red-500/20 to-orange-500/10' },
    { label: 'Impressoras', value: stats.totalImpressoras, icon: 'printers', color: 'from-pink-500/20 to-rose-500/10' },
    { label: 'Automações', value: stats.totalAutomacoes, icon: 'automations', color: 'from-yellow-500/20 to-amber-500/10' },
    { label: 'Relógios', value: stats.totalRelogios, icon: 'clocks', color: 'from-indigo-500/20 to-purple-500/10' },
    { label: 'Servidores', value: stats.totalServidores, icon: 'servers', color: 'from-teal-500/20 to-cyan-500/10' },
    { label: 'Conectividades', value: stats.totalConectividades, icon: 'connectivity', color: 'from-emerald-500/20 to-green-500/10' },
    { label: 'Celulares', value: stats.totalCelulares, icon: 'phones', color: 'from-violet-500/20 to-purple-500/10' },
  ];

  const getIcon = (type: string) => {
    const icons: { [key: string]: React.ReactElement } = {
      users: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      computers: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
        </svg>
      ),
      ips: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      ),
      emails: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      passwords: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      printers: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
        </svg>
      ),
      automations: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      clocks: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      servers: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
        </svg>
      ),
      connectivity: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
        </svg>
      ),
      phones: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
    };
    return icons[type] || null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#1e2228]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#4CAF50] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1e2228] relative overflow-hidden">
      {/* Network Grid Background */}
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#4CAF50" strokeWidth="0.5" opacity="0.3"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Animated Network Lines */}
      <div className="fixed inset-0 opacity-10 pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              left: `${(i * 12.5) % 100}%`,
              top: `${(i * 15) % 100}%`,
              width: '2px',
              height: '200px',
              background: `linear-gradient(to bottom, transparent, #4CAF50, transparent)`,
              animation: `network-line-${i % 3} ${3 + (i % 3)}s ease-in-out infinite`,
              animationDelay: `${i * 0.3}s`,
            }}
          />
        ))}
      </div>

      {/* Floating Particles */}
      <div className="fixed inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-[#4CAF50] rounded-full opacity-40"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float-particle ${5 + Math.random() * 5}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Pulsing Nodes */}
      <div className="fixed inset-0 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-3 h-3 bg-[#4CAF50] rounded-full"
            style={{
              left: `${20 + (i * 15)}%`,
              top: `${30 + (i % 3) * 20}%`,
              animation: `pulse-node ${2 + (i % 2)}s ease-in-out infinite`,
              animationDelay: `${i * 0.5}s`,
              boxShadow: '0 0 10px #4CAF50, 0 0 20px #4CAF50',
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="space-y-1">
                <h1 className="text-3xl sm:text-4xl font-bold text-white">
                  Dashboard
                </h1>
                <p className="text-gray-400">
                  {user?.fullName ? `Olá, ${user.fullName}` : 'Visão geral do sistema'}
                </p>
              </div>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="group flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#4CAF50] to-[#45a049] hover:from-[#45a049] hover:to-[#4CAF50] text-white rounded-lg transition-all duration-300 disabled:opacity-50 text-sm font-medium shadow-lg shadow-[#4CAF50]/20 hover:shadow-xl hover:shadow-[#4CAF50]/30 transform hover:scale-105"
              >
                <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {refreshing ? 'Atualizando...' : 'Atualizar'}
              </button>
            </div>

            {/* Hero Card */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#4CAF50] via-[#45a049] to-[#4CAF50] rounded-2xl opacity-20 group-hover:opacity-30 blur transition duration-500 animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-[#282c34] via-[#282c34] to-[#1e2228] rounded-2xl border border-[#4CAF50]/30 p-8 overflow-hidden">
                {/* Network waves animation */}
                <div className="absolute bottom-0 left-0 right-0 h-32 opacity-20">
                  <svg className="w-full h-full" viewBox="0 0 400 128" preserveAspectRatio="none">
                    <path
                      d="M0,64 Q100,32 200,64 T400,64 L400,128 L0,128 Z"
                      fill="url(#waveGradient1)"
                      opacity="0.6"
                    >
                      <animate
                        attributeName="d"
                        values="M0,64 Q100,32 200,64 T400,64 L400,128 L0,128 Z;M0,64 Q100,96 200,64 T400,64 L400,128 L0,128 Z;M0,64 Q100,32 200,64 T400,64 L400,128 L0,128 Z"
                        dur="4s"
                        repeatCount="indefinite"
                      />
                    </path>
                    <path
                      d="M0,80 Q150,48 300,80 T400,80 L400,128 L0,128 Z"
                      fill="url(#waveGradient2)"
                      opacity="0.4"
                    >
                      <animate
                        attributeName="d"
                        values="M0,80 Q150,48 300,80 T400,80 L400,128 L0,128 Z;M0,80 Q150,112 300,80 T400,80 L400,128 L0,128 Z;M0,80 Q150,48 300,80 T400,80 L400,128 L0,128 Z"
                        dur="5s"
                        repeatCount="indefinite"
                      />
                    </path>
                    <defs>
                      <linearGradient id="waveGradient1" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#4CAF50" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#4CAF50" stopOpacity="0" />
                      </linearGradient>
                      <linearGradient id="waveGradient2" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#4CAF50" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="#4CAF50" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>

                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                
                <div className="relative z-10">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                    <div className="space-y-2">
                      <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">Total de Recursos</p>
                      <div className="flex items-baseline gap-3">
                        <p className="text-5xl sm:text-6xl font-bold text-white tracking-tight">
                          {(totalItems || 0).toLocaleString('pt-BR')}
                        </p>
                        <span className="text-gray-500 text-lg">itens</span>
                      </div>
                    </div>
                    <div className="flex flex-col sm:items-end gap-3">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-[#4CAF50]/10 rounded-full border border-[#4CAF50]/30">
                        <div className="w-2 h-2 bg-[#4CAF50] rounded-full animate-pulse"></div>
                        <span className="text-[#4CAF50] font-semibold text-sm">Sistema Online</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-mono">{currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
            {statsData.map((stat, index) => (
              <div
                key={index}
                className="group relative bg-[#282c34] rounded-xl border border-gray-700/50 p-5 hover:border-[#4CAF50]/50 transition-all duration-300 hover:shadow-lg hover:shadow-[#4CAF50]/10 hover:-translate-y-1 cursor-pointer"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#4CAF50]/0 via-[#4CAF50]/20 to-[#4CAF50]/0 rounded-xl opacity-0 group-hover:opacity-100 blur transition duration-500"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-[#4CAF50]/10 border border-[#4CAF50]/20 flex items-center justify-center text-[#4CAF50] group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                      {getIcon(stat.icon)}
                    </div>
                  </div>
                  <p className="text-gray-400 text-xs mb-2 font-medium uppercase tracking-wide">{stat.label}</p>
                  <p className="text-2xl font-bold text-white group-hover:scale-105 transition-transform duration-300">
                    {(stat.value || 0).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Tarefas */}
          {tarefasStats.total > 0 && (
            <div className="bg-[#282c34] rounded-xl border border-gray-700/50 p-6 mb-8 hover:border-[#4CAF50]/30 transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Tarefas</h2>
                <a href="/dashboard/tarefas" className="text-sm text-[#4CAF50] hover:underline flex items-center gap-1 group">
                  Ver todas
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#1e2228] rounded-lg p-5 text-center border border-gray-700/30 hover:border-gray-600/50 transition-colors">
                  <p className="text-gray-400 text-xs mb-2 uppercase tracking-wide">Total</p>
                  <p className="text-3xl font-bold text-white">{tarefasStats.total}</p>
                </div>
                <div className="bg-[#1e2228] rounded-lg p-5 text-center border border-[#4CAF50]/30 hover:border-[#4CAF50]/50 transition-colors group">
                  <p className="text-gray-400 text-xs mb-2 uppercase tracking-wide">Concluídas</p>
                  <p className="text-3xl font-bold text-[#4CAF50] group-hover:scale-110 transition-transform duration-300">{tarefasStats.porStatus.done}</p>
                </div>
                <div className="bg-[#1e2228] rounded-lg p-5 text-center border border-gray-700/30 hover:border-gray-600/50 transition-colors">
                  <p className="text-gray-400 text-xs mb-2 uppercase tracking-wide">Em Andamento</p>
                  <p className="text-3xl font-bold text-white">{tarefasStats.porStatus['in-progress']}</p>
                </div>
                <div className={`bg-[#1e2228] rounded-lg p-5 text-center border transition-colors ${tarefasStats.atrasadas > 0 ? 'border-red-500/30 hover:border-red-500/50' : 'border-gray-700/30 hover:border-gray-600/50'}`}>
                  <p className={`text-xs mb-2 uppercase tracking-wide ${tarefasStats.atrasadas > 0 ? 'text-red-400' : 'text-gray-400'}`}>
                    Atrasadas
                  </p>
                  <p className={`text-3xl font-bold ${tarefasStats.atrasadas > 0 ? 'text-red-400' : 'text-gray-600'}`}>
                    {tarefasStats.atrasadas || 0}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { href: '/dashboard/lista-pc', title: 'Computadores', desc: 'Gerenciar equipamentos', icon: 'computers' },
              { href: '/dashboard/emails', title: 'Emails', desc: 'Contas e credenciais', icon: 'emails' },
              { href: '/dashboard/tarefas', title: 'Tarefas', desc: 'Kanban e gestão', icon: 'clocks' },
            ].map((action, index) => (
              <a
                key={index}
                href={action.href}
                className="group relative bg-[#282c34] rounded-xl border border-gray-700/50 p-6 hover:border-[#4CAF50]/50 transition-all duration-300 hover:shadow-xl hover:shadow-[#4CAF50]/10 hover:-translate-y-1 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#4CAF50]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#4CAF50]/0 via-[#4CAF50]/20 to-[#4CAF50]/0 rounded-xl opacity-0 group-hover:opacity-100 blur transition duration-500"></div>
                
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-xl bg-[#4CAF50]/10 border border-[#4CAF50]/20 flex items-center justify-center mb-4 text-[#4CAF50] group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                    {getIcon(action.icon)}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1 group-hover:text-[#4CAF50] transition-colors">{action.title}</h3>
                  <p className="text-sm text-gray-400">{action.desc}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
