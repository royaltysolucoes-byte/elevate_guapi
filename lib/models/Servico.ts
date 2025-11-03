import mongoose, { Document, Schema } from 'mongoose';

export interface IServico extends Document {
  nome: string;
  createdAt: Date;
  updatedAt: Date;
}

const ServicoSchema = new Schema<IServico>(
  {
    nome: {
      type: String,
      required: [true, 'Nome is required'],
      unique: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Servico || mongoose.model<IServico>('Servico', ServicoSchema);

