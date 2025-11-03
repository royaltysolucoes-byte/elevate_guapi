import mongoose, { Document, Schema } from 'mongoose';

export interface ITipo extends Document {
  nome: string;
  createdAt: Date;
  updatedAt: Date;
}

const TipoSchema = new Schema<ITipo>(
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

export default mongoose.models.Tipo || mongoose.model<ITipo>('Tipo', TipoSchema);

