import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import Auditoria from '@/lib/models/Auditoria';

interface LogAuditoriaParams {
  usuario: string;
  acao: string;
  entidade: string;
  entidadeId?: string;
  descricao: string;
  dadosAntigos?: any;
  dadosNovos?: any;
  nivelAcesso: string;
  sensivel?: boolean;
  request?: NextRequest;
}

export async function registrarAuditoria(params: LogAuditoriaParams) {
  try {
    await connectDB();

    // Extrair IP e User Agent do request se disponível
    let ip: string | undefined;
    let userAgent: string | undefined;

    if (params.request) {
      ip = params.request.headers.get('x-forwarded-for') || 
           params.request.headers.get('x-real-ip') || 
           'unknown';
      userAgent = params.request.headers.get('user-agent') || undefined;
    }

    await Auditoria.create({
      usuario: params.usuario,
      acao: params.acao,
      entidade: params.entidade,
      entidadeId: params.entidadeId,
      descricao: params.descricao,
      dadosAntigos: params.dadosAntigos,
      dadosNovos: params.dadosNovos,
      nivelAcesso: params.nivelAcesso,
      sensivel: params.sensivel || false,
      ip,
      userAgent,
    });
  } catch (error) {
    // Não falhar a operação principal se o log falhar
    console.error('Erro ao registrar auditoria:', error);
  }
}

// Função helper para sanitizar dados sensíveis antes de salvar
export function sanitizarDadosSensiveis(dados: any): any {
  if (!dados || typeof dados !== 'object') return dados;

  const camposSensiveis = ['senha', 'password', 'token', 'chave', 'key', 'secret'];
  const sanitizado = { ...dados };

  for (const campo of camposSensiveis) {
    if (sanitizado[campo]) {
      sanitizado[campo] = '***REDACTED***';
    }
  }

  return sanitizado;
}

