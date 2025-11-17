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

    console.log('Buscando emails com query:', searchQuery);
    console.log('Página:', page, 'Skip:', skip, 'Limit:', limit);

    // Use .lean() to get plain JavaScript objects
    const [emailsRaw, total] = await Promise.all([
      Email.find(searchQuery).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Email.countDocuments(searchQuery),
    ]);

    console.log('Emails encontrados:', emailsRaw.length);
    console.log('Total de emails:', total);

    // Decrypt passwords before sending to frontend
    const emails = (emailsRaw as any[]).map(email => {
      try {
        // Check if senha exists and is not empty
        if (!email.senha || email.senha.trim() === '') {
          console.warn(`Email ${email._id} não tem senha cadastrada`);
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
        let decryptedSenha: string;
        try {
          decryptedSenha = decrypt(email.senha);
          
          // Check if decryption actually worked - if it returns the same encrypted text, it failed
          if (decryptedSenha === email.senha && email.senha.includes(':')) {
            throw new Error('Descriptografia falhou - a senha retornada é igual à criptografada');
          }
          
          console.log(`Senha descriptografada para ${email.email}: ${decryptedSenha ? 'OK' : 'VAZIA'}`);
        } catch (decryptError: any) {
          console.error(`Erro ao descriptografar senha para ${email.email}:`, decryptError.message);
          console.error('Senha criptografada (primeiros 50 chars):', email.senha?.substring(0, 50));
          console.error('Formato da senha:', email.senha?.includes(':') ? 'Formato correto (iv:encrypted)' : 'Formato incorreto');
          console.error('ENCRYPTION_KEY configurada:', process.env.ENCRYPTION_KEY ? 'SIM' : 'NÃO');
          
          // If decryption fails, the password might be in plain text or encrypted with different key
          // Check if it looks like encrypted format (has : separator)
          if (email.senha.includes(':')) {
            // It's encrypted but can't decrypt - probably wrong key
            // Return a clear error message instead of the encrypted text
            decryptedSenha = '[ERRO: Chave de criptografia incorreta. Verifique ENCRYPTION_KEY no .env.local]';
          } else {
            // Maybe it's already plain text?
            decryptedSenha = email.senha;
            console.warn(`Senha para ${email.email} parece estar em texto simples`);
          }
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
          senha: `[ERRO: ${error.message}]`, // Show error message so user knows what's wrong
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

