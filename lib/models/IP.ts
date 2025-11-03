import mongoose, { Document, Schema } from 'mongoose';

export interface IIP extends Document {
  tipo: 'faixa' | 'vlan';
  nome: string;
  // Faixa fields
  faixa?: string;
  gateway?: string;
  network?: string;
  mask?: string;
  // VLAN fields
  vlanNome?: string;
  vlanId?: string;
  vlanFaixa?: string;
  vlanGateway?: string;
  vlanNetwork?: string;
  vlanMask?: string;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const IPSchema = new Schema<IIP>(
  {
    tipo: {
      type: String,
      enum: ['faixa', 'vlan'],
      required: [true, 'Tipo is required'],
    },
    nome: {
      type: String,
      required: [true, 'Nome is required'],
      trim: true,
    },
    faixa: {
      type: String,
      trim: true,
    },
    gateway: {
      type: String,
      trim: true,
    },
    network: {
      type: String,
      trim: true,
    },
    mask: {
      type: String,
      trim: true,
    },
    vlanNome: {
      type: String,
      trim: true,
    },
    vlanId: {
      type: String,
      trim: true,
    },
    vlanFaixa: {
      type: String,
      trim: true,
    },
    vlanGateway: {
      type: String,
      trim: true,
    },
    vlanNetwork: {
      type: String,
      trim: true,
    },
    vlanMask: {
      type: String,
      trim: true,
    },
    ativo: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries (not unique - we'll handle uniqueness in application logic)
IPSchema.index({ tipo: 1, nome: 1 });

export default mongoose.models.IP || mongoose.model<IIP>('IP', IPSchema);

