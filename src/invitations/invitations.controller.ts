import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, Public, Roles } from '../common/decorators';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { UserRole } from '../common/enums';
import { AuthenticatedUser } from '../common/interfaces';
import { AcceptInviteDto, InviteUserDto } from './dto/invitation.dto';
import { InvitationsService } from './invitations.service';

@ApiTags('Invitations')
@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post()
  @ApiBearerAuth('JWT')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Invite a user and assign a role (admin / super_admin only)' })
  async invite(
    @Body() dto: InviteUserDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.invitationsService.invite(dto, user.id);
    return { message: 'Invitation sent successfully', data };
  }

  @Get()
  @ApiBearerAuth('JWT')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'List invitations (admin / super_admin only)' })
  async findAll(@Query() query: PaginationQueryDto) {
    const data = await this.invitationsService.findAll(query);
    return { message: 'Invitations retrieved successfully', data };
  }

  @Get(':token/validate')
  @Public()
  @ApiOperation({ summary: 'Validate an invitation token' })
  async validate(@Param('token') token: string) {
    const data = await this.invitationsService.validateToken(token);
    return { message: 'Invitation is valid', data };
  }

  @Post(':token/accept')
  @Public()
  @ApiOperation({ summary: 'Accept an invitation and set a password' })
  async accept(
    @Param('token') token: string,
    @Body() dto: AcceptInviteDto,
  ) {
    const data = await this.invitationsService.accept(token, dto);
    return { message: 'Invitation accepted successfully', data };
  }
}
