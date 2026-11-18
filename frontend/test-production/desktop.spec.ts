import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { today } from '../src/format';
import type { Envelope, Session, Transaction } from '../src/types';
import { apiBase, createCategory, createTransaction, login, removeTransactions } from './helpers';

test('public application: registration, CRUD, filters, pagination, dashboard, isolation and session', async ({
  page,
  request,
}, testInfo) => {
  const email = `delivery-${randomUUID()}@test.example`;
  const password = `Aa!${randomUUID()}`;
  const ids: string[] = [];
  let token = '';
  let categoryId = '';
  try {
    await page.goto('/register');
    await page.getByLabel('Nome', { exact: true }).fill('Teste Entrega');
    await page.getByLabel('E-mail', { exact: true }).fill(email);
    await page.getByLabel('Senha', { exact: true }).fill(password);
    const registered = page.waitForResponse(
      (response) =>
        response.url() === `${apiBase}/auth/register` && response.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Criar conta', exact: true }).click();
    const registration = await registered;
    expect(registration.status()).toBe(201);
    token = ((await registration.json()) as Envelope<Session>).data.accessToken;
    const headers = { Authorization: `Bearer ${token}` };
    await expect(page.getByRole('heading', { name: /Olá, Teste/ })).toBeVisible();
    await expect(page.locator('.balance-total')).toHaveText(/0,00/);

    const category = await createCategory(page, 'Categoria de validação');
    categoryId = category.id;
    const income = await createTransaction(
      page,
      'Recebimento de teste',
      '100,00',
      'INCOME',
      categoryId,
    );
    ids.push(income.id);
    const expense = await createTransaction(
      page,
      'Despesa de teste',
      '25,00',
      'EXPENSE',
      categoryId,
    );
    ids.push(expense.id);
    const date = today();
    const alternateDate = `${date.slice(0, 7)}-${date.endsWith('-01') ? '02' : '01'}`;
    for (let index = 0; index < 10; index++) {
      const response = await request.post(`${apiBase}/transactions`, {
        headers,
        data: {
          description: `Movimentação de paginação ${index + 1}`,
          amount: 100,
          type: 'EXPENSE',
          date: alternateDate,
          categoryId,
        },
      });
      expect(response.status()).toBe(201);
      ids.push(((await response.json()) as Envelope<Transaction>).data.id);
    }
    await page.getByRole('button', { name: 'Editar Despesa de teste' }).click();
    await page.getByLabel('Valor (R$)', { exact: false }).fill('30,00');
    await page.getByRole('button', { name: 'Salvar transação' }).click();
    await expect(page.getByText('12 transações encontradas', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Próxima página' }).click();
    await expect(page.getByText('Página 2 de 2', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Página anterior' }).click();

    const filters = page.locator('.filters');
    await filters.getByRole('combobox', { name: 'Tipo', exact: true }).selectOption('EXPENSE');
    await filters
      .getByRole('combobox', { name: 'Categoria', exact: true })
      .selectOption(categoryId);
    await filters.getByLabel('De', { exact: true }).fill(date);
    await filters.getByLabel('Até', { exact: true }).fill(date);
    await filters.getByRole('button', { name: 'Filtrar' }).click();
    await expect(page.locator('tbody tr')).toHaveCount(1);
    await expect(page.getByRole('cell', { name: /Despesa de teste Saída/ })).toBeVisible();
    const previousDay = new Date(`${date}T12:00:00Z`);
    previousDay.setUTCDate(previousDay.getUTCDate() - 1);
    await filters.getByLabel('Até', { exact: true }).fill(previousDay.toISOString().slice(0, 10));
    await filters.getByRole('button', { name: 'Filtrar' }).click();
    await expect(page.getByRole('alert')).toContainText('Data inicial deve ser anterior');
    await page.getByRole('button', { name: 'Limpar', exact: true }).click();

    await page.getByRole('link', { name: 'Visão geral' }).click();
    await expect(page.locator('.balance-total')).toHaveText(/60,00/);
    await expect(page.locator('.rank-name')).toHaveText('Categoria de validação');
    await page.screenshot({ path: testInfo.outputPath('dashboard-desktop.png'), fullPage: true });

    await page.getByRole('link', { name: 'Categorias', exact: true }).click();
    await page.getByRole('button', { name: 'Excluir Categoria de validação' }).click();
    await page.getByRole('button', { name: 'Excluir', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('Categoria vinculada');
    await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
    await page.getByRole('button', { name: 'Editar Categoria de validação' }).click();
    await page.getByRole('dialog').getByLabel('Nome', { exact: true }).fill('Categoria revisada');
    await page.getByRole('button', { name: 'Salvar categoria' }).click();
    await expect(
      page.getByRole('heading', { name: 'Categoria revisada', exact: true }),
    ).toBeVisible();

    const demo = await request.post(`${apiBase}/auth/login`, {
      data: { email: 'demo@fluxo.app', password: 'Demo@2026!' },
    });
    expect(demo.status()).toBe(200);
    const otherToken = ((await demo.json()) as Envelope<Session>).data.accessToken;
    const otherHeaders = { Authorization: `Bearer ${otherToken}` };
    expect(
      (
        await request.get(`${apiBase}/transactions/${expense.id}`, { headers: otherHeaders })
      ).status(),
    ).toBe(404);
    expect(
      (
        await request.patch(`${apiBase}/transactions/${expense.id}`, {
          headers: otherHeaders,
          data: { amount: 1 },
        })
      ).status(),
    ).toBe(404);
    expect(
      (
        await request.delete(`${apiBase}/categories/${categoryId}`, { headers: otherHeaders })
      ).status(),
    ).toBe(404);
    const otherCategories = await request.get(`${apiBase}/categories`, { headers: otherHeaders });
    expect(JSON.stringify(await otherCategories.json())).not.toContain(categoryId);
    expect((await request.get(`${apiBase}/transactions`)).status()).toBe(401);

    await removeTransactions(request, token, ids);
    await page.getByRole('button', { name: 'Excluir Categoria revisada' }).click();
    await page.getByRole('button', { name: 'Excluir', exact: true }).click();
    await expect(page.getByText('Categoria excluída.', { exact: true })).toBeVisible();
    categoryId = '';
    await page.getByRole('button', { name: 'Sair da conta' }).filter({ visible: true }).click();
    await login(page, email, password);
    await expect(page.getByRole('heading', { name: /Olá, Teste/ })).toBeVisible();
    await expect(page.locator('.balance-total')).toHaveText(/0,00/);
    await page.reload();
    await expect(page).toHaveURL(/\/login$/);
  } finally {
    if (token) {
      await removeTransactions(request, token, ids);
      if (categoryId) {
        const response = await request.delete(`${apiBase}/categories/${categoryId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        expect([200, 404]).toContain(response.status());
      }
    }
  }
});
