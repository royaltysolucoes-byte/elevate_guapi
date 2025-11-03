import mongoose, { Document, Schema } from 'mongoose';

export interface IModelo extends Document {
  nome: string;
  marca: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ModeloSchema = new Schema<IModelo>(
  {
    nome: {
      type: String,
      required: [true, 'Nome is required'],
      trim: true,
    },
    marca: {
      type: Schema.Types.ObjectId,
      ref: 'Marca',
      required: [true, 'Marca is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index to prevent duplicate model names within the same brand
ModeloSchema.index({ nome: 1, marca: 1 }, { unique: true });

export default mongoose.models.Modelo || mongoose.model<IModelo>('Modelo', ModeloSchema);

