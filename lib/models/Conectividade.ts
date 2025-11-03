import mongoose, { Document, Schema } from 'mongoose';

export interface IConectividade extends Document {
  nome: string;
  ip: string;
  categoria?: mongoose.Types.ObjectId;
  tipo: mongoose.Types.ObjectId;
  servico: mongoose.Types.ObjectId;
  modelo: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ConectividadeSchema = new Schema<IConectividade>(
  {
    nome: {
      type: String,
      required: [true, 'Nome is required'],
      trim: true,
    },
    ip: {
      type: String,
      required: [true, 'IP is required'],
      trim: true,
    },
    categoria: {
      type: Schema.Types.ObjectId,
      ref: 'Categoria',
    },
    tipo: {
      type: Schema.Types.ObjectId,
      ref: 'Tipo',
      required: [true, 'Tipo is required'],
    },
    servico: {
      type: Schema.Types.ObjectId,
      ref: 'Servico',
      required: [true, 'Serviço is required'],
    },
    modelo: {
      type: Schema.Types.ObjectId,
      ref: 'Modelo',
      required: [true, 'Modelo is required'],
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Conectividade || mongoose.model<IConectividade>('Conectividade', ConectividadeSchema);

