import { Module } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { UserModule } from "../users/user.module";
import { RoleModule } from "../roles/role.module";
import { ConfigModule } from "@nestjs/config";
import googleOauthConfig from "src/config/google-oauth.config";
import { EmailModule } from "../email/email.module";

@ApiTags("Auth")
@Module({
    imports: [
        ConfigModule,
        ConfigModule.forFeature(googleOauthConfig),
        UserModule, 
        RoleModule,
        EmailModule
    ],
    providers: [AuthService],
    controllers: [AuthController],
})
export class AuthModule {}