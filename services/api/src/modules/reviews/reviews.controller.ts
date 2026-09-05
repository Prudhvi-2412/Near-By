import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReportReviewDto } from './dto/report-review.dto';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Roles('CUSTOMER', 'PROVIDER')
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateReviewDto) {
    return this.reviews.create(user.id, dto);
  }

  @Public()
  @Get('for/:targetId')
  listForTarget(@Param('targetId') targetId: string) {
    return this.reviews.listForTarget(targetId);
  }

  @Roles('CUSTOMER', 'PROVIDER', 'ADMIN')
  @Post(':id/report')
  report(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: ReportReviewDto) {
    return this.reviews.report(user.id, id, dto.reason);
  }
}
