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

    const [emailsRaw, total] = await Promise.all([
      Email.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Email.countDocuments({}),
    ]);

    // Decrypt passwords before sending to frontend
    const emails = emailsRaw.map(email => ({
      ...email.toObject(),
      senha: decrypt(email.senha)
    }));

    return NextResponse.json({
      emails,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching emails:', error);
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

    const { email, colaborador, nome, senha } = await request.json();

    if (!email || !colaborador || !nome || !senha) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Encrypt password before storing
    const encryptedSenha = encrypt(senha);

    const newEmail = await Email.create({
      email,
      colaborador,
      nome,
      senha: encryptedSenha, // Store encrypted password
    });

    // Return decrypted password for frontend
    return NextResponse.json(
      { 
        email: {
          ...newEmail.toObject(),
          senha: senha
        }
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating email:', error);
    
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Este email já está cadastrado' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

