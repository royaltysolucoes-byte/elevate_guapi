import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import { verifyToken, hashPassword } from '@/lib/auth';

async function checkAuth(request: NextRequest) {
  const token = request.cookies.get('token')?.value;

  if (!token) {
    return null;
  }

  const payload = await verifyToken(token);
  return payload;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await checkAuth(request);
    
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Apenas admin pode editar usuários
    if (!auth.isAdmin && auth.nivelAcesso !== 'admin') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores podem acessar esta área.' },
        { status: 403 }
      );
    }

    await connectDB();

    const { id } = await params;
    const { fullName, funcao, isAdmin, nivelAcesso, password } = await request.json();
    const updateData: any = { fullName };

    if (funcao) {
      updateData.funcao = funcao;
    }

    // Only admins can change admin status and access level
    if (auth.isAdmin) {
      updateData.isAdmin = isAdmin;
      updateData.nivelAcesso = nivelAcesso;
    }

    // Update password if provided
    if (password && password.trim() !== '') {
      updateData.password = await hashPassword(password);
    }

    const user = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await checkAuth(request);
    
    if (!auth || !auth.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { id } = await params;
    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

