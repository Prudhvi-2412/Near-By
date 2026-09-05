import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, Matches, MinLength } from 'class-validator';
import type { RoleName } from '@prisma/client';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @MinLength(8)
  @Matches(/[A-Z]/, { message: 'password must contain an uppercase letter' })
  @Matches(/[0-9]/, { message: 'password must contain a number' })
  password!: string;

  @IsEnum(['CUSTOMER', 'PROVIDER'] as RoleName[])
  role!: 'CUSTOMER' | 'PROVIDER';

  @IsBoolean()
  ageConfirmed!: boolean;

  @IsBoolean()
  termsAccepted!: boolean;
}
