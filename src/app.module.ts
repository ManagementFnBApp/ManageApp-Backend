import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './modules/users/user.module';
import { PrismaModule } from '../db/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { RoleModule } from './modules/roles/role.module';
import { ProductModule } from './modules/products/product.module';
import { InventoryModule } from './modules/inventories/inventory.module';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './modules/auth/guard/auth.guard';
import { RolesGuard } from './modules/auth/guard/role.guard';
import { SubscriptionExpiredGuard } from './modules/auth/guard/subscription-expired.guard';
import { getJwtExpiresIn, getJwtSecretKey } from './config/jwt.config';
import { ProfileModule } from './modules/profiles/profile.module';
import { SubscriptionModule } from './modules/subscriptions/subscription.module';
import { OrderModule } from './modules/orders/order.module';
import { OrderItemModule } from './modules/order_items/order-item.module';
import { CustomerModule } from './modules/customers/customer.module';
import { MerchandiseModule } from './modules/merchandises/merchandise.module';
import { MerchandiseRedemptionModule } from './modules/merchandise-redemptions/merchandise-redemption.module';
import { CategoryModule } from './modules/categories/category.module';
import { ShopCategoryModule } from './modules/shop-category/shop-category.module';
import { ShiftModule } from './modules/shifts/shift.module';
import { ShopProductModule } from './modules/shop-product/shop-product.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(), // Enable CronJob scheduling
    PrismaModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      global: true,
      useFactory: (configService: ConfigService) => ({
        secret: getJwtSecretKey(configService),
        signOptions: {
          expiresIn: getJwtExpiresIn(configService),
        },
      }),
    }),
    UserModule,
    AuthModule,
    RoleModule,
    ProductModule,
    InventoryModule,
    ProfileModule,
    SubscriptionModule,
    OrderModule,
    OrderItemModule,
    CustomerModule,
    MerchandiseModule,
    MerchandiseRedemptionModule,
    CategoryModule,
    ShopCategoryModule,
    ShiftModule,
    ShopProductModule,
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
    },
    {
      provide: APP_GUARD,
      useClass: SubscriptionExpiredGuard,
    },
  ],
})
export class AppModule {}
