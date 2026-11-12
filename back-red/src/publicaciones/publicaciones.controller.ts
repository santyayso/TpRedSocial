import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ImagenesInterceptor } from '../imagenes/imagenes.interceptor';
import { MAX_IMAGEN_BYTES } from '../imagenes/imagenes.service';
import { PublicacionesService } from './publicaciones.service';
import { CrearPublicacionDto } from './dto/crear-publicacion-dto';
import { ListarPublicacionesDto } from './dto/listar-publicaciones-dto';

type Autenticada = Request & { user: { sub: string; perfil: string } };

@Controller('publicaciones')
@UseGuards(JwtAuthGuard)
export class PublicacionesController {
  constructor(private readonly publicaciones: PublicacionesService) {}

  @Get()
  listar(@Req() req: Autenticada, @Query() consulta: ListarPublicacionesDto) {
    return this.publicaciones.listar(req.user.sub, consulta);
  }

  @Post()
  @UseInterceptors(
    ImagenesInterceptor,
    FileInterceptor('imagen', {
      storage: memoryStorage(),
      limits: {
        fileSize: MAX_IMAGEN_BYTES,
        files: 1,
        fields: 2,
        parts: 3,
        fieldSize: 4096,
        fieldNameSize: 100,
      },
    }),
  )
  crear(
    @Req() req: Autenticada,
    @Body() datos: CrearPublicacionDto,
    @UploadedFile() archivo?: Express.Multer.File,
  ) {
    return this.publicaciones.crear(req.user.sub, datos, archivo);
  }

  @Delete(':id')
  @HttpCode(204)
  eliminar(@Req() req: Autenticada, @Param('id') id: string) {
    return this.publicaciones.eliminar(req.user.sub, req.user.perfil, id);
  }

  @Post(':id/me-gusta')
  @HttpCode(200)
  darMeGusta(@Req() req: Autenticada, @Param('id') id: string) {
    return this.publicaciones.darMeGusta(req.user.sub, id);
  }

  @Delete(':id/me-gusta')
  // @HttpCode(200)
  quitarMeGusta(@Req() req: Autenticada, @Param('id') id: string) {
    return this.publicaciones.quitarMeGusta(req.user.sub, id);
  }
}
