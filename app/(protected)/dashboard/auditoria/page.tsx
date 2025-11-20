'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface LogAuditoria {
  _id: string;
  usuario: string;
  acao: string;
  entidade: string;
  entidadeId: string;
  descricao: string;
  dadosAntigos?: any;
  dadosNovos?: any;
  ip: string;
  userAgent: string;
  nivelAcesso: string;
  sensivel: boolean;
  createdAt: string;
}

interface User {
  username: string;
  fullName: string;
  funcao: string;
  isAdmin: boolean;
  nivelAcesso: string;
}

const ACOES = ['criar', 'editar', 'excluir', 'visualizar', 'exportar', 'download'];
const ENTIDADES = ['tarefa', 'usuario', 'email', 'senha', 'pc', 'impressora', 'servidor', 'documento', 'gpo', 'ip'];

export default function AuditoriaPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [logs, setLogs] = useState<LogAuditoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filtros
  const [filtroUsuario, setFiltroUsuario] = useState('');
  const [filtroAcao, setFiltroAcao] = useState('');
  const [filtroEntidade, setFiltroEntidade] = useState('');
  const [filtroSensivel, setFiltroSensivel] = useState('');
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (user) {
      fetchLogs();
    }
  }, [user, page, filtroUsuario, filtroAcao, filtroEntidade, filtroSensivel, filtroDataInicio, filtroDataFim]);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/users/profile');
      if (!response.ok) {
        router.push('/');
        return;
      }
      const data = await response.json();
      setUser(data.user);

      // Verificar se é admin
      if (data.user.nivelAcesso !== 'admin' && !data.user.isAdmin) {
        router.push('/dashboard');
        return;
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      router.push('/');
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      });

      if (filtroUsuario) params.append('usuario', filtroUsuario);
      if (filtroAcao) params.append('acao', filtroAcao);
      if (filtroEntidade) params.append('entidade', filtroEntidade);
      if (filtroSensivel) params.append('sensivel', filtroSensivel);
      if (filtroDataInicio) params.append('dataInicio', filtroDataInicio);
      if (filtroDataFim) params.append('dataFim', filtroDataFim);

      const response = await fetch(`/api/auditoria?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();

      if (filtroUsuario) params.append('usuario', filtroUsuario);
      if (filtroAcao) params.append('acao', filtroAcao);
      if (filtroEntidade) params.append('entidade', filtroEntidade);
      if (filtroSensivel) params.append('sensivel', filtroSensivel);
      if (filtroDataInicio) params.append('dataInicio', filtroDataInicio);
      if (filtroDataFim) params.append('dataFim', filtroDataFim);

      const response = await fetch(`/api/auditoria/export?${params.toString()}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `auditoria_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting logs:', error);
    } finally {
      setExporting(false);
    }
  };

  const limparFiltros = () => {
    setFiltroUsuario('');
    setFiltroAcao('');
    setFiltroEntidade('');
    setFiltroSensivel('');
    setFiltroDataInicio('');
    setFiltroDataFim('');
    setPage(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getAcaoColor = (acao: string) => {
    switch (acao.toLowerCase()) {
      case 'criar':
        return 'bg-green-500/20 text-green-400';
      case 'editar':
        return 'bg-blue-500/20 text-blue-400';
      case 'excluir':
        return 'bg-red-500/20 text-red-400';
      case 'visualizar':
        return 'bg-gray-500/20 text-gray-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#1e2228] flex items-center justify-center">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1e2228] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#282c34] to-[#1e2228] rounded-lg border border-gray-700/50 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Auditoria e Log de Atividades</h1>
              <p className="text-gray-400">Registro completo de ações dos usuários no sistema</p>
            </div>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="bg-[#4CAF50] hover:bg-[#45a049] text-white px-6 py-3 rounded-lg transition font-medium flex items-center gap-2 disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {exporting ? 'Exportando...' : 'Exportar CSV'}
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-[#282c34] rounded-lg border border-gray-700/50 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Usuário</label>
              <input
                type="text"
                value={filtroUsuario}
                onChange={(e) => setFiltroUsuario(e.target.value)}
                placeholder="Filtrar por usuário"
                className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#4CAF50]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Ação</label>
              <select
                value={filtroAcao}
                onChange={(e) => setFiltroAcao(e.target.value)}
                className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#4CAF50]"
              >
                <option value="">Todas</option>
                {ACOES.map(acao => (
                  <option key={acao} value={acao}>{acao.charAt(0).toUpperCase() + acao.slice(1)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Entidade</label>
              <select
                value={filtroEntidade}
                onChange={(e) => setFiltroEntidade(e.target.value)}
                className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#4CAF50]"
              >
                <option value="">Todas</option>
                {ENTIDADES.map(entidade => (
                  <option key={entidade} value={entidade}>{entidade.charAt(0).toUpperCase() + entidade.slice(1)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Dados Sensíveis</label>
              <select
                value={filtroSensivel}
                onChange={(e) => setFiltroSensivel(e.target.value)}
                className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#4CAF50]"
              >
                <option value="">Todos</option>
                <option value="true">Apenas sensíveis</option>
                <option value="false">Não sensíveis</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Data Início</label>
              <input
                type="date"
                value={filtroDataInicio}
                onChange={(e) => setFiltroDataInicio(e.target.value)}
                className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#4CAF50]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Data Fim</label>
              <input
                type="date"
                value={filtroDataFim}
                onChange={(e) => setFiltroDataFim(e.target.value)}
                className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#4CAF50]"
              />
            </div>

            <div className="flex items-end gap-2">
              <button
                onClick={limparFiltros}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
              >
                Limpar
              </button>
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#282c34] rounded-lg border border-gray-700/50 p-4">
            <p className="text-gray-400 text-sm mb-1">Total de Registros</p>
            <p className="text-2xl font-bold text-white">{total.toLocaleString('pt-BR')}</p>
          </div>
          <div className="bg-[#282c34] rounded-lg border border-gray-700/50 p-4">
            <p className="text-gray-400 text-sm mb-1">Ações Sensíveis</p>
            <p className="text-2xl font-bold text-red-400">
              {logs.filter(l => l.sensivel).length}
            </p>
          </div>
          <div className="bg-[#282c34] rounded-lg border border-gray-700/50 p-4">
            <p className="text-gray-400 text-sm mb-1">Usuários Únicos</p>
            <p className="text-2xl font-bold text-blue-400">
              {new Set(logs.map(l => l.usuario)).size}
            </p>
          </div>
          <div className="bg-[#282c34] rounded-lg border border-gray-700/50 p-4">
            <p className="text-gray-400 text-sm mb-1">Página</p>
            <p className="text-2xl font-bold text-[#4CAF50]">
              {page} / {totalPages}
            </p>
          </div>
        </div>

        {/* Tabela de Logs */}
        <div className="bg-[#282c34] rounded-lg border border-gray-700/50 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Carregando logs...</div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-gray-400">Nenhum log encontrado</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#1e2228] border-b border-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Data/Hora</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Usuário</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Ação</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Entidade</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Descrição</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">IP</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Sensível</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {logs.map((log) => (
                    <tr key={log._id} className="hover:bg-gray-800/50 transition">
                      <td className="px-4 py-3 text-sm text-gray-300 whitespace-nowrap">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-sm text-white">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-[#4CAF50]/20 flex items-center justify-center">
                            <span className="text-[#4CAF50] text-xs font-bold">
                              {log.usuario.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span>{log.usuario}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getAcaoColor(log.acao)}`}>
                          {log.acao}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300">
                        {log.entidade}
                        {log.entidadeId && (
                          <span className="text-gray-500 ml-1">({log.entidadeId.substring(0, 8)}...)</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300 max-w-md truncate">
                        {log.descricao}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">
                        {log.ip || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {log.sensivel ? (
                          <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs font-medium">
                            Sim
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded text-xs">
                            Não
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="bg-[#1e2228] px-4 py-3 border-t border-gray-700 flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Mostrando {((page - 1) * 50) + 1} a {Math.min(page * 50, total)} de {total} registros
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

