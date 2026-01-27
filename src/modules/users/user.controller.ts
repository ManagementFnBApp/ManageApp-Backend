import { Body, Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { UserService } from "./user.service";
import { UserResponseDto } from "../users/dtos/user.dto";
import { ResponseData, ResponseType } from "src/public/globalResponse";
import { HttpMessage, HttpStatus } from "src/public/globalEnum";

@ApiTags('Users')
@Controller('users')
export class UserController {
    constructor(
        protected readonly userService: UserService,
    ) { }

    @Get()
    async getAllUsers(): Promise<ResponseType<UserResponseDto>> {
        return new ResponseData(await this.userService.getAllUsers(), HttpStatus.SUCCESS, HttpMessage.SUCCESS);
    }

}