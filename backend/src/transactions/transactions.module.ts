import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Injectable,
  Module,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { AuthModule } from '../auth/auth.module';
import { AuthGuard, UserId } from '../auth/auth.guard';
import { CategoriesModule, CategoriesService } from '../categories/categories.module';
import { PrismaService } from '../database/prisma.module';
import {
  CreateTransactionDto,
  PeriodDto,
  TransactionQueryDto,
  UpdateTransactionDto,
} from './transactions.dto';

export function periodWhere(query: PeriodDto): Prisma.DateTimeFilter | undefined {
  if (query.startDate && query.endDate && query.startDate > query.endDate) {
    throw new BadRequestException('Data inicial deve ser anterior ou igual à data final.');
  }
  if (!query.startDate && !query.endDate) return undefined;
  return {
    ...(query.startDate ? { gte: new Date(`${query.startDate}T00:00:00Z`) } : {}),
    ...(query.endDate ? { lte: new Date(`${query.endDate}T00:00:00Z`) } : {}),
  };
}

const includeCategory = { category: { select: { id: true, name: true } } } as const;
type TransactionRow = Prisma.TransactionGetPayload<{ include: typeof includeCategory }>;
export function presentTransaction(row: TransactionRow) {
  return { ...row, date: row.date.toISOString().slice(0, 10) };
}

@Injectable()
class TransactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly categories: CategoriesService,
  ) {}
  async list(userId: string, query: TransactionQueryDto) {
    const where: Prisma.TransactionWhereInput = {
      userId,
      type: query.type,
      categoryId: query.categoryId,
      date: periodWhere(query),
    };
    const [rows, total] = await this.prisma.$transaction(
      [
        this.prisma.transaction.findMany({
          where,
          include: includeCategory,
          orderBy: [{ date: 'desc' }, { id: 'desc' }],
          skip: (query.page - 1) * query.limit,
          take: query.limit,
        }),
        this.prisma.transaction.count({ where }),
      ],
      { isolationLevel: 'RepeatableRead' },
    );
    return {
      data: rows.map(presentTransaction),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }
  async get(id: string, userId: string) {
    const row = await this.prisma.transaction.findFirst({
      where: { id, userId },
      include: includeCategory,
    });
    if (!row) throw new NotFoundException('Transação não encontrada.');
    return presentTransaction(row);
  }
  async create(userId: string, dto: CreateTransactionDto) {
    await this.categories.requireOwned(dto.categoryId, userId);
    return presentTransaction(
      await this.prisma.transaction.create({
        data: { ...dto, userId, date: new Date(`${dto.date}T00:00:00Z`) },
        include: includeCategory,
      }),
    );
  }
  async update(id: string, userId: string, dto: UpdateTransactionDto) {
    await this.get(id, userId);
    if (dto.categoryId !== undefined) await this.categories.requireOwned(dto.categoryId, userId);
    return presentTransaction(
      await this.prisma.transaction.update({
        where: { id, userId },
        data: { ...dto, ...(dto.date ? { date: new Date(`${dto.date}T00:00:00Z`) } : {}) },
        include: includeCategory,
      }),
    );
  }
  async remove(id: string, userId: string) {
    await this.get(id, userId);
    await this.prisma.transaction.delete({ where: { id, userId } });
    return null;
  }
}

@Controller('transactions')
@UseGuards(AuthGuard)
class TransactionsController {
  constructor(private readonly transactions: TransactionsService) {}
  @Get()
  list(@UserId() userId: string, @Query() query: TransactionQueryDto) {
    return this.transactions.list(userId, query);
  }
  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string, @UserId() userId: string) {
    return this.transactions.get(id, userId);
  }
  @Post()
  create(@UserId() userId: string, @Body() dto: CreateTransactionDto) {
    return this.transactions.create(userId, dto);
  }
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @UserId() userId: string,
    @Body() dto: UpdateTransactionDto,
  ) {
    return this.transactions.update(id, userId, dto);
  }
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @UserId() userId: string) {
    return this.transactions.remove(id, userId);
  }
}

@Module({
  imports: [AuthModule, CategoriesModule],
  controllers: [TransactionsController],
  providers: [TransactionsService],
})
export class TransactionsModule {}
