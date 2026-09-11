import { IsString, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class SearchRulingDto {
  @ApiPropertyOptional({ example: 'responsabilidad civil' })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({ example: 'corte_constitucional' })
  @IsOptional()
  @IsString()
  corporation?: string;

  @ApiPropertyOptional({ example: 'civil' })
  @IsOptional()
  @IsString()
  legalArea?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  radicado?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  magistrate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dateFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dateTo?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;
}
