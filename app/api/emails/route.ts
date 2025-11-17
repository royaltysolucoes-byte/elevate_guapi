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
    const search = searchParams.get('search') || '';
    const limit = 10;
    const skip = (page - 1) * limit;

    const searchQuery: any = {};
    if (search) {
      searchQuery.$or = [
        { email: { $regex: search, $options: 'i' } },
        { colaborador: { $regex: search, $options: 'i' } },
        { nome: { $regex: search, $options: 'i' } },
      ];
    }

    // Use .lean() to get plain JavaScript objects
    const [emailsRaw, total] = await Promise.all([
      Email.find(searchQuery).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Email.countDocuments(searchQuery),
    ]);

    // Decrypt passwords before sending to frontend
    const emails = (emailsRaw as any[]).map(email => {
      try {
        // Check if senha exists and is not empty
        if (!email.senha || email.senha.trim() === '') {
          return {
            _id: email._id.toString(),
            email: email.email,
            colaborador: email.colaborador,
            nome: email.nome,
            senha: '',
            createdAt: email.createdAt ? new Date(email.createdAt).toISOString() : new Date().toISOString(),
            updatedAt: email.updatedAt ? new Date(email.updatedAt).toISOString() : new Date().toISOString(),
          };
        }

        // Try to decrypt
        let decryptedSenha: string = '';
        try {
          if (!email.senha || email.senha.trim() === '') {
            decryptedSenha = '';
          } else if (email.senha.includes(':')) {
            // Está no formato criptografado, tenta descriptografar
            try {
              decryptedSenha = decrypt(email.senha);
              // Verifica se a descriptografia funcionou (não deve retornar o mesmo texto)
              if (decryptedSenha === email.senha) {
                // Descriptografia falhou silenciosamente, tenta retornar vazio
                console.warn(`Descriptografia retornou mesmo texto para ${email.email}, pode estar com chave incorreta`);
                decryptedSenha = '';
              }
            } catch (decryptErr: any) {
              console.error(`Erro ao descriptografar ${email.email}:`, decryptErr.message);
              // Se falhar, retorna vazio em vez do texto criptografado
              decryptedSenha = '';
            }
          } else {
            // Não está criptografado, pode ser texto simples
            decryptedSenha = email.senha;
          }
        } catch (error: any) {
          console.error(`Erro geral ao processar senha de ${email.email}:`, error.message);
          decryptedSenha = '';
        }
        
        return {
          _id: email._id.toString(),
          email: email.email,
          colaborador: email.colaborador,
          nome: email.nome,
          senha: decryptedSenha || '',
          createdAt: email.createdAt ? new Date(email.createdAt).toISOString() : new Date().toISOString(),
          updatedAt: email.updatedAt ? new Date(email.updatedAt).toISOString() : new Date().toISOString(),
        };
      } catch (error: any) {
        console.error(`Erro geral ao processar email ${email.email}:`, error.message);
        return {
          _id: email._id.toString(),
          email: email.email,
          colaborador: email.colaborador,
          nome: email.nome,
          senha: '', // Retorna vazio em caso de erro
          createdAt: email.createdAt ? new Date(email.createdAt).toISOString() : new Date().toISOString(),
          updatedAt: email.updatedAt ? new Date(email.updatedAt).toISOString() : new Date().toISOString(),
        };
      }
    });

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

