import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import mongoose from 'mongoose';
import Documento from '@/lib/models/Documento';
import { verifyToken } from '@/lib/auth';
import { unlink } from 'fs/promises';
import { existsSync } from 'fs';

// Ensure models are registered
const ensureModelsRegistered = () => {
  if (!mongoose.models.Documento) {
    require('@/lib/models/Documento');
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

export async function GET(
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
    ensureModelsRegistered();

    const { id } = await params;
    const documento = await Documento.findById(id);

    if (!documento) {
      return NextResponse.json(
        { error: 'Documento não encontrado' },
        { status: 404 }
      );
    }

    // Ler arquivo e retornar
    const { readFile } = await import('fs/promises');
    const fileBuffer = await readFile(documento.caminhoArquivo);

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': documento.tipoMime,
        'Content-Disposition': `attachment; filename="${documento.nomeArquivo}"`,
        'Content-Length': documento.tamanho.toString(),
      },
    });
  } catch (error: any) {
    console.error('Error fetching documento file:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
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

    // Verificar permissões
    if ((auth as any).nivelAcesso === 'suporte') {
      return NextResponse.json(
        { error: 'Você não tem permissão para editar documentos' },
        { status: 403 }
      );
    }

    await connectDB();
    ensureModelsRegistered();

    const { id } = await params;
    const { nome } = await request.json();

    if (!nome || nome.trim() === '') {
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      );
    }

    const documento = await Documento.findByIdAndUpdate(
      id,
      { nome: nome.trim() },
      { new: true, runValidators: true }
    );

    if (!documento) {
      return NextResponse.json(
        { error: 'Documento não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ documento });
  } catch (error: any) {
    console.error('Error updating documento:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
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

    // Verificar permissões - apenas admin pode deletar
    if ((auth as any).nivelAcesso !== 'admin' && !(auth as any).isAdmin) {
      return NextResponse.json(
        { error: 'Apenas administradores podem excluir documentos' },
        { status: 403 }
      );
    }

    await connectDB();
    ensureModelsRegistered();

    const { id } = await params;
    const documento = await Documento.findById(id);

    if (!documento) {
      return NextResponse.json(
        { error: 'Documento não encontrado' },
        { status: 404 }
      );
    }

    // Deletar arquivo físico
    if (existsSync(documento.caminhoArquivo)) {
      try {
        await unlink(documento.caminhoArquivo);
      } catch (fileError) {
        console.error('Error deleting file:', fileError);
        // Continuar mesmo se não conseguir deletar o arquivo
      }
    }

    // Deletar documento do banco
    await Documento.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Documento excluído com sucesso' });
  } catch (error: any) {
    console.error('Error deleting documento:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

