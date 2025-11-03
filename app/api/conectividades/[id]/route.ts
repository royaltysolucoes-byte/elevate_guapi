import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Conectividade from '@/lib/models/Conectividade';
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

    const conectividade = await Conectividade.findByIdAndUpdate(
      id,
      body,
      { new: true, runValidators: true }
    ).populate('categoria').populate('tipo').populate('servico').populate('modelo');

    if (!conectividade) {
      return NextResponse.json(
        { error: 'Conectividade not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ conectividade });
  } catch (error) {
    console.error('Error updating conectividade:', error);
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
    const conectividade = await Conectividade.findByIdAndDelete(id);

    if (!conectividade) {
      return NextResponse.json(
        { error: 'Conectividade not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Conectividade deleted successfully' });
  } catch (error) {
    console.error('Error deleting conectividade:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

