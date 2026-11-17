import { Controller, Get, Injectable, Module, Query, UseGuards } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AuthGuard, UserId } from '../auth/auth.guard';
import { PrismaService } from '../database/prisma.module';
import { PeriodDto } from '../transactions/transactions.dto';
import { periodWhere } from '../transactions/transactions.module';

@Injectable()
class DashboardService {
  constructor(private readonly prisma: PrismaService) {}
  async summary(userId: string, query: PeriodDto) {
    const date = periodWhere(query);
    return this.prisma.$transaction(
      async (tx) => {
        const all = await tx.transaction.groupBy({
          by: ['type'],
          where: { userId },
          _sum: { amount: true },
        });
        const period = await tx.transaction.groupBy({
          by: ['type'],
          where: { userId, date },
          _sum: { amount: true },
        });
        const top = await tx.transaction.groupBy({
          by: ['categoryId'],
          where: { userId, date, type: 'EXPENSE' },
          _sum: { amount: true },
          orderBy: [{ _sum: { amount: 'desc' } }, { categoryId: 'asc' }],
          take: 3,
        });
        const categories = await tx.category.findMany({
          where: { userId, id: { in: top.map((row) => row.categoryId) } },
        });
        const sum = (rows: typeof all, type: 'INCOME' | 'EXPENSE') =>
          rows.find((row) => row.type === type)?._sum.amount ?? 0;
        return {
          balance: sum(all, 'INCOME') - sum(all, 'EXPENSE'),
          income: sum(period, 'INCOME'),
          expense: sum(period, 'EXPENSE'),
          topCategories: top.map((row) => ({
            id: row.categoryId,
            name: categories.find((category) => category.id === row.categoryId)!.name,
            amount: row._sum.amount ?? 0,
          })),
        };
      },
      { isolationLevel: 'RepeatableRead' },
    );
  }
}

@Controller('dashboard')
@UseGuards(AuthGuard)
class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}
  @Get()
  summary(@UserId() userId: string, @Query() query: PeriodDto) {
    return this.dashboard.summary(userId, query);
  }
}

@Module({
  imports: [AuthModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
