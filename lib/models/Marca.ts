import mongoose, { Document, Schema } from 'mongoose';

export interface IMarca extends Document {
  nome: string;
  createdAt: Date;
  updatedAt: Date;
}

const MarcaSchema = new Schema<IMarca>(
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

export default mongoose.models.Marca || mongoose.model<IMarca>('Marca', MarcaSchema);

