import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TransportRequestsService } from './transport-requests.service';
import { CreateTransportRequestDto } from './dto/create-request.dto';
import { CompleteTransportRequestDto } from './dto/complete-request.dto';

@ApiTags('transport-requests')
@Controller('transport-requests')
export class TransportRequestsController {
  constructor(private readonly requests: TransportRequestsService) {}

  @Post()
  create(@Body() dto: CreateTransportRequestDto) {
    return this.requests.create(dto);
  }

  @Get()
  listForRequester(@Query('requesterId') requesterId: string) {
    return this.requests.listForRequester(requesterId);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.requests.findById(id);
  }

  @Post(':id/auto-assign')
  autoAssign(@Param('id') id: string) {
    return this.requests.autoAssign(id);
  }

  @Post(':id/start')
  start(@Param('id') id: string) {
    return this.requests.start(id);
  }

  @Post(':id/complete')
  complete(@Param('id') id: string, @Body() dto: CompleteTransportRequestDto) {
    return this.requests.complete(id, dto.fare);
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.requests.cancel(id);
  }
}
