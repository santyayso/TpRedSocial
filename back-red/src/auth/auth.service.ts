import { ConflictException, Injectable, UnauthorizedException, } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { mongo } from 'mongoose';
import { UsuariosService } from '../usuarios/usuarios.service';
import type { UsuarioInterface } from '../usuarios/usuario';
import type { UsuarioDocument } from '../usuarios/usuario.schema';
import { ImagenesService } from '../imagenes/imagenes.service';
import { LoginDto } from './login.dto';
import { RegistroDto } from './registro.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly imagenesService: ImagenesService,
    private readonly jwtService: JwtService,
  ) { }

  async registrar(datos: RegistroDto, archivo?: Express.Multer.File) {
    //normaliza la imagen
    const bufferNormalizado = await this.imagenesService.normalizarImagen(archivo);
    // la sube pasnadole la imagen normalizada y la ruta
    const datosImagenCloudinary = await this.imagenesService.subirCloudinary(bufferNormalizado, 'usuarios/perfiles');
    try {
      // crea el usuario, hasehando la password y obteniendo el id y  la url de la imagen  subida a cloudinary
      const usuario = await this.usuariosService.crearUsuario({
        nombre: datos.nombre,
        apellido: datos.apellido,
        email: datos.email,
        nombreUsuario: datos.nombreUsuario,
        fechaNacimiento: datos.fechaNacimiento,
        descripcion: datos.descripcion,
        passwordHash: await bcrypt.hash(datos.password, 10),
        imagen_url: datosImagenCloudinary.url,
        imagen_public_id: datosImagenCloudinary.publicId,
      });
      return this.crearSesion(usuario);
      // return usuario;
    } catch (error) {
      //  si hubo error en el alta del usuario, se  borra la imagen
      await this.imagenesService.eliminar(datosImagenCloudinary.publicId);

      // if por si es un error de duplicado
      if (error instanceof mongo.MongoServerError && error.code === 11000) {

        // se fija si el que esta duplicado  es el nombreUsuario o es el email
        if (error.keyPattern?.nombreUsuario) {
          throw new ConflictException('El nombre de usuario ya está en uso');
        }
        throw new ConflictException('El email ya está registrado');
      }
      throw error;
    }
  }

  async login(datos: LoginDto) {
    // puede llegar el email o el nombre de usuario. Un nombre de usuario nunca tiene arroba (el registro solo admite letras, numeros y guion bajo)
    // y un email siempre la tiene, asi que con eso sabemos por cual de los dos hay que buscar
    let usuario: UsuarioDocument | null;
    if (datos.emailOUsuario.includes('@')) {
      usuario = await this.usuariosService.buscarUsuarioPorEmail(datos.emailOUsuario);
    } else {
      usuario = await this.usuariosService.buscarUsuarioPorNombreUsuario(datos.emailOUsuario);
    }

    // si no lo encuentra lanza el throw
    if (!usuario) throw new UnauthorizedException('Credenciales inválidas');

    // si el usuario existe, se fija que la contraseña sea valida comparando el hasheo
    const passwordValida = await bcrypt.compare(
      datos.password,
      usuario.passwordHash,
    );

    // si es invalida lanza el error
    if (!passwordValida) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    return this.crearSesion(this.usuariosService.presentarUsuarioInterfaz(usuario));
    // return this.usuarios.presentar(usuario);
  }

  async obtenerUsuarioActual(id: string) {
    //  busca el usuario por id y lanza el error si  el usuario no existe
    const usuario = await this.usuariosService.buscarUsuarioPorId(id);
    if (!usuario) {
      throw new UnauthorizedException('El usuario no existe');
    }
    return this.usuariosService.presentarUsuarioInterfaz(usuario);
  }

  async refrescarSesion(id: string) {
    // buscamos de nuevo al usuario (lanza el error si ya no existe) y creamos un token nuevo con el mismo payload
    // el token nuevo vuelve a vencer a los 15 minutos
    const usuario = await this.obtenerUsuarioActual(id);
    return this.crearSesion(usuario);
  }

  private async crearSesion(usuario: UsuarioInterface) {
    return {
      access_token: await this.jwtService.signAsync({
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
