import { IsIn } from 'class-validator';

export class CreateVerificationRequestDto {
  @IsIn(['IDENTITY', 'HEALTH'])
  type!: 'IDENTITY' | 'HEALTH';
}
