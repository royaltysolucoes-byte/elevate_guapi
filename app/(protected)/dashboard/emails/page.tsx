'use client';

import { useEffect, useState } from 'react';

interface EmailType {
  _id: string;
  email: string;
  colaborador: string;
  nome: string;
  senha: string;
  createdAt: string;
  updatedAt: string;
}

export default function EmailsPage() {
  const [emails, setEmails] = useState<EmailType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEmail, setEditingEmail] = useState<EmailType | null>(null);
  const [showPassword, setShowPassword] = useState<{ [key: string]: boolean }>({});
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    colaborador: '',
    nome: '',
    senha: '',
    confirmarSenha: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEmails();
  }, [page]);

  const fetchEmails = async () => {
    try {
      const response = await fetch(`/api/emails?page=${page}`);
      if (response.ok) {
        const data = await response.json();
        setEmails(data.emails);
        setTotalPages(data.pagination.pages);
      }
    } catch (error) {
      console.error('Error fetching emails:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate password confirmation when creating new email
    if (!editingEmail && formData.senha !== formData.confirmarSenha) {
      setError('As senhas não coincidem');
      return;
    }

    try {
      const url = editingEmail ? `/api/emails/${editingEmail._id}` : '/api/emails';
      const method = editingEmail ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || `Erro ao ${editingEmail ? 'atualizar' : 'criar'} email`);
        return;
      }

      setFormData({
        email: '',
        colaborador: '',
        nome: '',
        senha: '',
        confirmarSenha: '',
      });
      setShowModal(false);
      setEditingEmail(null);
      fetchEmails();
    } catch (error) {
      setError('Erro ao conectar com o servidor');
    }
  };

  const handleEdit = (email: EmailType) => {
    setEditingEmail(email);
    setFormData({
      email: email.email,
      colaborador: email.colaborador,
      nome: email.nome,
      senha: '', // Don't populate password for security
      confirmarSenha: '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este email?')) {
      return;
    }

    try {
      const response = await fetch(`/api/emails/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchEmails();
      }
    } catch (error) {
      console.error('Error deleting email:', error);
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

  const toggleShowPassword = (id: string) => {
    setShowPassword(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const getPasswordDisplay = (email: EmailType) => {
    if (showPassword[email._id]) {
      return email.senha; // This will show the hashed password, not the plain text
    }
    return '••••••••';
  };

  if (loading) {
    return <div className="text-gray-400">Carregando...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Gestão de E-mail</h1>
        <button
          onClick={() => {
            setEditingEmail(null);
            setFormData({
              email: '',
              colaborador: '',
              nome: '',
              senha: '',
            });
            setShowModal(true);
          }}
          className="bg-[#4CAF50] hover:bg-[#45a049] text-white font-semibold px-6 py-3 rounded-lg transition duration-200 flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Novo Email
        </button>
      </div>

      <div className="bg-[#282c34] rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-600">
          <thead className="bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                E-mail
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Colaborador
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Nome
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Senha
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
            {emails.map((email) => (
              <tr key={email._id} className="hover:bg-gray-700/50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-white">{email.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-300">{email.colaborador}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-300">{email.nome}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="text-sm text-gray-300">{getPasswordDisplay(email)}</span>
                    <button
                      onClick={() => toggleShowPassword(email._id)}
                      className="ml-2 text-[#4CAF50] hover:text-[#45a049] transition"
                      title={showPassword[email._id] ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {showPassword[email._id] ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        )}
                      </svg>
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  {formatDate(email.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEdit(email)}
                    className="text-blue-400 hover:text-blue-300 mr-4"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(email._id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    Excluir
                  </button>
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
            <h2 className="text-3xl font-bold text-white mb-8">{editingEmail ? 'Editar Email' : 'Novo Email'}</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-500/20 border border-red-500 text-red-500 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  E-mail
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-[#363f4a] text-white placeholder-gray-400 focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent"
                  placeholder="exemplo@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Colaborador
                </label>
                <input
                  type="text"
                  value={formData.colaborador}
                  onChange={(e) => setFormData({ ...formData, colaborador: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-[#363f4a] text-white placeholder-gray-400 focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent"
                  placeholder="Nome do colaborador"
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
                  placeholder="Nome completo"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {editingEmail ? 'Nova Senha (deixe em branco para manter)' : 'Senha'}
                </label>
                <input
                  type="password"
                  value={formData.senha}
                  onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-[#363f4a] text-white placeholder-gray-400 focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent"
                  placeholder="Digite a senha"
                  required={!editingEmail}
                />
              </div>

              {!editingEmail && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Confirmar Senha
                  </label>
                  <input
                    type="password"
                    value={formData.confirmarSenha}
                    onChange={(e) => setFormData({ ...formData, confirmarSenha: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-[#363f4a] text-white placeholder-gray-400 focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent"
                    placeholder="Confirme a senha"
                    required={!editingEmail}
                  />
                </div>
              )}

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingEmail(null);
                    setFormData({
                      email: '',
                      colaborador: '',
                      nome: '',
                      senha: '',
                      confirmarSenha: '',
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
                  {editingEmail ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

