import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { PasswordUtil, PaginationUtil } from '../common/utils';
import { PaginatedResult } from '../common/interfaces';
import { CreateUserDto, UpdateUserDto } from './dto/create-user.dto';
import { IUser } from './interfaces/user.interface';
import { UsersRepository } from './repositories/users.repository';
import { UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly configService: ConfigService,
  ) {}

  async create(dto: CreateUserDto): Promise<IUser> {
    const emailExists = await this.usersRepository.existsByEmail(dto.email);
    if (emailExists) {
      throw new ConflictException('A user with this email already exists');
    }

    const saltRounds =
      this.configService.get<number>('app.bcryptSaltRounds') || 12;
    const hashedPassword = await PasswordUtil.hash(dto.password, saltRounds);

    const user = await this.usersRepository.create({
      ...dto,
      email: dto.email.toLowerCase(),
      password: hashedPassword,
    });

    return this.toUser(user);
  }

  async findAll(
    query: PaginationQueryDto,
  ): Promise<PaginatedResult<IUser>> {
    const { page = 1, limit = 20, search, sort } = query;
    const filter = search
      ? {
          $or: [
            { firstName: { $regex: search, $options: 'i' } },
            { lastName: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      this.usersRepository.findMany(
        filter,
        PaginationUtil.getSkip(page, limit),
        limit,
        PaginationUtil.parseSort(sort),
      ),
      this.usersRepository.count(filter),
    ]);

    return PaginationUtil.buildResult(
      items.map((user: UserDocument) => this.toUser(user)),
      total,
      page,
      limit,
    );
  }

  async findById(id: string): Promise<IUser> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.toUser(user);
  }

  async findByEmail(email: string): Promise<IUser | null> {
    const user = await this.usersRepository.findByEmail(email);
    return user ? this.toUser(user) : null;
  }

  async findByEmailWithPassword(email: string): Promise<UserDocument | null> {
    return this.usersRepository.findByEmailWithPassword(email);
  }

  async findByIdWithPassword(id: string): Promise<UserDocument | null> {
    return this.usersRepository.findByIdWithPassword(id);
  }

  async update(id: string, dto: UpdateUserDto): Promise<IUser> {
    if (dto.email) {
      const existing = await this.usersRepository.findByEmail(dto.email);
      if (existing && existing.id !== id) {
        throw new ConflictException('A user with this email already exists');
      }
    }

    const payload: UpdateUserDto = { ...dto };
    if (dto.password) {
      const saltRounds =
        this.configService.get<number>('app.bcryptSaltRounds') || 12;
      payload.password = await PasswordUtil.hash(dto.password, saltRounds);
    }

    if (dto.email) {
      payload.email = dto.email.toLowerCase();
    }

    const user = await this.usersRepository.updateById(id, payload);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.toUser(user);
  }

  async deactivate(id: string): Promise<IUser> {
    const user = await this.usersRepository.softDeactivate(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.toUser(user);
  }

  async recordLogin(id: string): Promise<void> {
    await this.usersRepository.updateById(id, {
      lastLoginAt: new Date(),
    });
  }

  toUser(user: UserDocument): IUser {
    return {
      id: user.id as string,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt ?? null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
