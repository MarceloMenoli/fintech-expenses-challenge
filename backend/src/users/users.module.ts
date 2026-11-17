import { Injectable, Module } from '@nestjs/common';
import { PrismaService } from '../database/prisma.module';

export const publicUserSelect = { id: true, name: true, email: true } as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) { return this.prisma.user.findUnique({ where: { email } }); }
  findPublicById(id: string) {
    return this.prisma.user.findUnique({ where: { id }, select: publicUserSelect });
  }
  create(data: { name: string; email: string; passwordHash: string }) {
    return this.prisma.user.create({ data, select: publicUserSelect });
  }
}

@Module({ providers: [UsersService], exports: [UsersService] })
export class UsersModule {}
