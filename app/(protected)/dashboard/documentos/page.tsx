'use client';

import { useEffect, useState } from 'react';

interface User {
  username: string;
  fullName: string;
  funcao: string;
  isAdmin: boolean;
  nivelAcesso?: string;
}

interface DocumentoType {
  _id: string;
  nome: string;
  nomeArquivo: string;
  tamanho: number;
  tipoMime: string;
  criadoPor: string;
  createdAt: string;
  updatedAt: string;
}

export default function DocumentosPage() {
  const [user, setUser] = useState<User | null>(null);
  const [documentos, setDocumentos] = useState<DocumentoType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDocumento, setEditingDocumento] = useState<DocumentoType | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [formData, setFormData] = useState({
    nome: '',
    file: null as File | null,
  });
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchUser();
    fetchDocumentos();
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

  const fetchDocumentos = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/documentos?page=${page}&limit=10`);
      if (response.ok) {
        const data = await response.json();
        setDocumentos(data.documentos);
        setTotalPages(data.pagination.pages);
      }
    } catch (error) {
      console.error('Error fetching documentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setUploading(true);

    try {
      if (editingDocumento) {
        // Editar apenas o nome
        const response = await fetch(`/api/documentos/${editingDocumento._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ nome: formData.nome }),
        });

        if (!response.ok) {
          const data = await response.json();
          setError(data.error || 'Erro ao atualizar documento');
          setUploading(false);
          return;
        }
      } else {
        // Upload de novo documento
        if (!formData.file) {
          setError('Selecione um arquivo');
          setUploading(false);
          return;
        }

        const uploadFormData = new FormData();
        uploadFormData.append('nome', formData.nome);
        uploadFormData.append('file', formData.file);

        const response = await fetch('/api/documentos', {
          method: 'POST',
          body: uploadFormData,
        });

        if (!response.ok) {
          const data = await response.json();
          setError(data.error || 'Erro ao fazer upload do documento');
          setUploading(false);
          return;
        }
      }

      setFormData({
        nome: '',
        file: null,
      });
      setShowModal(false);
      setEditingDocumento(null);
      setError('');
      fetchDocumentos();
    } catch (error) {
      setError('Erro ao conectar com o servidor');
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (documento: DocumentoType) => {
    setEditingDocumento(documento);
    setFormData({
      nome: documento.nome,
      file: null,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este documento?')) {
      return;
    }

    try {
      const response = await fetch(`/api/documentos/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchDocumentos();
      } else {
        const data = await response.json();
        alert(data.error || 'Erro ao excluir documento');
      }
    } catch (error) {
      console.error('Error deleting documento:', error);
      alert('Erro ao conectar com o servidor');
    }
  };

  const handleDownload = async (documento: DocumentoType) => {
    try {
      const response = await fetch(`/api/documentos/${documento._id}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = documento.nomeArquivo;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Erro ao baixar documento');
      }
    } catch (error) {
      console.error('Error downloading documento:', error);
      alert('Erro ao conectar com o servidor');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tamanho (15MB)
      const maxSize = 15 * 1024 * 1024;
      if (file.size > maxSize) {
        setError('Arquivo muito grande. Tamanho máximo permitido: 15MB');
        e.target.value = '';
        return;
      }
      setFormData({ ...formData, file });
      setError('');
    }
  };

  if (loading && documentos.length === 0) {
    return <div className="text-gray-400">Carregando...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Documentos do TI</h1>
        {user?.nivelAcesso !== 'suporte' && (
          <button
            onClick={() => {
              setEditingDocumento(null);
              setFormData({
                nome: '',
                file: null,
              });
              setShowModal(true);
            }}
            className="bg-[#4CAF50] hover:bg-[#45a049] text-white font-semibold px-6 py-3 rounded-lg transition duration-200 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Novo Documento
          </button>
        )}
      </div>

      <div className="bg-[#282c34] rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-600">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-1/4">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-1/4">
                  Arquivo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-32">
                  Tamanho
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-32">
                  Criado por
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-40">
                  Criado em
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider w-40">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-[#282c34] divide-y divide-gray-600">
              {documentos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="text-gray-400">
                      <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-lg font-medium">Nenhum documento encontrado</p>
                      <p className="text-sm mt-2">Comece fazendo upload de um documento</p>
                    </div>
                  </td>
                </tr>
              ) : (
                documentos.map((documento) => (
                  <tr key={documento._id} className="hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-white truncate max-w-xs" title={documento.nome}>
                        {documento.nome}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-300 truncate max-w-xs" title={documento.nomeArquivo}>
                        {documento.nomeArquivo}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">{formatFileSize(documento.tamanho)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">{documento.criadoPor}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {formatDate(documento.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => handleDownload(documento)}
                          className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 hover:text-blue-300 rounded-lg transition-all"
                          title="Baixar"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </button>
                        {user?.nivelAcesso !== 'suporte' && (
                          <button
                            onClick={() => handleEdit(documento)}
                            className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 hover:text-blue-300 rounded-lg transition-all"
                            title="Editar"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        )}
                        {(user?.isAdmin || user?.nivelAcesso === 'admin') && (
                          <button
                            onClick={() => handleDelete(documento._id)}
                            className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 rounded-lg transition-all"
                            title="Excluir"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
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
      </div>

      {/* Paginação */}
      {documentos.length > 0 && (
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
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#282c34]/98 backdrop-blur-xl rounded-lg shadow-md p-8 max-w-2xl w-full mx-4 border border-gray-700/50">
            <h2 className="text-3xl font-bold text-white mb-8">
              {editingDocumento ? 'Editar Documento' : 'Novo Documento'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-500/20 border border-red-500 text-red-500 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nome do Documento
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-[#363f4a] text-white placeholder-gray-400 focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent"
                  placeholder="Nome do documento"
                  required
                />
              </div>

              {!editingDocumento && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Arquivo (Máximo 15MB)
                  </label>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-[#363f4a] text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#4CAF50] file:text-white hover:file:bg-[#45a049] file:cursor-pointer focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent"
                    required={!editingDocumento}
                  />
                  {formData.file && (
                    <p className="mt-2 text-sm text-gray-400">
                      Arquivo selecionado: {formData.file.name} ({formatFileSize(formData.file.size)})
                    </p>
                  )}
                </div>
              )}

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingDocumento(null);
                    setFormData({
                      nome: '',
                      file: null,
                    });
                    setError('');
                  }}
                  className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 rounded-lg transition"
                  disabled={uploading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#4CAF50] hover:bg-[#45a049] text-white font-semibold py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={uploading}
                >
                  {uploading ? 'Enviando...' : editingDocumento ? 'Atualizar' : 'Enviar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

