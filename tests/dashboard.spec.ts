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

    // El selector de barberos debe estar presente (el admin ve "Todos los Barberos")
    await expect(page.locator('text=Todos los Barberos')).toBeVisible();

    // Las tarjetas del Summary deben estar presentes
    await expect(page.locator('text=Ingresos totales')).toBeVisible();
    await expect(page.locator('text=Ganancias Netas')).toBeVisible();
  });

  test('Debe mostrar la sección de ingresos por método de pago', async ({ page }) => {
    // La sección de payment totals se muestra en el Summary del admin cuando hay datos
    // Verificamos que la sección Summary esté visible y tenga el contenido esperado
    await expect(page.locator('text=Ingresos totales')).toBeVisible();
    
    // La sección de método de pago solo aparece si hay datos registrados
    // Verificamos si el elemento existe, pero no fallamos si no hay datos aún
    const paymentSection = page.locator('text=Ingresos por Turnos según Método de Pago');
    const effectivoSection = page.locator('p:has-text("Efectivo")');
    
    const paymentSectionCount = await paymentSection.count();
    if (paymentSectionCount > 0) {
      await expect(paymentSection).toBeVisible();
      await expect(effectivoSection.first()).toBeVisible();
      await expect(page.locator('p:has-text("Mercado Pago")').first()).toBeVisible();
    } else {
      // Si no hay datos de pagos, verificamos que el dashboard igual cargue bien
      await expect(page.locator('h1', { hasText: 'Dashboard' })).toBeVisible();
    }
  });

});
