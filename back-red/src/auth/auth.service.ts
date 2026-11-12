import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { mongo } from 'mongoose';
import { UsuariosService } from '../usuarios/usuarios.service';
import type { Usuario } from '../usuarios/usuario';
import { ImagenesService } from '../imagenes/imagenes.service';
import { CredencialesDto } from './credenciales.dto';
import { RegistroDto } from './registro.dto';

import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usuarios: UsuariosService,
    private readonly imagenes: ImagenesService,
    private readonly jwt: JwtService,
  ) {}

  async registrar(datos: RegistroDto, archivo?: Express.Multer.File) {
    const buffer = await this.imagenes.normalizar(archivo);
    const subida = await this.imagenes.subir(buffer,  'usuarios/perfiles');
    try {
      const usuario = await this.usuarios.crear({
        nombre: datos.nombre,
        apellido: datos.apellido,
        email: datos.email,
        nombreUsuario: datos.nombreUsuario,
        fechaNacimiento: datos.fechaNacimiento,
        descripcion: datos.descripcion,
        passwordHash: await bcrypt.hash(datos.password, 10),
        imagen_url: subida.url,
        imagen_public_id: subida.publicId,
      });
      return this.respuesta(usuario);
      // return usuario;
    } catch (error) {
      await this.imagenes.eliminar(subida.publicId);
      if (error instanceof mongo.MongoServerError && error.code === 11000) {
        throw new ConflictException(
          error.keyPattern?.nombreUsuario
            ? 'El nombre de usuario ya está en uso'
            : 'El email ya está registrado',
        );
      }
      throw error;
    }
  }

  async login(datos: CredencialesDto) {
    const usuario = await this.usuarios.buscarPorEmail(datos.email);
    if (!usuario) throw new UnauthorizedException('Credenciales inválidas');

    const passwordValida = await bcrypt.compare(
      datos.password,
      usuario.passwordHash,
    );
    if (!passwordValida) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    return this.respuesta(this.usuarios.presentar(usuario));
    // return this.usuarios.presentar(usuario);
  }

  async perfil(id: string) {
    const usuario = await this.usuarios.buscarPorId(id);
    if (!usuario) throw new UnauthorizedException('El usuario no existe');
    return this.usuarios.presentar(usuario);
  }

  private async respuesta(usuario: Usuario) {
    return {
      access_token: await this.jwt.signAsync({
        sub: usuario.id,
        email: usuario.email,
        perfil: usuario.perfil,
      }),
      token_type: 'Bearer',
      expires_in: 900,
      usuario,
    };
  }
}
