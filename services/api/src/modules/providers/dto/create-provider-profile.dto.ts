import { ArrayMaxSize, IsArray, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateProviderProfileDto {
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  displayName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1500)
  bio?: string;

  @IsString()
  @MinLength(2)
  city!: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsArray()
  languages?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  tags?: string[];
}
