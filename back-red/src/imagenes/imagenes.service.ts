import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';

                  // 1024 bytes (1 kilobyte) * 1024 kilobytes (1 mega) * 5 megas
export const MAX_IMAGEN_BYTES = 5 * 1024 * 1024;

@Injectable()
export class ImagenesService {
  private readonly logger = new Logger(ImagenesService.name);

  async normalizarImagen(archivo?: Express.Multer.File): Promise<Buffer> {
    /// rechaza si la imagen no llego  o  llego pero es mayor a 5 megas
    if (!archivo?.buffer?.length || archivo.buffer.length > MAX_IMAGEN_BYTES)
      throw new BadRequestException(
        'Se requiere una imagen de hasta 5 MB',
      );

    // verificacion png, jpeg y  webp
    const buffer = archivo.buffer;
    const jpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    const png = buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const webp =
      buffer.toString('ascii', 0, 4) === 'RIFF' &&
      buffer.toString('ascii', 8, 12) === 'WEBP';
    if (!jpeg && !png && !webp)
      throw new BadRequestException(
        'Solo se admiten imágenes JPEG, PNG o WebP',
      );
    try {
      const imagen = sharp(buffer, {
        limitInputPixels: 20_000_000,
        failOn: 'warning',
      });
      const metadata = await imagen.metadata();
      // se asegura que tenga un solo  cuadro para que la imagen no s ea animada
      if ((metadata.pages ?? 1) > 1) throw new Error('Imagen animada');
      return await imagen
        .rotate()  // rota
        .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })  // la pone de  1600x1600 o la  deja igual si  es mas chica
        .webp({ quality: 82 }) //  la transforma a webp y calidad 82/100
        .timeout({ seconds: 10 })  //maximo 10 segundos
        .toBuffer(); //  la transforma a un  buffer nuevo de la imagen normalizada
    } catch {
      throw new BadRequestException(
        'Imagen inválida, animada o demasiado grande (máximo 20 megapíxeles)',
      );
    }
  }

  private obtenerCredencialesCloudinary() {
    // destructuring del .env
    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET)
      throw new ServiceUnavailableException(
        'Falta configurar Cloudinary en el servidor',
      );

      // retornamos objeto con las credenciales
    return {
      cloud_name: CLOUDINARY_CLOUD_NAME,
      api_key: CLOUDINARY_API_KEY,
      api_secret: CLOUDINARY_API_SECRET,
      secure: true,
    };
  }

  async subirCloudinary(buffer: Buffer, carpeta: string): Promise<{ url: string; publicId: string }> {
    const credencialesCloudinary = this.obtenerCredencialesCloudinary();
    
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          ...credencialesCloudinary,
          resource_type: 'image', // vamos a subir  una imgen
          allowed_formats: ['webp'], // solo permite formato web
          public_id: `${carpeta}/${randomUUID()}`, //armamos el nombre de la imagen con la ruta y un numero random
          overwrite: false,  // que no sobreescriba
          timeout: 30000, //maximo 30 segundos
        },
        (error, resultado) => {
          if (error || !resultado)
            return reject(
              new BadGatewayException('No se pudo subir la imagen'),
            );
          resolve({ url: resultado.secure_url, publicId: resultado.public_id });
        },
      );

      stream.on('error', () =>
        reject(new BadGatewayException('No se pudo subir la imagen')),
      );

      stream.end(buffer);
    });
  }

  // parametro opcional por si se subio algo sin imagen
  // entra al if y se va al return
  async eliminar(publicId?: string): Promise<void> {
    if (!publicId) return;
    try {
      const resultado = (await cloudinary.uploader.destroy(publicId, {
        ...this.obtenerCredencialesCloudinary(),
        resource_type: 'image',
        invalidate: true,
      })) as { result: string };

      // NO entra al if si responde con ok o si responde not found (la imagen ya  fue eliminada)
      // por eso negamos para que entre al if si hay error, lo lanzamos y lo capturamos en el catch
      if (!['ok', 'not found'].includes(resultado.result))
        throw new Error('No eliminado');
    } catch {
      // avisamos que no  pudimos limpiarlo y mandamos el id 
      this.logger.warn(`Pendiente de limpieza en Cloudinary: ${publicId}`);
    }
  }
}
