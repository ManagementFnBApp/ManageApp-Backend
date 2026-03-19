import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import {
  CreateProfileDto,
  ProfileResponseDto,
  UpdateProfileDto,
} from 'src/dtos/profile.dto';
import { HttpMessage, HttpStatus, Role } from 'src/global/globalEnum';
import { ResponseData, ResponseType } from 'src/global/globalResponse';
import { ProfileService } from './profile.service';
import { Roles } from 'src/decorators/decorators';

@Controller('profiles')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) { }

  @Post()
  async createProfile(
    @Body() body: CreateProfileDto,
  ): Promise<ResponseType<ProfileResponseDto>> {
    return new ResponseData(
      await this.profileService.createProfile(body),
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
    @Body() body: UpdateProfileDto,
  ): Promise<ResponseType<ProfileResponseDto>> {
    return new ResponseData(
      await this.profileService.updateProfile(id, body),
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
