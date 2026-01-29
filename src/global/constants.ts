import { ConfigService } from "@nestjs/config";

export const getJwtSecretKey = (configService: ConfigService): string => {
    return configService.get<string>('JWT_SECRET_KEY') || '';
};

export const getJwtExpiresIn = (configService: ConfigService): number => {
    return configService.get<number>('JWT_EXPIRES_IN') || 0;
};