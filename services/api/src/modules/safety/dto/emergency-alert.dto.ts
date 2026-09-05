import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class EmergencyAlertDto {
  @IsOptional()
  @IsUUID()
  bookingId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  message?: string;
}
