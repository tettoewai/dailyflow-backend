import { Controller, Get } from '@nestjs/common';
import { CategoryService } from './category.service';
import {
  CurrentUser,
  type JwtPayload,
} from '@/auth/decorators/current-user.decorator';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  getHabit(@CurrentUser() user: JwtPayload) {
    return this.categoryService.getCategory(user.sub);
  }
}
