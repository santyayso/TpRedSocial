import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsuarioMongo, UsuarioSchema } from './usuario.schema';
import { UsuariosService } from './usuarios.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UsuarioMongo.name, schema: UsuarioSchema },
    ]),
  ],
  providers: [UsuariosService],
  exports: [UsuariosService],
})
export class UsuariosModule {}
