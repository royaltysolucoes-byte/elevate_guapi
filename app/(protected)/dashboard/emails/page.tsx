'use client';

import { useEffect, useState, useRef } from 'react';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    colaborador: '',
    nome: '',
    senha: '',
    confirmarSenha: '',
  });
  const [error, setError] = useState('');
  const isFirstRender = useRef(true);
  const [showMigrateModal, setShowMigrateModal] = useState(false);
  const [oldKey, setOldKey] = useState('');
  const [migrating, setMigrating] = useState(false);
  const [migrateResult, setMigrateResult] = useState<{ success: boolean; message: string; details?: string[] } | null>(null);

  useEffect(() => {
    fetchEmails(true); // Mostra loading apenas na mudança de página
  }, [page]);

  // Debounce para busca enquanto digita
  useEffect(() => {
    // Ignora na primeira renderização
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const timeoutId = setTimeout(() => {
      // Sempre busca sem mostrar loading para não piscar
      if (page !== 1) {
        setPage(1); // Reset para primeira página ao buscar
      } else {
        // Se já está na página 1, busca direto sem loading
        fetchEmails(false);
      }
    }, 500); // Aguarda 500ms após parar de digitar

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const fetchEmails = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const searchParam = searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : '';
      const response = await fetch(`/api/emails?page=${page}${searchParam}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Emails recebidos:', data);
        console.log('Total de emails:', data.emails?.length || 0);
        setEmails(data.emails || []);
        setTotalPages(data.pagination?.pages || 1);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error fetching emails:', response.status, errorData);
        setEmails([]);
      }
    } catch (error) {
      console.error('Error fetching emails:', error);
      setEmails([]);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (page !== 1) {
      setPage(1);
    } else {
      fetchEmails(true);
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
      return email.senha || '(sem senha)'; // Show decrypted password or indicate if empty
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
        <div className="flex gap-3">
          <button
            onClick={() => setShowMigrateModal(true)}
            className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold px-6 py-3 rounded-lg transition duration-200 flex items-center"
            title="Migrar criptografia de senhas"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Migrar Criptografia
          </button>
          <button
            onClick={() => {
              setEditingEmail(null);
              setFormData({
                email: '',
                colaborador: '',
                nome: '',
                senha: '',
                confirmarSenha: '',
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
      </div>

      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por email, colaborador ou nome..."
            className="flex-1 px-4 py-2 bg-[#282c34] text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#4CAF50]"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-[#4CAF50] hover:bg-[#45a049] text-white font-semibold rounded-lg transition duration-200 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Buscar
          </button>
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setPage(1);
              }}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition duration-200"
            >
              Limpar
            </button>
          )}
        </div>
      </form>

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

      {/* Modal de Migração */}
      {showMigrateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#282c34]/98 backdrop-blur-xl rounded-lg shadow-md p-8 max-w-2xl w-full mx-4 border border-gray-700/50">
            <h2 className="text-3xl font-bold text-white mb-4">Migrar Criptografia de Senhas</h2>
            <p className="text-gray-400 mb-6">
              Se você lembrar da chave de criptografia antiga, podemos recriptografar todas as senhas com a nova chave.
              Caso contrário, será necessário redefinir as senhas manualmente.
            </p>

            {migrateResult && (
              <div className={`mb-6 p-4 rounded-lg ${migrateResult.success ? 'bg-green-500/20 border border-green-500' : 'bg-red-500/20 border border-red-500'}`}>
                <p className={migrateResult.success ? 'text-green-400' : 'text-red-400'}>
                  {migrateResult.message}
                </p>
                {migrateResult.details && migrateResult.details.length > 0 && (
                  <div className="mt-2 text-sm text-gray-300">
                    <p className="font-semibold">Detalhes dos erros:</p>
                    <ul className="list-disc list-inside mt-1">
                      {migrateResult.details.slice(0, 5).map((detail, idx) => (
                        <li key={idx}>{detail}</li>
                      ))}
                      {migrateResult.details.length > 5 && (
                        <li>... e mais {migrateResult.details.length - 5} erro(s)</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={async (e) => {
              e.preventDefault();
              setMigrating(true);
              setMigrateResult(null);
              setError('');

              try {
                const response = await fetch('/api/emails/migrate-encryption', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ oldEncryptionKey: oldKey }),
                });

                const data = await response.json();

                if (response.ok) {
                  setMigrateResult({
                    success: true,
                    message: data.message,
                    details: data.errorDetails,
                  });
                  // Recarrega os emails após migração bem-sucedida
                  setTimeout(() => {
                    fetchEmails(true);
                    setShowMigrateModal(false);
                    setOldKey('');
                    setMigrateResult(null);
                  }, 2000);
                } else {
                  setMigrateResult({
                    success: false,
                    message: data.error || 'Erro ao migrar senhas',
                    details: data.errorDetails,
                  });
                }
              } catch (error: any) {
                setMigrateResult({
                  success: false,
                  message: `Erro: ${error.message}`,
                });
              } finally {
                setMigrating(false);
              }
            }} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Chave de Criptografia Antiga
                </label>
                <input
                  type="password"
                  value={oldKey}
                  onChange={(e) => setOldKey(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-[#363f4a] text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder="Cole ou digite a chave antiga aqui"
                  required
                  disabled={migrating}
                />
                <p className="mt-2 text-xs text-gray-400">
                  A chave pode ser uma string hexadecimal (64 caracteres) ou qualquer texto que será hasheado.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={migrating || !oldKey}
                  className="flex-1 px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {migrating ? 'Migrando...' : 'Executar Migração'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMigrateModal(false);
                    setOldKey('');
                    setMigrateResult(null);
                  }}
                  disabled={migrating}
                  className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition duration-200 disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

