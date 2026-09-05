import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateTrustedContactDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @IsString()
  phone!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  relationship?: string;
}
