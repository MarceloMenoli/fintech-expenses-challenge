import 'reflect-metadata';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { JwtService } from '@nestjs/jwt';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.module';
import { configureApp } from '../src/setup';

interface Session {
  accessToken: string;
  user: { id: string; email: string; name: string };
}
interface Category {
  id: string;
  name: string;
}
interface Transaction {
  id: string;
  amount: number;
  date: string;
  categoryId: string;
}
interface Envelope<T> {
  data: T;
}

describe('Financial API (real PostgreSQL)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let a: Session;
  let b: Session;
  let category: Category;
  let otherCategory: Category;
  const email = () => `${randomUUID()}@test.example`;
  const auth = (session = a) => ({ Authorization: `Bearer ${session.accessToken}` });
  const sample = (overrides: Record<string, unknown> = {}) => ({
    description: 'Serviço',
    amount: 10000,
    type: 'EXPENSE',
    date: '2026-11-17',
    categoryId: category.id,
    ...overrides,
  });
  const createTransaction = async (overrides: Record<string, unknown> = {}) => {
    const response = await request(app.getHttpServer())
      .post('/api/transactions')
      .set(auth())
      .send(sample(overrides))
      .expect(201);
    return (response.body as Envelope<Transaction>).data;
  };

  beforeAll(async () => {
    execFileSync(
      process.execPath,
      [require.resolve('prisma/build/index.js'), 'migrate', 'deploy'],
      { env: process.env, stdio: 'pipe' },
    );
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    // The environment guard only allows a dedicated *_test database.
    await prisma.transaction.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();
    const register = async (name: string) => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ name, email: email(), password: 'Password123!' })
        .expect(201);
      return (response.body as Envelope<Session>).data;
    };
    a = await register('Alice');
    b = await register('Bruno');
    const createCategory = async (session: Session, name: string) => {
      const response = await request(app.getHttpServer())
        .post('/api/categories')
        .set(auth(session))
        .send({ name })
        .expect(201);
      return (response.body as Envelope<Category>).data;
    };
    category = await createCategory(a, 'Operação');
    otherCategory = await createCategory(b, 'Privada');
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('registers normalized emails without exposing password hashes and rejects duplicates', async () => {
    expect(a.user).not.toHaveProperty('passwordHash');
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ name: 'Duplicado', email: a.user.email.toUpperCase(), password: 'Password123!' })
      .expect(409);
    const me = await request(app.getHttpServer()).get('/api/auth/me').set(auth()).expect(200);
    expect(me.body.data.id).toBe(a.user.id);
    expect(me.body.data).not.toHaveProperty('passwordHash');
    expect(
      (await prisma.user.findUniqueOrThrow({ where: { id: a.user.id } })).passwordHash,
    ).not.toBe('Password123!');
  });

  it('logs in with correct credentials and rejects wrong passwords', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: a.user.email, password: 'Password123!' })
      .expect(200);
    expect(response.body.data.accessToken).toEqual(expect.any(String));
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: a.user.email, password: 'WrongPass123' })
      .expect(401);
  });

  it('blocks missing, tampered and expired JWTs', async () => {
    for (const route of ['categories', 'transactions', 'dashboard', 'auth/me']) {
      await request(app.getHttpServer()).get(`/api/${route}`).expect(401);
    }
    await request(app.getHttpServer())
      .get('/api/categories')
      .set({ Authorization: 'Bearer invalid' })
      .expect(401);
    const expired = await app.get(JwtService).signAsync({ sub: a.user.id }, { expiresIn: -1 });
    await request(app.getHttpServer())
      .get('/api/categories')
      .set({ Authorization: `Bearer ${expired}` })
      .expect(401);
  });

  it('isolates categories across listing, editing and deletion', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/categories')
      .set(auth())
      .expect(200);
    expect(response.body.data.map((row: Category) => row.id)).toEqual([category.id]);
    await request(app.getHttpServer())
      .patch(`/api/categories/${otherCategory.id}`)
      .set(auth())
      .send({ name: 'Invadida' })
      .expect(404);
    await request(app.getHttpServer())
      .delete(`/api/categories/${otherCategory.id}`)
      .set(auth())
      .expect(404);
  });

  it('isolates transaction listing, reading, editing and deletion', async () => {
    const row = await createTransaction();
    expect(
      (await request(app.getHttpServer()).get('/api/transactions').set(auth(b))).body.data,
    ).toEqual([]);
    await request(app.getHttpServer()).get(`/api/transactions/${row.id}`).set(auth(b)).expect(404);
    await request(app.getHttpServer())
      .patch(`/api/transactions/${row.id}`)
      .set(auth(b))
      .send({ amount: 200 })
      .expect(404);
    await request(app.getHttpServer())
      .delete(`/api/transactions/${row.id}`)
      .set(auth(b))
      .expect(404);
  });

  it('rejects foreign categories on create and update, and owner injection', async () => {
    await request(app.getHttpServer())
      .post('/api/transactions')
      .set(auth())
      .send(sample({ categoryId: otherCategory.id }))
      .expect(404);
    const row = await createTransaction();
    await request(app.getHttpServer())
      .patch(`/api/transactions/${row.id}`)
      .set(auth())
      .send({ categoryId: otherCategory.id })
      .expect(404);
    await request(app.getHttpServer())
      .post('/api/transactions')
      .set(auth())
      .send(sample({ userId: b.user.id }))
      .expect(400);
  });

  it('combines filters, includes both date boundaries and paginates consistently', async () => {
    await createTransaction({ date: '2026-11-01' });
    await createTransaction({ date: '2026-11-30' });
    await createTransaction({ date: '2026-10-31' });
    await createTransaction({ date: '2026-11-15', type: 'INCOME' });
    const query = {
      categoryId: category.id,
      type: 'EXPENSE',
      startDate: '2026-11-01',
      endDate: '2026-11-30',
      limit: 1,
    };
    const first = await request(app.getHttpServer())
      .get('/api/transactions')
      .set(auth())
      .query(query)
      .expect(200);
    expect(first.body.meta).toEqual({ page: 1, limit: 1, total: 2, totalPages: 2 });
    expect(first.body.data[0].date).toBe('2026-11-30');
    const second = await request(app.getHttpServer())
      .get('/api/transactions')
      .set(auth())
      .query({ ...query, page: 2 })
      .expect(200);
    expect(second.body.data[0].date).toBe('2026-11-01');
  });

  it('validates amounts, civil dates, ranges and pagination', async () => {
    for (const overrides of [
      { amount: 0 },
      { amount: 1.2 },
      { amount: 2147483648 },
      { date: '2026-02-30' },
      { date: '2026-11-17T00:00:00Z' },
      { type: 'OTHER' },
    ]) {
      await request(app.getHttpServer())
        .post('/api/transactions')
        .set(auth())
        .send(sample(overrides))
        .expect(400);
    }
    await request(app.getHttpServer())
      .get('/api/transactions')
      .set(auth())
      .query({ page: 0 })
      .expect(400);
    await request(app.getHttpServer())
      .get('/api/transactions')
      .set(auth())
      .query({ limit: 101 })
      .expect(400);
    for (const route of ['transactions', 'dashboard']) {
      await request(app.getHttpServer())
        .get(`/api/${route}`)
        .set(auth())
        .query({ startDate: '2026-12-01', endDate: '2026-11-01' })
        .expect(400);
    }
  });

  it('computes global balance, period totals and top three expense categories', async () => {
    await createTransaction({ amount: 100000, type: 'INCOME', date: '2026-10-01' });
    await createTransaction({ amount: 50000, type: 'INCOME' });
    await createTransaction({ amount: 20000 });
    for (const [name, amount] of [
      ['Software', 15000],
      ['Alimentação', 7000],
      ['Transporte', 3000],
    ] as const) {
      const response = await request(app.getHttpServer())
        .post('/api/categories')
        .set(auth())
        .send({ name })
        .expect(201);
      await createTransaction({ categoryId: response.body.data.id, amount });
    }
    const response = await request(app.getHttpServer())
      .get('/api/dashboard')
      .set(auth())
      .query({ startDate: '2026-11-01', endDate: '2026-11-30' })
      .expect(200);
    expect(response.body.data).toMatchObject({ balance: 105000, income: 50000, expense: 45000 });
    expect(response.body.data.topCategories.map((row: { amount: number }) => row.amount)).toEqual([
      20000, 15000, 7000,
    ]);
    const other = await request(app.getHttpServer()).get('/api/dashboard').set(auth(b)).expect(200);
    expect(other.body.data).toEqual({ balance: 0, income: 0, expense: 0, topCategories: [] });
  });

  it('blocks linked category deletion and allows it after removing the transaction', async () => {
    const row = await createTransaction();
    await request(app.getHttpServer())
      .delete(`/api/categories/${category.id}`)
      .set(auth())
      .expect(409);
    await request(app.getHttpServer())
      .delete(`/api/transactions/${row.id}`)
      .set(auth())
      .expect(200);
    await request(app.getHttpServer())
      .delete(`/api/categories/${category.id}`)
      .set(auth())
      .expect(200);
  });

  it('updates owned categories and transactions without changing the civil date', async () => {
    await request(app.getHttpServer())
      .patch(`/api/categories/${category.id}`)
      .set(auth())
      .send({ name: 'Operação editada', description: 'Detalhes' })
      .expect(200);
    const row = await createTransaction();
    const response = await request(app.getHttpServer())
      .patch(`/api/transactions/${row.id}`)
      .set(auth())
      .send({ amount: 12345, date: '2026-01-01' })
      .expect(200);
    expect(response.body.data).toMatchObject({
      amount: 12345,
      date: '2026-01-01',
      category: { name: 'Operação editada' },
    });
    await request(app.getHttpServer())
      .patch(`/api/transactions/${row.id}`)
      .set(auth())
      .send({ amount: null })
      .expect(400);
  });
});
