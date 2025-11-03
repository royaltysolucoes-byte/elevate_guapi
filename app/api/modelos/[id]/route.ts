import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Modelo from '@/lib/models/Modelo';
import { verifyToken } from '@/lib/auth';

async function checkAuth(request: NextRequest) {
  const token = request.cookies.get('token')?.value;

  if (!token) {
    return null;
  }

  const payload = await verifyToken(token);
  return payload;
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
    const modelo = await Modelo.findByIdAndDelete(id);

    if (!modelo) {
      return NextResponse.json(
        { error: 'Modelo not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Modelo deleted successfully' });
  } catch (error) {
    console.error('Error deleting modelo:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

