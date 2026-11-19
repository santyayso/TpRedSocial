import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

@Schema({ collection: 'comentarios', timestamps: true })
export class ComentarioMongo {
  // id de la publicacion a la que pertenece el comentario
  @Prop({ required: true, index: true })
  publicacion!: string;

  // id del usuario que escribio el comentario
  @Prop({ required: true })
  autor!: string;

  @Prop({ required: true, trim: true })
  mensaje!: string;

  // arranca en false y pasa a true cuando el autor edita el comentario
  @Prop({ default: false })
  modificado!: boolean;

  createdAt!: Date;
}

export type ComentarioDocument = HydratedDocument<ComentarioMongo>;
export const ComentarioSchema = SchemaFactory.createForClass(ComentarioMongo);
