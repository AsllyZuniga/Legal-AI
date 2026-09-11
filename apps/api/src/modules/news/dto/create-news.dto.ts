import { IsString, IsOptional, IsBoolean, IsArray, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNewsDto {
  @ApiProperty({ example: 'Corte Constitucional emite fallo histórico' })
  @IsString()
  title!: string;

  @ApiProperty({ example: 'La Corte Constitucional estableció nuevos precedentes...' })
  @IsString()
  summary!: string;

  @ApiPropertyOptional({ example: 'Contenido completo de la noticia...' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({ example: 'nacional', enum: ['regional', 'nacional', 'internacional'] })
  @IsString()
  category!: string;

  @ApiProperty({ example: 'El Tiempo' })
  @IsString()
  source!: string;

  @ApiPropertyOptional({ example: 'https://eltiempo.com/noticia/123' })
  @IsOptional()
  @IsString()
  sourceUrl?: string;

  @ApiPropertyOptional({ example: 'https://images.com/noticia.jpg' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ example: ['Corte Constitucional', 'Fallo', 'Derechos'] })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ example: '2026-08-22T10:00:00Z' })
  @IsOptional()
  @IsDateString()
  publishedAt?: string;
}
