import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Email from '@/lib/models/Email';
import { verifyToken } from '@/lib/auth';
import { encrypt, decrypt } from '@/lib/utils/encryption';

async function checkAuth(request: NextRequest) {
  const token = request.cookies.get('token')?.value;

  if (!token) {
    return null;
  }

  const payload = await verifyToken(token);
  // Only admin can migrate
  if (!payload || !payload.isAdmin) {
    return null;
  }
  return payload;
}

export async function POST(request: NextRequest) {
  try {
    const auth = await checkAuth(request);
    
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized. Apenas administradores podem executar esta operação.' },
        { status: 401 }
      );
    }

    const { oldEncryptionKey } = await request.json();

    if (!oldEncryptionKey) {
      return NextResponse.json(
        { error: 'Chave de criptografia antiga é obrigatória' },
        { status: 400 }
      );
    }

    await connectDB();

    // Get all emails
    const emails = await Email.find({}).lean();
    
    if (emails.length === 0) {
      return NextResponse.json(
        { message: 'Nenhum email encontrado para migrar', migrated: 0 },
        { status: 200 }
      );
    }

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Migrate each email
    for (const email of emails) {
      try {
        // Skip if senha is empty
        if (!email.senha || email.senha.trim() === '') {
          console.warn(`Email ${email.email} não tem senha, pulando...`);
          continue;
        }

        // Try to decrypt with old key
        let decryptedSenha: string;
        try {
          decryptedSenha = decrypt(email.senha, oldEncryptionKey);
          
          // Check if decryption actually worked
          if (decryptedSenha === email.senha && email.senha.includes(':')) {
            throw new Error('Descriptografia falhou - a senha retornada é igual à criptografada');
          }
        } catch (decryptError: any) {
          errorCount++;
          errors.push(`${email.email}: Erro ao descriptografar com chave antiga - ${decryptError.message}`);
          console.error(`Erro ao descriptografar ${email.email}:`, decryptError.message);
          continue;
        }

        // Encrypt with new key
        const newEncryptedSenha = encrypt(decryptedSenha);

        // Update in database
        await Email.updateOne(
          { _id: email._id },
          { $set: { senha: newEncryptedSenha } }
        );

        successCount++;
        console.log(`Email ${email.email} migrado com sucesso`);
      } catch (error: any) {
        errorCount++;
        errors.push(`${email.email}: ${error.message}`);
        console.error(`Erro ao migrar email ${email.email}:`, error.message);
      }
    }

    return NextResponse.json(
      {
        message: `Migração concluída: ${successCount} emails migrados com sucesso, ${errorCount} erros`,
        migrated: successCount,
        errors: errorCount,
        errorDetails: errors.length > 0 ? errors : undefined,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error migrating emails:', error);
    return NextResponse.json(
      { error: 'Erro interno ao migrar emails', details: error.message },
      { status: 500 }
    );
  }
}

