'use client';

import { useEffect, useState, useMemo } from 'react';

interface EquipamentoIP {
  ip: string;
  nome: string;
  tipo: string;
  status: 'ativo' | 'inativo' | 'manutencao';
  disponivel?: boolean;
}

export default function ConsultaIPPage() {
  const [equipamentos, setEquipamentos] = useState<EquipamentoIP[]>([]);
  const [loading, setLoading] = useState(true);
  const [rangeInicio, setRangeInicio] = useState('10.10.8.2');
  const [rangeFim, setRangeFim] = useState('10.10.8.130');

  // Função para gerar todos os IPs do range
  const gerarIPsDoRange = (inicio: string, fim: string): string[] => {
    const ipToNumber = (ip: string): number => {
      const parts = ip.split('.').map(Number);
      return parts[0] * 256 * 256 * 256 + parts[1] * 256 * 256 + parts[2] * 256 + parts[3];
    };

    const numberToIP = (num: number): string => {
      const part1 = Math.floor(num / (256 * 256 * 256));
      const part2 = Math.floor((num % (256 * 256 * 256)) / (256 * 256));
      const part3 = Math.floor((num % (256 * 256)) / 256);
      const part4 = num % 256;
      return `${part1}.${part2}.${part3}.${part4}`;
    };

    const inicioNum = ipToNumber(inicio);
    const fimNum = ipToNumber(fim);
    const ips: string[] = [];

    for (let i = inicioNum; i <= fimNum; i++) {
      ips.push(numberToIP(i));
    }

    return ips;
  };

  // Calcular IPs disponíveis
  const ipsDisponiveis = useMemo(() => {
    const todosIPs = gerarIPsDoRange(rangeInicio, rangeFim);
    const ipsUtilizados = new Set(equipamentos.map(e => e.ip));
    return todosIPs.filter(ip => !ipsUtilizados.has(ip));
  }, [equipamentos, rangeInicio, rangeFim]);

  // Combinar equipamentos e IPs disponíveis
  const todosIPs = useMemo(() => {
    const equipamentosComDisponivel = equipamentos.map(e => ({ ...e, disponivel: false }));
    const disponiveis: EquipamentoIP[] = ipsDisponiveis.map(ip => ({
      ip,
      nome: 'Disponível',
      tipo: 'Disponível',
      status: 'ativo' as const,
      disponivel: true,
    }));
    return [...equipamentosComDisponivel, ...disponiveis].sort((a, b) => {
      const ipToNumber = (ip: string): number => {
        const parts = ip.split('.').map(Number);
        if (parts.length === 4 && parts.every(p => !isNaN(p))) {
          return parts[0] * 256 * 256 * 256 + parts[1] * 256 * 256 + parts[2] * 256 + parts[3];
        }
        return 0;
      };
      return ipToNumber(a.ip) - ipToNumber(b.ip);
    });
  }, [equipamentos, ipsDisponiveis]);

  const stats = useMemo(() => ({
    total: equipamentos.length,
    ativos: equipamentos.filter(e => e.status === 'ativo').length,
    inativos: equipamentos.filter(e => e.status === 'inativo').length,
    manutencao: equipamentos.filter(e => e.status === 'manutencao').length,
    disponiveis: ipsDisponiveis.length,
  }), [equipamentos, ipsDisponiveis]);

  useEffect(() => {
    fetchEquipamentos();
  }, []);

  const fetchEquipamentos = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/consulta-ip');
      if (response.ok) {
        const data = await response.json();
        setEquipamentos(data.equipamentos);
      }
    } catch (error) {
      console.error('Error fetching equipamentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (equipamento: EquipamentoIP) => {
    // Não fazer nada se for IP disponível
    if (equipamento.disponivel) return;

    // Ciclar entre ativo -> inativo -> manutenção -> ativo
    const statusOrder: Array<'ativo' | 'inativo' | 'manutencao'> = ['ativo', 'inativo', 'manutencao'];
    const currentIndex = statusOrder.indexOf(equipamento.status);
    const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];

    // Para equipamentos que não têm status editável, apenas atualizar localmente
    if (equipamento.tipo === 'Servidor') {
      // Atualizar servidor via API
      try {
        // Buscar servidor pelo IP
        let allServidores: any[] = [];
        let page = 1;
        let hasMore = true;

        while (hasMore) {
          const servidoresRes = await fetch(`/api/servidores?page=${page}`);
          if (servidoresRes.ok) {
            const servidoresData = await servidoresRes.json();
            allServidores = [...allServidores, ...servidoresData.servidores];
            hasMore = page < servidoresData.pagination.pages;
            page++;
          } else {
            hasMore = false;
          }
        }

        const servidor = allServidores.find((s: any) => s.ip === equipamento.ip);
        if (servidor) {
          const newStatus = nextStatus === 'manutencao' ? 'inativo' : nextStatus; // Servidor só aceita ativo/inativo
          const updateRes = await fetch(`/api/servidores/${servidor._id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ...servidor, status: newStatus }),
          });
          if (updateRes.ok) {
            fetchEquipamentos();
          }
        }
      } catch (error) {
        console.error('Error updating servidor status:', error);
      }
    } else {
      // Para outros equipamentos, apenas atualizar localmente (visual)
      setEquipamentos(equipamentos.map(eq => 
        eq.ip === equipamento.ip ? { ...eq, status: nextStatus } : eq
      ));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-400">Carregando...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Consulta IP</h1>
        <p className="text-gray-400 mt-2">Visualização rápida de todos os IPs cadastrados</p>
      </div>

      {/* Configuração de Range */}
      <div className="bg-[#282c34] rounded-lg border border-gray-700/50 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-300 mb-2">Range de IPs Disponíveis</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={rangeInicio}
                onChange={(e) => setRangeInicio(e.target.value)}
                placeholder="10.10.8.2"
                className="flex-1 px-4 py-2 border border-gray-600 rounded-lg bg-[#363f4a] text-white placeholder-gray-400 focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent"
              />
              <span className="text-gray-400 self-center">até</span>
              <input
                type="text"
                value={rangeFim}
                onChange={(e) => setRangeFim(e.target.value)}
                placeholder="10.10.8.130"
                className="flex-1 px-4 py-2 border border-gray-600 rounded-lg bg-[#363f4a] text-white placeholder-gray-400 focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-[#282c34] rounded-lg border border-gray-700/50 p-4">
          <div className="text-gray-400 text-sm mb-1">Utilizados</div>
          <div className="text-2xl font-bold text-white">{stats.total}</div>
        </div>
        <div className="bg-[#282c34] rounded-lg border border-green-500/30 p-4">
          <div className="text-gray-400 text-sm mb-1">Ativos</div>
          <div className="text-2xl font-bold text-green-400">{stats.ativos}</div>
        </div>
        <div className="bg-[#282c34] rounded-lg border border-gray-500/30 p-4">
          <div className="text-gray-400 text-sm mb-1">Inativos</div>
          <div className="text-2xl font-bold text-gray-400">{stats.inativos}</div>
        </div>
        <div className="bg-[#282c34] rounded-lg border border-yellow-500/30 p-4">
          <div className="text-gray-400 text-sm mb-1">Manutenção</div>
          <div className="text-2xl font-bold text-yellow-400">{stats.manutencao}</div>
        </div>
        <div className="bg-[#282c34] rounded-lg border border-blue-500/30 p-4">
          <div className="text-gray-400 text-sm mb-1">Disponíveis</div>
          <div className="text-2xl font-bold text-blue-400">{stats.disponiveis}</div>
        </div>
      </div>

      <div className="bg-[#282c34] rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-600">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  IP
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-[#282c34] divide-y divide-gray-600">
              {todosIPs.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center">
                    <div className="text-gray-400">
                      <p className="text-lg font-medium">Nenhum IP encontrado</p>
                    </div>
                  </td>
                </tr>
              ) : (
                todosIPs.map((item, index) => (
                  <tr 
                    key={`${item.ip}-${index}`} 
                    className={`hover:bg-gray-700/50 ${item.disponivel ? 'opacity-75' : ''}`}
                  >
                    <td className="px-6 py-4">
                      <div className={`text-sm font-medium ${item.disponivel ? 'text-blue-400' : 'text-white'}`}>
                        {item.ip}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`text-sm ${item.disponivel ? 'text-blue-300' : 'text-gray-300'}`}>
                        {item.nome}
                      </div>
                      {!item.disponivel && (
                        <div className="text-xs text-gray-500 mt-1">{item.tipo}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {item.disponivel ? (
                        <span className="px-4 py-2 rounded-lg font-medium text-sm bg-blue-500/20 text-blue-400 border border-blue-500/30">
                          Disponível
                        </span>
                      ) : (
                        <button
                          onClick={() => handleToggleStatus(item)}
                          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                            item.status === 'ativo'
                              ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30'
                              : item.status === 'manutencao'
                              ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 border border-yellow-500/30'
                              : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30 border border-gray-500/30'
                          }`}
                        >
                          {item.status === 'ativo' ? 'Ativo' : item.status === 'manutencao' ? 'Manutenção' : 'Inativo'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

