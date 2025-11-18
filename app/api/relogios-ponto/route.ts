import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import mongoose from 'mongoose';
import RelogioPonto from '@/lib/models/RelogioPonto';
import { verifyToken } from '@/lib/auth';

// Import and ensure models are registered before use
import Modelo from '@/lib/models/Modelo';
import Tipo from '@/lib/models/Tipo';
import IP from '@/lib/models/IP';
import Marca from '@/lib/models/Marca';

// Ensure models are registered
const ensureModelsRegistered = () => {
  if (!mongoose.models.Modelo) {
    require('@/lib/models/Modelo');
  }
  if (!mongoose.models.Tipo) {
    require('@/lib/models/Tipo');
  }
  if (!mongoose.models.IP) {
    require('@/lib/models/IP');
  }
  if (!mongoose.models.Marca) {
    require('@/lib/models/Marca');
  }
};

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
    ensureModelsRegistered();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 10;
    const skip = (page - 1) * limit;

    const [relogios, total] = await Promise.all([
      RelogioPonto.find({}).populate('faixa').populate({ path: 'modelo', populate: { path: 'marca' } }).populate('tipo').sort({ createdAt: -1 }).skip(skip).limit(limit),
      RelogioPonto.countDocuments({}),
    ]);

    return NextResponse.json({
      relogios,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching relogios ponto:', error);
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
    ensureModelsRegistered();

    const { setor, numeroSerie, tipo, enderecoIP, categoria, faixa, modelo } = await request.json();

    if (!setor || !numeroSerie || !tipo || !enderecoIP) {
      return NextResponse.json(
        { error: 'Setor, Número de Série, Tipo e Endereço IP são obrigatórios' },
        { status: 400 }
      );
    }

    const newRelogio = await RelogioPonto.create({
      setor,
      numeroSerie,
      tipo,
      enderecoIP,
      categoria: categoria || undefined,
      faixa: faixa || undefined,
      modelo: modelo || undefined,
    });

    const relogioPopulado = await RelogioPonto.findById(newRelogio._id).populate('faixa').populate({ path: 'modelo', populate: { path: 'marca' } }).populate('tipo');

    return NextResponse.json(
      { relogio: relogioPopulado },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating relogio ponto:', error);
    
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

