import mongoose, { Document, Schema } from 'mongoose';

export interface ICelular extends Document {
  numero: string;
  colaborador: string;
  categoria: mongoose.Types.ObjectId;
  modelo: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CelularSchema = new Schema<ICelular>(
  {
    numero: {
      type: String,
      required: [true, 'Número é obrigatório'],
      trim: true,
    },
    colaborador: {
      type: String,
      required: [true, 'Colaborador é obrigatório'],
      trim: true,
    },
    categoria: {
      type: Schema.Types.ObjectId,
      ref: 'Categoria',
      required: [true, 'Categoria é obrigatória'],
    },
    modelo: {
      type: Schema.Types.ObjectId,
      ref: 'Modelo',
      required: [true, 'Modelo é obrigatório'],
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Celular || mongoose.model<ICelular>('Celular', CelularSchema);

