import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

declare const module: any;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const allowedUrls =
    configService
      .get<string>('ALLOWED_URLS', '')
      .split(',')
      .map(v => v.trim())
      .filter(Boolean);

  app.enableCors({
    origin: allowedUrls,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  });

  // Enable global validation with auto-transform
  app.useGlobalPipes(new ValidationPipe({
    transform: true, // Tự động transform kiểu dữ liệu (string "1" -> number 1)
    whitelist: true, // Loại bỏ các field không có trong DTO
    forbidNonWhitelisted: false, // Không throw error với field không có trong DTO
  }));

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  const config = new DocumentBuilder()
    .setTitle('NestJS API')
    .setDescription('API description')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}
bootstrap();
