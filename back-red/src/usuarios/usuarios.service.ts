import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UsuarioMongo } from './usuario.schema';
import type { UsuarioDocument } from './usuario.schema';
import type { Usuario } from './usuario';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectModel(UsuarioMongo.name) private readonly modelo: Model<UsuarioMongo>,
  ) {}

  async crear(datos: Omit<UsuarioMongo, 'perfil'>): Promise<Usuario> {
    return this.presentar(await this.modelo.create(datos));
  }

  async buscarPorEmail(email: string): Promise<UsuarioDocument | null> {
    return this.modelo.findOne({ email }).select('+passwordHash').exec();
  }

  async buscarPorId(id: string): Promise<UsuarioDocument | null> {
    return this.modelo.findById(id).exec();
  }

  presentar(usuario: UsuarioDocument): Usuario {
    return {
      id: usuario._id.toString(),
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
      nombreUsuario: usuario.nombreUsuario,
      fechaNacimiento: usuario.fechaNacimiento,
      descripcion: usuario.descripcion,
      imagen_url: usuario.imagen_url,
      perfil: usuario.perfil,
    };
  }

  async listarPorIds(ids: string[]): Promise<Usuario[]> {
  const usuarios = await this.modelo.find({ _id: { $in: ids } }).exec();
  return usuarios.map((usuario) => this.presentar(usuario));
}

}
