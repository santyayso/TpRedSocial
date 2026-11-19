import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ImagenesModule } from '../imagenes/imagenes.module';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { PublicacionesController } from './publicaciones.controller';
import { PublicacionesService } from './publicaciones.service';
import { PublicacionMongo, PublicacionSchema } from './publicacion.schema';
import { ComentariosController } from './comentarios/comentarios.controller';
import { ComentariosService } from './comentarios/comentarios.service';
import { ComentarioMongo, ComentarioSchema } from './comentarios/comentario.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PublicacionMongo.name, schema: PublicacionSchema },
      { name: ComentarioMongo.name, schema: ComentarioSchema },
    ]),
    ImagenesModule,
    UsuariosModule,
  ],
  controllers: [PublicacionesController, ComentariosController],
  providers: [PublicacionesService, ComentariosService],
})
export class PublicacionesModule {}
