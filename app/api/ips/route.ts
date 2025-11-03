import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import IP from '@/lib/models/IP';
import { verifyToken } from '@/lib/auth';

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

    const [ips, total] = await Promise.all([
      IP.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit),
      IP.countDocuments({}),
    ]);

    return NextResponse.json({
      ips,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching IPs:', error);
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

    const { tipo: tipoIP, nome, faixa, gateway, network, mask, vlanNome, vlanId, vlanFaixa, vlanGateway, vlanNetwork, vlanMask } = await request.json();

    const ip = await IP.create({
      tipo: tipoIP,
      nome,
      faixa,
      gateway,
      network,
      mask,
      vlanNome,
      vlanId,
      vlanFaixa,
      vlanGateway,
      vlanNetwork,
      vlanMask,
    });

    const ipPopulado = await IP.findById(ip._id);

    return NextResponse.json(
      { ip: ipPopulado },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating IP:', error);
    
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Esta faixa já está cadastrada' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
