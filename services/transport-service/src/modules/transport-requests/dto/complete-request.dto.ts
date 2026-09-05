import { IsNumber, IsOptional, IsPositive } from 'class-validator';

export class CompleteTransportRequestDto {
  @IsOptional()
  @IsNumber()
  @IsPositive()
  fare?: number;
}
