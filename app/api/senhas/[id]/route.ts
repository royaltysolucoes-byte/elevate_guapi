import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import mongoose from 'mongoose';
import Senha from '@/lib/models/Senha';
import Servico from '@/lib/models/Servico';
import { verifyToken } from '@/lib/auth';
import { encrypt, decrypt } from '@/lib/utils/encryption';
import { registrarAuditoria, sanitizarDadosSensiveis } from '@/lib/utils/auditoria';

// Ensure models are registered
const ensureModelsRegistered = () => {
  if (!mongoose.models.Servico) {
    require('@/lib/models/Servico');
  }
};

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
    ensureModelsRegistered();

    const { id } = await params;
    const body = await request.json();

    // Buscar senha antiga para auditoria
    const senhaAntiga = await Senha.findById(id);
    if (!senhaAntiga) {
      return NextResponse.json(
        { error: 'Senha not found' },
        { status: 404 }
      );
    }

    // Build update object, only include senha if provided
    const updateData: any = {
      id: body.id,
      servico: body.servico,
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
    ).populate('servico');

    if (!senhaUpdated) {
      return NextResponse.json(
        { error: 'Senha not found' },
        { status: 404 }
      );
    }

    // Registrar auditoria de edição
    const username = 'username' in auth && typeof auth.username === 'string' ? auth.username : '';
    const nivelAcesso = 'nivelAcesso' in auth && typeof auth.nivelAcesso === 'string' ? auth.nivelAcesso : 'admin';
    
    await registrarAuditoria({
      usuario: username,
      acao: 'editar',
      entidade: 'senha',
      entidadeId: id,
      descricao: `Editou senha ${senhaAntiga.id} -> ${body.id} (${body.categoria})`,
      dadosAntigos: sanitizarDadosSensiveis({ id: senhaAntiga.id, categoria: senhaAntiga.categoria }),
      dadosNovos: sanitizarDadosSensiveis({ id: body.id, categoria: body.categoria }),
      nivelAcesso: nivelAcesso,
      sensivel: true,
      request,
    });

    // Return decrypted password for frontend
    const senhaData = senhaUpdated as any;
    return NextResponse.json({ 
      senha: {
        _id: senhaData._id.toString(),
        id: senhaData.id,
        servico: senhaData.servico && typeof senhaData.servico === 'object' ? {
          _id: senhaData.servico._id.toString(),
          nome: senhaData.servico.nome
        } : null,
        categoria: senhaData.categoria,
        senha: body.senha || decrypt(senhaData.senha),
        createdAt: senhaData.createdAt,
        updatedAt: senhaData.updatedAt,
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
    const senha = await Senha.findById(id);

    if (!senha) {
      return NextResponse.json(
        { error: 'Senha not found' },
        { status: 404 }
      );
    }

    await Senha.findByIdAndDelete(id);

    // Registrar auditoria de exclusão
    const username = 'username' in auth && typeof auth.username === 'string' ? auth.username : '';
    const nivelAcesso = 'nivelAcesso' in auth && typeof auth.nivelAcesso === 'string' ? auth.nivelAcesso : 'admin';
    
    await registrarAuditoria({
      usuario: username,
      acao: 'excluir',
      entidade: 'senha',
      entidadeId: id,
      descricao: `Excluiu senha ${senha.id} (${senha.categoria})`,
      dadosAntigos: sanitizarDadosSensiveis({ id: senha.id, categoria: senha.categoria }),
      nivelAcesso: nivelAcesso,
      sensivel: true,
      request,
    });

    return NextResponse.json({ message: 'Senha deleted successfully' });
  } catch (error) {
    console.error('Error deleting senha:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

