import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import Servidor from '@/lib/models/Servidor';
import Impressora from '@/lib/models/Impressora';
import RelogioPonto from '@/lib/models/RelogioPonto';
import Conectividade from '@/lib/models/Conectividade';

async function checkAuth(request: NextRequest) {
  const token = request.cookies.get('token')?.value;

  if (!token) {
    return null;
  }

  const payload = await verifyToken(token);
  return payload;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await checkAuth(request);
    
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const equipamentos: Array<{ ip: string; nome: string; tipo: string; status: 'ativo' | 'inativo' | 'manutencao' }> = [];

    // Computadores não têm IP fixo direto, apenas referência à faixa de rede
    // Por isso não incluímos na lista de IPs fixos

    // Buscar Servidores (IP direto)
    const servidores = await Servidor.find({}).lean();
    servidores.forEach((serv: any) => {
      if (serv.ip) {
        equipamentos.push({
          ip: serv.ip,
          nome: serv.nome,
          tipo: 'Servidor',
          status: serv.status === 'ativo' ? 'ativo' : 'inativo',
        });
      }
    });

    // Buscar Impressoras (enderecoIP)
    const impressoras = await Impressora.find({}).lean();
    impressoras.forEach((imp: any) => {
      if (imp.enderecoIP) {
        equipamentos.push({
          ip: imp.enderecoIP,
          nome: `${imp.setor} - ${imp.numeroSerie}`,
          tipo: 'Impressora',
          status: 'ativo', // Impressoras não têm campo ativo, padrão ativo
        });
      }
    });

    // Buscar Relógios de Ponto (enderecoIP)
    const relogios = await RelogioPonto.find({}).lean();
    relogios.forEach((rel: any) => {
      if (rel.enderecoIP) {
        equipamentos.push({
          ip: rel.enderecoIP,
          nome: `${rel.setor} - ${rel.numeroSerie}`,
          tipo: 'Relógio de Ponto',
          status: 'ativo', // Relógios não têm campo ativo, padrão ativo
        });
      }
    });

    // Buscar Conectividades (ip)
    const conectividades = await Conectividade.find({}).lean();
    conectividades.forEach((conn: any) => {
      if (conn.ip) {
        equipamentos.push({
          ip: conn.ip,
          nome: conn.nome,
          tipo: 'Conectividade',
          status: 'ativo', // Conectividades não têm campo ativo, padrão ativo
        });
      }
    });


    // Função para converter IP em número para ordenação
    const ipToNumber = (ip: string): number => {
      const parts = ip.split('.').map(Number);
      if (parts.length === 4 && parts.every(p => !isNaN(p))) {
        return parts[0] * 256 * 256 * 256 + parts[1] * 256 * 256 + parts[2] * 256 + parts[3];
      }
      return 0;
    };

    // Ordenar por IP de forma sequencial (numérica)
    equipamentos.sort((a, b) => {
      const numA = ipToNumber(a.ip);
      const numB = ipToNumber(b.ip);
      if (numA !== numB) {
        return numA - numB;
      }
      // Se não conseguir converter, ordena alfabeticamente
      return a.ip.localeCompare(b.ip);
    });

    return NextResponse.json({ equipamentos });
  } catch (error) {
    console.error('Error fetching equipamentos IPs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

