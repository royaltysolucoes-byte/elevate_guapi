import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import mongoose from 'mongoose';
import GPO from '@/lib/models/GPO';
import { verifyToken } from '@/lib/auth';

// Import and ensure models are registered before use
import Servidor from '@/lib/models/Servidor';

// Ensure models are registered
const ensureModelsRegistered = () => {
  if (!mongoose.models.Servidor) {
    require('@/lib/models/Servidor');
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
    const limit = 10;
    const skip = (page - 1) * limit;

    const [gpos, total] = await Promise.all([
      GPO.find({}).populate('servidor').sort({ createdAt: -1 }).skip(skip).limit(limit),
      GPO.countDocuments({}),
    ]);

    return NextResponse.json({
      gpos,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching gpos:', error);
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
    ensureModelsRegistered();

    const { nome, ativa, servidor } = await request.json();

    if (!nome || !servidor) {
      return NextResponse.json(
        { error: 'Nome e Servidor são obrigatórios' },
        { status: 400 }
      );
    }

    const newGPO = await GPO.create({
      nome,
      ativa: ativa !== undefined ? ativa : true,
      servidor,
    });

    const gpoPopulado = await GPO.findById(newGPO._id).populate('servidor');

    return NextResponse.json(
      { gpo: gpoPopulado },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating gpo:', error);
    
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

