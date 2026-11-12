import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ImagenesModule } from '../imagenes/imagenes.module';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { PublicacionesController } from './publicaciones.controller';
import { PublicacionesService } from './publicaciones.service';
import { PublicacionMongo, PublicacionSchema } from './publicacion.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PublicacionMongo.name, schema: PublicacionSchema },
    ]),
    ImagenesModule,
    UsuariosModule,
  ],
  controllers: [PublicacionesController],
  providers: [PublicacionesService],
})
export class PublicacionesModule {}
