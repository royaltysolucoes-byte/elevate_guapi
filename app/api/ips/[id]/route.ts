import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import IP from '@/lib/models/IP';
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

    const ip = await IP.findByIdAndUpdate(
      id,
      body,
      { new: true, runValidators: true }
    );

    if (!ip) {
      return NextResponse.json(
        { error: 'IP not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ ip });
  } catch (error) {
    console.error('Error updating IP:', error);
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
    const ip = await IP.findByIdAndDelete(id);

    if (!ip) {
      return NextResponse.json(
        { error: 'IP not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'IP deleted successfully' });
  } catch (error) {
    console.error('Error deleting IP:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

