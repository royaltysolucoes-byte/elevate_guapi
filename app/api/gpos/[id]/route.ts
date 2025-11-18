import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import GPO from '@/lib/models/GPO';
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

    const gpo = await GPO.findByIdAndUpdate(
      id,
      body,
      { new: true, runValidators: true }
    ).populate('servidor');

    if (!gpo) {
      return NextResponse.json(
        { error: 'GPO not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ gpo });
  } catch (error) {
    console.error('Error updating gpo:', error);
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
    const gpo = await GPO.findByIdAndDelete(id);

    if (!gpo) {
      return NextResponse.json(
        { error: 'GPO not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'GPO deleted successfully' });
  } catch (error) {
    console.error('Error deleting gpo:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

