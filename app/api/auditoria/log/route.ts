import { NextRequest, NextResponse } from 'next/server';
import { registrarAuditoria } from '@/lib/utils/auditoria';
import { verifyToken } from '@/lib/auth';

async function checkAuth(request: NextRequest) {
  const token = request.cookies.get('token')?.value;

  if (!token) {
    return null;
  }

  const payload = await verifyToken(token);
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  return payload as { username: string; isAdmin: boolean; nivelAcesso?: string };
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

    const username = 'username' in auth && typeof auth.username === 'string' ? auth.username : '';
    const nivelAcesso = 'nivelAcesso' in auth && typeof auth.nivelAcesso === 'string' ? auth.nivelAcesso : 'admin';

    await registrarAuditoria({
      usuario: username,
      acao: body.acao || 'acessar',
      entidade: body.entidade || 'pagina',
      entidadeId: body.entidadeId,
      descricao: body.descricao || '',
      nivelAcesso: body.nivelAcesso || nivelAcesso,
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

