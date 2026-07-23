import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { PasswordUtil } from '../common/utils';
import { JwtPayload } from '../common/interfaces';
import { UserRole } from '../common/enums';
import { UsersService } from '../users/users.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { AuthResult, AuthTokens } from './interfaces/auth.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    const user = await this.usersService.create({
      ...dto,
      role: dto.role ?? UserRole.OPERATOR,
    });

    const tokens = await this.issueTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return { user, tokens };
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.usersService.findByEmailWithPassword(dto.email);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordValid = await PasswordUtil.compare(
      dto.password,
      user.password,
    );

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    await this.usersService.recordLogin(user.id as string);

    const profile = this.usersService.toUser(user);
    const tokens = await this.issueTokens({
      sub: profile.id,
      email: profile.email,
      role: profile.role,
    });

    return { user: profile, tokens };
  }

  async getProfile(userId: string) {
    return this.usersService.findById(userId);
  }

  private async issueTokens(payload: JwtPayload): Promise<AuthTokens> {
    const expiresIn = (this.configService.get<string>('jwt.expiresIn') ||
      '1d') as JwtSignOptions['expiresIn'];
    const refreshExpiresIn = (this.configService.get<string>(
      'jwt.refreshExpiresIn',
    ) || '7d') as JwtSignOptions['expiresIn'];
    const refreshSecret =
      this.configService.getOrThrow<string>('jwt.refreshSecret');

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: refreshExpiresIn,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: String(expiresIn),
    };
  }
}
