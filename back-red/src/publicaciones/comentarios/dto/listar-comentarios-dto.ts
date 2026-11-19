import { Transform } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class ListarComentariosDto {
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    // validamos que el texto solo este formado por digitos, para el offset
    if (typeof value === 'string' && /^\d+$/.test(value)) {
      return Number(value);
    }
    return value;
  })
  @IsInt()
  @Min(0)
  offset: number = 0;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    // validamos que el texto solo este formado por digitos, para el limit
    if (typeof value === 'string' && /^\d+$/.test(value)) {
      return Number(value);
    }
    return value;
  })
  @IsInt()
  @Min(1)
  @Max(50)
  limit: number = 10;
}
