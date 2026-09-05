import { IsIn } from 'class-validator';

export class UpdateAvailabilityStatusDto {
  @IsIn(['AVAILABLE_NOW', 'AVAILABLE_LATER', 'BUSY', 'UNAVAILABLE'])
  status!: 'AVAILABLE_NOW' | 'AVAILABLE_LATER' | 'BUSY' | 'UNAVAILABLE';
}
