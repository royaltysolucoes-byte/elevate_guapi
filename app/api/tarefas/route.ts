import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import mongoose from 'mongoose';
import Tarefa from '@/lib/models/Tarefa';
import Notificacao from '@/lib/models/Notificacao';
import { verifyToken } from '@/lib/auth';

// Garantir que os modelos estão registrados
const ensureModelsRegistered = () => {
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

    const tarefas = await Tarefa.find({}).sort({ createdAt: -1 }).lean();

    return NextResponse.json({
      tarefas: tarefas.map(tarefa => ({
        _id: tarefa._id.toString(),
        titulo: tarefa.titulo,
        descricao: tarefa.descricao || '',
        status: tarefa.status,
        prioridade: tarefa.prioridade,
        responsavel: tarefa.responsavel || '',
        criadoPor: tarefa.criadoPor,
        prazo: tarefa.prazo ? new Date(tarefa.prazo).toISOString() : null,
        tags: tarefa.tags || [],
        createdAt: tarefa.createdAt ? new Date(tarefa.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: tarefa.updatedAt ? new Date(tarefa.updatedAt).toISOString() : new Date().toISOString(),
      })),
    });
  } catch (error) {
    console.error('Error fetching tarefas:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
    ensureModelsRegistered();

    const { titulo, descricao, status, prioridade, responsavel, prazo, tags } = await request.json();

    if (!titulo) {
      return NextResponse.json(
        { error: 'Título é obrigatório' },
        { status: 400 }
      );
    }

    const novaTarefa = await Tarefa.create({
      titulo,
      descricao: descricao || '',
      status: status || 'todo',
      prioridade: prioridade || 'media',
      responsavel: responsavel || '',
      criadoPor: auth.username,
      prazo: prazo ? new Date(prazo) : undefined,
      tags: tags || [],
    });

    // Criar notificação se responsável foi atribuído
    if (responsavel) {
      try {
        await Notificacao.create({
          usuario: responsavel,
          tipo: 'tarefa_atribuida',
          titulo: 'Nova tarefa atribuída',
          mensagem: `${auth.username} atribuiu a tarefa "${titulo}" para você`,
          tarefaId: novaTarefa._id.toString(),
          lida: false,
        });
      } catch (notifError: any) {
        console.error('Error creating notification:', notifError);
        // Não falhar a criação da tarefa se a notificação falhar
      }
    }

    return NextResponse.json(
      {
        tarefa: {
          _id: novaTarefa._id.toString(),
          titulo: novaTarefa.titulo,
          descricao: novaTarefa.descricao || '',
          status: novaTarefa.status,
          prioridade: novaTarefa.prioridade,
          responsavel: novaTarefa.responsavel || '',
          criadoPor: novaTarefa.criadoPor,
          prazo: novaTarefa.prazo ? new Date(novaTarefa.prazo).toISOString() : null,
          tags: novaTarefa.tags || [],
          createdAt: novaTarefa.createdAt ? new Date(novaTarefa.createdAt).toISOString() : new Date().toISOString(),
          updatedAt: novaTarefa.updatedAt ? new Date(novaTarefa.updatedAt).toISOString() : new Date().toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating tarefa:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

