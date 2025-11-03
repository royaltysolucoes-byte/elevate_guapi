import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Automacao from '@/lib/models/Automacao';
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

    const [automacoes, total] = await Promise.all([
      Automacao.find({}).populate('faixa').sort({ createdAt: -1 }).skip(skip).limit(limit),
      Automacao.countDocuments({}),
    ]);

    return NextResponse.json({
      automacoes,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching automacoes:', error);
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

    const { ip, equipamento, porta, categoria, faixa } = await request.json();

    if (!ip || !equipamento) {
      return NextResponse.json(
        { error: 'IP e Equipamento são obrigatórios' },
        { status: 400 }
      );
    }

    const newAutomacao = await Automacao.create({
      ip,
      equipamento,
      porta,
      categoria: categoria || undefined,
      faixa: faixa || undefined,
    });

    const automacaoPopulada = await Automacao.findById(newAutomacao._id).populate('faixa');

    return NextResponse.json(
      { automacao: automacaoPopulada },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating automacao:', error);
    
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

