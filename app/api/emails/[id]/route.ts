import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Email from '@/lib/models/Email';
import { verifyToken, hashPassword } from '@/lib/auth';
import { encrypt, decrypt } from '@/lib/utils/encryption';
import { registrarAuditoria, sanitizarDadosSensiveis } from '@/lib/utils/auditoria';

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

    // Suporte não pode acessar credenciais
    if (auth.nivelAcesso === 'suporte') {
      return NextResponse.json(
        { error: 'Acesso negado. Você não tem permissão para acessar esta área.' },
        { status: 403 }
      );
    }

    await connectDB();

    const { id } = await params;
    const body = await request.json();

    // Buscar email antigo para auditoria
    const emailAntigo = await Email.findById(id);
    if (!emailAntigo) {
      return NextResponse.json(
        { error: 'Email not found' },
        { status: 404 }
      );
    }

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

    // Registrar auditoria de edição
    await registrarAuditoria({
      usuario: auth.username,
      acao: 'editar',
      entidade: 'email',
      entidadeId: id,
      descricao: `Editou email ${emailAntigo.email} -> ${body.email}`,
      dadosAntigos: sanitizarDadosSensiveis({ email: emailAntigo.email, colaborador: emailAntigo.colaborador, nome: emailAntigo.nome }),
      dadosNovos: sanitizarDadosSensiveis({ email: body.email, colaborador: body.colaborador, nome: body.nome }),
      nivelAcesso: auth.nivelAcesso || 'admin',
      sensivel: true,
      request,
    });

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
    
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Suporte não pode acessar credenciais
    if (auth.nivelAcesso === 'suporte') {
      return NextResponse.json(
        { error: 'Acesso negado. Você não tem permissão para acessar esta área.' },
        { status: 403 }
      );
    }

    await connectDB();

    const { id } = await params;
    const email = await Email.findById(id);

    if (!email) {
      return NextResponse.json(
        { error: 'Email not found' },
        { status: 404 }
      );
    }

    await Email.findByIdAndDelete(id);

    // Registrar auditoria de exclusão
    await registrarAuditoria({
      usuario: auth.username,
      acao: 'excluir',
      entidade: 'email',
      entidadeId: id,
      descricao: `Excluiu email ${email.email} (${email.colaborador})`,
      dadosAntigos: sanitizarDadosSensiveis({ email: email.email, colaborador: email.colaborador, nome: email.nome }),
      nivelAcesso: auth.nivelAcesso || 'admin',
      sensivel: true,
      request,
    });

    return NextResponse.json({ message: 'Email deleted successfully' });
  } catch (error) {
    console.error('Error deleting email:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

