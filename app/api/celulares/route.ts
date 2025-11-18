import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import mongoose from 'mongoose';
import Celular from '@/lib/models/Celular';
import Categoria from '@/lib/models/Categoria';
import Modelo from '@/lib/models/Modelo';
import { verifyToken } from '@/lib/auth';

// Garantir que os modelos estão registrados
const ensureModelsRegistered = () => {
  if (!mongoose.models.Celular) {
    require('@/lib/models/Celular');
  }
  if (!mongoose.models.Categoria) {
    require('@/lib/models/Categoria');
  }
  if (!mongoose.models.Modelo) {
    require('@/lib/models/Modelo');
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
    const search = searchParams.get('search') || '';
    const limit = 10;
    const skip = (page - 1) * limit;

    const searchQuery: any = {};
    if (search) {
      searchQuery.$or = [
        { numero: { $regex: search, $options: 'i' } },
        { colaborador: { $regex: search, $options: 'i' } },
      ];
    }

    const [celularesRaw, total] = await Promise.all([
      Celular.find(searchQuery)
        .populate({ path: 'categoria', model: 'Categoria', strictPopulate: false })
        .populate({ path: 'modelo', populate: { path: 'marca', model: 'Marca', strictPopulate: false }, model: 'Modelo', strictPopulate: false })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Celular.countDocuments(searchQuery),
    ]);

    const celulares = celularesRaw.map((celular: any) => ({
      _id: celular._id?.toString() || '',
      numero: celular.numero,
      colaborador: celular.colaborador,
      categoria: celular.categoria ? {
        _id: celular.categoria._id?.toString() || '',
        nome: celular.categoria.nome,
      } : null,
      modelo: celular.modelo ? {
        _id: celular.modelo._id?.toString() || '',
        nome: celular.modelo.nome,
        marca: celular.modelo.marca ? {
          _id: celular.modelo.marca._id?.toString() || '',
          nome: celular.modelo.marca.nome,
        } : null,
      } : null,
      createdAt: celular.createdAt ? new Date(celular.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: celular.updatedAt ? new Date(celular.updatedAt).toISOString() : new Date().toISOString(),
    }));

    return NextResponse.json({
      celulares,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching celulares:', error);
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

    const { numero, colaborador, categoria, modelo } = await request.json();

    if (!numero || !colaborador || !categoria || !modelo) {
      return NextResponse.json(
        { error: 'Número, colaborador, categoria e modelo são obrigatórios' },
        { status: 400 }
      );
    }

    const novoCelular = await Celular.create({
      numero,
      colaborador,
      categoria,
      modelo,
    });

    const celularPopulado = await Celular.findById(novoCelular._id)
      .populate({ path: 'categoria', model: 'Categoria', strictPopulate: false })
      .populate({ path: 'modelo', populate: { path: 'marca', model: 'Marca', strictPopulate: false }, model: 'Modelo', strictPopulate: false })
      .lean();

    const celularTyped = celularPopulado as any;

    return NextResponse.json({
      celular: {
        _id: celularTyped._id?.toString() || '',
        numero: celularTyped.numero,
        colaborador: celularTyped.colaborador,
        categoria: celularTyped.categoria ? {
          _id: celularTyped.categoria._id?.toString() || '',
          nome: celularTyped.categoria.nome,
        } : null,
        modelo: celularTyped.modelo ? {
          _id: celularTyped.modelo._id?.toString() || '',
          nome: celularTyped.modelo.nome,
          marca: celularTyped.modelo.marca ? {
            _id: celularTyped.modelo.marca._id?.toString() || '',
            nome: celularTyped.modelo.marca.nome,
          } : null,
        } : null,
        createdAt: celularTyped.createdAt ? new Date(celularTyped.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: celularTyped.updatedAt ? new Date(celularTyped.updatedAt).toISOString() : new Date().toISOString(),
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating celular:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

