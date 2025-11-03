import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Email from '@/lib/models/Email';
import { verifyToken, hashPassword } from '@/lib/auth';
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
      email: body.email,
      colaborador: body.colaborador,
      nome: body.nome,
    };

    // If senha is being updated, encrypt it
    if (body.senha && body.senha.trim() !== '') {
      updateData.senha = encrypt(body.senha);
    }

    const emailUpdated = await Email.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!emailUpdated) {
      return NextResponse.json(
        { error: 'Email not found' },
        { status: 404 }
      );
    }

    // Return decrypted password for frontend
    return NextResponse.json({ 
      email: {
        ...emailUpdated.toObject(),
        senha: body.senha || decrypt(emailUpdated.senha)
      }
    });
  } catch (error) {
    console.error('Error updating email:', error);
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
    const email = await Email.findByIdAndDelete(id);

    if (!email) {
      return NextResponse.json(
        { error: 'Email not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Email deleted successfully' });
  } catch (error) {
    console.error('Error deleting email:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

