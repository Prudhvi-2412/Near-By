import { IsString, MinLength } from 'class-validator';

export class RegisterDriverDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  phone!: string;

  @IsString()
  licenseNumber!: string;
}
