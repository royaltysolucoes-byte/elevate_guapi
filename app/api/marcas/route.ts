import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Marca from '@/lib/models/Marca';
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

    const marcas = await Marca.find({}).sort({ nome: 1 });

    return NextResponse.json({ marcas });
  } catch (error) {
    console.error('Error fetching marcas:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await checkAuth(request);
    
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { nome } = await request.json();

    if (!nome) {
      return NextResponse.json(
        { error: 'Nome is required' },
        { status: 400 }
      );
    }

    const marca = await Marca.create({ nome });

    return NextResponse.json(
      { marca },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating marca:', error);
    
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Esta marca já existe' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

