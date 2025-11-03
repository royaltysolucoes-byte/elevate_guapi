'use client';

import { useEffect, useState } from 'react';

interface User {
  username: string;
  fullName: string;
  funcao: string;
  isAdmin: boolean;
  nivelAcesso?: string;
}

interface ServidorType {
  _id: string;
  ip: string;
  nome: string;
  sistemaOperacional: {
    _id: string;
    nome: string;
  };
  status: 'ativo' | 'inativo';
  servico: {
    _id: string;
    nome: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface SistemaOperacionalDisponivel {
  _id: string;
  nome: string;
}

interface ServicoDisponivel {
  _id: string;
  nome: string;
}

export default function ServidoresPage() {
  const [user, setUser] = useState<User | null>(null);
  const [servidores, setServidores] = useState<ServidorType[]>([]);
  const [sistemasDisponiveis, setSistemasDisponiveis] = useState<SistemaOperacionalDisponivel[]>([]);
  const [servicosDisponiveis, setServicosDisponiveis] = useState<ServicoDisponivel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingServidor, setEditingServidor] = useState<ServidorType | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [formData, setFormData] = useState({
    ip: '',
    nome: '',
    sistemaOperacional: '',
    status: 'ativo',
    servico: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUser();
    fetchServidores();
    fetchSistemasDisponiveis();
    fetchServicosDisponiveis();
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

  const fetchServidores = async () => {
    try {
      const response = await fetch(`/api/servidores?page=${page}`);
      if (response.ok) {
        const data = await response.json();
        setServidores(data.servidores);
        setTotalPages(data.pagination.pages);
      }
    } catch (error) {
      console.error('Error fetching servidores:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSistemasDisponiveis = async () => {
    try {
      const response = await fetch('/api/sistemas-operacionais');
      if (response.ok) {
        const data = await response.json();
        setSistemasDisponiveis(data.sistemas);
      }
    } catch (error) {
      console.error('Error fetching sistemas operacionais:', error);
    }
  };

  const fetchServicosDisponiveis = async () => {
    try {
      const response = await fetch('/api/servicos');
      if (response.ok) {
        const data = await response.json();
        setServicosDisponiveis(data.servicos);
      }
    } catch (error) {
      console.error('Error fetching servicos:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const url = editingServidor ? `/api/servidores/${editingServidor._id}` : '/api/servidores';
      const method = editingServidor ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || `Erro ao ${editingServidor ? 'atualizar' : 'criar'} servidor`);
        return;
      }

      setFormData({
        ip: '',
        nome: '',
        sistemaOperacional: '',
        status: 'ativo',
        servico: '',
      });
      setShowModal(false);
      setEditingServidor(null);
      fetchServidores();
    } catch (error) {
      setError('Erro ao conectar com o servidor');
    }
  };

  const handleEdit = (servidor: ServidorType) => {
    setEditingServidor(servidor);
    setFormData({
      ip: servidor.ip,
      nome: servidor.nome,
      sistemaOperacional: servidor.sistemaOperacional._id,
      status: servidor.status,
      servico: servidor.servico._id,
    });
    setShowModal(true);
  };

  const handleToggleStatus = async (servidor: ServidorType) => {
    const newStatus = servidor.status === 'ativo' ? 'inativo' : 'ativo';
    
    try {
      const response = await fetch(`/api/servidores/${servidor._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...servidor, status: newStatus }),
      });

      if (response.ok) {
        fetchServidores();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este servidor?')) {
      return;
    }

    try {
      const response = await fetch(`/api/servidores/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchServidores();
      }
    } catch (error) {
      console.error('Error deleting servidor:', error);
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
        <h1 className="text-3xl font-bold text-white">Servidores</h1>
        {user?.nivelAcesso !== 'suporte' && (
          <button
            onClick={() => {
              setEditingServidor(null);
              setFormData({
                ip: '',
                nome: '',
                sistemaOperacional: '',
                status: 'ativo',
                servico: '',
              });
              setShowModal(true);
            }}
            className="bg-[#4CAF50] hover:bg-[#45a049] text-white font-semibold px-6 py-3 rounded-lg transition duration-200 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Novo Servidor
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
                Nome
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Sistema Operacional
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Serviço
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
            {servidores.map((servidor) => (
              <tr key={servidor._id} className="hover:bg-gray-700/50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-white">{servidor.ip}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-300">{servidor.nome}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-300">{servidor.sistemaOperacional.nome}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-2 ${servidor.status === 'ativo' ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                    <div className="text-sm text-gray-300 capitalize">{servidor.status}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-300">{servidor.servico.nome}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  {formatDate(servidor.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-3">
                    {user?.nivelAcesso !== 'suporte' && (
                      <>
                        <button
                          onClick={() => handleToggleStatus(servidor)}
                          className="p-2 rounded-lg hover:bg-gray-700 transition"
                          title={servidor.status === 'ativo' ? 'Desativar' : 'Ativar'}
                        >
                          <div className={`w-3 h-3 rounded-full ${servidor.status === 'ativo' ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                        </button>
                        <button
                          onClick={() => handleEdit(servidor)}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          Editar
                        </button>
                      </>
                    )}
                    {(user?.isAdmin || user?.nivelAcesso === 'admin') && (
                      <button
                        onClick={() => handleDelete(servidor._id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        Excluir
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      <div className="mt-6 flex items-center justify-between">
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
            <h2 className="text-3xl font-bold text-white mb-8">{editingServidor ? 'Editar Servidor' : 'Novo Servidor'}</h2>

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
                  Nome
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-[#363f4a] text-white placeholder-gray-400 focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent"
                  placeholder="Nome do servidor"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Sistema Operacional
                </label>
                <select
                  value={formData.sistemaOperacional}
                  onChange={(e) => setFormData({ ...formData, sistemaOperacional: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-[#363f4a] text-white focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent"
                  required
                >
                  <option value="">Selecione um sistema operacional</option>
                  {sistemasDisponiveis.map((sistema) => (
                    <option key={sistema._id} value={sistema._id}>
                      {sistema.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-[#363f4a] text-white focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent"
                  required
                >
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Serviço
                </label>
                <select
                  value={formData.servico}
                  onChange={(e) => setFormData({ ...formData, servico: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-[#363f4a] text-white focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent"
                  required
                >
                  <option value="">Selecione um serviço</option>
                  {servicosDisponiveis.map((servico) => (
                    <option key={servico._id} value={servico._id}>
                      {servico.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingServidor(null);
                    setFormData({
                      ip: '',
                      nome: '',
                      sistemaOperacional: '',
                      status: 'ativo',
                      servico: '',
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
                  {editingServidor ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
