import mongoose, { Document, Schema } from 'mongoose';

export interface IAutomacao extends Document {
  ip: string;
  equipamento: string;
  porta?: string;
  categoria?: string;
  faixa?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AutomacaoSchema = new Schema<IAutomacao>(
  {
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
    porta: {
      type: String,
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
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Automacao || mongoose.model<IAutomacao>('Automacao', AutomacaoSchema);

