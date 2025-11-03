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

  const fetchStats = async () => {
    try {
      // Fetch all stats in parallel
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
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-br from-[#282c34] via-[#2c3139] to-[#282c34] rounded-xl shadow-2xl p-8 border border-gray-700/50">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Bem-vindo, <span className="text-[#4CAF50]">{user?.fullName || 'Usuário'}</span>!
            </h1>
            <p className="text-gray-400 text-lg">
              Sistema de Controle e Gerenciamento TI
            </p>
          </div>
          <div className="bg-[#4CAF50]/10 border border-[#4CAF50]/30 rounded-full p-4">
            <svg className="w-12 h-12 text-[#4CAF50]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="bg-gray-800/50 px-4 py-2 rounded-lg flex items-center space-x-2">
            <svg className="w-5 h-5 text-[#4CAF50]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-white font-medium">IP Público:</span>
            <span className="text-[#4CAF50] font-mono">-</span>
          </div>
          {user?.funcao && (
            <div className="bg-gray-800/50 px-4 py-2 rounded-lg flex items-center space-x-2">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="text-gray-400">Função:</span>
              <span className="text-white font-medium">{user.funcao}</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {/* Usuários */}
        <div className="bg-[#282c34] rounded-xl shadow-lg p-6 border-l-4 border-blue-500 hover:shadow-xl transition-all duration-300 hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
          <p className="text-gray-400 text-sm mb-1">Usuários</p>
          <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
        </div>

        {/* PCs */}
        <div className="bg-[#282c34] rounded-xl shadow-lg p-6 border-l-4 border-[#4CAF50] hover:shadow-xl transition-all duration-300 hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-[#4CAF50]/10 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-[#4CAF50]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
          </div>
          <p className="text-gray-400 text-sm mb-1">Computadores</p>
          <p className="text-3xl font-bold text-white">{stats.totalPCs}</p>
        </div>

        {/* IPs */}
        <div className="bg-[#282c34] rounded-xl shadow-lg p-6 border-l-4 border-purple-500 hover:shadow-xl transition-all duration-300 hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
          </div>
          <p className="text-gray-400 text-sm mb-1">IPs / VLANs</p>
          <p className="text-3xl font-bold text-white">{stats.totalIPs}</p>
        </div>

        {/* Emails */}
        <div className="bg-[#282c34] rounded-xl shadow-lg p-6 border-l-4 border-yellow-500 hover:shadow-xl transition-all duration-300 hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <p className="text-gray-400 text-sm mb-1">Emails</p>
          <p className="text-3xl font-bold text-white">{stats.totalEmails}</p>
        </div>

        {/* Senhas */}
        <div className="bg-[#282c34] rounded-xl shadow-lg p-6 border-l-4 border-orange-500 hover:shadow-xl transition-all duration-300 hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>
          <p className="text-gray-400 text-sm mb-1">Senhas</p>
          <p className="text-3xl font-bold text-white">{stats.totalSenhas}</p>
        </div>

        {/* Impressoras */}
        <div className="bg-[#282c34] rounded-xl shadow-lg p-6 border-l-4 border-cyan-500 hover:shadow-xl transition-all duration-300 hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-cyan-500/10 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
            </div>
          </div>
          <p className="text-gray-400 text-sm mb-1">Impressoras</p>
          <p className="text-3xl font-bold text-white">{stats.totalImpressoras}</p>
        </div>

        {/* Automações */}
        <div className="bg-[#282c34] rounded-xl shadow-lg p-6 border-l-4 border-pink-500 hover:shadow-xl transition-all duration-300 hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-pink-500/10 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
          </div>
          <p className="text-gray-400 text-sm mb-1">Automações</p>
          <p className="text-3xl font-bold text-white">{stats.totalAutomacoes}</p>
        </div>

        {/* Relógios de Ponto */}
        <div className="bg-[#282c34] rounded-xl shadow-lg p-6 border-l-4 border-indigo-500 hover:shadow-xl transition-all duration-300 hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-indigo-500/10 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-gray-400 text-sm mb-1">Relógios de Ponto</p>
          <p className="text-3xl font-bold text-white">{stats.totalRelogios}</p>
        </div>

        {/* Servidores */}
        <div className="bg-[#282c34] rounded-xl shadow-lg p-6 border-l-4 border-red-500 hover:shadow-xl transition-all duration-300 hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
              </svg>
            </div>
          </div>
          <p className="text-gray-400 text-sm mb-1">Servidores</p>
          <p className="text-3xl font-bold text-white">{stats.totalServidores}</p>
        </div>

        {/* Conectividades */}
        <div className="bg-[#282c34] rounded-xl shadow-lg p-6 border-l-4 border-teal-500 hover:shadow-xl transition-all duration-300 hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-teal-500/10 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
              </svg>
            </div>
          </div>
          <p className="text-gray-400 text-sm mb-1">Conectividades</p>
          <p className="text-3xl font-bold text-white">{stats.totalConectividades}</p>
        </div>
      </div>

      {/* Quick Info */}
      <div className="bg-gradient-to-br from-[#282c34] to-[#1e2228] rounded-xl shadow-lg p-8 border border-gray-700/50">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
          <svg className="w-6 h-6 mr-2 text-[#4CAF50]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Resumo do Sistema
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="flex items-start space-x-3">
            <div className="bg-[#4CAF50]/10 rounded-lg p-2">
              <svg className="w-5 h-5 text-[#4CAF50]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-white font-semibold">Total de Recursos</p>
              <p className="text-gray-400 text-sm">
                {stats.totalUsers + stats.totalPCs + stats.totalIPs + stats.totalEmails + stats.totalSenhas + 
                 stats.totalImpressoras + stats.totalAutomacoes + stats.totalRelogios + stats.totalServidores + 
                 stats.totalConectividades} itens cadastrados no sistema
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="bg-blue-500/10 rounded-lg p-2">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <p className="text-white font-semibold">Sistema Seguro</p>
              <p className="text-gray-400 text-sm">
                Todas as informações estão protegidas e organizadas
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
