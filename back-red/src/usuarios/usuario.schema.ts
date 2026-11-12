import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

@Schema({ collection: 'usuarios', timestamps: true })
export class UsuarioMongo {
  @Prop({ required: true, trim: true })
  nombre!: string;

  @Prop({ required: true, trim: true })
  apellido!: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  nombreUsuario!: string;

  @Prop({ required: true, select: false })
  passwordHash!: string;

  @Prop({ required: true })
  fechaNacimiento!: Date;

  @Prop({ required: true, trim: true })
  descripcion!: string;

  @Prop({ required: true })
  imagen_url!: string;

  @Prop()
  imagen_public_id?: string;

  @Prop({ default: 'usuario', enum: ['usuario', 'administrador'] })
  perfil!: string;
}

export type UsuarioDocument = HydratedDocument<UsuarioMongo>;
export const UsuarioSchema = SchemaFactory.createForClass(UsuarioMongo);
