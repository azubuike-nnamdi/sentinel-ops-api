import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { InvitationStatus } from '../../common/enums';
import { CreateInvitationData } from '../interfaces/invitation.interface';
import { Invitation, InvitationDocument } from '../schemas/invitation.schema';

@Injectable()
export class InvitationsRepository {
  constructor(
    @InjectModel(Invitation.name)
    private readonly invitationModel: Model<InvitationDocument>,
  ) { }

  async create(data: CreateInvitationData): Promise<InvitationDocument> {
    return this.invitationModel.create({
      ...data,
      invitedBy: new Types.ObjectId(data.invitedBy),
      userId: new Types.ObjectId(data.userId),
    });
  }

  async findByTokenHash(tokenHash: string): Promise<InvitationDocument | null> {
    return this.invitationModel
      .findOne({ tokenHash })
      .select('+tokenHash')
      .exec();
  }

  async findPendingByEmail(email: string): Promise<InvitationDocument | null> {
    return this.invitationModel
      .findOne({
        email: email.toLowerCase(),
        status: InvitationStatus.PENDING,
      })
      .exec();
  }

  async findMany(
    filter: Record<string, unknown> = {},
    skip = 0,
    limit = 20,
    sort: Record<string, 1 | -1> = { createdAt: -1 },
  ): Promise<InvitationDocument[]> {
    return this.invitationModel
      .find(filter)
      .skip(skip)
      .limit(limit)
      .sort(sort)
      .exec();
  }

  async count(filter: Record<string, unknown> = {}): Promise<number> {
    return this.invitationModel.countDocuments(filter).exec();
  }

  async updateById(
    id: string,
    data: Partial<Invitation>,
  ): Promise<InvitationDocument | null> {
    return this.invitationModel
      .findByIdAndUpdate(id, { $set: data }, { new: true })
      .exec();
  }
}
