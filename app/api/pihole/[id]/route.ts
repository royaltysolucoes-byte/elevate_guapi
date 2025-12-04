import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import mongoose from 'mongoose';
import Pihole from '@/lib/models/Pihole';
import { verifyToken } from '@/lib/auth';

const ensureModelsRegistered = () => {
  if (!mongoose.models.Pihole) {
    require('@/lib/models/Pihole');
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
    if (body.nome !== undefined) updateData.nome = body.nome;
    if (body.anydesk !== undefined) updateData.anydesk = body.anydesk;
    if (body.temDnsPihole !== undefined) updateData.temDnsPihole = body.temDnsPihole;

    const piholeAtualizado = await Pihole.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).lean();

    if (!piholeAtualizado) {
      return NextResponse.json(
        { error: 'Máquina Pi-hole não encontrada' },
        { status: 404 }
      );
    }

    const piholeTyped = piholeAtualizado as any;

    return NextResponse.json({
      pihole: {
        _id: piholeTyped._id?.toString() || '',
        nome: piholeTyped.nome,
        anydesk: piholeTyped.anydesk,
        temDnsPihole: piholeTyped.temDnsPihole,
        createdAt: piholeTyped.createdAt ? new Date(piholeTyped.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: piholeTyped.updatedAt ? new Date(piholeTyped.updatedAt).toISOString() : new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error updating pihole:', error);
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

    const pihole = await Pihole.findByIdAndDelete(id);

    if (!pihole) {
      return NextResponse.json(
        { error: 'Máquina Pi-hole não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Máquina Pi-hole excluída com sucesso' });
  } catch (error) {
    console.error('Error deleting pihole:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

