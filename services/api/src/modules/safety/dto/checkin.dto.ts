import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CheckInDto {
  @IsUUID()
  bookingId!: string;

  @IsIn(['CHECK_IN', 'CHECK_OUT'])
  type!: 'CHECK_IN' | 'CHECK_OUT';

  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string;
}
