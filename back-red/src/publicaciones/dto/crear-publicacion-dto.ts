import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CrearPublicacionDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  // \S  significa cualquier carácter que no sea un espacio o tabulacion o salto de linea
  @Matches(/\S/)
  titulo!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(500)
   // \S  significa cualquier carácter que no sea un espacio o tabulacion o salto de linea
  @Matches(/\S/)
  mensaje!: string;
}
