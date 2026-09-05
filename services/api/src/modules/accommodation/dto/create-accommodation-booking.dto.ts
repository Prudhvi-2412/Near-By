import { IsDateString, IsUUID } from 'class-validator';

export class CreateAccommodationBookingDto {
  @IsUUID()
  roomId!: string;

  @IsDateString()
  checkIn!: string;

  @IsDateString()
  checkOut!: string;
}
