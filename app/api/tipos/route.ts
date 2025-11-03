import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Tipo from '@/lib/models/Tipo';
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

    const tipos = await Tipo.find({}).sort({ nome: 1 });

    return NextResponse.json({ tipos });
  } catch (error) {
    console.error('Error fetching tipos:', error);
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

    const tipo = await Tipo.create({ nome });

    return NextResponse.json(
      { tipo },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating tipo:', error);
    
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Este tipo já existe' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

