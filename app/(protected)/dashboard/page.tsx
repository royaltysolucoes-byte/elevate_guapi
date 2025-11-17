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

  // Refresh automático quando a página ganha foco (usuário volta para a aba)
  useEffect(() => {
    const handleFocus = () => {
      fetchStats();
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchStats();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
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

  // Função para criar gráfico de pizza SVG
  const renderPieChart = () => {
    const size = 200;
    const radius = 80;
    const center = size / 2;
    let currentAngle = -90; // Começa no topo
    
    const top5Cards = [...statsCards].sort((a, b) => b.value - a.value).slice(0, 5);
    const top5Total = top5Cards.reduce((sum, card) => sum + card.value, 0);
    
    const colors = {
      blue: '#3b82f6',
      green: '#10b981',
      purple: '#8b5cf6',
      yellow: '#eab308',
      orange: '#f97316',
      cyan: '#06b6d4',
      pink: '#ec4899',
      indigo: '#6366f1',
      red: '#ef4444',
      teal: '#14b8a6',
    };

    const paths = top5Cards.map((card, index) => {
      const percentage = top5Total > 0 ? (card.value / top5Total) * 100 : 0;
      const angle = (percentage / 100) * 360;
      const startAngle = currentAngle;
      currentAngle += angle;
      
      const endAngle = currentAngle;
      const largeArcFlag = angle > 180 ? 1 : 0;
      
      const x1 = center + radius * Math.cos((startAngle * Math.PI) / 180);
      const y1 = center + radius * Math.sin((startAngle * Math.PI) / 180);
      const x2 = center + radius * Math.cos((endAngle * Math.PI) / 180);
      const y2 = center + radius * Math.sin((endAngle * Math.PI) / 180);
      
      return {
        path: `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`,
        color: colors[card.color as keyof typeof colors] || '#6b7280',
        label: card.label,
        value: card.value,
        percentage: percentage.toFixed(1),
      };
    });

    return (
      <div className="flex flex-col items-center">
        <svg width={size} height={size} className="mb-4">
          {paths.map((item, index) => (
            <path
              key={index}
              d={item.path}
              fill={item.color}
              stroke="#1e2228"
              strokeWidth="2"
              className="hover:opacity-80 transition-opacity cursor-pointer"
            />
          ))}
          <circle cx={center} cy={center} r={radius * 0.6} fill="#1e2228" />
          <text
            x={center}
            y={center - 5}
            textAnchor="middle"
            className="text-white text-sm font-bold fill-white"
          >
            {top5Total.toLocaleString('pt-BR')}
          </text>
          <text
            x={center}
            y={center + 10}
            textAnchor="middle"
            className="text-gray-400 text-xs fill-gray-400"
          >
            Top 5
          </text>
        </svg>
        <div className="grid grid-cols-2 gap-2 w-full max-w-xs">
          {paths.map((item, index) => (
            <div key={index} className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }}></div>
              <span className="text-gray-400 truncate">{item.label}</span>
              <span className="text-white font-semibold ml-auto">{item.percentage}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header Compacto */}
      <div className="bg-[#282c34] rounded-lg border border-gray-700/50 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Olá, <span className="text-[#4CAF50]">{user?.fullName || 'Usuário'}</span>
            </h1>
            <p className="text-gray-400 text-sm">Painel de controle</p>
          </div>
          
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-[#4CAF50] hover:bg-[#45a049] text-white rounded-lg transition-colors disabled:opacity-50 text-sm font-medium"
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

        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-gray-700/50 text-xs">
          {user?.funcao && (
            <div className="flex items-center gap-1.5 text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>{user.funcao}</span>
            </div>
          )}

          {lastUpdate && (
            <div className="flex items-center gap-1.5 text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{formatLastUpdate(lastUpdate)}</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-[#4CAF50]">
            <div className="w-1.5 h-1.5 bg-[#4CAF50] rounded-full animate-pulse"></div>
            <span className="font-medium">Online</span>
          </div>
        </div>
      </div>

      {/* Total Compacto */}
      <div className="bg-gradient-to-r from-[#4CAF50]/10 to-[#45a049]/5 rounded-lg border border-[#4CAF50]/20 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-xs mb-0.5">Total de Recursos</p>
            <p className="text-3xl font-bold text-[#4CAF50]">
              {totalItems.toLocaleString('pt-BR')}
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-[#4CAF50]/20 flex items-center justify-center border border-[#4CAF50]/30">
            <svg className="w-6 h-6 text-[#4CAF50]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Stats Cards Grid Compacto */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {statsCards.map((card, index) => {
          const percentage = totalItems > 0 ? (card.value / totalItems) * 100 : 0;
          return (
            <div
              key={index}
              className="bg-[#282c34] rounded-lg border border-gray-800/50 p-3 hover:border-gray-700 transition-colors"
            >
              <div className={`w-8 h-8 ${colorClasses[card.color]} rounded-lg flex items-center justify-center border mb-2`}>
                {getIcon(card.iconType)}
              </div>
              <p className="text-gray-400 text-xs mb-1 uppercase tracking-wide">{card.label}</p>
              <p className="text-xl font-bold text-white mb-1">{card.value.toLocaleString('pt-BR')}</p>
              <div className="w-full bg-gray-800/50 rounded-full h-1 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    card.color === 'blue' ? 'bg-blue-500' :
                    card.color === 'green' ? 'bg-green-500' :
                    card.color === 'purple' ? 'bg-purple-500' :
                    card.color === 'yellow' ? 'bg-yellow-500' :
                    card.color === 'orange' ? 'bg-orange-500' :
                    card.color === 'cyan' ? 'bg-cyan-500' :
                    card.color === 'pink' ? 'bg-pink-500' :
                    card.color === 'indigo' ? 'bg-indigo-500' :
                    card.color === 'red' ? 'bg-red-500' :
                    'bg-teal-500'
                  }`}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Gráfico e Estatísticas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Gráfico de Pizza */}
        <div className="lg:col-span-2 bg-[#282c34] rounded-lg border border-gray-700/50 p-4">
          <h2 className="text-lg font-bold text-white mb-4">Distribuição - Top 5</h2>
          {renderPieChart()}
        </div>

        {/* Resumo Compacto */}
        <div className="bg-[#282c34] rounded-lg border border-gray-700/50 p-4">
          <h2 className="text-lg font-bold text-white mb-4">Resumo</h2>
          <div className="space-y-3">
            <div className="bg-[#1e2228] rounded-lg p-3 border border-gray-800/50">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400">Total</span>
                <span className="text-lg font-bold text-white">{totalItems.toLocaleString('pt-BR')}</span>
              </div>
              <p className="text-xs text-gray-500">Recursos cadastrados</p>
            </div>

            <div className="bg-[#1e2228] rounded-lg p-3 border border-gray-800/50">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400">Categorias</span>
                <span className="text-lg font-bold text-white">10</span>
              </div>
              <p className="text-xs text-gray-500">Tipos de recursos</p>
            </div>

            <div className="bg-[#4CAF50]/10 rounded-lg p-3 border border-[#4CAF50]/20">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-[#4CAF50] rounded-full animate-pulse"></div>
                <span className="text-xs font-semibold text-[#4CAF50]">Sistema Online</span>
              </div>
              <p className="text-xs text-gray-300">Operações normais</p>
            </div>
          </div>
        </div>
      </div>

      {/* Distribuição Detalhada Compacta */}
      <div className="bg-[#282c34] rounded-lg border border-gray-700/50 p-4">
        <h2 className="text-lg font-bold text-white mb-4">Distribuição Completa</h2>
        <div className="space-y-3">
          {statsCards.map((card, index) => {
            const percentage = totalItems > 0 ? (card.value / totalItems) * 100 : 0;
            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 ${colorClasses[card.color]} rounded-lg flex items-center justify-center border`}>
                      {getIcon(card.iconType)}
                    </div>
                    <div>
                      <span className="text-sm text-gray-300 font-medium block">{card.label}</span>
                      <span className="text-xs text-gray-500">{card.value} itens</span>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-white">{percentage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-800/50 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${
                      card.color === 'blue' ? 'bg-blue-500' :
                      card.color === 'green' ? 'bg-green-500' :
                      card.color === 'purple' ? 'bg-purple-500' :
                      card.color === 'yellow' ? 'bg-yellow-500' :
                      card.color === 'orange' ? 'bg-orange-500' :
                      card.color === 'cyan' ? 'bg-cyan-500' :
                      card.color === 'pink' ? 'bg-pink-500' :
                      card.color === 'indigo' ? 'bg-indigo-500' :
                      card.color === 'red' ? 'bg-red-500' :
                      'bg-teal-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}