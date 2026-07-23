import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, UpdateQuery } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import {
  CreateUserData,
  UpdateUserData,
} from '../interfaces/user.interface';

type UserFilter = Record<string, unknown>;

@Injectable()
export class UsersRepository {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async create(data: CreateUserData): Promise<UserDocument> {
    return this.userModel.create(data);
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  async findByEmailWithPassword(
    email: string,
  ): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ email: email.toLowerCase() })
      .select('+password')
      .exec();
  }

  async findByIdWithPassword(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).select('+password').exec();
  }

  async findMany(
    filter: UserFilter = {},
    skip = 0,
    limit = 20,
    sort: Record<string, 1 | -1> = { createdAt: -1 },
  ): Promise<UserDocument[]> {
    return this.userModel
      .find(filter)
      .skip(skip)
      .limit(limit)
      .sort(sort)
      .exec();
  }

  async count(filter: UserFilter = {}): Promise<number> {
    return this.userModel.countDocuments(filter).exec();
  }

  async updateById(
    id: string,
    data: UpdateUserData,
  ): Promise<UserDocument | null> {
    const update: UpdateQuery<UserDocument> = { $set: data };
    return this.userModel
      .findByIdAndUpdate(id, update, { new: true })
      .exec();
  }

  async softDeactivate(id: string): Promise<UserDocument | null> {
    return this.userModel
      .findByIdAndUpdate(id, { $set: { isActive: false } }, { new: true })
      .exec();
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.userModel
      .countDocuments({ email: email.toLowerCase() })
      .exec();
    return count > 0;
  }
}
