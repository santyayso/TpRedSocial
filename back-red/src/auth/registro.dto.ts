import { Transform } from 'class-transformer';
import {
  IsDate,
  IsString,
  Matches,
  MaxDate,
  MaxLength,
  MinLength,
} from 'class-validator';
import { CredencialesDto } from './credenciales.dto';

export class RegistroDto extends CredencialesDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Matches(/\S/)
  nombre!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Matches(/\S/)
  apellido!: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-z0-9_]+$/, {
    message:
      'El nombre de usuario solo admite letras, números y guion bajo',
  })
  nombreUsuario!: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? new Date(value)
      : value,
  )
  @IsDate()
  @MaxDate(() => new Date())
  fechaNacimiento!: Date;

  @IsString()
  @MaxLength(300)
  @Matches(/\S/)
  descripcion!: string;
}
