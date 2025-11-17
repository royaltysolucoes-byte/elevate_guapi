import mongoose, { Document, Schema } from 'mongoose';

export interface INotificacao extends Document {
  usuario: string; // username do usuário que recebe a notificação
  tipo: 'tarefa_atribuida' | 'tarefa_atualizada' | 'tarefa_comentada';
  titulo: string;
  mensagem: string;
  tarefaId?: string; // ID da tarefa relacionada
  lida: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificacaoSchema = new Schema<INotificacao>(
  {
    usuario: {
      type: String,
      required: [true, 'Usuário é obrigatório'],
      trim: true,
      index: true,
    },
    tipo: {
      type: String,
      enum: ['tarefa_atribuida', 'tarefa_atualizada', 'tarefa_comentada'],
      required: true,
    },
    titulo: {
      type: String,
      required: true,
      trim: true,
    },
    mensagem: {
      type: String,
      required: true,
      trim: true,
    },
    tarefaId: {
      type: String,
      trim: true,
    },
    lida: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Índice composto para buscar notificações não lidas de um usuário
NotificacaoSchema.index({ usuario: 1, lida: 1 });

export default mongoose.models.Notificacao || mongoose.model<INotificacao>('Notificacao', NotificacaoSchema);

