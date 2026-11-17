import { Controller, Get, Module } from '@nestjs/common';
import { PrismaModule } from './database/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';

@Controller('health')
class HealthController {
  @Get()
  health() { return { status: 'ok' }; }
}

@Module({ imports: [PrismaModule, AuthModule, CategoriesModule], controllers: [HealthController] })
export class AppModule {}
