import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateDisputeDto {
  @IsUUID()
  bookingId!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(150)
  reason!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  details?: string;
}
