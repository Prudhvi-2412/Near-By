import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import type { RoleName, UserStatus } from '@prisma/client';
import { AdminService } from './admin.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuditLog } from '../../common/decorators/audit-log.decorator';

class UpdateUserStatusDto {
  @IsIn(['ACTIVE', 'SUSPENDED', 'BANNED'])
  status!: UserStatus;
}

@ApiTags('admin')
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('users')
  listUsers(
    @Query('role') role?: RoleName,
    @Query('status') status?: UserStatus,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.admin.listUsers({
      role,
      status,
      search,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
  }

  @Post('users/:id/status')
  @AuditLog({ action: 'USER_STATUS_UPDATED', entityType: 'User' })
  updateUserStatus(@Param('id') id: string, @Body() dto: UpdateUserStatusDto) {
    return this.admin.updateUserStatus(id, dto.status);
  }

  @Get('bookings')
  listBookings(
    @Query('status') status?: string,
    @Query('city') city?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.admin.listBookings({
      status,
      city,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
  }

  @Get('analytics')
  analytics() {
    return this.admin.platformAnalytics();
  }
}
