import { IsNumber, IsPositive } from 'class-validator';

export class UpdatePricingDto {
  @IsNumber()
  @IsPositive()
  price!: number;
}
