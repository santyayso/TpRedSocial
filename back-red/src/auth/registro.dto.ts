import { Transform } from 'class-transformer';
import {
  IsDate,
  IsString,
  Matches,
  MaxDate,
  MaxLength,
  MinLength,
} from 'class-validator';
import { LoginDto } from './login.dto';

export class RegistroDto extends LoginDto {
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
