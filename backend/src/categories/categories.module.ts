import { Body, Controller, Delete, Get, Injectable, Module, NotFoundException, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AuthGuard, UserId } from '../auth/auth.guard';
import { PrismaService } from '../database/prisma.module';
import { CreateCategoryDto, UpdateCategoryDto } from './categories.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}
  list(userId: string) { return this.prisma.category.findMany({ where: { userId }, orderBy: [{ name: 'asc' }, { id: 'asc' }] }); }
  create(userId: string, dto: CreateCategoryDto) { return this.prisma.category.create({ data: { ...dto, userId } }); }
  async requireOwned(id: string, userId: string) {
    const category = await this.prisma.category.findUnique({ where: { id_userId: { id, userId } } });
    if (!category) throw new NotFoundException('Categoria não encontrada.');
    return category;
  }
  async update(id: string, userId: string, dto: UpdateCategoryDto) {
    await this.requireOwned(id, userId);
    return this.prisma.category.update({ where: { id_userId: { id, userId } }, data: dto });
  }
  async remove(id: string, userId: string) {
    await this.requireOwned(id, userId);
    // The database restriction also protects against concurrent transaction creation.
    await this.prisma.category.delete({ where: { id_userId: { id, userId } } });
    return null;
  }
}

@Controller('categories')
@UseGuards(AuthGuard)
class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}
  @Get()
  list(@UserId() userId: string) { return this.categories.list(userId); }
  @Post()
  create(@UserId() userId: string, @Body() dto: CreateCategoryDto) { return this.categories.create(userId, dto); }
  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @UserId() userId: string, @Body() dto: UpdateCategoryDto) {
    return this.categories.update(id, userId, dto);
  }
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @UserId() userId: string) { return this.categories.remove(id, userId); }
}

@Module({ imports: [AuthModule], controllers: [CategoriesController], providers: [CategoriesService], exports: [CategoriesService] })
export class CategoriesModule {}
