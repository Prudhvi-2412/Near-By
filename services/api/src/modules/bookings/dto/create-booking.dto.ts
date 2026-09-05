import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateBookingDto {
  @IsUUID()
  providerPricingId!: string;

  @IsUUID()
  availabilitySlotId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  meetingNotes?: string;
}
