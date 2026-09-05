import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class ResolveDisputeDto {
  @IsIn(['RESOLVED', 'REJECTED'])
  status!: 'RESOLVED' | 'REJECTED';

  @IsIn(['COMPLETED', 'CANCELLED'])
  bookingOutcome!: 'COMPLETED' | 'CANCELLED';

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  resolution?: string;
}
