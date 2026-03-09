import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user/user.service';
import { LoginDto } from '../../common/dto/login.dto';
import { RegisterDto } from '../../common/dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string) {
    const user = await this.userService.findByUsername(username);
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password: _, ...result } = user;
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.username, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }
    return {
      access_token: this.jwtService.sign({
        sub: user.id,
        username: user.username,
      }),
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        avatar: user.avatar,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    const user = await this.userService.create({
      username: registerDto.username,
      password: registerDto.password,
      nickname: registerDto.nickname || registerDto.username,
    });
    return {
      access_token: this.jwtService.sign({
        sub: user.id,
        username: user.username,
      }),
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        avatar: user.avatar,
      },
    };
  }
}
