import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Computador from '@/lib/models/Computador';
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

    const computador = await Computador.findByIdAndUpdate(
      id,
      updateBody,
      { new: true, runValidators: true }
    ).populate('ip').populate('modelo').populate('so');

    if (!computador) {
      return NextResponse.json(
        { error: 'Computador not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ computador });
  } catch (error) {
    console.error('Error updating computador:', error);
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
    const computador = await Computador.findByIdAndDelete(id);

    if (!computador) {
      return NextResponse.json(
        { error: 'Computador not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Computador deleted successfully' });
  } catch (error) {
    console.error('Error deleting computador:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


