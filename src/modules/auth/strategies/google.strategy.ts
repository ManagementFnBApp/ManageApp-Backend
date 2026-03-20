import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import googleOauthConfig from 'src/config/google-oauth.config';
import { UserService } from 'src/modules/users/user.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(googleOauthConfig.KEY)
    private googleConfiguration: ConfigType<typeof googleOauthConfig>,
    private readonly userService: UserService,
  ) {
    super({
      clientID: googleConfiguration.clientId!,
      clientSecret: googleConfiguration.clientSecret!,
      callbackURL: googleConfiguration.callbackUrl!,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ) {
    const { id, displayName, emails, photos } = profile;
    const email = emails[0].value;
    const user = await this.userService.findOrCreate({
      email: email,
      fullName: `${profile.name.givenName} ${profile.name.familyName}`,
      // Mặc định cho user mới là role gì đó, ví dụ 'USER'
    });
    const userGoogle = {
      provider: 'google',
      providerId: id,
      email: emails[0].value,
      name: displayName,
      picture: photos[0].value,
    };
    done(null, user);
  }
}
