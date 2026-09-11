import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: '1000000001' })
  @IsString()
  documentNumber!: string;

  @ApiProperty({ example: 'Demo1234' })
  @IsString()
  password!: string;
}
