import { test, expect } from '@playwright/test';

test.describe('Dashboard y Estadísticas', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/turnos');
    await page.getByTestId('user-menu-btn').click();
    await page.getByTestId('login-email').fill('admin@gmail.com');
    await page.getByTestId('login-password').fill('123');
    await page.getByTestId('login-submit-wrapper').click();
    await page.waitForURL(/\/turnos|\/dashboard/);
    await page.goto('/dashboard');
  });

  test('Debe cargar el Dashboard y mostrar gráficas', async ({ page }) => {
    // Título del Dashboard
    await expect(page.locator('h1', { hasText: 'Dashboard' })).toBeVisible();

    // Debería verse el selector de barberos en el Sidebar
    await expect(page.locator('text=Todos los Barberos')).toBeVisible();

    // Las tarjetas del Summary deben estar presentes
    // Buscamos algo como "Ingresos totales"
    await expect(page.locator('text=Ingresos totales')).toBeVisible();
    await expect(page.locator('text=Ganancias Netas')).toBeVisible();
  });

  test('Debe mostrar la sección de ingresos por método de pago', async ({ page }) => {
    // La nueva función de la Fase 1
    await expect(page.locator('text=Ingresos por Turnos según Método de Pago')).toBeVisible();
    await expect(page.locator('p:has-text("Efectivo")')).toBeVisible();
    await expect(page.locator('p:has-text("Mercado Pago")')).toBeVisible();
  });

});
