import { IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: '1000000001' })
  @IsString()
  documentNumber!: string;

  @ApiProperty({ example: 'Demo1234' })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({ example: 'Abogado Demo' })
  @IsString()
  fullName!: string;

  @ApiPropertyOptional({ example: 'Firma Demo' })
  @IsOptional()
  @IsString()
  lawFirm?: string;

  @ApiPropertyOptional({ example: '3000000000' })
  @IsOptional()
  @IsString()
  phone?: string;
}
