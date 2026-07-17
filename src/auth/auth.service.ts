import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from 'src/users/users.service';
import { LogInDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { jwtConstants } from './constants';
import { LoginGuestDto } from './dto/loginGuest.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async getTokens(userId: string, email: string) {
    const payload = { sub: userId, email };
    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: jwtConstants.secret,
        expiresIn: jwtConstants.accessTokenExpirationTime,
      }),
      this.jwtService.signAsync(payload, {
        secret: jwtConstants.refreshSecret,
        expiresIn: jwtConstants.refreshTokenExpirationTime,
      }),
    ]);
    return { access_token, refresh_token };
  }

  async register(
    registerDto: RegisterDto,
  ): Promise<{ access_token: string; refresh_token: string }> {
    if (registerDto.password !== registerDto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const user = await this.usersService.findByEmail(registerDto.email);
    if (user) {
      throw new UnauthorizedException('User already exists');
    }
    const newUser = await this.usersService.create(
      registerDto.email,
      registerDto.password,
      registerDto.name,
    );
    const tokens = await this.getTokens(newUser.id, newUser.email);
    await this.usersService.updateRefreshToken(
      newUser.id,
      tokens.refresh_token,
    );
    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    };
  }

  async loginGuest(loginGuestDto: LoginGuestDto) {}

  async login(
    logInDto: LogInDto,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const user = await this.usersService.findByEmail(logInDto.email);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const isMatch = user.password
      ? await bcrypt.compare(logInDto.password, user.password)
      : false;
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const tokens = await this.getTokens(user.id, user.email);
    await this.usersService.updateRefreshToken(user.id, tokens.refresh_token);
    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    };
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const isMatch = user.refreshToken
      ? await bcrypt.compare(refreshToken, user.refreshToken)
      : false;
    if (!isMatch) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const tokens = await this.getTokens(user.id, user.email);
    await this.usersService.updateRefreshToken(user.id, tokens.refresh_token);
    return tokens;
  }

  async logout(userId: string) {
    await this.usersService.updateRefreshToken(userId, null);
    return { message: 'Logged out successfully' };
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const isMatch = user.password
      ? await bcrypt.compare(password, user.password)
      : false;
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return { email: user.email, sub: user.id };
  }
}
