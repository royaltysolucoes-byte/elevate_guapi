import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import { verifyToken } from '@/lib/auth';

async function checkAuth(request: NextRequest) {
  const token = request.cookies.get('token')?.value;

  if (!token) {
    return null;
  }

  const payload = await verifyToken(token);
  
  if (!payload) {
    return null;
  }

  return payload;
}

async function checkAdminAuth(request: NextRequest) {
  const auth = await checkAuth(request);
  
  if (!auth || !auth.isAdmin) {
    return null;
  }

  return auth;
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

    // Para tarefas, qualquer usuário autenticado pode ver a lista de usuários
    // Mas apenas admins podem ver todos os dados na página de usuários
    const users = await User.find({}, { password: 0 }).sort({ createdAt: -1 }).lean();

    return NextResponse.json({ 
      users: users.map(user => ({
        _id: user._id.toString(),
        username: user.username,
        fullName: user.fullName,
        funcao: user.funcao,
        isAdmin: user.isAdmin,
        nivelAcesso: user.nivelAcesso,
        createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: user.updatedAt ? new Date(user.updatedAt).toISOString() : new Date().toISOString(),
      }))
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await checkAdminAuth(request);
    
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { username, password, fullName, funcao, isAdmin, nivelAcesso } = await request.json();

    if (!username || !password || !fullName) {
      return NextResponse.json(
        { error: 'Username, password, and full name are required' },
        { status: 400 }
      );
    }

    const existingUser = await User.findOne({ username: username.toLowerCase() });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 400 }
      );
    }

    const hashedPassword = await import('@/lib/auth').then((m) => m.hashPassword(password));

    const user = await User.create({
      username: username.toLowerCase(),
      password: hashedPassword,
      fullName,
      funcao: funcao || 'Consultor TI',
      isAdmin: isAdmin || false,
      nivelAcesso: nivelAcesso || 'suporte',
    });

    return NextResponse.json({
      user: {
        _id: user._id,
        username: user.username,
        fullName: user.fullName,
        funcao: user.funcao,
        isAdmin: user.isAdmin,
        nivelAcesso: user.nivelAcesso,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

