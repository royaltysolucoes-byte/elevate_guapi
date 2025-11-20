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

    // Apenas admin pode acessar auditoria
    if (auth.nivelAcesso !== 'admin' && !auth.isAdmin) {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores podem acessar a auditoria.' },
        { status: 403 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

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

    // Buscar logs
    const logs = await Auditoria.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Contar total
    const total = await Auditoria.countDocuments(query);

    return NextResponse.json({
      logs: logs.map((log: any) => ({
        _id: log._id?.toString() || '',
        usuario: log.usuario,
        acao: log.acao,
        entidade: log.entidade,
        entidadeId: log.entidadeId || '',
        descricao: log.descricao,
        dadosAntigos: log.dadosAntigos,
        dadosNovos: log.dadosNovos,
        ip: log.ip || '',
        userAgent: log.userAgent || '',
        nivelAcesso: log.nivelAcesso,
        sensivel: log.sensivel,
        createdAt: log.createdAt ? new Date(log.createdAt).toISOString() : new Date().toISOString(),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching auditoria:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

