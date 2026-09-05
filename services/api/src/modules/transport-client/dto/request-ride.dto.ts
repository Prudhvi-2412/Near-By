import { IsString, MinLength } from 'class-validator';

export class RequestRideDto {
  @IsString()
  @MinLength(2)
  pickupLocation!: string;

  @IsString()
  @MinLength(2)
  dropoffLocation!: string;
}
