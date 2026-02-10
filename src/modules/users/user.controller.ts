import { Body, Controller, Get, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { UserService } from "./user.service";
import { CreateUserDto, UserResponseDto } from "../../dtos/user.dto";
import { ResponseData, ResponseType } from "src/global/globalResponse";
import { HttpMessage, HttpStatus } from "src/global/globalEnum";
import { Public, Roles } from "src/decorators/decorators";

@ApiTags('Users')
@Controller('users')
export class UserController {
    constructor(
        protected readonly userService: UserService,
    ) { }

    // @Roles('MANAGER')
    @Public()
    @Get()
    async getAllUsers(): Promise<ResponseType<UserResponseDto>> {
        return new ResponseData(await this.userService.getAllUsers(), HttpStatus.SUCCESS, HttpMessage.SUCCESS);
    }

    @Public()
    @Post()
    @ApiTags('Create User')
    async createUser(@Body() body:CreateUserDto ): Promise<ResponseType<UserResponseDto>> {
        return new ResponseData(await this.userService.createUser(body), HttpStatus.SUCCESS, HttpMessage.SUCCESS);
    }
}