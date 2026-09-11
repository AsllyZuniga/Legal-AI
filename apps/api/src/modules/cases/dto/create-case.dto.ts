import { IsString, IsOptional, IsNumber, IsDateString } from 'class-validator';

export class CreateCaseDto {
  @IsString()
  name!: string;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsString()
  legalArea?: string;

  @IsOptional() @IsString()
  subarea?: string;

  @IsOptional() @IsString()
  processType?: string;

  @IsOptional() @IsString()
  client?: string;

  @IsOptional() @IsString()
  court?: string;

  @IsOptional() @IsString()
  fileNumber?: string;

  @IsOptional() @IsString()
  city?: string;

  @IsOptional() @IsDateString()
  startDate?: string;

  @IsOptional() @IsString()
  responsibleLawyer?: string;

  @IsOptional() @IsString()
  opposingParty?: string;

  @IsOptional() @IsString()
  pretensions?: string;

  @IsOptional() @IsNumber()
  amount?: number;

  @IsOptional() @IsString()
  priority?: string;

  @IsOptional()
  parties?: any;

  @IsOptional() @IsString()
  legalProblemDescription?: string;

  @IsOptional() @IsString()
  additionalInfo?: string;
}
