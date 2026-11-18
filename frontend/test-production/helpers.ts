import { expect, type APIRequestContext, type Page } from '@playwright/test';
import type { Category, Envelope, Transaction } from '../src/types';

export const apiBase = process.env.PRODUCTION_API_URL!.replace(/\/$/, '');

export async function createCategory(page: Page, name: string) {
  await page.getByRole('link', { name: 'Categorias', exact: true }).click();
  await page.getByRole('button', { name: 'Nova categoria' }).click();
  await page.getByRole('dialog').getByLabel('Nome', { exact: true }).fill(name);
  const result = page.waitForResponse(
    (response) =>
      response.url() === `${apiBase}/categories` && response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Salvar categoria' }).click();
  const response = await result;
  expect(response.status()).toBe(201);
  return ((await response.json()) as Envelope<Category>).data;
}

export async function createTransaction(
  page: Page,
  description: string,
  amount: string,
  type: string,
  category: string,
) {
  await page.getByRole('link', { name: 'Transações', exact: true }).click();
  await page.getByRole('button', { name: 'Nova transação' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Descrição', { exact: true }).fill(description);
  await dialog.getByRole('combobox', { name: 'Tipo', exact: true }).selectOption(type);
  await dialog.getByLabel('Valor (R$)', { exact: false }).fill(amount);
  await dialog.getByRole('combobox', { name: 'Categoria', exact: true }).selectOption(category);
  const result = page.waitForResponse(
    (response) =>
      response.url() === `${apiBase}/transactions` && response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Salvar transação' }).click();
  const response = await result;
  expect(response.status()).toBe(201);
  return ((await response.json()) as Envelope<Transaction>).data;
}

export async function removeTransactions(request: APIRequestContext, token: string, ids: string[]) {
  for (const id of ids) {
    const response = await request.delete(`${apiBase}/transactions/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([200, 404]).toContain(response.status());
  }
}

export async function login(page: Page, email: string, password: string) {
  await page.getByLabel('E-mail', { exact: true }).fill(email);
  await page.getByLabel('Senha', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Entrar na minha conta' }).click();
}
