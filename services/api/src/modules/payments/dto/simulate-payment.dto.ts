import { IsIn } from 'class-validator';

export class SimulatePaymentDto {
  @IsIn(['SUCCEEDED', 'FAILED'])
  outcome!: 'SUCCEEDED' | 'FAILED';
}
