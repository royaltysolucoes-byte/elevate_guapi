import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Conectividade from '@/lib/models/Conectividade';
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

    // Get filter parameters
    const search = searchParams.get('search') || '';
    const categoria = searchParams.get('categoria') || '';
    const tipo = searchParams.get('tipo') || '';
    const servico = searchParams.get('servico') || '';
    const modelo = searchParams.get('modelo') || '';

    // Build filter object
    const filter: any = {};

    if (search) {
      filter.$or = [
        { nome: { $regex: search, $options: 'i' } },
        { ip: { $regex: search, $options: 'i' } },
      ];
    }

    if (categoria) {
      filter.categoria = categoria;
    }

    if (tipo) {
      filter.tipo = tipo;
    }

    if (servico) {
      filter.servico = servico;
    }

    if (modelo) {
      filter.modelo = modelo;
    }

    const [conectividades, total] = await Promise.all([
      Conectividade.find(filter).populate('categoria').populate('tipo').populate('servico').populate('modelo').sort({ createdAt: -1 }).skip(skip).limit(limit),
      Conectividade.countDocuments(filter),
    ]);

    return NextResponse.json({
      conectividades,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching conectividades:', error);
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

    const { nome, ip, categoria, tipo, servico, modelo } = await request.json();

    if (!nome || !ip || !tipo || !servico || !modelo) {
      return NextResponse.json(
        { error: 'Nome, IP, Tipo, Serviço e Modelo são obrigatórios' },
        { status: 400 }
      );
    }

    const newConectividade = await Conectividade.create({
      nome,
      ip,
      categoria: categoria || undefined,
      tipo,
      servico,
      modelo,
    });

    const conectividadePopulada = await Conectividade.findById(newConectividade._id).populate('categoria').populate('tipo').populate('servico').populate('modelo');

    return NextResponse.json(
      { conectividade: conectividadePopulada },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating conectividade:', error);
    
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

