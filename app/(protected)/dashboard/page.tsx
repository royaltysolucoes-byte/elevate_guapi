'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

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
  totalGPOs: number;
  totalDocumentos: number;
  totalEquipamentosIP: number;
}

interface Tarefa {
  _id: string;
  titulo: string;
  descricao: string;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
  responsavel: string;
  criadoPor: string;
  prazo: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface TarefasStats {
  total: number;
  porStatus: { todo: number; 'in-progress': number; review: number; done: number };
  porPrioridade: { baixa: number; media: number; alta: number; urgente: number };
  atrasadas: number;
}

export default function DashboardPage() {
  const router = useRouter();
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
    totalGPOs: 0,
    totalDocumentos: 0,
    totalEquipamentosIP: 0,
  });
  const [tarefasStats, setTarefasStats] = useState<TarefasStats>({
    total: 0,
    porStatus: { todo: 0, 'in-progress': 0, review: 0, done: 0 },
    porPrioridade: { baixa: 0, media: 0, alta: 0, urgente: 0 },
    atrasadas: 0,
  });
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchProfile();
    fetchStats();
    fetchTarefas();
  }, []);

  useEffect(() => {
    const handleFocus = () => {
      fetchStats();
      fetchTarefas();
    };
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchStats();
        fetchTarefas();
      }
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
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

  const fetchTarefas = async () => {
    try {
      const response = await fetch('/api/tarefas');
      if (response.ok) {
        const data = await response.json();
        setTarefas(data.tarefas || []);
      }
    } catch (error) {
      console.error('Error fetching tarefas:', error);
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
        gposRes,
        documentosRes,
        equipamentosIPRes,
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
        fetch('/api/gpos?page=1'),
        fetch('/api/documentos?page=1'),
        fetch('/api/consulta-ip'),
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
        totalGPOs: gposRes.ok ? (await gposRes.json()).pagination.total : 0,
        totalDocumentos: documentosRes.ok ? (await documentosRes.json()).pagination.total : 0,
        totalEquipamentosIP: equipamentosIPRes.ok ? (await equipamentosIPRes.json()).equipamentos.length : 0,
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
    await Promise.all([fetchStats(true), fetchTarefas()]);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const getTarefasByDate = (date: Date) => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return tarefas.filter(tarefa => {
      if (!tarefa.prazo) return false;
      const prazoStr = new Date(tarefa.prazo).toISOString().split('T')[0];
      return prazoStr === dateStr;
    });
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isPast = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate < today;
  };

  const getPrioridadeColor = (prioridade: string) => {
    switch (prioridade) {
      case 'urgente': return 'bg-red-500';
      case 'alta': return 'bg-orange-500';
      case 'media': return 'bg-yellow-500';
      case 'baixa': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'bg-green-500';
      case 'in-progress': return 'bg-blue-500';
      case 'review': return 'bg-purple-500';
      case 'todo': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const days = getDaysInMonth(currentDate);
  const selectedTarefas = selectedDate ? getTarefasByDate(selectedDate) : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#1e2228]">
        <div className="flex flex-col items-center gap-6">
          {/* Logo Átomo Animado - Apenas órbitas girando */}
          <div className="relative w-24 h-24 flex items-center justify-center">
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
          <p className="text-gray-400 text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  const totalItems = stats.totalUsers + stats.totalPCs + stats.totalIPs + stats.totalEmails + stats.totalSenhas + stats.totalImpressoras + stats.totalAutomacoes + stats.totalRelogios + stats.totalServidores + stats.totalConectividades + stats.totalCelulares + stats.totalGPOs + stats.totalDocumentos + stats.totalEquipamentosIP;

  const currentTimeFormatted = currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const currentDateFormatted = currentTime.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-[#1e2228] p-6">
      {/* Header Melhorado */}
      <div className="bg-gradient-to-r from-[#282c34] to-[#1e2228] rounded-lg border border-gray-700/50 p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-[#4CAF50]/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-[#4CAF50]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      </div>
              <div>
                <h1 className="text-xl font-bold text-white">Dashboard</h1>
                <p className="text-xs text-gray-400">{user?.fullName ? `Olá, ${user.fullName.split(' ')[0]}` : 'Sistema'}</p>
      </div>
      </div>
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
              <div className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="capitalize">{currentDateFormatted}</span>
      </div>
              <div className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{currentTimeFormatted}</span>
              </div>
            </div>
              </div>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-[#282c34] hover:bg-[#363f4a] text-white rounded-lg transition disabled:opacity-50 border border-gray-700 self-start sm:self-auto"
              >
            <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {refreshing ? 'Atualizando...' : 'Atualizar'}
              </button>
        </div>
            </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Coluna Principal */}
        <div className="lg:col-span-3 space-y-6">
          {/* Cards Principais com Hover Interativo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card Equipamentos */}
            <div 
              className="group relative bg-[#282c34] rounded-lg border border-gray-700/50 p-6 hover:border-blue-500/50 transition-all cursor-pointer overflow-hidden"
              onMouseEnter={() => setHoveredCard('equipamentos')}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => router.push('/dashboard/lista-pc')}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                </div>
              </div>
              <p className="text-sm text-gray-400 mb-1">Equipamentos</p>
              <p className="text-3xl font-bold text-white mb-4">{stats.totalPCs + stats.totalImpressoras + stats.totalRelogios + stats.totalCelulares}</p>
              
              {/* Info no Hover */}
              {hoveredCard === 'equipamentos' && (
                <div className="absolute inset-0 bg-[#282c34] p-6 animate-fadeIn">
                    <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">PCs:</span>
                      <span className="text-white font-semibold">{stats.totalPCs}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Impressoras:</span>
                      <span className="text-white font-semibold">{stats.totalImpressoras}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Relógios:</span>
                      <span className="text-white font-semibold">{stats.totalRelogios}</span>
                      </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Celulares:</span>
                      <span className="text-white font-semibold">{stats.totalCelulares}</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex gap-4 text-xs text-gray-500">
                <span>PCs: <span className="text-white">{stats.totalPCs}</span></span>
                <span>Impr: <span className="text-white">{stats.totalImpressoras}</span></span>
              </div>
                      </div>

            {/* Card Rede */}
            <div 
              className="group relative bg-[#282c34] rounded-lg border border-gray-700/50 p-6 hover:border-cyan-500/50 transition-all cursor-pointer overflow-hidden"
              onMouseEnter={() => setHoveredCard('rede')}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => router.push('/dashboard/gestao-ip')}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-cyan-500/10 flex items-center justify-center group-hover:scale-110 transition">
                  <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                </div>
              </div>
              <p className="text-sm text-gray-400 mb-1">Rede & Infra</p>
              <p className="text-3xl font-bold text-white mb-4">{stats.totalIPs + stats.totalServidores + stats.totalConectividades}</p>
              
              {hoveredCard === 'rede' && (
                <div className="absolute inset-0 bg-[#282c34] p-6 animate-fadeIn">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">IPs/VLANs:</span>
                      <span className="text-white font-semibold">{stats.totalIPs}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Servidores:</span>
                      <span className="text-white font-semibold">{stats.totalServidores}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Conectividades:</span>
                      <span className="text-white font-semibold">{stats.totalConectividades}</span>
                      </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Equip. IP:</span>
                      <span className="text-white font-semibold">{stats.totalEquipamentosIP}</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex gap-4 text-xs text-gray-500">
                <span>IPs: <span className="text-white">{stats.totalIPs}</span></span>
                <span>Serv: <span className="text-white">{stats.totalServidores}</span></span>
            </div>
          </div>

            {/* Card Tarefas */}
            <div 
              className="group relative bg-[#282c34] rounded-lg border border-gray-700/50 p-6 hover:border-green-500/50 transition-all cursor-pointer overflow-hidden"
              onMouseEnter={() => setHoveredCard('tarefas')}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => router.push('/dashboard/tarefas')}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center group-hover:scale-110 transition">
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
              <p className="text-sm text-gray-400 mb-1">Tarefas</p>
              <p className="text-3xl font-bold text-white mb-4">{tarefasStats.total}</p>
              
              {hoveredCard === 'tarefas' && (
                <div className="absolute inset-0 bg-[#282c34] p-6 animate-fadeIn">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">A Fazer:</span>
                      <span className="text-white font-semibold">{tarefasStats.porStatus.todo}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Em Andamento:</span>
                      <span className="text-blue-400 font-semibold">{tarefasStats.porStatus['in-progress']}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Concluídas:</span>
                      <span className="text-green-400 font-semibold">{tarefasStats.porStatus.done}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Atrasadas:</span>
                      <span className="text-red-400 font-semibold">{tarefasStats.atrasadas || 0}</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden flex">
                  <div className="bg-gray-500" style={{ width: `${(tarefasStats.porStatus.todo / (tarefasStats.total || 1)) * 100}%` }}></div>
                  <div className="bg-blue-500" style={{ width: `${(tarefasStats.porStatus['in-progress'] / (tarefasStats.total || 1)) * 100}%` }}></div>
                  <div className="bg-purple-500" style={{ width: `${(tarefasStats.porStatus.review / (tarefasStats.total || 1)) * 100}%` }}></div>
                  <div className="bg-green-500" style={{ width: `${(tarefasStats.porStatus.done / (tarefasStats.total || 1)) * 100}%` }}></div>
                </div>
                {tarefasStats.atrasadas > 0 && (
                  <span className="text-xs text-red-400 font-medium">{tarefasStats.atrasadas}</span>
                )}
              </div>
            </div>
          </div>

          {/* Status das Tarefas */}
          {tarefasStats.total > 0 && (
            <div className="bg-[#282c34] rounded-lg border border-gray-700/50 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-white">Status das Tarefas</h2>
                <a href="/dashboard/tarefas" className="text-sm text-[#4CAF50] hover:underline flex items-center gap-1">
                  Ver todas
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-[#1e2228] rounded-lg border border-gray-700/30 hover:border-gray-600/50 transition cursor-pointer" onClick={() => router.push('/dashboard/tarefas')}>
                  <p className="text-xs text-gray-400 mb-2">A Fazer</p>
                  <p className="text-2xl font-bold text-white">{tarefasStats.porStatus.todo}</p>
                </div>
                <div className="p-4 bg-[#1e2228] rounded-lg border border-blue-500/30 hover:border-blue-500/50 transition cursor-pointer" onClick={() => router.push('/dashboard/tarefas')}>
                  <p className="text-xs text-gray-400 mb-2">Em Andamento</p>
                  <p className="text-2xl font-bold text-blue-400">{tarefasStats.porStatus['in-progress']}</p>
                </div>
                <div className="p-4 bg-[#1e2228] rounded-lg border border-purple-500/30 hover:border-purple-500/50 transition cursor-pointer" onClick={() => router.push('/dashboard/tarefas')}>
                  <p className="text-xs text-gray-400 mb-2">Em Revisão</p>
                  <p className="text-2xl font-bold text-purple-400">{tarefasStats.porStatus.review}</p>
                </div>
                <div className="p-4 bg-[#1e2228] rounded-lg border border-green-500/30 hover:border-green-500/50 transition cursor-pointer" onClick={() => router.push('/dashboard/tarefas')}>
                  <p className="text-xs text-gray-400 mb-2">Concluídas</p>
                  <p className="text-2xl font-bold text-green-400">{tarefasStats.porStatus.done}</p>
                </div>
              </div>
            </div>
          )}

          {/* Recursos do Sistema */}
          <div className="bg-[#282c34] rounded-lg border border-gray-700/50 p-6">
            <h2 className="text-lg font-bold text-white mb-6">Recursos do Sistema</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-[#1e2228] rounded-lg border border-gray-700/30 hover:border-[#4CAF50]/50 transition cursor-pointer group" onClick={() => router.push('/dashboard/lista-pc')}>
                <div className="flex items-center gap-3 mb-2">
                  <svg className="w-5 h-5 text-blue-400 group-hover:scale-110 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                  <p className="text-lg font-bold text-white">{stats.totalPCs}</p>
                </div>
                <p className="text-xs text-gray-400">PCs</p>
              </div>
              <div className="p-4 bg-[#1e2228] rounded-lg border border-gray-700/30 hover:border-[#4CAF50]/50 transition cursor-pointer group" onClick={() => router.push('/dashboard/servidores')}>
                <div className="flex items-center gap-3 mb-2">
                  <svg className="w-5 h-5 text-purple-400 group-hover:scale-110 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                  </svg>
                  <p className="text-lg font-bold text-white">{stats.totalServidores}</p>
                </div>
                <p className="text-xs text-gray-400">Servidores</p>
              </div>
              <div className="p-4 bg-[#1e2228] rounded-lg border border-gray-700/30 hover:border-[#4CAF50]/50 transition cursor-pointer group" onClick={() => router.push('/dashboard/impressoras')}>
                <div className="flex items-center gap-3 mb-2">
                  <svg className="w-5 h-5 text-pink-400 group-hover:scale-110 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  <p className="text-lg font-bold text-white">{stats.totalImpressoras}</p>
                </div>
                <p className="text-xs text-gray-400">Impressoras</p>
              </div>
              <div className="p-4 bg-[#1e2228] rounded-lg border border-gray-700/30 hover:border-[#4CAF50]/50 transition cursor-pointer group" onClick={() => router.push('/dashboard/gestao-ip')}>
                <div className="flex items-center gap-3 mb-2">
                  <svg className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <p className="text-lg font-bold text-white">{stats.totalIPs}</p>
                </div>
                <p className="text-xs text-gray-400">IPs/VLANs</p>
              </div>
              <div className="p-4 bg-[#1e2228] rounded-lg border border-gray-700/30 hover:border-[#4CAF50]/50 transition cursor-pointer group" onClick={() => router.push('/dashboard/emails')}>
                <div className="flex items-center gap-3 mb-2">
                  <svg className="w-5 h-5 text-orange-400 group-hover:scale-110 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <p className="text-lg font-bold text-white">{stats.totalEmails}</p>
                </div>
                <p className="text-xs text-gray-400">Emails</p>
              </div>
              <div className="p-4 bg-[#1e2228] rounded-lg border border-gray-700/30 hover:border-[#4CAF50]/50 transition cursor-pointer group" onClick={() => router.push('/dashboard/senhas')}>
                <div className="flex items-center gap-3 mb-2">
                  <svg className="w-5 h-5 text-red-400 group-hover:scale-110 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <p className="text-lg font-bold text-white">{stats.totalSenhas}</p>
                </div>
                <p className="text-xs text-gray-400">Senhas</p>
              </div>
              <div className="p-4 bg-[#1e2228] rounded-lg border border-gray-700/30 hover:border-[#4CAF50]/50 transition cursor-pointer group" onClick={() => router.push('/dashboard/automacoes')}>
                <div className="flex items-center gap-3 mb-2">
                  <svg className="w-5 h-5 text-yellow-400 group-hover:scale-110 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <p className="text-lg font-bold text-white">{stats.totalAutomacoes}</p>
                </div>
                <p className="text-xs text-gray-400">Automações</p>
              </div>
              <div className="p-4 bg-[#1e2228] rounded-lg border border-gray-700/30 hover:border-[#4CAF50]/50 transition cursor-pointer group" onClick={() => router.push('/dashboard/gpos')}>
                <div className="flex items-center gap-3 mb-2">
                  <svg className="w-5 h-5 text-green-400 group-hover:scale-110 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <p className="text-lg font-bold text-white">{stats.totalGPOs}</p>
                </div>
                <p className="text-xs text-gray-400">GPOs</p>
              </div>
            </div>
          </div>
        </div>

        {/* Coluna Lateral - Calendário Compacto */}
        <div className="space-y-6">
          {/* Calendário Compacto */}
          <div className="bg-[#282c34] rounded-lg border border-gray-700/50 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-white">
                {monthNames[currentDate.getMonth()].substring(0, 3)} {currentDate.getFullYear()}
              </h3>
              <div className="flex gap-1">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-1 hover:bg-gray-700 rounded transition"
                >
                  <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="px-1.5 py-0.5 text-xs text-gray-400 hover:text-white hover:bg-gray-700 rounded transition"
                >
                  Hoje
                </button>
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-1 hover:bg-gray-700 rounded transition"
                >
                  <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-0.5 mb-1">
              {weekDays.map(day => (
                <div key={day} className="text-center text-[10px] font-medium text-gray-500 py-0.5">
                  {day.substring(0, 1)}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-0.5">
              {days.map((day, index) => {
                if (!day) {
                  return <div key={index} className="aspect-square"></div>;
                }

                const dayTarefas = getTarefasByDate(day);
                const isTodayDate = isToday(day);
                const isPastDate = isPast(day);
                const isSelected = selectedDate && day.toDateString() === selectedDate.toDateString();

                return (
                  <button
                    key={index}
                    onClick={() => setSelectedDate(day)}
                    className={`aspect-square p-0.5 rounded transition-all relative text-[10px] ${
                      isTodayDate
                        ? 'bg-[#4CAF50]/20 border border-[#4CAF50] text-[#4CAF50] font-bold'
                        : isSelected
                        ? 'bg-blue-500/20 border border-blue-500 text-blue-400'
                        : isPastDate && dayTarefas.length > 0
                        ? 'bg-red-500/10 border border-red-500/30 text-red-400'
                        : 'hover:bg-gray-700/50 border border-transparent text-gray-300'
                    }`}
                  >
                    {day.getDate()}
                    {dayTarefas.length > 0 && (
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                        {dayTarefas.slice(0, 1).map((tarefa, idx) => (
                          <div
                            key={idx}
                            className={`w-0.5 h-0.5 rounded-full ${getPrioridadeColor(tarefa.prioridade)}`}
                            title={tarefa.titulo}
                          />
                        ))}
                        {dayTarefas.length > 1 && (
                          <div className="w-0.5 h-0.5 rounded-full bg-gray-500" />
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tarefas do dia selecionado */}
          {selectedDate && (
            <div className="bg-[#282c34] rounded-lg border border-gray-700/50 p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold text-white">
                  {selectedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                </h4>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {selectedTarefas.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-3">Nenhuma tarefa</p>
                ) : (
                  selectedTarefas.map(tarefa => (
                    <div
                      key={tarefa._id}
                      className="p-2 bg-[#1e2228] rounded border border-gray-700/50 hover:border-[#4CAF50]/50 transition cursor-pointer group"
                      onClick={() => router.push('/dashboard/tarefas')}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <h5 className="text-xs text-white font-medium flex-1 truncate group-hover:text-[#4CAF50] transition">{tarefa.titulo}</h5>
                        <div className={`w-1 h-1 rounded-full ${getPrioridadeColor(tarefa.prioridade)} ml-1 flex-shrink-0`} />
                      </div>
                      <span className={`inline-block px-1.5 py-0.5 text-[10px] rounded ${getStatusColor(tarefa.status)} text-white`}>
                        {tarefa.status === 'todo' ? 'A Fazer' : 
                         tarefa.status === 'in-progress' ? 'Em Andamento' :
                         tarefa.status === 'review' ? 'Revisão' : 'Concluída'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Total de Recursos */}
          <div className="bg-[#282c34] rounded-lg border border-gray-700/50 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-400">Total de Recursos</p>
              <svg className="w-4 h-4 text-[#4CAF50]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-white">{totalItems.toLocaleString('pt-BR')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
