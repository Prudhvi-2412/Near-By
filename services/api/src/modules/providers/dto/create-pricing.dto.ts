import { IsInt, IsNumber, IsOptional, IsPositive, IsString, IsUUID, Max } from 'class-validator';

export class CreatePricingDto {
  @IsOptional()
  @IsUUID()
  serviceId?: string;

  @IsInt()
  @IsPositive()
  @Max(1440)
  durationMinutes!: number;

  @IsNumber()
  @IsPositive()
  price!: number;

  @IsOptional()
  @IsString()
  currency?: string;
}
