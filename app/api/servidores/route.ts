import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Servidor from '@/lib/models/Servidor';
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

    const [servidores, total] = await Promise.all([
      Servidor.find({}).populate('sistemaOperacional').populate('servico').sort({ createdAt: -1 }).skip(skip).limit(limit),
      Servidor.countDocuments({}),
    ]);

    return NextResponse.json({
      servidores,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching servidores:', error);
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

    const { ip, nome, sistemaOperacional, status, servico } = await request.json();

    if (!ip || !nome || !sistemaOperacional || !servico) {
      return NextResponse.json(
        { error: 'IP, Nome, Sistema Operacional e Serviço são obrigatórios' },
        { status: 400 }
      );
    }

    const newServidor = await Servidor.create({
      ip,
      nome,
      sistemaOperacional,
      status: status || 'ativo',
      servico,
    });

    const servidorPopulado = await Servidor.findById(newServidor._id).populate('sistemaOperacional').populate('servico');

    return NextResponse.json(
      { servidor: servidorPopulado },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating servidor:', error);
    
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
