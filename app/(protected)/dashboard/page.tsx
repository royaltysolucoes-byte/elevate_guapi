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

interface StatCard {
  label: string;
  value: number;
  iconType: string;
  color: string;
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

  const formatLastUpdate = (date: Date | null): string => {
    if (!date) return 'Nunca atualizado';
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return `Há ${diff}s`;
    if (diff < 3600) return `Há ${Math.floor(diff / 60)}min`;
    if (diff < 86400) return `Há ${Math.floor(diff / 3600)}h`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
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

  const getIcon = (type: string): React.ReactElement => {
    const iconClass = 'w-6 h-6';
    const icons: { [key: string]: React.ReactElement } = {
      users: (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      computers: (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
        </svg>
      ),
      ips: (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      ),
      emails: (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      passwords: (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      printers: (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
        </svg>
      ),
      automations: (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      clocks: (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      servers: (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
        </svg>
      ),
      connectivity: (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
        </svg>
      ),
      phones: (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
    };
    return icons[type] || <div className={iconClass} />;
  };

  const statsCards: StatCard[] = [
    { label: 'Usuários', value: stats.totalUsers, iconType: 'users', color: 'from-blue-500/20 to-blue-600/10' },
    { label: 'Computadores', value: stats.totalPCs, iconType: 'computers', color: 'from-purple-500/20 to-purple-600/10' },
    { label: 'IPs / VLANs', value: stats.totalIPs, iconType: 'ips', color: 'from-cyan-500/20 to-cyan-600/10' },
    { label: 'Emails', value: stats.totalEmails, iconType: 'emails', color: 'from-orange-500/20 to-orange-600/10' },
    { label: 'Senhas', value: stats.totalSenhas, iconType: 'passwords', color: 'from-red-500/20 to-red-600/10' },
    { label: 'Impressoras', value: stats.totalImpressoras, iconType: 'printers', color: 'from-pink-500/20 to-pink-600/10' },
    { label: 'Automações', value: stats.totalAutomacoes, iconType: 'automations', color: 'from-yellow-500/20 to-yellow-600/10' },
    { label: 'Relógios', value: stats.totalRelogios, iconType: 'clocks', color: 'from-indigo-500/20 to-indigo-600/10' },
    { label: 'Servidores', value: stats.totalServidores, iconType: 'servers', color: 'from-teal-500/20 to-teal-600/10' },
    { label: 'Conectividades', value: stats.totalConectividades, iconType: 'connectivity', color: 'from-emerald-500/20 to-emerald-600/10' },
    { label: 'Celulares', value: stats.totalCelulares, iconType: 'phones', color: 'from-violet-500/20 to-violet-600/10' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#1e2228]">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#4CAF50] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1e2228]">
      {/* Header */}
      <div className="bg-[#282c34] border-b border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">
                Olá, <span className="text-[#4CAF50]">{user?.fullName || 'Usuário'}</span>
              </h1>
              <p className="text-gray-400">Bem-vindo ao painel de controle</p>
            </div>
            <div className="flex items-center gap-3">
              {lastUpdate && (
                <div className="hidden md:flex items-center gap-2 text-gray-400 text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{formatLastUpdate(lastUpdate)}</span>
                </div>
              )}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-[#4CAF50] hover:bg-[#45a049] text-white rounded-lg transition disabled:opacity-50 text-sm font-medium"
              >
                <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {refreshing ? 'Atualizando...' : 'Atualizar'}
              </button>
            </div>
          </div>

          {/* Hero Card */}
          <div className="relative bg-gradient-to-br from-[#4CAF50]/20 via-[#4CAF50]/10 to-transparent rounded-2xl border border-[#4CAF50]/30 p-6 md:p-8 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-[#4CAF50]/0 via-[#4CAF50]/5 to-[#4CAF50]/0 opacity-50"></div>
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  <p className="text-gray-400 text-sm mb-2 uppercase tracking-wide font-medium">Total de Recursos</p>
                  <div className="flex items-baseline gap-3">
                    <p className="text-5xl md:text-6xl font-bold text-white">
                      {(totalItems || 0).toLocaleString('pt-BR')}
                    </p>
                    <span className="text-gray-500 text-lg">itens cadastrados</span>
                  </div>
                </div>
                <div className="flex flex-col items-start md:items-end gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-[#4CAF50] rounded-full animate-pulse"></div>
                    <span className="text-[#4CAF50] font-semibold">Sistema Online</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm">
                      {currentTime.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                    </span>
                    <span className="text-[#4CAF50] font-semibold">
                      {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          {statsCards.map((card, index) => (
            <div
              key={index}
              className="group relative bg-[#282c34] rounded-xl border border-gray-700/50 p-5 hover:border-[#4CAF50]/50 transition-all duration-300 hover:shadow-lg hover:shadow-[#4CAF50]/10 hover:-translate-y-1"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${card.color} rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-lg bg-[#4CAF50]/10 border border-[#4CAF50]/20 flex items-center justify-center mb-4 text-[#4CAF50] group-hover:scale-110 transition-transform duration-300">
                  {getIcon(card.iconType)}
                </div>
                <p className="text-gray-400 text-xs mb-2 uppercase tracking-wide font-medium">{card.label}</p>
                <p className="text-2xl font-bold text-white">{(card.value || 0).toLocaleString('pt-BR')}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tarefas Section */}
        {tarefasStats.total > 0 && (
          <div className="bg-[#282c34] rounded-xl border border-gray-700/50 p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Tarefas</h2>
              <a href="/dashboard/tarefas" className="text-sm text-gray-400 hover:text-[#4CAF50] transition-colors">
                Ver todas →
              </a>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#1e2228] rounded-lg border border-gray-700/30 p-5 text-center">
                <p className="text-gray-400 text-xs mb-2 uppercase tracking-wide">Total</p>
                <p className="text-3xl font-bold text-white">{tarefasStats.total}</p>
              </div>
              <div className="bg-[#1e2228] rounded-lg border border-[#4CAF50]/30 p-5 text-center">
                <p className="text-gray-400 text-xs mb-2 uppercase tracking-wide">Concluídas</p>
                <p className="text-3xl font-bold text-[#4CAF50]">{tarefasStats.porStatus.done}</p>
              </div>
              <div className="bg-[#1e2228] rounded-lg border border-gray-700/30 p-5 text-center">
                <p className="text-gray-400 text-xs mb-2 uppercase tracking-wide">Em Andamento</p>
                <p className="text-3xl font-bold text-white">{tarefasStats.porStatus['in-progress']}</p>
              </div>
              <div className={`bg-[#1e2228] rounded-lg border p-5 text-center ${tarefasStats.atrasadas > 0 ? 'border-red-500/30' : 'border-gray-700/30'}`}>
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
          <a
            href="/dashboard/lista-pc"
            className="group bg-[#282c34] rounded-xl border border-gray-700/50 p-6 hover:border-[#4CAF50]/50 transition-all duration-300 hover:shadow-lg hover:shadow-[#4CAF50]/10 hover:-translate-y-1"
          >
            <div className="w-14 h-14 rounded-xl bg-[#4CAF50]/10 border border-[#4CAF50]/20 flex items-center justify-center mb-4 text-[#4CAF50] group-hover:scale-110 transition-transform duration-300">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Computadores</h3>
            <p className="text-sm text-gray-400">Gerenciar equipamentos e recursos</p>
          </a>

          <a
            href="/dashboard/emails"
            className="group bg-[#282c34] rounded-xl border border-gray-700/50 p-6 hover:border-[#4CAF50]/50 transition-all duration-300 hover:shadow-lg hover:shadow-[#4CAF50]/10 hover:-translate-y-1"
          >
            <div className="w-14 h-14 rounded-xl bg-[#4CAF50]/10 border border-[#4CAF50]/20 flex items-center justify-center mb-4 text-[#4CAF50] group-hover:scale-110 transition-transform duration-300">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Emails</h3>
            <p className="text-sm text-gray-400">Contas e credenciais de acesso</p>
          </a>

          <a
            href="/dashboard/tarefas"
            className="group bg-[#282c34] rounded-xl border border-gray-700/50 p-6 hover:border-[#4CAF50]/50 transition-all duration-300 hover:shadow-lg hover:shadow-[#4CAF50]/10 hover:-translate-y-1"
          >
            <div className="w-14 h-14 rounded-xl bg-[#4CAF50]/10 border border-[#4CAF50]/20 flex items-center justify-center mb-4 text-[#4CAF50] group-hover:scale-110 transition-transform duration-300">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Tarefas</h3>
            <p className="text-sm text-gray-400">Kanban e gestão de atividades</p>
          </a>
        </div>
      </div>
    </div>
  );
}
