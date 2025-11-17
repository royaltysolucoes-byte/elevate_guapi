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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();

    // Buscar tarefa atual para comparar responsável
    const tarefaAtual = await Tarefa.findById(id);
    if (!tarefaAtual) {
      return NextResponse.json(
        { error: 'Tarefa não encontrada' },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (body.titulo !== undefined) updateData.titulo = body.titulo;
    if (body.descricao !== undefined) updateData.descricao = body.descricao;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.prioridade !== undefined) updateData.prioridade = body.prioridade;
    if (body.responsavel !== undefined) updateData.responsavel = body.responsavel;
    if (body.prazo !== undefined) updateData.prazo = body.prazo ? new Date(body.prazo) : null;
    if (body.tags !== undefined) updateData.tags = body.tags;

    const tarefaAtualizada = await Tarefa.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).lean();

    if (!tarefaAtualizada) {
      return NextResponse.json(
        { error: 'Tarefa não encontrada' },
        { status: 404 }
      );
    }

    // Criar notificação se responsável foi atribuído ou alterado
    if (body.responsavel !== undefined && body.responsavel && body.responsavel !== tarefaAtual.responsavel) {
      try {
        await Notificacao.create({
          usuario: body.responsavel,
          tipo: 'tarefa_atribuida',
          titulo: 'Nova tarefa atribuída',
          mensagem: `${auth.username} atribuiu a tarefa "${tarefaAtualizada?.titulo || tarefaAtual.titulo}" para você`,
          tarefaId: id,
          lida: false,
        });
      } catch (notifError) {
        console.error('Error creating notification:', notifError);
        // Não falhar a atualização da tarefa se a notificação falhar
      }
    }

    return NextResponse.json({
      tarefa: {
        _id: tarefaAtualizada._id.toString(),
        titulo: tarefaAtualizada.titulo,
        descricao: tarefaAtualizada.descricao || '',
        status: tarefaAtualizada.status,
        prioridade: tarefaAtualizada.prioridade,
        responsavel: tarefaAtualizada.responsavel || '',
        criadoPor: tarefaAtualizada.criadoPor,
        prazo: tarefaAtualizada.prazo ? new Date(tarefaAtualizada.prazo).toISOString() : null,
        tags: tarefaAtualizada.tags || [],
        createdAt: tarefaAtualizada.createdAt ? new Date(tarefaAtualizada.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: tarefaAtualizada.updatedAt ? new Date(tarefaAtualizada.updatedAt).toISOString() : new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error updating tarefa:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await checkAuth(request);
    
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { id } = await params;

    const tarefa = await Tarefa.findByIdAndDelete(id);

    if (!tarefa) {
      return NextResponse.json(
        { error: 'Tarefa não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Tarefa excluída com sucesso' });
  } catch (error) {
    console.error('Error deleting tarefa:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

