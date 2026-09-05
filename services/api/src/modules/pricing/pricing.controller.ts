import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsObject, IsOptional, IsString } from 'class-validator';
import { PricingService } from './pricing.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';

class CreatePricingRuleDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsIn(['DEMAND_MULTIPLIER', 'TIME_OF_DAY', 'SUPPLY_SHORTAGE'])
  ruleType!: 'DEMAND_MULTIPLIER' | 'TIME_OF_DAY' | 'SUPPLY_SHORTAGE';

  @IsObject()
  config!: Record<string, unknown>;
}

class SetRuleActiveDto {
  @IsBoolean()
  isActive!: boolean;
}

@ApiTags('pricing')
@Controller('pricing')
export class PricingController {
  constructor(private readonly pricing: PricingService) {}

  @Roles('PROVIDER')
  @Post('suggestions/generate')
  generate(@CurrentUser() user: AuthenticatedUser) {
    return this.pricing.generateForOwnProvider(user.id);
  }

  @Roles('PROVIDER')
  @Get('suggestions/mine')
  mine(@CurrentUser() user: AuthenticatedUser) {
    return this.pricing.listPendingForOwnProvider(user.id);
  }

  @Roles('PROVIDER')
  @Post('suggestions/:id/accept')
  accept(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.pricing.accept(user.id, id);
  }

  @Roles('PROVIDER')
  @Post('suggestions/:id/reject')
  reject(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.pricing.reject(user.id, id);
  }

  @Roles('ADMIN')
  @Get('rules')
  rules() {
    return this.pricing.listRules();
  }

  @Roles('ADMIN')
  @Post('rules')
  createRule(@Body() dto: CreatePricingRuleDto) {
    return this.pricing.createRule(dto);
  }

  @Roles('ADMIN')
  @Post('rules/:id/active')
  setRuleActive(@Param('id') id: string, @Body() dto: SetRuleActiveDto) {
    return this.pricing.setRuleActive(id, dto.isActive);
  }
}
