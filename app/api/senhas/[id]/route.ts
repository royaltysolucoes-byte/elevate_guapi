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

    await connectDB();

    const { id } = await params;
    const body = await request.json();

    // Build update object, only include senha if provided
    const updateData: any = {
      id: body.id,
      ip: body.ip,
      equipamento: body.equipamento,
      categoria: body.categoria,
    };

    // If senha is being updated, encrypt it
    if (body.senha && body.senha.trim() !== '') {
      updateData.senha = encrypt(body.senha);
    }

    const senhaUpdated = await Senha.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!senhaUpdated) {
      return NextResponse.json(
        { error: 'Senha not found' },
        { status: 404 }
      );
    }

    // Return decrypted password for frontend
    return NextResponse.json({ 
      senha: {
        ...senhaUpdated.toObject(),
        senha: body.senha || decrypt(senhaUpdated.senha)
      }
    });
  } catch (error) {
    console.error('Error updating senha:', error);
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

    if (!auth || (auth as any).nivelAcesso !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { id } = await params;
    const senha = await Senha.findByIdAndDelete(id);

    if (!senha) {
      return NextResponse.json(
        { error: 'Senha not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Senha deleted successfully' });
  } catch (error) {
    console.error('Error deleting senha:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

