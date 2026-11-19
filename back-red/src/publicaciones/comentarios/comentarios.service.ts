import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isObjectIdOrHexString } from 'mongoose';
import { ComentarioMongo } from './comentario.schema';
import type { ComentarioDocument } from './comentario.schema';
import type { ComentarioInterface } from './comentario';
import type { AutorPublicacionInterface } from '../publicacion';
import { PublicacionMongo } from '../publicacion.schema';
import { CrearComentarioDto } from './dto/crear-comentario-dto';
import { ModificarComentarioDto } from './dto/modificar-comentario-dto';
import { ListarComentariosDto } from './dto/listar-comentarios-dto';
import { UsuariosService } from '../../usuarios/usuarios.service';

@Injectable()
export class ComentariosService {
  constructor(
    @InjectModel(ComentarioMongo.name)
    private readonly comentarios: Model<ComentarioMongo>,
    @InjectModel(PublicacionMongo.name)
    private readonly publicaciones: Model<PublicacionMongo>,
    private readonly usuariosService: UsuariosService,
  ) {}

  async listarComentarios(idPublicacion: string, consulta: ListarComentariosDto) {
    this.validarId(idPublicacion, 'ID de publicación inválido');
    await this.verificarPublicacionExiste(idPublicacion);

    const filtro = { publicacion: idPublicacion };

    // hacemos las dos consultas a la vez: los comentarios de esta tanda, y cuantos comentarios hay en total
    const [documentos, totalComentarios] = await Promise.all([
      this.comentarios
        .find(filtro)
        // los mas recientes primero
        .sort({ createdAt: -1 })
        // saltea los que ya se mostraron y trae solo la cantidad pedida
        .skip(consulta.offset)
        .limit(consulta.limit)
        .exec(),
      this.comentarios.countDocuments(filtro).exec(),
    ]);

    return {
      totalComentarios,
      offset: consulta.offset,
      limit: consulta.limit,
      comentarios: await this.presentarComentarioInterfaz(documentos),
    };
  }

  async crearComentario(autor: string, idPublicacion: string, datos: CrearComentarioDto) {
    this.validarId(idPublicacion, 'ID de publicación inválido');
    await this.verificarPublicacionExiste(idPublicacion);

    // guardamos el comentario con el id de la publicacion y el id del usuario que lo escribio (la fecha la pone mongoose con timestamps)
    const comentario = await this.comentarios.create({
      publicacion: idPublicacion,
      autor,
      mensaje: datos.mensaje,
    });

    const [creado] = await this.presentarComentarioInterfaz([comentario]);
    return creado;
  }

  async modificarComentario(usuarioId: string, idComentario: string, datos: ModificarComentarioDto) {
    this.validarId(idComentario, 'ID de comentario inválido');

    // el filtro incluye el autor, asi que solo se puede modificar un comentario propio
    // $set cambia el mensaje y marca el comentario como modificado
    const comentario = await this.comentarios
      .findOneAndUpdate(
        { _id: idComentario, autor: usuarioId },
        { $set: { mensaje: datos.mensaje, modificado: true } },
        { new: true },
      )
      .exec();
    if (!comentario) {
      throw new NotFoundException('No existe el comentario');
    }

    const [modificado] = await this.presentarComentarioInterfaz([comentario]);
    return modificado;
  }

  private async presentarComentarioInterfaz(
    documentos: ComentarioDocument[],
  ): Promise<ComentarioInterface[]> {
    const autores = new Map(
      (
        await this.usuariosService.listarUsuariosPorIds([
          ...new Set(documentos.map((documento) => documento.autor)),
        ])
      ).map((usuario) => [usuario.id, usuario]),
    );

    return documentos.map((documento) => {
      const usuario = autores.get(documento.autor);

      let autor: AutorPublicacionInterface | null = null;
      if (usuario) {
        autor = {
          id: usuario.id,
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          nombreUsuario: usuario.nombreUsuario,
          imagen_url: usuario.imagen_url,
        };
      }

      return {
        id: documento.id as string,
        mensaje: documento.mensaje,
        modificado: documento.modificado,
        autor,
        createdAt: documento.createdAt,
      };
    });
  }

  private async verificarPublicacionExiste(id: string) {
    const existe = await this.publicaciones
      .exists({ _id: id, eliminada: false })
      .exec();
    if (!existe) {
      throw new NotFoundException('No existe la publicación');
    }
  }

  private validarId(id: string, mensaje: string) {
    if (!isObjectIdOrHexString(id)) {
      throw new BadRequestException(mensaje);
    }
  }
}
