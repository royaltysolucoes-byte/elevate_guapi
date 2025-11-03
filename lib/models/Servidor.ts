import mongoose, { Document, Schema } from 'mongoose';

export interface IServidor extends Document {
  ip: string;
  nome: string;
  sistemaOperacional: mongoose.Types.ObjectId;
  status: 'ativo' | 'inativo';
  servico: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ServidorSchema = new Schema<IServidor>(
  {
    ip: {
      type: String,
      required: [true, 'IP is required'],
      trim: true,
    },
    nome: {
      type: String,
      required: [true, 'Nome is required'],
      trim: true,
    },
    sistemaOperacional: {
      type: Schema.Types.ObjectId,
      ref: 'SistemaOperacional',
      required: [true, 'Sistema Operacional is required'],
    },
    status: {
      type: String,
      enum: ['ativo', 'inativo'],
      required: [true, 'Status is required'],
      default: 'ativo',
    },
    servico: {
      type: Schema.Types.ObjectId,
      ref: 'Servico',
      required: [true, 'Serviço is required'],
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Servidor || mongoose.model<IServidor>('Servidor', ServidorSchema);
