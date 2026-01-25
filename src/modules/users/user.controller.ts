import { Body, Controller, Get, Post, Res } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { UserService } from "./user.service";
import { UserResponseDto } from "src/dtos/user.dto";

@ApiTags('Users')
@Controller('users')
export class UserController {
    constructor(
        protected readonly userService: UserService,
    ) {}
    @Get()
    async getAllUsers(): Promise<UserResponseDto[]> {
        return this.userService.getAllUsers();
    }

    // @Post()
    // async createUser(@Body() account: string): Promise<number> {
    //     return 1;
    // }

}