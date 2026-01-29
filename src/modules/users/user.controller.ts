import { Body, Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { UserService } from "./user.service";
import { UserResponseDto, UserRole } from "../../dtos/user.dto";
import { ResponseData, ResponseType } from "src/global/globalResponse";
import { HttpMessage, HttpStatus } from "src/global/globalEnum";
import { Public, Roles } from "src/decorators/decorators";

@ApiTags('Users')
@Controller('users')
export class UserController {
    constructor(
        protected readonly userService: UserService,
    ) { }

    @Roles(UserRole.ADMIN)
    @Get()
    async getAllUsers(): Promise<ResponseType<UserResponseDto>> {
        return new ResponseData(await this.userService.getAllUsers(), HttpStatus.SUCCESS, HttpMessage.SUCCESS);
    }

}