import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Categoria from '@/lib/models/Categoria';
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
    
    if (!auth || !auth.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { id } = await params;
    const categoria = await Categoria.findByIdAndDelete(id);

    if (!categoria) {
      return NextResponse.json(
        { error: 'Categoria not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Categoria deleted successfully' });
  } catch (error) {
    console.error('Error deleting categoria:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


