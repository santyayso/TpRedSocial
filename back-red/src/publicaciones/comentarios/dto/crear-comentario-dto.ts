import { IsString, Matches, MaxLength } from 'class-validator';

export class CrearComentarioDto {
  @IsString()
  @MaxLength(300)
  // \S  significa cualquier carácter que no sea un espacio o tabulacion o salto de linea
  // sirve para que no puedan mandar un comentario vacio o hecho solo de espacios
  @Matches(/\S/)
  mensaje!: string;
}
