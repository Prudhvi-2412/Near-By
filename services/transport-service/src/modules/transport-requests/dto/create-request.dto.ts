import { IsString, IsUUID, MinLength } from 'class-validator';

export class CreateTransportRequestDto {
  @IsUUID()
  requesterId!: string;

  @IsString()
  @MinLength(2)
  pickupLocation!: string;

  @IsString()
  @MinLength(2)
  dropoffLocation!: string;
}
