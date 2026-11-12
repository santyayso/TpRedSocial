import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { memoryStorage } from 'multer';
import { MAX_IMAGEN_BYTES } from '../imagenes/imagenes.service';
import { ImagenesInterceptor } from '../imagenes/imagenes.interceptor';
import { AuthService } from './auth.service';
import { CredencialesDto } from './credenciales.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RegistroDto } from './registro.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  @Throttle({ default: { ttl: 15 * 60 * 1000, limit: 10 } })
  @UseInterceptors(
    ImagenesInterceptor,
    FileInterceptor('imagen', {
      storage: memoryStorage(),
      limits: {
        fileSize: MAX_IMAGEN_BYTES,
        files: 1,
        fields: 7,
        parts: 9,
        fieldSize: 4096,
        fieldNameSize: 100,
      },
    }),
  )
  registrar(
    @Body() datos: RegistroDto,
    @UploadedFile() archivo?: Express.Multer.File,
  ) {
    return this.auth.registrar(datos, archivo);
  }

  @Post('login')
  @Throttle({ default: { ttl: 15 * 60 * 1000, limit: 10 } })
  @HttpCode(200)
  login(@Body() datos: CredencialesDto) {
    return this.auth.login(datos);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  perfil(@Req() req: Request & { user: { sub: string } }) {
    return this.auth.perfil(req.user.sub);
  }
}
