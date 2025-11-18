import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import mongoose from 'mongoose';
import Celular from '@/lib/models/Celular';
import { verifyToken } from '@/lib/auth';

// Garantir que os modelos estão registrados
const ensureModelsRegistered = () => {
  if (!mongoose.models.Celular) {
    require('@/lib/models/Celular');
  }
  if (!mongoose.models.Categoria) {
    require('@/lib/models/Categoria');
  }
  if (!mongoose.models.Modelo) {
    require('@/lib/models/Modelo');
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

    const updateData: any = {};
    if (body.numero !== undefined) updateData.numero = body.numero;
    if (body.colaborador !== undefined) updateData.colaborador = body.colaborador;
    if (body.categoria !== undefined) updateData.categoria = body.categoria;
    if (body.modelo !== undefined) updateData.modelo = body.modelo;

    const celularAtualizado = await Celular.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate({ path: 'categoria', model: 'Categoria', strictPopulate: false })
      .populate({ path: 'modelo', populate: { path: 'marca', model: 'Marca', strictPopulate: false }, model: 'Modelo', strictPopulate: false })
      .lean();

    if (!celularAtualizado) {
      return NextResponse.json(
        { error: 'Celular não encontrado' },
        { status: 404 }
      );
    }

    const celularTyped = celularAtualizado as any;

    return NextResponse.json({
      celular: {
        _id: celularTyped._id?.toString() || '',
        numero: celularTyped.numero,
        colaborador: celularTyped.colaborador,
        categoria: celularTyped.categoria ? {
          _id: celularTyped.categoria._id?.toString() || '',
          nome: celularTyped.categoria.nome,
        } : null,
        modelo: celularTyped.modelo ? {
          _id: celularTyped.modelo._id?.toString() || '',
          nome: celularTyped.modelo.nome,
          marca: celularTyped.modelo.marca ? {
            _id: celularTyped.modelo.marca._id?.toString() || '',
            nome: celularTyped.modelo.marca.nome,
          } : null,
        } : null,
        createdAt: celularTyped.createdAt ? new Date(celularTyped.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: celularTyped.updatedAt ? new Date(celularTyped.updatedAt).toISOString() : new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error updating celular:', error);
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
    ensureModelsRegistered();

    const { id } = await params;

    const celular = await Celular.findByIdAndDelete(id);

    if (!celular) {
      return NextResponse.json(
        { error: 'Celular não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Celular excluído com sucesso' });
  } catch (error) {
    console.error('Error deleting celular:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

