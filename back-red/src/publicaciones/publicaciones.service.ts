import {BadRequestException, ConflictException, Injectable, NotFoundException} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isObjectIdOrHexString } from 'mongoose';
import { PublicacionMongo } from './publicacion.schema';
import type { PublicacionDocument } from './publicacion.schema';
import type { PublicacionInterface } from './publicacion';
import { CrearPublicacionDto } from './dto/crear-publicacion-dto';
import { ListarPublicacionesDto } from './dto/listar-publicaciones-dto';
import { UsuariosService } from '../usuarios/usuarios.service';
import { ImagenesService } from '../imagenes/imagenes.service';

@Injectable()
export class PublicacionesService {
  constructor(
    @InjectModel(PublicacionMongo.name)
    private readonly publicaciones: Model<PublicacionMongo>,
    private readonly usuariosService: UsuariosService,
    private readonly imagenesService: ImagenesService,
  ) {}

  async listarPublicaciones(usuarioId: string, consulta: ListarPublicacionesDto) {
    const filtro = {
      eliminada: false,
      ...(consulta.autor ? { autor: consulta.autor } : {}),
    };
    const orden: Record<string, 1 | -1> =
      consulta.orden === 'meGusta'
        ? { cantidadMeGusta: -1, createdAt: -1 }
        : { createdAt: -1 };
    const [documentos, totalPublicaciones] = await Promise.all([
      this.publicaciones
        .find(filtro)
        .sort(orden)
        .skip(consulta.offset)
        .limit(consulta.limit)
        .exec(),
      this.publicaciones.countDocuments(filtro).exec(),
    ]);
    return {
      totalPublicaciones,
      offset: consulta.offset,
      limit: consulta.limit,
      publicaciones: await this.presentarPublicacionInterfaz(documentos, usuarioId),
    };
  }

  async obtenerPublicacion(usuarioId: string, id: string) {
    this.validarId(id);
    // solo busca publicaciones que no esten eliminadas (baja logica)
    const publicacion = await this.publicaciones
      .findOne({ _id: id, eliminada: false })
      .exec();
    if (!publicacion) throw new NotFoundException('No existe la publicación');

    // presentarPublicacionInterfaz recibe una lista, asi que le pasamos una lista de 1 y agarramos el primero
    const [encontrada] = await this.presentarPublicacionInterfaz([publicacion], usuarioId);
    return encontrada;
  }

  async crearPublicacion(
    autor: string,
    datos: CrearPublicacionDto,
    archivo?: Express.Multer.File,
  ) {
    const subida = archivo
      ? await this.imagenesService.subirCloudinary(
          await this.imagenesService.normalizarImagen(archivo),
          'publicaciones',
        )
      : undefined;
    try {
      const publicacion = await this.publicaciones.create({
        autor,
        ...datos,
        imagen_url: subida?.url ?? '',
        imagen_public_id: subida?.publicId,
      });
      const [creada] = await this.presentarPublicacionInterfaz([publicacion], autor);
      return creada;
    } catch (error) {
      await this.imagenesService.eliminar(subida?.publicId);
      throw error;
    }
  }

  async eliminarPublicacion(usuarioId: string, perfil: string, id: string) {
    this.validarId(id);
    const filtro =
      perfil === 'administrador'
        ? { _id: id, eliminada: false }
        : { _id: id, autor: usuarioId, eliminada: false };
    const publicacion = await this.publicaciones
      .findOneAndUpdate(filtro, { $set: { eliminada: true } })
      .exec();
    if (!publicacion) throw new NotFoundException('No existe la publicación');
  }

  async darMeGusta(usuarioId: string, id: string) {
    this.validarId(id);
    const publicacion = await this.publicaciones
      .findOneAndUpdate(
        { _id: id, eliminada: false, meGusta: { $ne: usuarioId } },
        { $addToSet: { meGusta: usuarioId }, $inc: { cantidadMeGusta: 1 } },
        { new: true },
      )
      .exec();
    if (!publicacion) {
      await this.verificarExiste(id);
      throw new ConflictException('Ya le diste me gusta a esta publicación');
    }
    return { id, cantidadMeGusta: publicacion.cantidadMeGusta, meGusta: true };
  }

  async quitarMeGusta(usuarioId: string, id: string) {
    this.validarId(id);
    const publicacion = await this.publicaciones
      .findOneAndUpdate(
        { _id: id, eliminada: false, meGusta: usuarioId },
        { $pull: { meGusta: usuarioId }, $inc: { cantidadMeGusta: -1 } },
        { new: true },
      )
      .exec();
    if (!publicacion) {
      await this.verificarExiste(id);
      throw new ConflictException('No le habías dado me gusta a esta publicación');
    }
    return { id, cantidadMeGusta: publicacion.cantidadMeGusta, meGusta: false };
  }

  private async presentarPublicacionInterfaz(
    documentos: PublicacionDocument[],
    usuarioId: string,
  ): Promise<PublicacionInterface[]> {
    const autores = new Map(
      (
        await this.usuariosService.listarUsuariosPorIds([
          ...new Set(documentos.map((documento) => documento.autor)),
        ])
      ).map((usuario) => [usuario.id, usuario]),
    );
    return documentos.map((documento) => {
      const autor = autores.get(documento.autor);
      return {
        id: documento.id as string,
        titulo: documento.titulo,
        mensaje: documento.mensaje,
        imagen_url: documento.imagen_url,
        autor: autor
          ? {
              id: autor.id,
              nombre: autor.nombre,
              apellido: autor.apellido,
              nombreUsuario: autor.nombreUsuario,
              imagen_url: autor.imagen_url,
            }
          : null,
        cantidadMeGusta: documento.cantidadMeGusta,
        meGusta: documento.meGusta.includes(usuarioId),
        createdAt: documento.createdAt,
      };
    });
  }

  private async verificarExiste(id: string) {
    const existe = await this.publicaciones
      .exists({ _id: id, eliminada: false })
      .exec();
    if (!existe) throw new NotFoundException('No existe la publicación');
  }

  private validarId(id: string) {
    if (!isObjectIdOrHexString(id))
      throw new BadRequestException('ID de publicación inválido');
  }
}
