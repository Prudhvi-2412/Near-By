import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class ReportUserDto {
  @IsOptional()
  @IsUUID()
  reportedUserId?: string;

  @IsOptional()
  @IsUUID()
  reportedBookingId?: string;

  @IsString()
  @MinLength(3)
  @MaxLength(120)
  reason!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  details?: string;
}
