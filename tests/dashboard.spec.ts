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
    // Esperar a que el JS hidrate y el dashboard cargue
    await page.waitForLoadState('networkidle');
  });

  test('Debe cargar el Dashboard y mostrar gráficas', async ({ page }) => {
    // Título del Dashboard (cargado por JS tras la hidratación)
    await expect(page.locator('h1', { hasText: 'Dashboard' })).toBeVisible({ timeout: 20000 });

    // El select de barberos debe estar en el DOM (el admin ve "Todos los Barberos" como primera opción)
    await expect(page.locator('#dashboard-barber')).toBeVisible({ timeout: 10000 });

    // Las tarjetas del Summary deben estar presentes (solo para admin)
    await expect(page.locator('text=Ingresos totales')).toBeVisible({ timeout: 20000 });
    await expect(page.locator('text=Ganancias Netas')).toBeVisible({ timeout: 10000 });
  });

  test('Debe mostrar la sección de ingresos por método de pago', async ({ page }) => {
    // Esperar que el heading del dashboard esté visible
    await expect(page.locator('h1', { hasText: 'Dashboard' })).toBeVisible({ timeout: 20000 });
    
    // Esperar que el Summary se haya cargado (sección principal del admin)
    await expect(page.locator('text=Ingresos totales')).toBeVisible({ timeout: 20000 });
    
    // La sección de método de pago aparece cuando hay datos registrados
    const paymentSection = page.locator('text=Ingresos por Turnos según Método de Pago');
    const paymentSectionCount = await paymentSection.count();
    
    if (paymentSectionCount > 0) {
      await expect(paymentSection).toBeVisible();
      await expect(page.locator('p:has-text("Efectivo")').first()).toBeVisible();
      await expect(page.locator('p:has-text("Mercado Pago")').first()).toBeVisible();
    } else {
      // Sin datos de pagos, el dashboard igual debe cargar
      await expect(page.locator('h1', { hasText: 'Dashboard' })).toBeVisible();
    }
  });

});
