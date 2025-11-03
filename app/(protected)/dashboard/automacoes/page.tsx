'use client';

import { useEffect, useState } from 'react';

interface User {
  username: string;
  fullName: string;
  funcao: string;
  isAdmin: boolean;
  nivelAcesso?: string;
}

interface AutomacaoType {
  _id: string;
  ip: string;
  equipamento: string;
  porta?: string;
  categoria?: string;
  faixa?: {
    _id: string;
    tipo: 'faixa' | 'vlan';
    nome: string;
    faixa?: string;
    vlanNome?: string;
    vlanId?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface CategoriaType {
  _id: string;
  nome: string;
}

interface IPDisponivel {
  _id: string;
  tipo: 'faixa' | 'vlan';
  nome: string;
  faixa?: string;
  vlanNome?: string;
  vlanId?: string;
}

export default function AutomacoesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [automacoes, setAutomacoes] = useState<AutomacaoType[]>([]);
  const [categorias, setCategorias] = useState<CategoriaType[]>([]);
  const [ipsDisponiveis, setIPsDisponiveis] = useState<IPDisponivel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAutomacao, setEditingAutomacao] = useState<AutomacaoType | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [formData, setFormData] = useState({
    ip: '',
    equipamento: '',
    porta: '',
    categoria: '',
    faixa: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUser();
    fetchAutomacoes();
    fetchCategorias();
    fetchIPsDisponiveis();
  }, [page]);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/users/profile');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const fetchAutomacoes = async () => {
    try {
      const response = await fetch(`/api/automacoes?page=${page}`);
      if (response.ok) {
        const data = await response.json();
        setAutomacoes(data.automacoes);
        setTotalPages(data.pagination.pages);
      }
    } catch (error) {
      console.error('Error fetching automacoes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategorias = async () => {
    try {
      const response = await fetch('/api/categorias');
      if (response.ok) {
        const data = await response.json();
        setCategorias(data.categorias || []);
      }
    } catch (error) {
      console.error('Error fetching categorias:', error);
    }
  };

  const fetchIPsDisponiveis = async () => {
    try {
      const response = await fetch('/api/ips?page=1');
      if (response.ok) {
        const data = await response.json();
        setIPsDisponiveis(data.ips);
      }
    } catch (error) {
      console.error('Error fetching IPs disponíveis:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const url = editingAutomacao ? `/api/automacoes/${editingAutomacao._id}` : '/api/automacoes';
      const method = editingAutomacao ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || `Erro ao ${editingAutomacao ? 'atualizar' : 'criar'} automação`);
        return;
      }

      setFormData({
        ip: '',
        equipamento: '',
        porta: '',
        categoria: '',
        faixa: '',
      });
      setShowModal(false);
      setEditingAutomacao(null);
      fetchAutomacoes();
    } catch (error) {
      setError('Erro ao conectar com o servidor');
    }
  };

  const handleEdit = (automacao: AutomacaoType) => {
    setEditingAutomacao(automacao);
    setFormData({
      ip: automacao.ip,
      equipamento: automacao.equipamento,
      porta: automacao.porta || '',
      categoria: automacao.categoria || '',
      faixa: automacao.faixa?._id || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta automação?')) {
      return;
    }

    try {
      const response = await fetch(`/api/automacoes/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchAutomacoes();
      }
    } catch (error) {
      console.error('Error deleting automacao:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return <div className="text-gray-400">Carregando...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Automações</h1>
        {user?.nivelAcesso !== 'suporte' && (
          <button
            onClick={() => {
              setEditingAutomacao(null);
              setFormData({
                ip: '',
                equipamento: '',
                porta: '',
                categoria: '',
                faixa: '',
              });
              setShowModal(true);
            }}
            className="bg-[#4CAF50] hover:bg-[#45a049] text-white font-semibold px-6 py-3 rounded-lg transition duration-200 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nova Automação
          </button>
        )}
      </div>

      <div className="bg-[#282c34] rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-600">
          <thead className="bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                IP
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Equipamento
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Porta
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Categoria
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Faixa IP
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Criado em
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-[#282c34] divide-y divide-gray-600">
            {automacoes.map((automacao) => (
              <tr key={automacao._id} className="hover:bg-gray-700/50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-white">{automacao.ip}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-300">{automacao.equipamento}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-300">{automacao.porta || '-'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-300">{automacao.categoria || '-'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {automacao.faixa ? (
                    <div className="text-sm text-gray-300">
                      {automacao.faixa.nome}
                      {automacao.faixa.tipo === 'faixa' && automacao.faixa.faixa && ` (${automacao.faixa.faixa})`}
                      {automacao.faixa.tipo === 'vlan' && automacao.faixa.vlanId && ` (${automacao.faixa.vlanId})`}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  {formatDate(automacao.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {user?.nivelAcesso !== 'suporte' && (
                    <button
                      onClick={() => handleEdit(automacao)}
                      className="text-blue-400 hover:text-blue-300 mr-4"
                    >
                      Editar
                    </button>
                  )}
                  {(user?.isAdmin || user?.nivelAcesso === 'admin') && (
                    <button
                      onClick={() => handleDelete(automacao._id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      Excluir
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={() => setPage(page - 1)}
          disabled={page === 1}
          className="px-4 py-2 bg-[#282c34] text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Anterior
        </button>
        <span className="text-white">
          Página {page} de {totalPages}
        </span>
        <button
          onClick={() => setPage(page + 1)}
          disabled={page === totalPages}
          className="px-4 py-2 bg-[#282c34] text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Próxima
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/5 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#282c34]/98 backdrop-blur-xl rounded-lg shadow-md p-8 max-w-2xl w-full mx-4 border border-gray-700/50">
            <h2 className="text-3xl font-bold text-white mb-8">{editingAutomacao ? 'Editar Automação' : 'Nova Automação'}</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-500/20 border border-red-500 text-red-500 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  IP
                </label>
                <input
                  type="text"
                  value={formData.ip}
                  onChange={(e) => setFormData({ ...formData, ip: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-[#363f4a] text-white placeholder-gray-400 focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent"
                  placeholder="Ex: 192.168.1.100"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Equipamento
                </label>
                <input
                  type="text"
                  value={formData.equipamento}
                  onChange={(e) => setFormData({ ...formData, equipamento: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-[#363f4a] text-white placeholder-gray-400 focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent"
                  placeholder="Nome do equipamento"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Porta (opcional)
                </label>
                <input
                  type="text"
                  value={formData.porta}
                  onChange={(e) => setFormData({ ...formData, porta: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-[#363f4a] text-white placeholder-gray-400 focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent"
                  placeholder="Ex: 8080"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Categoria (opcional)
                </label>
                <select
                  value={formData.categoria}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-[#363f4a] text-white focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent"
                >
                  <option value="">Nenhuma</option>
                  {categorias.map((categoria) => (
                    <option key={categoria._id} value={categoria.nome}>
                      {categoria.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Faixa IP (opcional)
                </label>
                <select
                  value={formData.faixa}
                  onChange={(e) => setFormData({ ...formData, faixa: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-[#363f4a] text-white focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent"
                >
                  <option value="">Nenhum</option>
                  {ipsDisponiveis.map((ip) => (
                    <option key={ip._id} value={ip._id}>
                      {ip.nome} {ip.tipo === 'faixa' && ip.faixa && `(${ip.faixa})`} {ip.tipo === 'vlan' && ip.vlanId && `(${ip.vlanId})`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingAutomacao(null);
                    setFormData({
                      ip: '',
                      equipamento: '',
                      porta: '',
                      categoria: '',
                      faixa: '',
                    });
                    setError('');
                  }}
                  className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#4CAF50] hover:bg-[#45a049] text-white font-semibold py-2 rounded-lg transition"
                >
                  {editingAutomacao ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

