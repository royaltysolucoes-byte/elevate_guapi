import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import mongoose from 'mongoose';
import Senha from '@/lib/models/Senha';
import Servico from '@/lib/models/Servico';
import { verifyToken } from '@/lib/auth';
import { encrypt, decrypt } from '@/lib/utils/encryption';

// Ensure models are registered
const ensureModelsRegistered = () => {
  if (!mongoose.models.Servico) {
    require('@/lib/models/Servico');
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
        { id: { $regex: search, $options: 'i' } },
        { categoria: { $regex: search, $options: 'i' } },
      ];
    }

    const [senhasRaw, total] = await Promise.all([
      Senha.find(searchQuery).populate('servico').sort({ createdAt: -1 }).skip(skip).limit(limit),
      Senha.countDocuments(searchQuery),
    ]);

    // Decrypt passwords before sending to frontend
    const senhas = senhasRaw.map((senha: any) => ({
      _id: senha._id.toString(),
      id: senha.id,
      servico: senha.servico && typeof senha.servico === 'object' ? {
        _id: senha.servico._id.toString(),
        nome: senha.servico.nome
      } : null,
      categoria: senha.categoria,
      senha: decrypt(senha.senha),
      createdAt: senha.createdAt,
      updatedAt: senha.updatedAt,
    }));

    return NextResponse.json({
      senhas,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching senhas:', error);
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

    const { id, servico, categoria, senha, confirmarSenha } = await request.json();

    if (!id || !servico || !categoria || !senha) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar confirmação de senha
    if (senha !== confirmarSenha) {
      return NextResponse.json(
        { error: 'As senhas não coincidem' },
        { status: 400 }
      );
    }

    // Encrypt password before storing
    const encryptedSenha = encrypt(senha);

    const newSenha = await Senha.create({
      id,
      servico,
      categoria,
      senha: encryptedSenha, // Store encrypted password
    });

    const senhaPopulada = await Senha.findById(newSenha._id).populate('servico');

    // Return decrypted password for frontend
    const senhaData = senhaPopulada as any;
    return NextResponse.json(
      { 
        senha: {
          _id: senhaData._id.toString(),
          id: senhaData.id,
          servico: senhaData.servico && typeof senhaData.servico === 'object' ? {
            _id: senhaData.servico._id.toString(),
            nome: senhaData.servico.nome
          } : null,
          categoria: senhaData.categoria,
          senha: senha,
          createdAt: senhaData.createdAt,
          updatedAt: senhaData.updatedAt,
        }
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating senha:', error);

    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Esta senha já está cadastrada' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

