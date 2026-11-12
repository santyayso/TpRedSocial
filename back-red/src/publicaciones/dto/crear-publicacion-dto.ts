import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CrearPublicacionDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Matches(/\S/)
  titulo!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(500)
  @Matches(/\S/)
  mensaje!: string;
}
