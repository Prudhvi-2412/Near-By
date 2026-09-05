import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProvidersService } from './providers.service';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { CreateProviderProfileDto } from './dto/create-provider-profile.dto';
import { UpdateProviderProfileDto } from './dto/update-provider-profile.dto';
import { UpdateAvailabilityStatusDto } from './dto/update-availability-status.dto';
import { CreateServiceDto } from './dto/create-service.dto';
import { CreatePricingDto } from './dto/create-pricing.dto';
import { UpdatePricingDto } from './dto/update-pricing.dto';
import { CreateAvailabilitySlotDto } from './dto/create-availability-slot.dto';
import { ExploreQueryDto } from './dto/explore-query.dto';
import { IsBoolean, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

class UploadUrlDto {
  @IsString()
  contentType!: string;

  @IsIn(['cover', 'gallery'])
  kind!: 'cover' | 'gallery';
}

class ImageKeyDto {
  @IsString()
  key!: string;
}

class UpdateTransportPreferenceDto {
  @IsOptional()
  @IsBoolean()
  usesTransport?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  preferredVehicleType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  notes?: string;
}

@ApiTags('providers')
@Controller('providers')
export class ProvidersController {
  constructor(private readonly providers: ProvidersService) {}

  @Public()
  @Get()
  explore(@Query() query: ExploreQueryDto) {
    return this.providers.explore(query);
  }

  @Roles('PROVIDER')
  @Post('me')
  @AuditLog({ action: 'PROVIDER_PROFILE_CREATED', entityType: 'ProviderProfile' })
  createProfile(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateProviderProfileDto) {
    return this.providers.createProfile(user.id, dto);
  }

  @Roles('PROVIDER')
  @Get('me')
  getMyProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.providers.getMyProfile(user.id);
  }

  @Roles('PROVIDER')
  @Patch('me')
  updateProfile(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateProviderProfileDto) {
    return this.providers.updateProfile(user.id, dto);
  }

  @Roles('PROVIDER')
  @Patch('me/availability-status')
  updateAvailabilityStatus(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateAvailabilityStatusDto) {
    return this.providers.updateAvailabilityStatus(user.id, dto.status);
  }

  @Roles('PROVIDER')
  @Post('me/media/upload-url')
  getUploadUrl(@CurrentUser() user: AuthenticatedUser, @Body() dto: UploadUrlDto) {
    return this.providers.getUploadUrl(user.id, dto.contentType, dto.kind);
  }

  @Roles('PROVIDER')
  @Post('me/media/cover')
  setCoverImage(@CurrentUser() user: AuthenticatedUser, @Body() dto: ImageKeyDto) {
    return this.providers.setCoverImage(user.id, dto.key);
  }

  @Roles('PROVIDER')
  @Post('me/media/gallery')
  addGalleryImage(@CurrentUser() user: AuthenticatedUser, @Body() dto: ImageKeyDto) {
    return this.providers.addGalleryImage(user.id, dto.key);
  }

  @Roles('PROVIDER')
  @Post('me/services')
  createService(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateServiceDto) {
    return this.providers.createService(user.id, dto);
  }

  @Roles('PROVIDER')
  @Patch('me/services/:id')
  updateService(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: CreateServiceDto) {
    return this.providers.updateService(user.id, id, dto);
  }

  @Roles('PROVIDER')
  @Delete('me/services/:id')
  deleteService(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.providers.deleteService(user.id, id);
  }

  @Roles('PROVIDER')
  @Post('me/pricing')
  createPricing(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreatePricingDto) {
    return this.providers.createPricing(user.id, dto);
  }

  @Roles('PROVIDER')
  @Patch('me/pricing/:id')
  @AuditLog({ action: 'PROVIDER_PRICE_UPDATED', entityType: 'ProviderPricing' })
  updatePricing(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdatePricingDto) {
    return this.providers.updatePricing(user.id, id, dto.price);
  }

  @Roles('PROVIDER')
  @Get('me/pricing/:id/history')
  pricingHistory(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.providers.pricingHistory(user.id, id);
  }

  @Roles('PROVIDER')
  @Delete('me/pricing/:id')
  deletePricing(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.providers.deletePricing(user.id, id);
  }

  @Roles('PROVIDER')
  @Post('me/availability-slots')
  createAvailabilitySlot(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateAvailabilitySlotDto) {
    return this.providers.createAvailabilitySlot(user.id, dto);
  }

  @Roles('PROVIDER')
  @Get('me/availability-slots')
  listAvailabilitySlots(@CurrentUser() user: AuthenticatedUser) {
    return this.providers.listMyAvailabilitySlots(user.id);
  }

  @Roles('PROVIDER')
  @Delete('me/availability-slots/:id')
  deleteAvailabilitySlot(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.providers.deleteAvailabilitySlot(user.id, id);
  }

  @Roles('PROVIDER')
  @Get('me/transport-preference')
  getTransportPreference(@CurrentUser() user: AuthenticatedUser) {
    return this.providers.getTransportPreference(user.id);
  }

  @Roles('PROVIDER')
  @Patch('me/transport-preference')
  updateTransportPreference(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateTransportPreferenceDto) {
    return this.providers.updateTransportPreference(user.id, dto);
  }

  @Public()
  @Get(':slug')
  getPublicProfile(@Param('slug') slug: string) {
    return this.providers.getPublicProfile(slug);
  }
}
