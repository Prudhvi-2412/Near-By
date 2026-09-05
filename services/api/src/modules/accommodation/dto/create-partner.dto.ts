import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreatePartnerDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @MinLength(2)
  city!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;
}
