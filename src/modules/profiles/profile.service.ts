import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'db/prisma.service';
import {
  CreateProfileDto,
  ProfileResponseDto,
  UpdateProfileDto,
} from 'src/dtos/profile.dto';

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) { }

  async createProfile(data: CreateProfileDto, userId: number): Promise<ProfileResponseDto> {
    const profile = await this.prisma.profile.create({
      data: {
        user_id: userId,
        full_name: data.full_name ?? '',
        avatar: data.avatar,
        phone: data.phone,
      },
    });

    return this.transformToDto(profile);
  }

  async getAllProfiles(): Promise<ProfileResponseDto[]> {
    const profiles = await this.prisma.profile.findMany({
      orderBy: { created_at: 'desc' },
    });

    return profiles.map((profile) => this.transformToDto(profile));
  }

  async getProfileDetail(userId: number): Promise<ProfileResponseDto> {
    const profile = await this.prisma.profile.findUnique({
      where: { user_id: userId },
    });

    if (!profile) {
      throw new NotFoundException(`Profile for user with ID ${userId} not found`);
    }

    return this.transformToDto(profile);
  }

  async updateProfile(
    id: string,
    userId: number,
    data: UpdateProfileDto,
  ): Promise<ProfileResponseDto> {
    const existingProfile = await this.prisma.profile.findUnique({
      where: { id },
    });

    if (!existingProfile) {
      throw new NotFoundException(`Profile with ID ${id} not found`);
    }

    if (existingProfile.user_id !== userId) {
      throw new ForbiddenException('You are not the owner of this profile');
    }

    const updatedProfile = await this.prisma.profile.update({
      where: { id },
      data: {
        ...(data.full_name !== undefined && { full_name: data.full_name }),
        ...(data.avatar !== undefined && { avatar: data.avatar }),
        ...(data.phone !== undefined && { phone: data.phone }),
      },
    });

    return this.transformToDto(updatedProfile);
  }

  async deleteProfile(id: string): Promise<{ message: string }> {
    const existingProfile = await this.prisma.profile.findUnique({
      where: { id },
    });

    if (!existingProfile) {
      throw new NotFoundException(`Profile with ID ${id} not found`);
    }

    await this.prisma.profile.delete({
      where: { id },
    });

    return { message: `Profile with ID ${id} has been deleted successfully` };
  }

  private transformToDto(profile: any): ProfileResponseDto {
    return {
      profile_id: profile.id,
      user_id: profile.user_id,
      full_name: profile.full_name,
      avatar: profile.avatar,
      phone: profile.phone
    };
  }
}
