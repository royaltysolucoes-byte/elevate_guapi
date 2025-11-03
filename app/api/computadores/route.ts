import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Computador from '@/lib/models/Computador';
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

    const [computadores, total] = await Promise.all([
      Computador.find({}).populate('ip').populate('modelo').populate('so').sort({ createdAt: -1 }).skip(skip).limit(limit),
      Computador.countDocuments({}),
    ]);

    return NextResponse.json({
      computadores,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching computadores:', error);
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

    const { nome, descricaoUsuario, anydesk, so, demaisProgramas, ip, modelo } = await request.json();

    const computador = await Computador.create({
      nome,
      descricaoUsuario,
      anydesk,
      so,
      demaisProgramas,
      ip: ip || undefined,
      modelo: modelo || undefined,
    });

    const computadorPopulado = await Computador.findById(computador._id).populate('ip').populate('modelo').populate('so');

    return NextResponse.json(
      { computador: computadorPopulado },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating computador:', error);
    
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

