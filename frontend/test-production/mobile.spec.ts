import { test, expect } from '@playwright/test';
import { login } from './helpers';

test('public mobile application: demo login, dashboard, filters, navigation and direct routes', async ({
  page,
}, testInfo) => {
  await page.goto('/transactions');
  await expect(page).toHaveURL(/\/login$/);
  await login(page, 'demo@fluxo.app', 'InvalidPassword!');
  await expect(page.getByRole('alert')).toContainText('E-mail ou senha incorretos.');
  await login(page, 'demo@fluxo.app', 'Demo@2026!');
  await expect(page.getByRole('heading', { name: /Olá, Marina/ })).toBeVisible();
  await expect(page.locator('.balance-total')).toHaveText(/12\.936,50/);
  await expect(page.locator('.rank-row')).toHaveCount(3);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const addButton = await page.getByRole('button', { name: 'Nova transação' }).boundingBox();
  expect(addButton).not.toBeNull();
  expect(addButton!.x + addButton!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  await page.screenshot({ path: testInfo.outputPath('dashboard-mobile.png'), fullPage: true });
  await page.getByRole('link', { name: 'Transações', exact: true }).click();
  await page
    .locator('.filters')
    .getByRole('combobox', { name: 'Tipo', exact: true })
    .selectOption('INCOME');
  await page.getByRole('button', { name: 'Filtrar', exact: true }).click();
  await expect(page.getByText('2 transações encontradas', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Limpar', exact: true }).click();
  await expect(page.getByText('6 transações encontradas', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Categorias', exact: true }).click();
  await expect(page.locator('.category-card')).toHaveCount(5);
  await page.reload();
  await expect(page).toHaveURL(/\/login$/);
});
