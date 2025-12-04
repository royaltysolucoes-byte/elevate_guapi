import mongoose, { Document, Schema } from 'mongoose';

export interface IPihole extends Document {
  nome: string;
  anydesk: string;
  temDnsPihole: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PiholeSchema = new Schema<IPihole>(
  {
    nome: {
      type: String,
      required: [true, 'Nome da máquina é obrigatório'],
      trim: true,
    },
    anydesk: {
      type: String,
      required: [true, 'ID do Anydesk é obrigatório'],
      trim: true,
    },
    temDnsPihole: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Pihole || mongoose.model<IPihole>('Pihole', PiholeSchema);

