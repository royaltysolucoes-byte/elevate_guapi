import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Impressora from '@/lib/models/Impressora';
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 10;
    const skip = (page - 1) * limit;

    const [impressoras, total] = await Promise.all([
      Impressora.find({}).populate('faixa').populate('modelo').populate('tipo').sort({ createdAt: -1 }).skip(skip).limit(limit),
      Impressora.countDocuments({}),
    ]);

    return NextResponse.json({
      impressoras,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching impressoras:', error);
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

    const { setor, numeroSerie, tipo, enderecoIP, categoria, faixa, modelo } = await request.json();

    if (!setor || !numeroSerie || !tipo || !enderecoIP) {
      return NextResponse.json(
        { error: 'Setor, Número de Série, Tipo e Endereço IP são obrigatórios' },
        { status: 400 }
      );
    }

    const newImpressora = await Impressora.create({
      setor,
      numeroSerie,
      tipo,
      enderecoIP,
      categoria: categoria || undefined,
      faixa: faixa || undefined,
      modelo: modelo || undefined,
    });

    return NextResponse.json(
      { impressora: newImpressora },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating impressora:', error);
    
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Esta impressora já está cadastrada' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

