import mongoose, { Document, Schema } from 'mongoose';

export interface ISenha extends Document {
  id: string;
  ip: string;
  equipamento: string;
  categoria: string;
  senha: string; // Encrypted password in database
  createdAt: Date;
  updatedAt: Date;
}

const SenhaSchema = new Schema<ISenha>(
  {
    id: {
      type: String,
      required: [true, 'ID is required'],
      trim: true,
    },
    ip: {
      type: String,
      required: [true, 'IP is required'],
      trim: true,
    },
    equipamento: {
      type: String,
      required: [true, 'Equipamento is required'],
      trim: true,
    },
    categoria: {
      type: String,
      required: [true, 'Categoria is required'],
      trim: true,
    },
    senha: {
      type: String,
      required: [true, 'Senha is required'],
      // Encrypted password stored in database
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Senha || mongoose.model<ISenha>('Senha', SenhaSchema);

