import mongoose, { Document, Schema } from 'mongoose';

export interface ITarefa extends Document {
  titulo: string;
  descricao?: string;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
  responsavel?: string; // username do responsável
  criadoPor: string; // username de quem criou
  prazo?: Date;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const TarefaSchema = new Schema<ITarefa>(
  {
    titulo: {
      type: String,
      required: [true, 'Título é obrigatório'],
      trim: true,
    },
    descricao: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['todo', 'in-progress', 'review', 'done'],
      default: 'todo',
    },
    prioridade: {
      type: String,
      enum: ['baixa', 'media', 'alta', 'urgente'],
      default: 'media',
    },
    responsavel: {
      type: String,
      trim: true,
    },
    criadoPor: {
      type: String,
      required: [true, 'Criado por é obrigatório'],
      trim: true,
    },
    prazo: {
      type: Date,
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Tarefa || mongoose.model<ITarefa>('Tarefa', TarefaSchema);

