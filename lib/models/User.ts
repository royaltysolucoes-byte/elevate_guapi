import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  username: string;
  password: string;
  fullName: string;
  funcao: string;
  isAdmin: boolean;
  nivelAcesso: 'admin' | 'analista' | 'suporte';
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    funcao: {
      type: String,
      required: [true, 'Função is required'],
      trim: true,
      default: 'Consultor TI',
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    nivelAcesso: {
      type: String,
      enum: ['admin', 'analista', 'suporte'],
      default: 'suporte',
    },
  },
  {
    timestamps: true, // This adds createdAt and updatedAt automatically
  }
);

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

