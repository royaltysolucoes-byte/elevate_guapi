'use client';

import { useEffect, useState, useRef } from 'react';

interface User {
  username: string;
  fullName: string;
  funcao: string;
  isAdmin: boolean;
  nivelAcesso?: string;
}

interface CelularType {
  _id: string;
  numero: string;
  colaborador: string;
  categoria: {
    _id: string;
    nome: string;
  };
  modelo: {
    _id: string;
    nome: string;
    marca: {
      _id: string;
      nome: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

interface CategoriaType {
  _id: string;
  nome: string;
}

interface ModeloDisponivel {
  _id: string;
  nome: string;
  marca: {
    _id: string;
    nome: string;
  };
}

export default function CelularesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [celulares, setCelulares] = useState<CelularType[]>([]);
  const [categorias, setCategorias] = useState<CategoriaType[]>([]);
  const [modelosDisponiveis, setModelosDisponiveis] = useState<ModeloDisponivel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCelular, setEditingCelular] = useState<CelularType | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    numero: '',
    colaborador: '',
    categoria: '',
    modelo: '',
  });
  const [error, setError] = useState('');
  const isFirstRender = useRef(true);

  useEffect(() => {
    fetchUser();
    fetchCategorias();
    fetchModelosDisponiveis();
  }, []);

  useEffect(() => {
    fetchCelulares(true);
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
        fetchCelulares(false);
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

  const fetchCelulares = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const searchParam = searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : '';
      const response = await fetch(`/api/celulares?page=${page}${searchParam}`);
      const data = await response.json();
      if (response.ok) {
        const celularesArray = Array.isArray(data.celulares) ? data.celulares : [];
        setCelulares(celularesArray);
        setTotalPages(data.pagination?.pages || 1);
      } else {
        setCelulares([]);
      }
    } catch (error) {
      console.error('Error fetching celulares:', error);
      setCelulares([]);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (page !== 1) {
      setPage(1);
    } else {
      fetchCelulares(true);
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

  const fetchModelosDisponiveis = async () => {
    try {
      const response = await fetch('/api/modelos');
      const data = await response.json();
      if (response.ok) {
        const modelosArray = Array.isArray(data.modelos) ? data.modelos : [];
        setModelosDisponiveis(modelosArray);
      } else {
        setModelosDisponiveis([]);
      }
    } catch (error) {
      console.error('Error fetching modelos disponíveis:', error);
      setModelosDisponiveis([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const url = editingCelular ? `/api/celulares/${editingCelular._id}` : '/api/celulares';
      const method = editingCelular ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || `Erro ao ${editingCelular ? 'atualizar' : 'criar'} celular`);
        return;
      }

      setFormData({
        numero: '',
        colaborador: '',
        categoria: '',
        modelo: '',
      });
      setShowModal(false);
      setEditingCelular(null);
      fetchCelulares();
    } catch (error) {
      setError('Erro ao conectar com o servidor');
    }
  };

  const handleEdit = (celular: CelularType) => {
    setEditingCelular(celular);
    setFormData({
      numero: celular.numero,
      colaborador: celular.colaborador,
      categoria: celular.categoria._id,
      modelo: celular.modelo._id,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este celular?')) {
      return;
    }

    try {
      const response = await fetch(`/api/celulares/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchCelulares();
      }
    } catch (error) {
      console.error('Error deleting celular:', error);
    }
  };

  const handleCreate = () => {
    setEditingCelular(null);
    setFormData({
      numero: '',
      colaborador: '',
      categoria: '',
      modelo: '',
    });
    setError('');
    setShowModal(true);
  };

  if (loading && celulares.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#1e2228]">
        <div className="text-gray-400">Carregando...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-white">Celulares</h1>
          {(user?.isAdmin || user?.nivelAcesso === 'admin') && (
            <button
              onClick={handleCreate}
              className="bg-[#4CAF50] hover:bg-[#45a049] text-white px-6 py-3 rounded-lg transition flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Novo Celular
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
              placeholder="Buscar por número ou colaborador..."
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
                  fetchCelulares(true);
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Número</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Colaborador</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Categoria</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Modelo</th>
                  {(user?.isAdmin || user?.nivelAcesso === 'admin') && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Ações</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {celulares.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                      Nenhum celular encontrado
                    </td>
                  </tr>
                ) : (
                  celulares.map((celular) => (
                    <tr key={celular._id} className="hover:bg-gray-700/50">
                      <td className="px-6 py-4 whitespace-nowrap text-white font-medium">{celular.numero}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-300">{celular.colaborador}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-300">{celular.categoria?.nome || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                        {celular.modelo ? `${celular.modelo.marca?.nome || ''} ${celular.modelo.nome}`.trim() : '-'}
                      </td>
                      {(user?.isAdmin || user?.nivelAcesso === 'admin') && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEdit(celular)}
                            className="text-[#4CAF50] hover:text-[#45a049] mr-4"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(celular._id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            Excluir
                          </button>
                        </td>
                      )}
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
                {editingCelular ? 'Editar Celular' : 'Novo Celular'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Número *</label>
                  <input
                    type="text"
                    value={formData.numero}
                    onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                    required
                    className="w-full bg-gray-800 text-white px-4 py-2.5 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent"
                    placeholder="Ex: (11) 98765-4321"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Colaborador *</label>
                  <input
                    type="text"
                    value={formData.colaborador}
                    onChange={(e) => setFormData({ ...formData, colaborador: e.target.value })}
                    required
                    className="w-full bg-gray-800 text-white px-4 py-2.5 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent"
                    placeholder="Nome do colaborador"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Categoria *</label>
                  <select
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    required
                    className="w-full bg-gray-800 text-white px-4 py-2.5 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent"
                  >
                    <option value="">Selecione uma categoria</option>
                    {categorias.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Modelo *</label>
                  <select
                    value={formData.modelo}
                    onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                    required
                    className="w-full bg-gray-800 text-white px-4 py-2.5 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent"
                  >
                    <option value="">Selecione um modelo</option>
                    {modelosDisponiveis.map((mod) => (
                      <option key={mod._id} value={mod._id}>
                        {mod.marca?.nome || ''} {mod.nome}
                      </option>
                    ))}
                  </select>
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
                      setEditingCelular(null);
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
                    {editingCelular ? 'Atualizar' : 'Criar'}
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

