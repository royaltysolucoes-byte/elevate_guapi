import mongoose, { Document, Schema } from 'mongoose';

export interface IGPO extends Document {
  nome: string;
  ativa: boolean;
  servidor: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const GPOSchema = new Schema<IGPO>(
  {
    nome: {
      type: String,
      required: [true, 'Nome is required'],
      trim: true,
    },
    ativa: {
      type: Boolean,
      required: [true, 'Status ativa is required'],
      default: true,
    },
    servidor: {
      type: Schema.Types.ObjectId,
      ref: 'Servidor',
      required: [true, 'Servidor is required'],
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.GPO || mongoose.model<IGPO>('GPO', GPOSchema);

