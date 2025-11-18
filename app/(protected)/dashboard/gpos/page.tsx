'use client';

import { useEffect, useState } from 'react';

interface User {
  username: string;
  fullName: string;
  funcao: string;
  isAdmin: boolean;
  nivelAcesso?: string;
}

interface GPOType {
  _id: string;
  nome: string;
  ativa: boolean;
  servidor: {
    _id: string;
    nome: string;
    ip: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface ServidorDisponivel {
  _id: string;
  nome: string;
  ip: string;
}

export default function GPOPage() {
  const [user, setUser] = useState<User | null>(null);
  const [gpos, setGpos] = useState<GPOType[]>([]);
  const [servidoresDisponiveis, setServidoresDisponiveis] = useState<ServidorDisponivel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGPO, setEditingGPO] = useState<GPOType | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [formData, setFormData] = useState({
    nome: '',
    ativa: true,
    servidor: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUser();
    fetchGPOs();
    fetchServidoresDisponiveis();
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

  const fetchGPOs = async () => {
    try {
      const response = await fetch(`/api/gpos?page=${page}`);
      if (response.ok) {
        const data = await response.json();
        setGpos(data.gpos);
        setTotalPages(data.pagination.pages);
      }
    } catch (error) {
      console.error('Error fetching gpos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchServidoresDisponiveis = async () => {
    try {
      // Buscar todos os servidores fazendo requisições paginadas
      let allServidores: ServidorDisponivel[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await fetch(`/api/servidores?page=${page}`);
        if (response.ok) {
          const data = await response.json();
          allServidores = [...allServidores, ...data.servidores];
          hasMore = page < data.pagination.pages;
          page++;
        } else {
          hasMore = false;
        }
      }

      setServidoresDisponiveis(allServidores);
    } catch (error) {
      console.error('Error fetching servidores:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const url = editingGPO ? `/api/gpos/${editingGPO._id}` : '/api/gpos';
      const method = editingGPO ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || `Erro ao ${editingGPO ? 'atualizar' : 'criar'} GPO`);
        return;
      }

      setFormData({
        nome: '',
        ativa: true,
        servidor: '',
      });
      setShowModal(false);
      setEditingGPO(null);
      fetchGPOs();
    } catch (error) {
      setError('Erro ao conectar com o servidor');
    }
  };

  const handleEdit = (gpo: GPOType) => {
    setEditingGPO(gpo);
    setFormData({
      nome: gpo.nome,
      ativa: gpo.ativa,
      servidor: gpo.servidor._id,
    });
    setShowModal(true);
  };

  const handleToggleStatus = async (gpo: GPOType) => {
    const newStatus = !gpo.ativa;
    
    try {
      const response = await fetch(`/api/gpos/${gpo._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...gpo, ativa: newStatus }),
      });

      if (response.ok) {
        fetchGPOs();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta GPO?')) {
      return;
    }

    try {
      const response = await fetch(`/api/gpos/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchGPOs();
      }
    } catch (error) {
      console.error('Error deleting gpo:', error);
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
        <h1 className="text-3xl font-bold text-white">GPOs</h1>
        {user?.nivelAcesso !== 'suporte' && (
          <button
            onClick={() => {
              setEditingGPO(null);
              setFormData({
                nome: '',
                ativa: true,
                servidor: '',
              });
              setShowModal(true);
            }}
            className="bg-[#4CAF50] hover:bg-[#45a049] text-white font-semibold px-6 py-3 rounded-lg transition duration-200 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nova GPO
          </button>
        )}
      </div>

      <div className="bg-[#282c34] rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-600">
          <thead className="bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Nome
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Servidor
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
            {gpos.map((gpo) => (
              <tr key={gpo._id} className="hover:bg-gray-700/50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-white">{gpo.nome}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-2 ${gpo.ativa ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                    <div className="text-sm text-gray-300">{gpo.ativa ? 'Ativa' : 'Inativa'}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-300">{gpo.servidor.nome}</div>
                  <div className="text-xs text-gray-500">{gpo.servidor.ip}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  {formatDate(gpo.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-3">
                    {user?.nivelAcesso !== 'suporte' && (
                      <>
                        <button
                          onClick={() => handleToggleStatus(gpo)}
                          className="p-2 rounded-lg hover:bg-gray-700 transition"
                          title={gpo.ativa ? 'Desativar' : 'Ativar'}
                        >
                          <div className={`w-3 h-3 rounded-full ${gpo.ativa ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                        </button>
                        <button
                          onClick={() => handleEdit(gpo)}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          Editar
                        </button>
                      </>
                    )}
                    {(user?.isAdmin || user?.nivelAcesso === 'admin') && (
                      <button
                        onClick={() => handleDelete(gpo._id)}
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
            <h2 className="text-3xl font-bold text-white mb-8">{editingGPO ? 'Editar GPO' : 'Nova GPO'}</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-500/20 border border-red-500 text-red-500 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nome
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-[#363f4a] text-white placeholder-gray-400 focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent"
                  placeholder="Nome da GPO"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={formData.ativa ? 'true' : 'false'}
                  onChange={(e) => setFormData({ ...formData, ativa: e.target.value === 'true' })}
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-[#363f4a] text-white focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent"
                  required
                >
                  <option value="true">Ativa</option>
                  <option value="false">Inativa</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Servidor
                </label>
                <select
                  value={formData.servidor}
                  onChange={(e) => setFormData({ ...formData, servidor: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-[#363f4a] text-white focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent"
                  required
                >
                  <option value="">Selecione um servidor</option>
                  {servidoresDisponiveis.map((servidor) => (
                    <option key={servidor._id} value={servidor._id}>
                      {servidor.nome} ({servidor.ip})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingGPO(null);
                    setFormData({
                      nome: '',
                      ativa: true,
                      servidor: '',
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
                  {editingGPO ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

