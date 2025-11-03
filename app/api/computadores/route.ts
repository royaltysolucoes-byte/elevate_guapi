import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import mongoose from 'mongoose';
import { verifyToken } from '@/lib/auth';

// Import and ensure models are registered before use
import IP from '@/lib/models/IP';
import SistemaOperacional from '@/lib/models/SistemaOperacional';
import Modelo from '@/lib/models/Modelo';
import Marca from '@/lib/models/Marca';
import Computador from '@/lib/models/Computador';

// Ensure models are registered
const ensureModelsRegistered = () => {
  if (!mongoose.models.IP) {
    require('@/lib/models/IP');
  }
  if (!mongoose.models.SistemaOperacional) {
    require('@/lib/models/SistemaOperacional');
  }
  if (!mongoose.models.Modelo) {
    require('@/lib/models/Modelo');
  }
  if (!mongoose.models.Marca) {
    require('@/lib/models/Marca');
  }
  if (!mongoose.models.Computador) {
    require('@/lib/models/Computador');
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 10;
    const skip = (page - 1) * limit;

    // Get models after ensuring they're registered
    const ComputadorModel = mongoose.models.Computador || Computador;

    const [computadoresRaw, total] = await Promise.all([
      ComputadorModel.find({})
        .populate({ path: 'ip', model: 'IP', strictPopulate: false })
        .populate({ path: 'modelo', populate: { path: 'marca', model: 'Marca', strictPopulate: false }, model: 'Modelo', strictPopulate: false })
        .populate({ path: 'so', model: 'SistemaOperacional', strictPopulate: false })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ComputadorModel.countDocuments({}),
    ]);

    // Serialize computadores to plain objects
    const computadores = computadoresRaw.map((computador: any) => {
      const obj: any = {
        _id: computador._id.toString(),
        nome: computador.nome || '',
        descricaoUsuario: computador.descricaoUsuario || '',
        anydesk: computador.anydesk || '',
        demaisProgramas: computador.demaisProgramas || '',
        createdAt: computador.createdAt?.toString() || new Date().toISOString(),
        updatedAt: computador.updatedAt?.toString() || new Date().toISOString(),
      };

      // Serialize so
      if (computador.so && computador.so._id) {
        obj.so = {
          _id: computador.so._id.toString(),
          nome: computador.so.nome || 'N/A'
        };
      } else {
        obj.so = null;
      }

      // Serialize modelo
      if (computador.modelo && computador.modelo._id) {
        obj.modelo = {
          _id: computador.modelo._id.toString(),
          nome: computador.modelo.nome || 'N/A',
          marca: computador.modelo.marca && computador.modelo.marca._id ? {
            _id: computador.modelo.marca._id.toString(),
            nome: computador.modelo.marca.nome || 'N/A'
          } : null
        };
      } else {
        obj.modelo = null;
      }

      // Serialize ip
      if (computador.ip && computador.ip._id) {
        obj.ip = {
          _id: computador.ip._id.toString(),
          tipo: computador.ip.tipo || null,
          nome: computador.ip.nome || 'N/A',
          faixa: computador.ip.faixa || null,
          vlanNome: computador.ip.vlanNome || null,
          vlanId: computador.ip.vlanId || null,
        };
      } else {
        obj.ip = null;
      }

      return obj;
    });

    return NextResponse.json({
      computadores: computadores || [],
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching computadores:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error', computadores: [] },
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

    const { nome, descricaoUsuario, anydesk, so, demaisProgramas, ip, modelo } = await request.json();

    // Get models after ensuring they're registered
    const ComputadorModel = mongoose.models.Computador || Computador;

    const computador = await ComputadorModel.create({
      nome,
      descricaoUsuario,
      anydesk,
      so,
      demaisProgramas,
      ip: ip || undefined,
      modelo: modelo || undefined,
    });

    const computadorPopuladoRaw = await ComputadorModel.findById(computador._id)
      .populate({ path: 'ip', model: 'IP', strictPopulate: false })
      .populate({ path: 'modelo', populate: { path: 'marca', model: 'Marca', strictPopulate: false }, model: 'Modelo', strictPopulate: false })
      .populate({ path: 'so', model: 'SistemaOperacional', strictPopulate: false })
      .lean();

    if (!computadorPopuladoRaw) {
      return NextResponse.json(
        { error: 'Computador não encontrado após criação' },
        { status: 404 }
      );
    }

    const computadorPopulado = computadorPopuladoRaw as any;

    // Serialize the created computador
    const computadorSerializado: any = {
      _id: computadorPopulado._id.toString(),
      nome: computadorPopulado.nome || '',
      descricaoUsuario: computadorPopulado.descricaoUsuario || '',
      anydesk: computadorPopulado.anydesk || '',
      demaisProgramas: computadorPopulado.demaisProgramas || '',
      createdAt: computadorPopulado.createdAt?.toString() || new Date().toISOString(),
      updatedAt: computadorPopulado.updatedAt?.toString() || new Date().toISOString(),
    };

    // Serialize so
    if (computadorPopulado.so && computadorPopulado.so._id) {
      computadorSerializado.so = {
        _id: computadorPopulado.so._id.toString(),
        nome: computadorPopulado.so.nome || 'N/A'
      };
    } else {
      computadorSerializado.so = null;
    }

    // Serialize modelo
    if (computadorPopulado.modelo && computadorPopulado.modelo._id) {
      computadorSerializado.modelo = {
        _id: computadorPopulado.modelo._id.toString(),
        nome: computadorPopulado.modelo.nome || 'N/A',
        marca: computadorPopulado.modelo.marca && computadorPopulado.modelo.marca._id ? {
          _id: computadorPopulado.modelo.marca._id.toString(),
          nome: computadorPopulado.modelo.marca.nome || 'N/A'
        } : null
      };
    } else {
      computadorSerializado.modelo = null;
    }

    // Serialize ip
    if (computadorPopulado.ip && computadorPopulado.ip._id) {
      computadorSerializado.ip = {
        _id: computadorPopulado.ip._id.toString(),
        tipo: computadorPopulado.ip.tipo || null,
        nome: computadorPopulado.ip.nome || 'N/A',
        faixa: computadorPopulado.ip.faixa || null,
        vlanNome: computadorPopulado.ip.vlanNome || null,
        vlanId: computadorPopulado.ip.vlanId || null,
      };
    } else {
      computadorSerializado.ip = null;
    }

    return NextResponse.json(
      { computador: computadorSerializado },
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

