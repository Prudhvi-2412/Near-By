import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, IsPositive, IsString, Max, Min } from 'class-validator';

export class ExploreQueryDto {
  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  maxPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  @Max(5)
  minRating?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  durationMinutes?: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  availableOnly?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  verifiedOnly?: boolean;

  @IsOptional()
  @IsIn(['relevance', 'price_asc', 'price_desc', 'rating'])
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'rating';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  @Max(50)
  pageSize?: number;
}
