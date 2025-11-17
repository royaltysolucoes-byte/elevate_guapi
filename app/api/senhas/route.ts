import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Senha from '@/lib/models/Senha';
import { verifyToken } from '@/lib/auth';
import { encrypt, decrypt } from '@/lib/utils/encryption';

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
    const search = searchParams.get('search') || '';
    const limit = 10;
    const skip = (page - 1) * limit;

    const searchQuery: any = {};
    if (search) {
      searchQuery.$or = [
        { id: { $regex: search, $options: 'i' } },
        { ip: { $regex: search, $options: 'i' } },
        { equipamento: { $regex: search, $options: 'i' } },
        { categoria: { $regex: search, $options: 'i' } },
      ];
    }

    const [senhasRaw, total] = await Promise.all([
      Senha.find(searchQuery).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Senha.countDocuments(searchQuery),
    ]);

    // Decrypt passwords before sending to frontend
    const senhas = senhasRaw.map(senha => ({
      ...senha.toObject(),
      senha: decrypt(senha.senha)
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

    const { id, ip, equipamento, categoria, senha, confirmarSenha } = await request.json();

    if (!id || !ip || !equipamento || !categoria || !senha) {
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
      ip,
      equipamento,
      categoria,
      senha: encryptedSenha, // Store encrypted password
    });

    // Return decrypted password for frontend
    return NextResponse.json(
      { 
        senha: {
          ...newSenha.toObject(),
          senha: senha
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

