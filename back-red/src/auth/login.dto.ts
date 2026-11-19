import { Transform } from 'class-transformer';
import {
  IsByteLength,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class LoginDto {
  // aca puede llegar el email O el nombre de usuario, por eso ya no validamos que sea un email
  // limpiamos el valor antes de validarlo, pero antes nos  aseguramos que  sea un string para q no explote con trim  y lowercase
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value === 'string') {
      return value.trim().toLowerCase();
    }
    return value;
  })
  @IsString()
  @MinLength(3)
  @MaxLength(254)
  emailOUsuario!: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Z])(?=.*\d)/, {
    message: 'La contraseña debe tener al menos una mayúscula y un número',
  })
  @IsByteLength(0, 72, { message: 'La contraseña admite como máximo 72 bytes' })
  password!: string;
}
