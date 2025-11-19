import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import mongoose from 'mongoose';
import Documento from '@/lib/models/Documento';
import { verifyToken } from '@/lib/auth';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
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

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB em bytes

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
    ensureModelsRegistered();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const [documentos, total] = await Promise.all([
      Documento.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Documento.countDocuments({}),
    ]);

    return NextResponse.json({
      documentos,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching documentos:', error);
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

    // Verificar permissões
    if ((auth as any).nivelAcesso === 'suporte') {
      return NextResponse.json(
        { error: 'Você não tem permissão para fazer upload de documentos' },
        { status: 403 }
      );
    }

    await connectDB();
    ensureModelsRegistered();

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const nome = formData.get('nome') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'Arquivo é obrigatório' },
        { status: 400 }
      );
    }

    if (!nome || nome.trim() === '') {
      return NextResponse.json(
        { error: 'Nome do documento é obrigatório' },
        { status: 400 }
      );
    }

    // Validar tamanho do arquivo
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `Arquivo muito grande. Tamanho máximo permitido: 15MB` },
        { status: 400 }
      );
    }

    // Criar pasta uploads se não existir
    const uploadsDir = join(process.cwd(), 'uploads');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const originalName = file.name;
    const fileExtension = originalName.split('.').pop();
    const uniqueFileName = `${timestamp}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
    const filePath = join(uploadsDir, uniqueFileName);

    // Salvar arquivo
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Criar documento no banco
    const documento = await Documento.create({
      nome: nome.trim(),
      nomeArquivo: originalName,
      caminhoArquivo: filePath,
      tamanho: file.size,
      tipoMime: file.type || 'application/octet-stream',
      criadoPor: (auth as any).username,
    });

    return NextResponse.json(
      { documento },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating documento:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

