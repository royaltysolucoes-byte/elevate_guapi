import mongoose, { Document, Schema } from 'mongoose';

export interface ISistemaOperacional extends Document {
  nome: string;
  createdAt: Date;
  updatedAt: Date;
}

const SistemaOperacionalSchema = new Schema<ISistemaOperacional>(
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

export default mongoose.models.SistemaOperacional || mongoose.model<ISistemaOperacional>('SistemaOperacional', SistemaOperacionalSchema);

