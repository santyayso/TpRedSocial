import {Body, Controller, HttpCode, Post, Req, UploadedFile, UseGuards,UseInterceptors} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { memoryStorage } from 'multer';
import { MAX_IMAGEN_BYTES } from '../imagenes/imagenes.service';
import { ImagenesInterceptor } from '../imagenes/imagenes.interceptor';
import { AuthService } from './auth.service';
import { LoginDto } from './login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RegistroDto } from './registro.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  // maximo 10 intentos cada 15 minutos
  // ruta del auth/register
  @Throttle({ default: { ttl: 15 * 60 * 1000, limit: 10 } })
  @UseInterceptors(
    ImagenesInterceptor,
    FileInterceptor('imagen', {
      storage: memoryStorage(),
      limits: {
        fileSize: MAX_IMAGEN_BYTES, // tamaño maximo de la  imagen (5 megas)
        files: 1, // 1 archivo
        fields: 7, // 7 campos
        parts: 9, // 8 en total
        fieldSize: 4096, // tamaño maximo del archivo
        fieldNameSize: 100, //tamaño maximo de los campos
      },
    }),
  )
  registrar(@Body() datos: RegistroDto, @UploadedFile() archivo?: Express.Multer.File) {
    //delegamos al service
    return this.authService.registrar(datos, archivo);
  }

  // ruta del auth/login
  @Post('login')
  //  maximo 10 intentos cada 15 minutos
  
  @Throttle({ default: { ttl: 15 * 60 * 1000, limit: 10 } })
  @HttpCode(200)
  login(@Body() datos: LoginDto) {
    //  delegamos al service
    return this.authService.login(datos);
  }

  // ruta del auth/autorizar
  @Post('autorizar')
  @HttpCode(200)
  // antes pasa por el guard que valida el token (si es invalido o esta vencido responde 401)
  @UseGuards(JwtAuthGuard)
  autorizar(@Req() req: Request & { user: { sub: string } }) {
    // si el token es valido devolvemos los datos del usuario, delegamos al service
    return this.authService.obtenerUsuarioActual(req.user.sub);
  }

  // ruta del auth/refrescar
  @Post('refrescar')
  @HttpCode(200)
  // antes pasa por el guard que valida el token (si es invalido o esta vencido responde 401)
  @UseGuards(JwtAuthGuard)
  refrescar(@Req() req: Request & { user: { sub: string } }) {
    // devolvemos un token nuevo, delegamos al service
    return this.authService.refrescarSesion(req.user.sub);
  }
}
