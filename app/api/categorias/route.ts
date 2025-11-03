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

export async function GET(request: NextRequest) {
  try {
    const auth = await checkAuth(request);
    
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const categorias = await Categoria.find({}).sort({ createdAt: -1 });

    return NextResponse.json({ categorias });
  } catch (error) {
    console.error('Error fetching categorias:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await checkAuth(request);
    
    if (!auth || !auth.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { nome } = await request.json();

    const categoria = await Categoria.create({ nome });

    return NextResponse.json(
      { categoria },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating categoria:', error);
    
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Esta categoria já existe' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


