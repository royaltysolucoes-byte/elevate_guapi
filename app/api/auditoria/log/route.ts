import { NextRequest, NextResponse } from 'next/server';
import { registrarAuditoria } from '@/lib/utils/auditoria';
import { verifyToken } from '@/lib/auth';

async function checkAuth(request: NextRequest) {
  const token = request.cookies.get('token')?.value;

  if (!token) {
    return null;
  }

  const payload = await verifyToken(token);
  return payload;
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

    const body = await request.json();

    await registrarAuditoria({
      usuario: auth.username,
      acao: body.acao || 'acessar',
      entidade: body.entidade || 'pagina',
      entidadeId: body.entidadeId,
      descricao: body.descricao || '',
      nivelAcesso: body.nivelAcesso || auth.nivelAcesso || 'admin',
      sensivel: body.sensivel || false,
      request,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error logging audit:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

