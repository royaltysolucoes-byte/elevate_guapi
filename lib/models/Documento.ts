import mongoose, { Document, Schema } from 'mongoose';

export interface IDocumento extends Document {
  nome: string;
  nomeArquivo: string;
  caminhoArquivo: string;
  tamanho: number; // em bytes
  tipoMime: string;
  criadoPor: string;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentoSchema = new Schema<IDocumento>(
  {
    nome: {
      type: String,
      required: [true, 'Nome é obrigatório'],
      trim: true,
    },
    nomeArquivo: {
      type: String,
      required: [true, 'Nome do arquivo é obrigatório'],
      trim: true,
    },
    caminhoArquivo: {
      type: String,
      required: [true, 'Caminho do arquivo é obrigatório'],
    },
    tamanho: {
      type: Number,
      required: [true, 'Tamanho do arquivo é obrigatório'],
    },
    tipoMime: {
      type: String,
      required: [true, 'Tipo MIME é obrigatório'],
    },
    criadoPor: {
      type: String,
      required: [true, 'Criado por é obrigatório'],
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Documento || mongoose.model<IDocumento>('Documento', DocumentoSchema);

