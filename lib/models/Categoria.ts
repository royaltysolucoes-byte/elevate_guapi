import mongoose, { Document, Schema } from 'mongoose';

export interface ICategoria extends Document {
  nome: string;
  createdAt: Date;
  updatedAt: Date;
}

const CategoriaSchema = new Schema<ICategoria>(
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

export default mongoose.models.Categoria || mongoose.model<ICategoria>('Categoria', CategoriaSchema);


