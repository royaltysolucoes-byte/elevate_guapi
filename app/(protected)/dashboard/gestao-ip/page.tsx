'use client';

import { useEffect, useState } from 'react';

interface User {
  username: string;
  fullName: string;
  funcao: string;
  isAdmin: boolean;
  nivelAcesso?: string;
}

interface IPType {
  _id: string;
  tipo: 'faixa' | 'vlan';
  nome: string;
  faixa?: string;
  gateway?: string;
  network?: string;
  mask?: string;
  vlanNome?: string;
  vlanId?: string;
  vlanFaixa?: string;
  vlanGateway?: string;
  vlanNetwork?: string;
  vlanMask?: string;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function GestaoIPPage() {
  const [user, setUser] = useState<User | null>(null);
  const [ips, setIPs] = useState<IPType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingIP, setEditingIP] = useState<IPType | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [formData, setFormData] = useState({
    tipo: 'faixa' as 'faixa' | 'vlan',
    nome: '',
    faixa: '',
    gateway: '',
    network: '',
    mask: '',
    vlanNome: '',
    vlanId: '',
    vlanFaixa: '',
    vlanGateway: '',
    vlanNetwork: '',
    vlanMask: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUser();
    fetchIPs();
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

  const fetchIPs = async () => {
    try {
      const response = await fetch(`/api/ips?page=${page}`);
      if (response.ok) {
        const data = await response.json();
        setIPs(data.ips);
        setTotalPages(data.pagination.pages);
      }
    } catch (error) {
      console.error('Error fetching IPs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const url = editingIP ? `/api/ips/${editingIP._id}` : '/api/ips';
      const method = editingIP ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || `Erro ao ${editingIP ? 'atualizar' : 'criar'} IP/VLAN`);
        return;
      }

      setFormData({
        tipo: 'faixa',
        nome: '',
        faixa: '',
        gateway: '',
        network: '',
        mask: '',
        vlanNome: '',
        vlanId: '',
        vlanFaixa: '',
        vlanGateway: '',
        vlanNetwork: '',
        vlanMask: '',
      });
      setShowModal(false);
      setEditingIP(null);
      fetchIPs();
    } catch (error) {
      setError('Erro ao conectar com o servidor');
    }
  };

  const handleToggleAtivo = async (id: string, ativoAtual: boolean) => {
    try {
      const response = await fetch(`/api/ips/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ativo: !ativoAtual }),
      });

      if (response.ok) {
        fetchIPs();
      } else {
        const data = await response.json();
        console.error('Error toggling ativo:', data);
        alert('Erro ao alterar status: ' + (data.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('Error toggling ativo:', error);
      alert('Erro ao conectar com o servidor');
    }
  };

  const handleEdit = (ip: IPType) => {
    setEditingIP(ip);
    setFormData({
      tipo: ip.tipo,
      nome: ip.nome,
      faixa: ip.faixa || '',
      gateway: ip.gateway || '',
      network: ip.network || '',
      mask: ip.mask || '',
      vlanNome: ip.vlanNome || '',
      vlanId: ip.vlanId || '',
      vlanFaixa: ip.vlanFaixa || '',
      vlanGateway: ip.vlanGateway || '',
      vlanNetwork: ip.vlanNetwork || '',
      vlanMask: ip.vlanMask || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este registro?')) {
      return;
    }

    try {
      const response = await fetch(`/api/ips/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchIPs();
      }
    } catch (error) {
      console.error('Error deleting IP:', error);
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
        <h1 className="text-3xl font-bold text-white">Gestão de IP</h1>
        {user?.nivelAcesso !== 'suporte' && (
          <button
            onClick={() => setShowModal(true)}
            className="bg-[#4CAF50] hover:bg-[#45a049] text-white font-semibold px-6 py-3 rounded-lg transition duration-200 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Novo Registro
          </button>
        )}
      </div>

      <div className="bg-[#282c34] rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-600">
          <thead className="bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Nome
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Informações
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
            {ips.map((ip) => (
              <tr key={ip._id} className="hover:bg-gray-700/50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    ip.tipo === 'faixa' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
                  }`}>
                    {ip.tipo.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-white">{ip.nome}</div>
                </td>
                <td className="px-6 py-4">
                  {ip.tipo === 'faixa' ? (
                    <div className="text-sm text-gray-300">
                      <div>Faixa: {ip.faixa}</div>
                      <div>Gateway: {ip.gateway}</div>
                      <div>Network: {ip.network}</div>
                      <div>Mask: {ip.mask}</div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-300">
                      <div>Nome: {ip.vlanNome}</div>
                      <div>ID: {ip.vlanId}</div>
                      {ip.vlanFaixa && <div>Faixa: {ip.vlanFaixa}</div>}
                      {ip.vlanGateway && <div>Gateway: {ip.vlanGateway}</div>}
                      {ip.vlanNetwork && <div>Network: {ip.vlanNetwork}</div>}
                      {ip.vlanMask && <div>Mask: {ip.vlanMask}</div>}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  {formatDate(ip.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-3">
                    {user?.nivelAcesso !== 'suporte' && (
                      <>
                        <button
                          onClick={() => handleToggleAtivo(ip._id, ip.ativo)}
                          className="p-2 rounded-lg hover:bg-gray-700 transition"
                          title={ip.ativo ? 'Desativar' : 'Ativar'}
                        >
                          <div className={`w-3 h-3 rounded-full ${ip.ativo ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                        </button>
                        <button
                          onClick={() => handleEdit(ip)}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          Editar
                        </button>
                      </>
                    )}
                    {(user?.isAdmin || user?.nivelAcesso === 'admin') && (
                      <button
                        onClick={() => handleDelete(ip._id)}
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
            <h2 className="text-3xl font-bold text-white mb-8">{editingIP ? 'Editar Registro' : 'Novo Registro'}</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-500/20 border border-red-500 text-red-500 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tipo
                </label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value as 'faixa' | 'vlan' })}
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-[#363f4a] text-white focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent"
                  required
                >
                  <option value="faixa">Faixa</option>
                  <option value="vlan">VLAN</option>
                </select>
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
                  placeholder={formData.tipo === 'faixa' ? 'Ex: Rede Principal' : 'Ex: VLAN Principal'}
                  required
                />
              </div>

              {formData.tipo === 'faixa' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Faixa
                    </label>
                    <input
                      type="text"
                      value={formData.faixa}
                      onChange={(e) => setFormData({ ...formData, faixa: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-[#363f4a] text-white placeholder-gray-400 focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent"
                      placeholder="Ex: 192.168.100.200/24"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Gateway
                      </label>
                      <input
                        type="text"
                        value={formData.gateway}
                        onChange={(e) => setFormData({ ...formData, gateway: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-[#363f4a] text-white placeholder-gray-400 focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent"
                        placeholder="Ex: 192.168.100.1"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Network
                      </label>
                      <input
                        type="text"
                        value={formData.network}
                        onChange={(e) => setFormData({ ...formData, network: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-[#363f4a] text-white placeholder-gray-400 focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent"
                        placeholder="Ex: 192.168.100.0"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Mask
                    </label>
                    <input
                      type="text"
                      value={formData.mask}
                      onChange={(e) => setFormData({ ...formData, mask: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-[#363f4a] text-white placeholder-gray-400 focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent"
                      placeholder="Ex: 255.255.255.0"
                      required
                    />
                  </div>
                </>
              )}

              {formData.tipo === 'vlan' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Nome VLAN
                    </label>
                    <input
                      type="text"
                      value={formData.vlanNome}
                      onChange={(e) => setFormData({ ...formData, vlanNome: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-[#363f4a] text-white placeholder-gray-400 focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent"
                      placeholder="Ex: VLAN Principal"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      ID VLAN
                    </label>
                    <input
                      type="text"
                      value={formData.vlanId}
                      onChange={(e) => setFormData({ ...formData, vlanId: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-[#363f4a] text-white placeholder-gray-400 focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent"
                      placeholder="Ex: 100"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Faixa
                    </label>
                    <input
                      type="text"
                      value={formData.vlanFaixa}
                      onChange={(e) => setFormData({ ...formData, vlanFaixa: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-[#363f4a] text-white placeholder-gray-400 focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent"
                      placeholder="Ex: 192.168.100.200/24"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Gateway
                      </label>
                      <input
                        type="text"
                        value={formData.vlanGateway}
                        onChange={(e) => setFormData({ ...formData, vlanGateway: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-[#363f4a] text-white placeholder-gray-400 focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent"
                        placeholder="Ex: 192.168.100.1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Network
                      </label>
                      <input
                        type="text"
                        value={formData.vlanNetwork}
                        onChange={(e) => setFormData({ ...formData, vlanNetwork: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-[#363f4a] text-white placeholder-gray-400 focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent"
                        placeholder="Ex: 192.168.100.0"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Mask
                    </label>
                    <input
                      type="text"
                      value={formData.vlanMask}
                      onChange={(e) => setFormData({ ...formData, vlanMask: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-[#363f4a] text-white placeholder-gray-400 focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent"
                      placeholder="Ex: 255.255.255.0"
                    />
                  </div>
                </>
              )}

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingIP(null);
                    setFormData({
                      tipo: 'faixa',
                      nome: '',
                      faixa: '',
                      gateway: '',
                      network: '',
                      mask: '',
                      vlanNome: '',
                      vlanId: '',
                      vlanFaixa: '',
                      vlanGateway: '',
                      vlanNetwork: '',
                      vlanMask: '',
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
                  {editingIP ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
