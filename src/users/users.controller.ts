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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../common/decorators';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { UserRole } from '../common/enums';
import { CreateUserDto, UpdateUserDto } from './dto/create-user.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth('JWT')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.ADMINISTRATOR)
  @ApiOperation({ summary: 'Create a user (Administrator only)' })
  async create(@Body() dto: CreateUserDto) {
    const data = await this.usersService.create(dto);
    return { message: 'User created successfully', data };
  }

  @Get()
  @Roles(UserRole.ADMINISTRATOR, UserRole.DEVOPS_ENGINEER)
  @ApiOperation({ summary: 'List users' })
  async findAll(@Query() query: PaginationQueryDto) {
    const data = await this.usersService.findAll(query);
    return { message: 'Users retrieved successfully', data };
  }

  @Get(':id')
  @Roles(UserRole.ADMINISTRATOR, UserRole.DEVOPS_ENGINEER)
  @ApiOperation({ summary: 'Get a user by id' })
  async findOne(@Param('id') id: string) {
    const data = await this.usersService.findById(id);
    return { message: 'User retrieved successfully', data };
  }

  @Patch(':id')
  @Roles(UserRole.ADMINISTRATOR)
  @ApiOperation({ summary: 'Update a user (Administrator only)' })
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    const data = await this.usersService.update(id, dto);
    return { message: 'User updated successfully', data };
  }

  @Delete(':id')
  @Roles(UserRole.ADMINISTRATOR)
  @ApiOperation({ summary: 'Deactivate a user (Administrator only)' })
  async deactivate(@Param('id') id: string) {
    const data = await this.usersService.deactivate(id);
    return { message: 'User deactivated successfully', data };
  }
}
