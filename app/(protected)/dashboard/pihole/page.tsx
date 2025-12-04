'use client';

import { useEffect, useState, useRef } from 'react';

interface User {
  username: string;
  fullName: string;
  funcao: string;
  isAdmin: boolean;
  nivelAcesso?: string;
}

interface PiholeType {
  _id: string;
  nome: string;
  anydesk: string;
  temDnsPihole: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function PiholePage() {
  const [user, setUser] = useState<User | null>(null);
  const [piholes, setPiholes] = useState<PiholeType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPihole, setEditingPihole] = useState<PiholeType | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    nome: '',
    anydesk: '',
    temDnsPihole: true,
  });
  const [error, setError] = useState('');
  const isFirstRender = useRef(true);

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    fetchPiholes(true);
  }, [page]);

  // Debounce para busca enquanto digita
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const timeoutId = setTimeout(() => {
      if (page !== 1) {
        setPage(1);
      } else {
        fetchPiholes(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

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

  const fetchPiholes = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const searchParam = searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : '';
      const response = await fetch(`/api/pihole?page=${page}${searchParam}`);
      const data = await response.json();
      if (response.ok) {
        const piholesArray = Array.isArray(data.piholes) ? data.piholes : [];
        setPiholes(piholesArray);
        setTotalPages(data.pagination?.pages || 1);
      } else {
        setPiholes([]);
      }
    } catch (error) {
      console.error('Error fetching piholes:', error);
      setPiholes([]);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (page !== 1) {
      setPage(1);
    } else {
      fetchPiholes(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const url = editingPihole ? `/api/pihole/${editingPihole._id}` : '/api/pihole';
      const method = editingPihole ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || `Erro ao ${editingPihole ? 'atualizar' : 'criar'} máquina Pi-hole`);
        return;
      }

      setFormData({
        nome: '',
        anydesk: '',
        temDnsPihole: true,
      });
      setShowModal(false);
      setEditingPihole(null);
      fetchPiholes();
    } catch (error) {
      setError('Erro ao conectar com o servidor');
    }
  };

  const handleEdit = (pihole: PiholeType) => {
    setEditingPihole(pihole);
    setFormData({
      nome: pihole.nome,
      anydesk: pihole.anydesk,
      temDnsPihole: pihole.temDnsPihole,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta máquina Pi-hole?')) {
      return;
    }

    try {
      const response = await fetch(`/api/pihole/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchPiholes();
      }
    } catch (error) {
      console.error('Error deleting pihole:', error);
    }
  };

  const handleCreate = () => {
    setEditingPihole(null);
    setFormData({
      nome: '',
      anydesk: '',
      temDnsPihole: true,
    });
    setError('');
    setShowModal(true);
  };

  if (loading && piholes.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#1e2228]">
        <div className="text-gray-400">Carregando...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-white">Pi-hole</h1>
        {user?.nivelAcesso !== 'suporte' && (
          <button
            onClick={handleCreate}
            className="bg-[#4CAF50] hover:bg-[#45a049] text-white px-6 py-3 rounded-lg transition flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nova Máquina
          </button>
        )}
      </div>

      {/* Search */}
      <div className="bg-[#282c34] rounded-lg p-4 mb-6 border border-gray-700/50">
        <form onSubmit={handleSearch} className="flex gap-3">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome da máquina ou ID Anydesk..."
            className="flex-1 bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#4CAF50]"
          />
          <button
            type="submit"
            className="bg-[#4CAF50] hover:bg-[#45a049] text-white px-6 py-2 rounded-lg transition"
          >
            Buscar
          </button>
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                fetchPiholes(true);
              }}
              className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition"
            >
              Limpar
            </button>
          )}
        </form>
      </div>

      {/* Table */}
      <div className="bg-[#282c34] rounded-lg border border-gray-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Nome da Máquina</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Anydesk</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">DNS Pi-hole</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {piholes.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                    Nenhuma máquina encontrada
                  </td>
                </tr>
              ) : (
                piholes.map((pihole) => (
                  <tr key={pihole._id} className="hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap text-white font-medium">{pihole.nome}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-300">{pihole.anydesk}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {pihole.temDnsPihole ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Sim
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400 border border-gray-500/30">
                          Não
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-3">
                        {user?.nivelAcesso !== 'suporte' && (
                          <button
                            onClick={() => handleEdit(pihole)}
                            className="text-[#4CAF50] hover:text-[#45a049]"
                          >
                            Editar
                          </button>
                        )}
                        {(user?.isAdmin || user?.nivelAcesso === 'admin') && (
                          <button
                            onClick={() => handleDelete(pihole._id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            Excluir
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-700/50 flex items-center justify-between">
            <div className="text-sm text-gray-400">
              Página {page} de {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-gray-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 bg-gray-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#282c34] rounded-lg border border-gray-700/50 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-white mb-6">
                {editingPihole ? 'Editar Máquina Pi-hole' : 'Nova Máquina Pi-hole'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Nome da Máquina *</label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    required
                    className="w-full bg-gray-800 text-white px-4 py-2.5 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent"
                    placeholder="Ex: PC-ADMIN-01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">ID Anydesk *</label>
                  <input
                    type="text"
                    value={formData.anydesk}
                    onChange={(e) => setFormData({ ...formData, anydesk: e.target.value })}
                    required
                    className="w-full bg-gray-800 text-white px-4 py-2.5 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent"
                    placeholder="Ex: 123 456 789"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.temDnsPihole}
                      onChange={(e) => setFormData({ ...formData, temDnsPihole: e.target.checked })}
                      className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-[#4CAF50] focus:ring-2 focus:ring-[#4CAF50]"
                    />
                    <span className="text-sm font-medium text-gray-300">Tem DNS Pi-hole configurado</span>
                  </label>
                </div>

                {error && (
                  <div className="bg-gray-800/50 text-gray-300 px-4 py-3 rounded-lg text-sm border border-gray-700/50">
                    {error}
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingPihole(null);
                      setError('');
                    }}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-[#4CAF50] hover:bg-[#45a049] text-white px-6 py-3 rounded-lg transition"
                  >
                    {editingPihole ? 'Atualizar' : 'Criar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

