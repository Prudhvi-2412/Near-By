import { IsInt, IsPositive, IsString, IsUUID, MinLength } from 'class-validator';

export class RegisterVehicleDto {
  @IsUUID()
  driverId!: string;

  @IsString()
  @MinLength(2)
  make!: string;

  @IsString()
  @MinLength(1)
  model!: string;

  @IsString()
  plateNumber!: string;

  @IsInt()
  @IsPositive()
  capacity!: number;
}
