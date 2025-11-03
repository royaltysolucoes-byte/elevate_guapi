import mongoose, { Document, Schema } from 'mongoose';

export interface IEmail extends Document {
  email: string;
  colaborador: string;
  nome: string;
  senha: string; // Encrypted password in database
  createdAt: Date;
  updatedAt: Date;
}

const EmailSchema = new Schema<IEmail>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    colaborador: {
      type: String,
      required: [true, 'Colaborador is required'],
      trim: true,
    },
    nome: {
      type: String,
      required: [true, 'Nome is required'],
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

export default mongoose.models.Email || mongoose.model<IEmail>('Email', EmailSchema);

