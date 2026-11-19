import { IsString, Matches, MaxLength } from 'class-validator';

export class ModificarComentarioDto {
  @IsString()
  @MaxLength(300)
  // \S  significa cualquier carácter que no sea un espacio o tabulacion o salto de linea
  @Matches(/\S/)
  mensaje!: string;
}
