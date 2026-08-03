import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { Controller, Get } from '@nestjs/common';
import { UserService } from './user.service';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  getProfile(@CurrentUser('sub') userId: string) {
    return this.userService.getUserProfile(userId);
  }
}
