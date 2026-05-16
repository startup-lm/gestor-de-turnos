import { test, expect } from '@playwright/test';

test.describe('Pantalla Cancelar Turno', () => {

  test('Error al intentar cancelar un turno inexistente', async ({ page }) => {
    await page.goto('/turnos/cancelar');
    await expect(page.getByRole('heading', { name: '¿Querés cancelar tu turno?' })).toBeVisible();
    await page.fill('#appointment-id', '999999');
    await page.fill('#cancel-phone', '1122334455');
    await page.locator('#btn-cancel-search').click();
    await expect(page.locator('text=No existe ese número de turno')).toBeVisible();
  });

});
