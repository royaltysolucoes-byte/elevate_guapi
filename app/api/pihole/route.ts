import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import mongoose from 'mongoose';
import Pihole from '@/lib/models/Pihole';
import { verifyToken } from '@/lib/auth';

const ensureModelsRegistered = () => {
  if (!mongoose.models.Pihole) {
    require('@/lib/models/Pihole');
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
    const search = searchParams.get('search') || '';
    const limit = 10;
    const skip = (page - 1) * limit;

    const searchQuery: any = {};
    if (search) {
      searchQuery.$or = [
        { nome: { $regex: search, $options: 'i' } },
        { anydesk: { $regex: search, $options: 'i' } },
      ];
    }

    const [piholesRaw, total] = await Promise.all([
      Pihole.find(searchQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Pihole.countDocuments(searchQuery),
    ]);

    const piholes = piholesRaw.map((pihole: any) => ({
      _id: pihole._id?.toString() || '',
      nome: pihole.nome,
      anydesk: pihole.anydesk,
      temDnsPihole: pihole.temDnsPihole,
      createdAt: pihole.createdAt ? new Date(pihole.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: pihole.updatedAt ? new Date(pihole.updatedAt).toISOString() : new Date().toISOString(),
    }));

    return NextResponse.json({
      piholes,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching piholes:', error);
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

    const { nome, anydesk, temDnsPihole } = await request.json();

    if (!nome || !anydesk) {
      return NextResponse.json(
        { error: 'Nome da máquina e ID do Anydesk são obrigatórios' },
        { status: 400 }
      );
    }

    const novoPihole = await Pihole.create({
      nome,
      anydesk,
      temDnsPihole: temDnsPihole !== undefined ? temDnsPihole : true,
    });

    const pihole = await Pihole.findById(novoPihole._id).lean();

    const piholeTyped = pihole as any;

    return NextResponse.json({
      pihole: {
        _id: piholeTyped._id?.toString() || '',
        nome: piholeTyped.nome,
        anydesk: piholeTyped.anydesk,
        temDnsPihole: piholeTyped.temDnsPihole,
        createdAt: piholeTyped.createdAt ? new Date(piholeTyped.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: piholeTyped.updatedAt ? new Date(piholeTyped.updatedAt).toISOString() : new Date().toISOString(),
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating pihole:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

