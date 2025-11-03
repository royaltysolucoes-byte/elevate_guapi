import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import mongoose from 'mongoose';
import { verifyToken } from '@/lib/auth';

// Import and ensure models are registered before use
import Modelo from '@/lib/models/Modelo';
import Marca from '@/lib/models/Marca';

// Ensure models are registered
const ensureModelsRegistered = () => {
  if (!mongoose.models.Marca) {
    require('@/lib/models/Marca');
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
    
    // Ensure all models are registered
    ensureModelsRegistered();

    // Get models after ensuring they're registered
    const ModeloModel = mongoose.models.Modelo || Modelo;
    
    const modelosRaw = await ModeloModel.find({})
      .populate({ path: 'marca', model: 'Marca', strictPopulate: false })
      .sort({ nome: 1 })
      .lean();

    console.log('Modelos encontrados:', modelosRaw.length);
    
    // Convert to plain objects
    const modelos = modelosRaw.map((modelo: any) => {
      const obj: any = {
        _id: modelo._id.toString(),
        nome: modelo.nome || '',
        createdAt: modelo.createdAt?.toString() || new Date().toISOString(),
        updatedAt: modelo.updatedAt?.toString() || new Date().toISOString(),
      };

      // Serialize marca
      if (modelo.marca && modelo.marca._id) {
        obj.marca = {
          _id: modelo.marca._id.toString(),
          nome: modelo.marca.nome || 'N/A'
        };
      } else {
        obj.marca = null;
      }

      return obj;
    });
    
    return NextResponse.json({ modelos: modelos || [] });
  } catch (error: any) {
    console.error('Error fetching modelos:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error', modelos: [] },
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
    
    // Ensure all models are registered
    ensureModelsRegistered();

    const { nome, marca } = await request.json();

    console.log('Criando modelo:', { nome, marca });

    if (!nome || !marca) {
      return NextResponse.json(
        { error: 'Nome e Marca são obrigatórios' },
        { status: 400 }
      );
    }

    // Get models after ensuring they're registered
    const ModeloModel = mongoose.models.Modelo || Modelo;
    
    // Verificar se já existe um modelo com o mesmo nome e marca
    const existingModelo = await ModeloModel.findOne({ 
      nome: nome.trim(), 
      marca: marca 
    });

    console.log('Modelo existente encontrado:', existingModelo);

    if (existingModelo) {
      return NextResponse.json(
        { error: 'Este modelo já existe para esta marca' },
        { status: 400 }
      );
    }

    const modelo = await ModeloModel.create({ 
      nome: nome.trim(), 
      marca 
    });

    const populatedModelo = await ModeloModel.findById(modelo._id).populate({ path: 'marca', model: 'Marca', strictPopulate: false }).lean();

    if (!populatedModelo) {
      return NextResponse.json(
        { error: 'Modelo não encontrado após criação' },
        { status: 404 }
      );
    }

    const modeloData = populatedModelo as any;

    // Serializar o modelo populado
    const modeloSerializado = {
      _id: modeloData._id.toString(),
      nome: modeloData.nome || '',
      marca: modeloData.marca && modeloData.marca._id ? {
        _id: modeloData.marca._id.toString(),
        nome: modeloData.marca.nome || 'N/A'
      } : null,
      createdAt: modeloData.createdAt?.toString() || new Date().toISOString(),
      updatedAt: modeloData.updatedAt?.toString() || new Date().toISOString(),
    };

    return NextResponse.json(
      { modelo: modeloSerializado },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating modelo:', error);
    
    if (error.code === 11000) {
      console.error('Duplicate key error:', error.keyPattern);
      return NextResponse.json(
        { error: 'Este modelo já existe para esta marca' },
        { status: 400 }
      );
    }

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { error: errors.join(', ') },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

