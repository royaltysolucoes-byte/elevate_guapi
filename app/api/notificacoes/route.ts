import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import mongoose from 'mongoose';
import Notificacao from '@/lib/models/Notificacao';
import { verifyToken } from '@/lib/auth';

// Garantir que o modelo está registrado
const ensureNotificacaoModel = () => {
  if (!mongoose.models.Notificacao) {
    require('@/lib/models/Notificacao');
  }
};

async function checkAuth(request: NextRequest) {
  const token = request.cookies.get('token')?.value;

  if (!token) {
    return null;
  }

  const payload = await verifyToken(token);
  return payload;
}

// GET - Buscar notificações do usuário
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
    ensureNotificacaoModel();

    const { searchParams } = new URL(request.url);
    const apenasNaoLidas = searchParams.get('apenasNaoLidas') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');

    const query: any = { usuario: auth.username };
    if (apenasNaoLidas) {
      query.lida = false;
    }

    const notificacoes = await Notificacao.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const totalNaoLidas = await Notificacao.countDocuments({
      usuario: auth.username,
      lida: false,
    });

    return NextResponse.json({
      notificacoes: notificacoes.map((notif: any) => ({
        _id: notif._id?.toString() || '',
        tipo: notif.tipo,
        titulo: notif.titulo,
        mensagem: notif.mensagem,
        tarefaId: notif.tarefaId || null,
        lida: notif.lida,
        createdAt: notif.createdAt ? new Date(notif.createdAt).toISOString() : new Date().toISOString(),
      })),
      totalNaoLidas,
    });
  } catch (error) {
    console.error('Error fetching notificacoes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Marcar notificações como lidas
export async function POST(request: NextRequest) {
  try {
    const auth = await checkAuth(request);
    
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();
    ensureNotificacaoModel();

    const { notificacaoId, marcarTodas } = await request.json();

    if (marcarTodas) {
      await Notificacao.updateMany(
        { usuario: auth.username, lida: false },
        { $set: { lida: true } }
      );
    } else if (notificacaoId) {
      await Notificacao.updateOne(
        { _id: notificacaoId, usuario: auth.username },
        { $set: { lida: true } }
      );
    } else {
      return NextResponse.json(
        { error: 'notificacaoId ou marcarTodas é obrigatório' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating notificacao:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

