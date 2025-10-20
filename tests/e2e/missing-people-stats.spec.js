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

  // 1️⃣ Abrir el frontend
  await page.goto('http://localhost:5173/missing-people-stats'); // ajusta puerto si usas otro

  // 2️⃣ Crear nuevo registro
  await page.getByPlaceholder('Año').fill(testYear);
  await page.getByPlaceholder('Provincia').fill(testProvince);
  await page.getByPlaceholder('Hombres desaparecidos').fill(testNumber);
  await page.getByPlaceholder('Mujeres desaparecidas').fill(testNumber);
  await page.getByPlaceholder('Desconocidos').fill(testNumber);
  await page.getByPlaceholder('Población total').fill(testNumber);
  await page.getByRole('button', { name: 'Crear' }).click();

  // Esperar a que se muestre el nuevo registro en la tabla
  await expect(page.getByText(testProvince)).toBeVisible();

  // 3️⃣ Filtrar el registro por provincia
  await page.getByPlaceholder('Valor a buscar').fill(testProvince);
  await page.getByRole('button', { name: 'Filtrar' }).click();
  await expect(page.getByText(testProvince)).toBeVisible();

  // 4️⃣ Editar el registro
  await page.getByRole('button', { name: 'Editar' }).click();

  // Comprobar que navega a la página de edición
  await expect(page).toHaveURL(new RegExp(`/missing-people-stats/${testProvince}/${testYear}`));

  // Editar campo y guardar (ajusta placeholder si cambia)
  await page.getByPlaceholder('Hombres desaparecidos').fill(testEdit);
  await page.getByRole('button', { name: /Guardar/i }).click();

  // 5️⃣ Volver a la página principal
  await page.goto('http://localhost:16078/missing-people-stats');
  await page.getByPlaceholder('Valor a buscar').fill(testProvince);
  await page.getByRole('button', { name: 'Filtrar' }).click();

  // 6️⃣ Eliminar el registro creado
  await page.getByRole('button', { name: 'Eliminar', exact: true }).click();

  // Confirmar que ya no aparece
  await expect(page.getByText(testProvince)).not.toBeVisible();
});