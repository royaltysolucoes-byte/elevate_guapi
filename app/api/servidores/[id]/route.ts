import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Servidor from '@/lib/models/Servidor';
import { verifyToken } from '@/lib/auth';

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

    const { id } = await params;
    const body = await request.json();

    const servidor = await Servidor.findByIdAndUpdate(
      id,
      body,
      { new: true, runValidators: true }
    ).populate('sistemaOperacional').populate('servico');

    if (!servidor) {
      return NextResponse.json(
        { error: 'Servidor not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ servidor });
  } catch (error) {
    console.error('Error updating servidor:', error);
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
    
    if (!auth || (auth as any).nivelAcesso !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { id } = await params;
    const servidor = await Servidor.findByIdAndDelete(id);

    if (!servidor) {
      return NextResponse.json(
        { error: 'Servidor not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Servidor deleted successfully' });
  } catch (error) {
    console.error('Error deleting servidor:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
