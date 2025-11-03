import mongoose, { Document, Schema } from 'mongoose';

export interface IImpressora extends Document {
  setor: string;
  numeroSerie: string;
  tipo: mongoose.Types.ObjectId;
  enderecoIP: string;
  categoria?: string;
  faixa?: mongoose.Types.ObjectId;
  modelo?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ImpressoraSchema = new Schema<IImpressora>(
  {
    setor: {
      type: String,
      required: [true, 'Setor is required'],
      trim: true,
    },
    numeroSerie: {
      type: String,
      required: [true, 'Número de série is required'],
      trim: true,
    },
    tipo: {
      type: Schema.Types.ObjectId,
      ref: 'Tipo',
      required: [true, 'Tipo is required'],
    },
    enderecoIP: {
      type: String,
      required: [true, 'Endereço IP is required'],
      trim: true,
    },
    categoria: {
      type: String,
      trim: true,
    },
    faixa: {
      type: Schema.Types.ObjectId,
      ref: 'IP',
    },
    modelo: {
      type: Schema.Types.ObjectId,
      ref: 'Modelo',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Impressora || mongoose.model<IImpressora>('Impressora', ImpressoraSchema);

