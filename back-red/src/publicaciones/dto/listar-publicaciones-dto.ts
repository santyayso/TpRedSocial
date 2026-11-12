import { Transform } from 'class-transformer';
import { IsInt, IsMongoId, IsOptional, Matches, Max, Min, } from 'class-validator';

export class ListarPublicacionesDto {
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
                   // validamos que el texto solo este formado por digitos, para el  limit
    if (typeof value === 'string' && /^\d+$/.test(value)) {
      return Number(value);
    }
    return value;
  })
  @IsInt()
  @Min(1)
  @Max(50)
  limit: number = 10;

  @IsOptional()
  @Matches(/^(fecha|meGusta)$/)
  orden: 'fecha' | 'meGusta' = 'fecha';

  @IsOptional()
  @IsMongoId()
  autor?: string;
}