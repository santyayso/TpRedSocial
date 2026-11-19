import { Transform } from 'class-transformer';
import {
  IsByteLength,
  IsDate,
  IsEmail,
  IsString,
  Matches,
  MaxDate,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegistroDto {
  // antes el email y la password los heredaba del LoginDto, pero ahora el login recibe email O usuario, asi que se validan aca
  // limpiamos el valor antes de validarlo, pero antes nos  aseguramos que  sea un string para q no explote con trim  y lowercase
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value === 'string') {
      return value.trim().toLowerCase();
    }
    return value;
  })
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Z])(?=.*\d)/, {
    message: 'La contraseña debe tener al menos una mayúscula y un número',
  })
  @IsByteLength(0, 72, { message: 'La contraseña admite como máximo 72 bytes' })
  password!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  // \S  significa cualquier carácter que no sea un espacio o tabulacion o salto de linea
  @Matches(/\S/)
  nombre!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  // \S  significa cualquier carácter que no sea un espacio o tabulacion o salto de linea
  @Matches(/\S/)
  apellido!: string;

  //  limpiamos el valor antes de validarlo, pero  nos aseguramos que sea string para q no explote el trim y el lowerCase
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value === 'string') {
      return value.trim().toLowerCase();
    }
    return value;
  })
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-z0-9_]+$/, {
    message:
      'El nombre de usuario solo admite letras, números y guion bajo',
  })
  nombreUsuario!: string;

  // si el valor es un texto con formato AAAA-MM-DD, 
  // lo convierte en un Date. Si no, lo devuelve como llego, y @IsDate() lo rechaza con un 400.
  @Transform(({ value }: { value: unknown }) => {
                                              // el test devuelve true o false si  el texto cumple con el patron
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return new Date(value);
    }
    return value;
  })
  @IsDate()
  // validamos q la fecha no sea futura
  @MaxDate(() => new Date())
  fechaNacimiento!: Date;

  @IsString()
  @MaxLength(300)
  // \S  significa cualquier carácter que no sea un espacio o tabulacion o salto de linea
  @Matches(/\S/)
  descripcion!: string;
}
