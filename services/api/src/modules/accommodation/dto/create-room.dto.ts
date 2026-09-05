import { IsInt, IsNumber, IsOptional, IsPositive, IsString, MinLength } from 'class-validator';

export class CreateRoomDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @IsPositive()
  capacity!: number;

  @IsNumber()
  @IsPositive()
  pricePerNight!: number;
}
