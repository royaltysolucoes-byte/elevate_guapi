import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import RelogioPonto from '@/lib/models/RelogioPonto';
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

    // Remove empty strings from body to avoid ObjectId casting errors
    const updateBody = Object.fromEntries(
      Object.entries(body).filter(([_, value]) => value !== '')
    );

    const relogio = await RelogioPonto.findByIdAndUpdate(
      id,
      updateBody,
      { new: true, runValidators: true }
    ).populate('faixa').populate({ path: 'modelo', populate: { path: 'marca' } }).populate('tipo');

    if (!relogio) {
      return NextResponse.json(
        { error: 'Relogio Ponto not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ relogio });
  } catch (error) {
    console.error('Error updating relogio ponto:', error);
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
    const relogio = await RelogioPonto.findByIdAndDelete(id);

    if (!relogio) {
      return NextResponse.json(
        { error: 'Relogio Ponto not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Relogio Ponto deleted successfully' });
  } catch (error) {
    console.error('Error deleting relogio ponto:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

