import { test, expect } from '@playwright/test';
import { createRequire } from 'node:module';
import { PrismaPg } from '@prisma/adapter-pg';
import { randomUUID } from 'node:crypto';

const require = createRequire(import.meta.url);
const { PrismaClient } =
  require('../../backend/dist/generated/prisma/client.js') as typeof import('../../backend/src/generated/prisma/client');

test('registration, category CRUD, transactions, dashboard and session lifecycle', async ({
  page,
}, testInfo) => {
  const email = `ui-${randomUUID()}@test.example`;
  const prisma = new PrismaClient({
    adapter: new PrismaPg({
      connectionString: process.env.TEST_DATABASE_URL,
      connectionTimeoutMillis: 5000,
    }),
  });
  try {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login$/);
    await page.getByRole('link', { name: 'Criar conta', exact: true }).click();
    await page.getByLabel('Nome', { exact: true }).fill('Pessoa Teste');
    await page.getByLabel('E-mail', { exact: true }).fill(email);
    await page.getByLabel('Senha', { exact: true }).fill('Password123!');
    await page.getByRole('button', { name: 'Criar conta', exact: true }).click();
    await expect(page.getByRole('heading', { name: /Olá, Pessoa/ })).toBeVisible();
    await expect(page.getByText('R$ 0,00', { exact: true })).toHaveCount(3);
    await page.getByRole('link', { name: 'Categorias', exact: true }).click();
    await page.getByRole('button', { name: 'Nova categoria' }).click();
    await page.getByRole('dialog').getByLabel('Nome', { exact: true }).fill('Consultoria');
    await page.getByRole('button', { name: 'Salvar categoria' }).click();
    await expect(page.getByRole('heading', { name: 'Consultoria', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Editar Consultoria' }).click();
    await page.getByRole('dialog').getByLabel('Nome', { exact: true }).fill('Serviços');
    await page.getByRole('button', { name: 'Salvar categoria' }).click();
    await expect(page.getByRole('heading', { name: 'Serviços', exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'Transações', exact: true }).click();
    await page.getByRole('button', { name: 'Nova transação' }).click();
    await page.getByLabel('Descrição', { exact: true }).fill('Projeto de teste');
    await page
      .getByRole('dialog')
      .getByRole('combobox', { name: 'Tipo', exact: true })
      .selectOption('INCOME');
    await page.getByLabel('Valor (R$)', { exact: false }).fill('1234,56');
    await page
      .getByRole('dialog')
      .getByRole('combobox', { name: 'Categoria', exact: true })
      .selectOption({ label: 'Serviços' });
    await page.getByRole('button', { name: 'Salvar transação' }).click();
    await expect(
      page.getByRole('cell', { name: 'Projeto de teste Entrada', exact: true }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Editar Projeto de teste' }).click();
    await page.getByLabel('Valor (R$)', { exact: false }).fill('1400,00');
    await page.getByRole('button', { name: 'Salvar transação' }).click();
    await expect(page.getByRole('cell', { name: /1\.400,00/ })).toBeVisible();
    await page.getByRole('link', { name: 'Visão geral' }).click();
    await expect(page.locator('.summary-card.balance .summary-value')).toHaveText(/1\.400,00/);
    await page.screenshot({ path: testInfo.outputPath('dashboard.png'), fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.getByRole('link', { name: 'Categorias', exact: true }).click();
    await page.getByRole('button', { name: 'Excluir Serviços' }).click();
    await page.getByRole('button', { name: 'Excluir', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('Categoria vinculada');
    await page.getByRole('button', { name: 'Cancelar' }).click();
    await page.getByRole('link', { name: 'Transações', exact: true }).click();
    await page.getByRole('button', { name: 'Excluir Projeto de teste' }).click();
    await page.getByRole('button', { name: 'Excluir', exact: true }).click();
    await expect(page.getByText('Transação excluída.', { exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'Categorias', exact: true }).click();
    await page.getByRole('button', { name: 'Excluir Serviços' }).click();
    await page.getByRole('button', { name: 'Excluir', exact: true }).click();
    await expect(page.getByText('Categoria excluída.', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Sair da conta' }).filter({ visible: true }).click();
    await page.getByLabel('E-mail', { exact: true }).fill(email);
    await page.getByLabel('Senha', { exact: true }).fill('Password123!');
    await page.getByRole('button', { name: 'Entrar na minha conta' }).click();
    await expect(page.getByRole('heading', { name: /Olá, Pessoa/ })).toBeVisible();
    await page.reload();
    await expect(page).toHaveURL(/\/login$/);
  } finally {
    // Delete only the account created by this test, in the guarded test database.
    await prisma.transaction.deleteMany({ where: { user: { email } } });
    await prisma.category.deleteMany({ where: { user: { email } } });
    await prisma.user.deleteMany({ where: { email } });
    await prisma.$disconnect();
  }
});
