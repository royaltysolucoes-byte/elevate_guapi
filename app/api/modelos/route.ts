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

    const modelos = await Modelo.find({}).populate('marca').sort({ nome: 1 });

    return NextResponse.json({ modelos });
  } catch (error) {
    console.error('Error fetching modelos:', error);
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

    const { nome, marca } = await request.json();

    if (!nome || !marca) {
      return NextResponse.json(
        { error: 'Nome e Marca são obrigatórios' },
        { status: 400 }
      );
    }

    const modelo = await Modelo.create({ nome, marca });

    const populatedModelo = await Modelo.findById(modelo._id).populate('marca');

    return NextResponse.json(
      { modelo: populatedModelo },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating modelo:', error);
    
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Este modelo já existe para esta marca' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

