'use client';

import { useEffect, useState } from 'react';

interface User {
  fullName: string;
  username: string;
  funcao: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState({
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
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    fetchProfile();
    fetchStats();
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
      const [usersRes, pcsRes, ipsRes, emailsRes, senhasRes, impressorasRes, automacoesRes, relogiosRes, servidoresRes, conectividadesRes] = await Promise.all([
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
      ]);

      const statsData = {
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
      };

      setStats(statsData);
      setLastUpdate(new Date());
      if (isManualRefresh) {
        setRefreshing(false);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      if (isManualRefresh) {
        setRefreshing(false);
      }
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStats(true);
  };

  const formatLastUpdate = (date: Date | null) => {
    if (!date) return 'Nunca atualizado';
    
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return `Atualizado há ${diff} segundo${diff !== 1 ? 's' : ''}`;
    if (diff < 3600) {
      const minutes = Math.floor(diff / 60);
      return `Atualizado há ${minutes} minuto${minutes !== 1 ? 's' : ''}`;
    }
    if (diff < 86400) {
      const hours = Math.floor(diff / 3600);
      return `Atualizado há ${hours} hora${hours !== 1 ? 's' : ''}`;
    }
    
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const totalItems = stats.totalUsers + stats.totalPCs + stats.totalIPs + stats.totalEmails + 
                     stats.totalSenhas + stats.totalImpressoras + stats.totalAutomacoes + 
                     stats.totalRelogios + stats.totalServidores + stats.totalConectividades;

  const getIcon = (type: string): React.ReactElement => {
    const iconClass = "w-5 h-5";
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
    };
    return icons[type] || <div className={iconClass} />;
  };

  const statsCards = [
    { label: 'Usuários', value: stats.totalUsers, iconType: 'users', color: 'blue' },
    { label: 'Computadores', value: stats.totalPCs, iconType: 'computers', color: 'green' },
    { label: 'IPs / VLANs', value: stats.totalIPs, iconType: 'ips', color: 'purple' },
    { label: 'Emails', value: stats.totalEmails, iconType: 'emails', color: 'yellow' },
    { label: 'Senhas', value: stats.totalSenhas, iconType: 'passwords', color: 'orange' },
    { label: 'Impressoras', value: stats.totalImpressoras, iconType: 'printers', color: 'cyan' },
    { label: 'Automações', value: stats.totalAutomacoes, iconType: 'automations', color: 'pink' },
    { label: 'Relógios', value: stats.totalRelogios, iconType: 'clocks', color: 'indigo' },
    { label: 'Servidores', value: stats.totalServidores, iconType: 'servers', color: 'red' },
    { label: 'Conectividades', value: stats.totalConectividades, iconType: 'connectivity', color: 'teal' },
  ];

  const colorClasses: { [key: string]: string } = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    green: 'bg-green-500/10 text-green-400 border-green-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    pink: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
    teal: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#4CAF50] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#282c34] rounded-lg border border-gray-700/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">
              Bem-vindo, <span className="text-[#4CAF50]">{user?.fullName || 'Usuário'}</span>
            </h1>
            <p className="text-gray-400">Sistema de Gerenciamento TI</p>
          </div>
          
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-[#4CAF50] hover:bg-[#45a049] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            <svg
              className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {refreshing ? 'Atualizando...' : 'Atualizar'}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-gray-700/50">
          <div className="flex items-center gap-2 text-sm">
            <svg className="w-4 h-4 text-[#4CAF50]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-gray-300">IP Público:</span>
            <span className="text-white font-mono">-</span>
          </div>
          
          {user?.funcao && (
            <div className="flex items-center gap-2 text-sm">
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="text-gray-300">Função:</span>
              <span className="text-white">{user.funcao}</span>
            </div>
          )}

          {lastUpdate && (
            <div className="flex items-center gap-2 text-sm">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-gray-500">{formatLastUpdate(lastUpdate)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="bg-[#282c34] rounded-lg border border-gray-700/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Visão Geral</h2>
          <div className="text-right">
            <p className="text-2xl font-bold text-[#4CAF50]">{totalItems}</p>
            <p className="text-xs text-gray-400">Total de Itens</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {statsCards.map((card, index) => (
            <div
              key={index}
              className="bg-[#1e2228] rounded-lg border border-gray-800/50 p-4 hover:border-gray-700 transition-colors"
            >
              <div className={`w-10 h-10 ${colorClasses[card.color]} rounded-lg flex items-center justify-center border mb-3`}>
                {getIcon(card.iconType)}
              </div>
              <p className="text-gray-400 text-xs mb-1 uppercase tracking-wide">{card.label}</p>
              <p className="text-2xl font-bold text-white">{card.value.toLocaleString('pt-BR')}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#282c34] rounded-lg border border-gray-700/50 p-6">
          <h2 className="text-xl font-bold text-white mb-4">Distribuição de Recursos</h2>
          <div className="space-y-4">
            {statsCards.slice(0, 5).map((card, index) => {
              const percentage = totalItems > 0 ? (card.value / totalItems) * 100 : 0;
              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 ${colorClasses[card.color]} rounded flex items-center justify-center border`}>
                        {getIcon(card.iconType)}
                      </div>
                      <span className="text-sm text-gray-300 font-medium">{card.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{card.value}</span>
                      <span className="text-xs text-gray-500">({percentage.toFixed(1)}%)</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-800/50 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full bg-${card.color}-500 rounded-full transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-[#282c34] rounded-lg border border-gray-700/50 p-6">
          <h2 className="text-xl font-bold text-white mb-4">Resumo do Sistema</h2>
          <div className="space-y-4">
            <div className="bg-[#1e2228] rounded-lg p-4 border border-gray-800/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Total de Recursos</span>
                <span className="text-lg font-bold text-white">{totalItems}</span>
              </div>
              <p className="text-xs text-gray-500">Todos os itens cadastrados</p>
            </div>

            <div className="bg-[#1e2228] rounded-lg p-4 border border-gray-800/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Categorias</span>
                <span className="text-lg font-bold text-white">10</span>
              </div>
              <p className="text-xs text-gray-500">Tipos de recursos</p>
            </div>

            <div className="bg-gradient-to-r from-[#4CAF50]/10 to-[#45a049]/10 rounded-lg p-4 border border-[#4CAF50]/20">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-[#4CAF50] rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold text-[#4CAF50]">Sistema Operacional</span>
              </div>
              <p className="text-xs text-gray-300">Todas as operações funcionando normalmente</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}