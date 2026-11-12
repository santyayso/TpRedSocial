import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

@Schema({ collection: 'publicaciones', timestamps: true })
export class PublicacionMongo {
  @Prop({ required: true, trim: true })
  titulo!: string;

  @Prop({ required: true, trim: true })
  mensaje!: string;

  @Prop({ required: true })
  autor!: string;

  @Prop({ type: [String], default: [] })
  meGusta!: string[];

  @Prop({ default: 0 })
  cantidadMeGusta!: number;

  @Prop({ default: false })
  eliminada!: boolean;

  @Prop({ default: '' })
  imagen_url!: string;

  @Prop()
  imagen_public_id?: string;

  createdAt!: Date;
}

export type PublicacionDocument = HydratedDocument<PublicacionMongo>;
export const PublicacionSchema = SchemaFactory.createForClass(PublicacionMongo);
