import { Module } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { UserModule } from "../users/user.module";
import { TenantModule } from "../tenants/tenant.module";
import { RoleModule } from "../roles/role.module";
import { AdminModule } from "../admins/admin.module";

@ApiTags("Auth")
@Module({
    imports: [UserModule, TenantModule, RoleModule, AdminModule],
    providers: [AuthService],
    controllers: [AuthController],
})
export class AuthModule {}