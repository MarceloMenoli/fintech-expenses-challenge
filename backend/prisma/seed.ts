import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'demo@fluxo.app';
  // This public demo password must never be reused on personal accounts.
  const passwordHash = await hash('Demo@2026!', 12);
  await prisma.$transaction(async (tx) => {
    const user = await tx.user.upsert({
      where: { email }, update: {},
      create: { name: 'Marina Costa', email, passwordHash },
    });
    // Re-running the seed preserves changes made by the demo user.
    if (await tx.category.count({ where: { userId: user.id } })) return;
    const names = ['Receita de clientes', 'Operação', 'Software', 'Alimentação', 'Transporte'];
    const categories = [];
    for (const name of names) categories.push(await tx.category.create({ data: { name, userId: user.id } }));
    const month = new Date().toISOString().slice(0, 7);
    const rows = [
      { description: 'Projeto Aurora', amount: 1250000, type: 'INCOME' as const, category: 0, day: '05' },
      { description: 'Consultoria mensal', amount: 480000, type: 'INCOME' as const, category: 0, day: '10' },
      { description: 'Aluguel do escritório', amount: 320000, type: 'EXPENSE' as const, category: 1, day: '07' },
      { description: 'Ferramentas da equipe', amount: 89900, type: 'EXPENSE' as const, category: 2, day: '12' },
      { description: 'Almoço com cliente', amount: 18650, type: 'EXPENSE' as const, category: 3, day: '14' },
      { description: 'Visita ao fornecedor', amount: 7800, type: 'EXPENSE' as const, category: 4, day: '15' },
    ];
    await tx.transaction.createMany({ data: rows.map(({ category, day, ...row }) => ({
      ...row, userId: user.id, categoryId: categories[category].id, date: new Date(`${month}-${day}T00:00:00Z`),
    })) });
  });
  console.log('Demo seed ready: demo@fluxo.app');
}

main().catch((error: unknown) => { console.error(error); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
