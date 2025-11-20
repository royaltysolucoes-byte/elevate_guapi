import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditoria extends Document {
  usuario: string; // username do usuário
  acao: string; // ação realizada (ex: 'criar', 'editar', 'excluir', 'visualizar')
  entidade: string; // tipo de entidade (ex: 'tarefa', 'usuario', 'email', 'senha', 'pc')
  entidadeId?: string; // ID da entidade afetada
  descricao: string; // descrição detalhada da ação
  dadosAntigos?: any; // dados antes da alteração (para edições)
  dadosNovos?: any; // dados após a alteração (para edições)
  ip?: string; // IP do usuário
  userAgent?: string; // User agent do navegador
  nivelAcesso: string; // nível de acesso do usuário no momento da ação
  sensivel: boolean; // se a ação envolve dados sensíveis
  createdAt: Date;
}

const AuditoriaSchema = new Schema<IAuditoria>(
  {
    usuario: {
      type: String,
      required: [true, 'Usuário é obrigatório'],
      trim: true,
      index: true,
    },
    acao: {
      type: String,
      required: [true, 'Ação é obrigatória'],
      trim: true,
      index: true,
    },
    entidade: {
      type: String,
      required: [true, 'Entidade é obrigatória'],
      trim: true,
      index: true,
    },
    entidadeId: {
      type: String,
      trim: true,
      index: true,
    },
    descricao: {
      type: String,
      required: [true, 'Descrição é obrigatória'],
      trim: true,
    },
    dadosAntigos: {
      type: Schema.Types.Mixed,
    },
    dadosNovos: {
      type: Schema.Types.Mixed,
    },
    ip: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },
    nivelAcesso: {
      type: String,
      required: true,
      enum: ['admin', 'analista', 'suporte'],
    },
    sensivel: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Índices para melhor performance nas consultas
AuditoriaSchema.index({ usuario: 1, createdAt: -1 });
AuditoriaSchema.index({ entidade: 1, createdAt: -1 });
AuditoriaSchema.index({ sensivel: 1, createdAt: -1 });
AuditoriaSchema.index({ createdAt: -1 });

export default mongoose.models.Auditoria || mongoose.model<IAuditoria>('Auditoria', AuditoriaSchema);

