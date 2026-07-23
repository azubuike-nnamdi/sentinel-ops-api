import { Body, Controller, Get, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, Public } from '../common/decorators';
import { AuthenticatedUser } from '../common/interfaces';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new user account' })
  async register(@Body() dto: RegisterDto) {
    const data = await this.authService.register(dto);
    return { message: 'Registration successful', data };
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Authenticate and receive JWT tokens' })
  async login(@Body() dto: LoginDto) {
    const data = await this.authService.login(dto);
    return { message: 'Login successful', data };
  }

  @Get('me')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Get the authenticated user profile' })
  async me(@CurrentUser() user: AuthenticatedUser) {
    const data = await this.authService.getProfile(user.id);
    return { message: 'Profile retrieved successfully', data };
  }
}
