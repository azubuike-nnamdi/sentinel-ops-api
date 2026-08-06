import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { InvitationStatus } from '../common/enums';
import { JwtPayload, PaginatedResult } from '../common/interfaces';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { PasswordUtil, PaginationUtil, TokenUtil } from '../common/utils';
import { MailService } from '../mail/mail.service';
import { AuthTokens } from '../auth/interfaces/auth.interface';
import { UsersService } from '../users/users.service';
import { AcceptInviteDto, InviteUserDto } from './dto/invitation.dto';
import { IInvitation } from './interfaces/invitation.interface';
import { InvitationsRepository } from './repositories/invitations.repository';
import { InvitationDocument } from './schemas/invitation.schema';

@Injectable()
export class InvitationsService {
  private readonly logger = new Logger(InvitationsService.name);

  constructor(
    private readonly invitationsRepository: InvitationsRepository,
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async invite(
    dto: InviteUserDto,
    invitedByUserId: string,
  ): Promise<IInvitation> {
    const email = dto.email.toLowerCase().trim();
    const existingUser = await this.usersService.findByEmail(email);

    if (existingUser?.isActive) {
      throw new ConflictException('A user with this email already exists');
    }

    const pending = await this.invitationsRepository.findPendingByEmail(email);
    if (pending) {
      throw new ConflictException(
        'An invitation is already pending for this email',
      );
    }

    const token = TokenUtil.randomToken();
    const tokenHash = TokenUtil.sha256(token);
    const ttlDays = this.configService.get<number>('mail.inviteTtlDays') || 7;
    const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);

    let userId = existingUser?.id;
    if (!userId) {
      const invitedUser = await this.usersService.createInvited({
        firstName: dto.firstName,
        lastName: dto.lastName,
        email,
        role: dto.role,
      });
      userId = invitedUser.id;
    } else {
      await this.usersService.update(userId, {
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role,
        isActive: false,
      });
    }

    const invitation = await this.invitationsRepository.create({
      email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: dto.role,
      status: InvitationStatus.PENDING,
      tokenHash,
      expiresAt,
      invitedBy: invitedByUserId,
      userId,
    });

    await this.sendInviteEmail({
      to: email,
      firstName: dto.firstName,
      role: dto.role,
      token,
      expiresAt,
      ttlDays,
    });

    return this.toInvitation(invitation);
  }

  async findAll(
    query: PaginationQueryDto,
  ): Promise<PaginatedResult<IInvitation>> {
    const { page = 1, limit = 20, search, sort } = query;
    const filter = search
      ? {
          $or: [
            { email: { $regex: search, $options: 'i' } },
            { firstName: { $regex: search, $options: 'i' } },
            { lastName: { $regex: search, $options: 'i' } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      this.invitationsRepository.findMany(
        filter,
        PaginationUtil.getSkip(page, limit),
        limit,
        PaginationUtil.parseSort(sort, { createdAt: -1 }),
      ),
      this.invitationsRepository.count(filter),
    ]);

    return PaginationUtil.buildResult(
      items.map((item) => this.toInvitation(item)),
      total,
      page,
      limit,
    );
  }

  async validateToken(token: string) {
    const invitation = await this.findUsableInvite(token);

    return {
      email: this.maskEmail(invitation.email),
      firstName: invitation.firstName,
      lastName: invitation.lastName,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
    };
  }

  async accept(token: string, dto: AcceptInviteDto) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const invitation = await this.findUsableInvite(token);
    const saltRounds =
      this.configService.get<number>('app.bcryptSaltRounds') || 12;
    const hashedPassword = await PasswordUtil.hash(dto.password, saltRounds);

    const user = await this.usersService.activateInvited(
      invitation.userId.toString(),
      {
        firstName: dto.firstName || invitation.firstName,
        lastName: dto.lastName || invitation.lastName,
        password: hashedPassword,
        role: invitation.role,
      },
    );

    await this.invitationsRepository.updateById(invitation.id, {
      status: InvitationStatus.ACCEPTED,
      usedAt: new Date(),
    });

    const tokens = await this.issueTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return { user, tokens };
  }

  private async findUsableInvite(token: string): Promise<InvitationDocument> {
    if (!token?.trim()) {
      throw new BadRequestException('Invite token is required');
    }

    const invitation = await this.invitationsRepository.findByTokenHash(
      TokenUtil.sha256(token),
    );

    if (!invitation) {
      throw new NotFoundException('Invite not found');
    }

    if (invitation.status === InvitationStatus.REVOKED) {
      throw new BadRequestException('Invite has been revoked');
    }

    if (invitation.status === InvitationStatus.ACCEPTED) {
      throw new BadRequestException('Invite has already been accepted');
    }

    if (
      invitation.status === InvitationStatus.EXPIRED ||
      invitation.expiresAt.getTime() < Date.now()
    ) {
      if (invitation.status === InvitationStatus.PENDING) {
        await this.invitationsRepository.updateById(invitation.id, {
          status: InvitationStatus.EXPIRED,
        });
      }
      throw new BadRequestException('Invite has expired');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('Invite is not usable');
    }

    return invitation;
  }

  private async sendInviteEmail(params: {
    to: string;
    firstName: string;
    role: string;
    token: string;
    expiresAt: Date;
    ttlDays: number;
  }): Promise<void> {
    const frontendUrl =
      this.configService.get<string>('mail.frontendUrl') ||
      'http://localhost:3000';
    const actionUrl = `${frontendUrl.replace(/\/$/, '')}/accept-invite?token=${encodeURIComponent(params.token)}`;
    const appName = this.configService.get<string>('app.name') || 'SentinelOps';

    const subject = `You're invited to ${appName}`;
    const text = [
      `Hi ${params.firstName},`,
      '',
      `You have been invited to join ${appName} as ${params.role}.`,
      `This invitation expires in ${params.ttlDays} days (${params.expiresAt.toUTCString()}).`,
      '',
      `Accept your invite: ${actionUrl}`,
      '',
      'If you did not expect this email, you can ignore it.',
    ].join('\n');

    const html = `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111">
        <h2 style="margin:0 0 12px">${appName} invitation</h2>
        <p>Hi ${params.firstName},</p>
        <p>You have been invited to join <strong>${appName}</strong> as <strong>${params.role}</strong>.</p>
        <p>This invitation expires in <strong>${params.ttlDays} days</strong>.</p>
        <p style="margin:24px 0">
          <a href="${actionUrl}" style="background:#111;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;display:inline-block">
            Accept invitation
          </a>
        </p>
        <p style="font-size:12px;color:#666">If the button does not work, open this link:<br/>${actionUrl}</p>
      </div>
    `;

    try {
      await this.mailService.sendMail({
        to: params.to,
        subject,
        html,
        text,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send invite email to ${params.to}: 
        ${error instanceof Error ? error.message : String(error)}
        `,
      );
      // Invite is still created; admin can resend later if needed.
    }
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

  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (!local || !domain) {
      return '***';
    }
    const visible = local.slice(0, Math.min(2, local.length));
    return `${visible}***@${domain}`;
  }

  toInvitation(invitation: InvitationDocument): IInvitation {
    return {
      id: invitation.id,
      email: invitation.email,
      firstName: invitation.firstName,
      lastName: invitation.lastName,
      role: invitation.role,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      usedAt: invitation.usedAt,
      revokedAt: invitation.revokedAt,
      invitedBy: invitation.invitedBy.toString(),
      userId: invitation.userId.toString(),
      createdAt: invitation.createdAt,
      updatedAt: invitation.updatedAt,
    };
  }
}
