import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Tarefa from '@/lib/models/Tarefa';
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

    await connectDB();

    const tarefas = await Tarefa.find({}).lean();

    const stats = {
      total: tarefas.length,
      porStatus: {
        todo: tarefas.filter(t => t.status === 'todo').length,
        'in-progress': tarefas.filter(t => t.status === 'in-progress').length,
        review: tarefas.filter(t => t.status === 'review').length,
        done: tarefas.filter(t => t.status === 'done').length,
      },
      porPrioridade: {
        baixa: tarefas.filter(t => t.prioridade === 'baixa').length,
        media: tarefas.filter(t => t.prioridade === 'media').length,
        alta: tarefas.filter(t => t.prioridade === 'alta').length,
        urgente: tarefas.filter(t => t.prioridade === 'urgente').length,
      },
      atrasadas: tarefas.filter(t => {
        if (!t.prazo) return false;
        const prazo = new Date(t.prazo);
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        return prazo < hoje && t.status !== 'done';
      }).length,
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching tarefas stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

