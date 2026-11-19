import {Body, Controller, Delete, Get, HttpCode, Param, Post, Query, Req, UploadedFile, UseGuards,UseInterceptors} from '@nestjs/common';
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
@UseGuards(JwtAuthGuard) // el guard esta puesto a nivel clase, o sea para todas las rutas, y aca se setea el req.user
export class PublicacionesController {
  constructor(private readonly publicacionesService: PublicacionesService) {}

  @Get()
  listar(@Req() req: Autenticada, @Query() consulta: ListarPublicacionesDto) {
    return this.publicacionesService.listarPublicaciones(req.user.sub, consulta);
  }

  // GET /publicaciones/:id  trae una sola publicacion (para la pagina de detalle)
  @Get(':id')
  obtener(@Req() req: Autenticada, @Param('id') id: string) {
    return this.publicacionesService.obtenerPublicacion(req.user.sub, id);
  }

  @Post()
  @UseInterceptors(
    ImagenesInterceptor, // interceptor de imagen que permite maximo 4 subidas a la vez
    FileInterceptor('imagen', {  // interceptor de multer que lee el form que manda el front
      storage: memoryStorage(),
      limits: {
        fileSize: MAX_IMAGEN_BYTES, // tamaño maximo de la imagen
        files: 1, // archivos
        fields: 2, // campos
        parts: 3, // archivos + campos
        fieldSize: 4096, // tamaño de cada campo de texto
        fieldNameSize: 100, // tamaño del nombre de cada campo de texto
      },
    }),
  )                                                                                   // parametro opcional por si es una publicacion sin foto
  crear(@Req() req: Autenticada, @Body() datos: CrearPublicacionDto, @UploadedFile() archivo?: Express.Multer.File) {
                                                   // req.user viene del validate del jwt, y sub es el id del usuario
    return this.publicacionesService.crearPublicacion(req.user.sub, datos, archivo);
  }

  @Delete(':id')
  @HttpCode(204)
  eliminar(@Req() req: Autenticada, @Param('id') id: string) {
                                                       // le pasamos el id de usuario y rol
    return this.publicacionesService.eliminarPublicacion(req.user.sub, req.user.perfil, id);
  }

  @Post(':id/me-gusta')
  @HttpCode(200)
  darMeGusta(@Req() req: Autenticada, @Param('id') idPublicacion: string) {
                                          // le pasamos el id de usuario 
    return this.publicacionesService.darMeGusta(req.user.sub, idPublicacion);
  }

  @Delete(':id/me-gusta')
  quitarMeGusta(@Req() req: Autenticada, @Param('id') idPublicacion: string) {
                                          // le pasamos el id de usuario 
    return this.publicacionesService.quitarMeGusta(req.user.sub, idPublicacion);
  }
}
