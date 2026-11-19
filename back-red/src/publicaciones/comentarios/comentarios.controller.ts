import { Body, Controller, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { ComentariosService } from './comentarios.service';
import { CrearComentarioDto } from './dto/crear-comentario-dto';
import { ModificarComentarioDto } from './dto/modificar-comentario-dto';
import { ListarComentariosDto } from './dto/listar-comentarios-dto';

type Autenticada = Request & { user: { sub: string } };

// usa el mismo prefijo que el controller de publicaciones porque los comentarios cuelgan de una publicacion
@Controller('publicaciones')
@UseGuards(JwtAuthGuard) // el guard esta puesto a nivel clase, o sea para todas las rutas, y aca se setea el req.user
export class ComentariosController {
  constructor(private readonly comentariosService: ComentariosService) {}

  // GET /publicaciones/:id/comentarios?offset=0&limit=5
  @Get(':id/comentarios')
  listar(@Param('id') idPublicacion: string, @Query() consulta: ListarComentariosDto) {
    return this.comentariosService.listarComentarios(idPublicacion, consulta);
  }

  // POST /publicaciones/:id/comentarios
  @Post(':id/comentarios')
  crear(
    @Req() req: Autenticada,
    @Param('id') idPublicacion: string,
    @Body() datos: CrearComentarioDto,
  ) {
    // req.user viene del validate del jwt, y sub es el id del usuario
    return this.comentariosService.crearComentario(req.user.sub, idPublicacion, datos);
  }

  // PUT /publicaciones/comentarios/:idComentario
  @Put('comentarios/:idComentario')
  modificar(
    @Req() req: Autenticada,
    @Param('idComentario') idComentario: string,
    @Body() datos: ModificarComentarioDto,
  ) {
    // le pasamos el id de usuario para que solo pueda modificar los suyos
    return this.comentariosService.modificarComentario(req.user.sub, idComentario, datos);
  }
}
