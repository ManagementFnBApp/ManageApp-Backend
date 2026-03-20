import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import {
  CreateProfileDto,
  ProfileResponseDto,
  UpdateProfileDto,
} from 'src/dtos/profile.dto';
import { HttpMessage, HttpStatus, Role } from 'src/global/globalEnum';
import { ResponseData, ResponseType } from 'src/global/globalResponse';
import { ProfileService } from './profile.service';
import { GetUser, Roles } from 'src/decorators/decorators';

@Controller('profiles')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) { }

  @Post()
  async createProfile(
    @Body() body: CreateProfileDto,
    @GetUser('id') userId: number,
  ): Promise<ResponseType<ProfileResponseDto>> {
    return new ResponseData(
      await this.profileService.createProfile(body, userId),
      HttpStatus.SUCCESS,
      HttpMessage.SUCCESS,
    );
  }

  @Get('detail')
  async getProfileDetail(
    @GetUser('id') userId: number,
  ): Promise<ResponseType<ProfileResponseDto>> {
    return new ResponseData(
      await this.profileService.getProfileDetail(userId),
      HttpStatus.SUCCESS,
      HttpMessage.SUCCESS,
    );
  }

  @Roles(Role.ADMIN)
  @Get()
  async getAllProfiles(): Promise<ResponseType<ProfileResponseDto[]>> {
    return new ResponseData<ProfileResponseDto[]>(
      await this.profileService.getAllProfiles(),
      HttpStatus.SUCCESS,
      HttpMessage.SUCCESS,
    );
  }

  @Put(':id')
  async updateProfile(
    @Param('id') id: string,
    @GetUser('id') userId: number,
    @Body() body: UpdateProfileDto,
  ): Promise<ResponseType<ProfileResponseDto>> {
    return new ResponseData(
      await this.profileService.updateProfile(id, userId, body),
      HttpStatus.SUCCESS,
      HttpMessage.SUCCESS,
    );
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  async deleteProfile(
    @Param('id') id: string,
  ): Promise<ResponseType<{ message: string }>> {
    return new ResponseData(
      await this.profileService.deleteProfile(id),
      HttpStatus.SUCCESS,
      HttpMessage.SUCCESS,
    );
  }
}
