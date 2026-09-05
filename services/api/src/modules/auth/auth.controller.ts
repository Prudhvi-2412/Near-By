import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';

const REFRESH_COOKIE = 'nb_refresh_token';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  private setRefreshCookie(res: Response, token: string) {
    res.cookie(REFRESH_COOKIE, token, {
      httpOnly: true,
      secure: this.config.get('NODE_ENV') === 'production',
      sameSite: 'lax',
      path: '/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken, roles } = await this.authService.register(dto);
    this.setRefreshCookie(res, refreshToken);
    return { accessToken, roles };
  }

  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken, roles } = await this.authService.login(dto.email, dto.password);
    this.setRefreshCookie(res, refreshToken);
    return { accessToken, roles };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(@Body() dto: RefreshDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = dto.refreshToken || req.cookies?.[REFRESH_COOKIE];
    const { accessToken, refreshToken, roles } = await this.authService.refresh(token);
    this.setRefreshCookie(res, refreshToken);
    return { accessToken, roles };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(@Body() dto: RefreshDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = dto.refreshToken || req.cookies?.[REFRESH_COOKIE];
    if (token) {
      await this.authService.logout(token);
    }
    res.clearCookie(REFRESH_COOKIE, { path: '/auth' });
    return { success: true };
  }

  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }
}
