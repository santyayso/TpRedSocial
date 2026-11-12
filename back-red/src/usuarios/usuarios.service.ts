import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UsuarioMongo } from './usuario.schema';
import type { UsuarioDocument } from './usuario.schema';
import type { UsuarioInterface } from './usuario';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectModel(UsuarioMongo.name) private readonly modelo: Model<UsuarioMongo>,
  ) {}

  async crearUsuario(datos: Omit<UsuarioMongo, 'perfil'>): Promise<UsuarioInterface> {
    // creamos y  el usuario que creamos se nos devuelve y lo pasamos por el presentar 
    return this.presentarUsuarioInterfaz(await this.modelo.create(datos));
  }

  async buscarUsuarioPorEmail(email: string): Promise<UsuarioDocument | null> {
    return this.modelo.findOne({ email }).select('+passwordHash').exec();
    // el + es para que traiga el password, que fue marcado como select en el schema, para que cuando se consulte al usuario no se traiga
  }

  async buscarUsuarioPorId(id: string): Promise<UsuarioDocument | null> {
    return this.modelo.findById(id).exec();
  }

  // presenta usando el "molde" de la interfaz
  presentarUsuarioInterfaz(usuario: UsuarioDocument): UsuarioInterface {
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

  async listarUsuariosPorIds(ids: string[]): Promise<UsuarioInterface[]> {
                                 // aca el find trae solo los que el id esten dentro (in) la lista de ids pasada por parametros
  const usuarios = await this.modelo.find({ _id: { $in: ids } }).exec();
  return usuarios.map((usuario) => this.presentarUsuarioInterfaz(usuario));
}

}
