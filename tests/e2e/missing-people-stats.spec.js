// @ts-check
import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('localhost:16078');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Inicio/);
});

test('get missing link', async ({ page }) => {
  await page.goto('localhost:16078');

  // Click the get started link.
  await page.getByRole('link', { name: 'FrontEnd Alejandro Morilla García' }).click();

  // Expects page to have a heading with the name of Installation.
  await expect(page).toHaveTitle(/Missing People Stats/);
});


test('create, filter, edit and delete missing', async ({ page }) => {
  const testProvince = "__TEST_PROVINCE__";
  const testYear = "2024";
  const testNumber = "999";
  const testEdit = "1234";

  // 1️⃣ Ir a la página principal
  await page.goto('localhost:16078');

  // 2️⃣ Entrar al frontend de Alejandro Morilla García
  await expect(page.getByRole('link', { name: 'FrontEnd Alejandro Morilla García' })).toBeVisible();
  await page.getByRole('link', { name: 'FrontEnd Alejandro Morilla García' }).click();
  await expect(page).toHaveTitle(/Missing People Stats/);

  // 3️⃣ Crear nuevo registro
  await page.getByPlaceholder('Año', { exact: true }).fill(testYear);
  await page.getByPlaceholder('Provincia').fill(testProvince);
  await page.getByPlaceholder('Hombres desaparecidos').fill(testNumber);
  await page.getByPlaceholder('Mujeres desaparecidas').fill(testNumber);
  await page.getByPlaceholder('Desconocidos').fill(testNumber);
  await page.getByPlaceholder('Población total').fill(testNumber);
  await page.getByRole('button', { name: 'Crear' }).click();

  // 4️⃣ Filtrar el registro por provincia
  await page.getByPlaceholder('Valor a buscar').fill(testProvince);
  await page.getByRole('button', { name: 'Filtrar' }).click();
  await expect(page.getByText(testProvince)).toBeVisible();

  // 5️⃣ Editar el registro
  await page.getByRole('button', { name: 'Editar' }).click();
  await expect(page).toHaveURL(new RegExp(`/missing-people-stats/${testProvince}/${testYear}`));

  await page.getByPlaceholder('Hombres desaparecidos').fill(testEdit);
  await page.getByRole('button', { name: /Guardar/i }).click();
});