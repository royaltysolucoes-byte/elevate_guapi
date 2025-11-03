import mongoose, { Document, Schema } from 'mongoose';

export interface IComputador extends Document {
  nome: string;
  descricaoUsuario: string;
  anydesk: string;
  so: mongoose.Types.ObjectId;
  demaisProgramas: string;
  ip?: mongoose.Types.ObjectId;
  modelo?: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const ComputadorSchema = new Schema<IComputador>(
  {
    nome: {
      type: String,
      required: [true, 'Nome is required'],
      trim: true,
    },
    descricaoUsuario: {
      type: String,
      required: [true, 'Descrição do usuário is required'],
      trim: true,
    },
    anydesk: {
      type: String,
      required: [true, 'Anydesk is required'],
      trim: true,
    },
    so: {
      type: Schema.Types.ObjectId,
      ref: 'SistemaOperacional',
      required: [true, 'Sistema Operacional is required'],
    },
    demaisProgramas: {
      type: String,
      required: [true, 'Demais programas is required'],
      trim: true,
    },
    ip: {
      type: Schema.Types.ObjectId,
      ref: 'IP',
    },
    modelo: {
      type: Schema.Types.ObjectId,
      ref: 'Modelo',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Computador || mongoose.model<IComputador>('Computador', ComputadorSchema);

