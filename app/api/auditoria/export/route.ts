import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Auditoria from '@/lib/models/Auditoria';
import { verifyToken } from '@/lib/auth';

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

    // Apenas admin pode exportar auditoria
    if (auth.nivelAcesso !== 'admin' && !auth.isAdmin) {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores podem exportar a auditoria.' },
        { status: 403 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);

    // Filtros
    const usuario = searchParams.get('usuario');
    const acao = searchParams.get('acao');
    const entidade = searchParams.get('entidade');
    const sensivel = searchParams.get('sensivel');
    const dataInicio = searchParams.get('dataInicio');
    const dataFim = searchParams.get('dataFim');

    // Construir query
    const query: any = {};

    if (usuario) {
      query.usuario = usuario;
    }

    if (acao) {
      query.acao = acao;
    }

    if (entidade) {
      query.entidade = entidade;
    }

    if (sensivel === 'true') {
      query.sensivel = true;
    }

    if (dataInicio || dataFim) {
      query.createdAt = {};
      if (dataInicio) {
        query.createdAt.$gte = new Date(dataInicio);
      }
      if (dataFim) {
        const fim = new Date(dataFim);
        fim.setHours(23, 59, 59, 999);
        query.createdAt.$lte = fim;
      }
    }

    // Buscar todos os logs (sem paginação para exportação)
    const logs = await Auditoria.find(query)
      .sort({ createdAt: -1 })
      .lean();

    // Converter para CSV
    const headers = [
      'Data/Hora',
      'Usuário',
      'Ação',
      'Entidade',
      'ID da Entidade',
      'Descrição',
      'Nível de Acesso',
      'Dados Sensíveis',
      'IP',
      'User Agent'
    ];

    const rows = logs.map((log: any) => [
      new Date(log.createdAt).toLocaleString('pt-BR'),
      log.usuario,
      log.acao,
      log.entidade,
      log.entidadeId || '',
      log.descricao,
      log.nivelAcesso,
      log.sensivel ? 'Sim' : 'Não',
      log.ip || '',
      log.userAgent || ''
    ]);

    // Criar CSV
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    // Adicionar BOM para Excel reconhecer UTF-8
    const BOM = '\uFEFF';
    const csvWithBOM = BOM + csvContent;

    return new NextResponse(csvWithBOM, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="auditoria_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error exporting auditoria:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

