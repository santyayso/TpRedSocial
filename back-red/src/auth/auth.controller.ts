import {Body, Controller, Get, HttpCode, Post, Req, UploadedFile, UseGuards,UseInterceptors} from '@nestjs/common';
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

  @Post('login')
  //  maximo 10 intentos cada 15 minutos
  // ruta del auth/login
  @Throttle({ default: { ttl: 15 * 60 * 1000, limit: 10 } })
  @HttpCode(200)
  login(@Body() datos: LoginDto) {
    //  delegamos al service
    return this.authService.login(datos);
  }

  // ruta del auth/mee
  @Get('me')
  @UseGuards(JwtAuthGuard)
  // antes pasa por el guard que valida el token
  getUsuarioActual(@Req() req: Request & { user: { sub: string } }) {
    // delegamos al service
    return this.authService.obtenerUsuarioActual(req.user.sub);
  }
}
