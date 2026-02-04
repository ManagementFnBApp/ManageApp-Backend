import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './modules/users/user.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { RoleModule } from './modules/roles/role.module';
import { AdminModule } from './modules/admins/admin.module';
import { TenantModule } from './modules/tenants/tenant.module';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './modules/auth/guard/auth.guard';
import { RolesGuard } from './modules/auth/guard/role.guard';
import { getJwtExpiresIn, getJwtSecretKey } from './global/constants';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      global: true,
      useFactory: async (configService: ConfigService) => ({
        secret: getJwtSecretKey(configService),
        signOptions: {
          expiresIn: getJwtExpiresIn(configService),
        }
      })
    }),
    UserModule,
    AuthModule,
    RoleModule,
    AdminModule,
    TenantModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    }
  ],
})
export class AppModule {}
