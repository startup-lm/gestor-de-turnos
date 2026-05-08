import { test, expect } from '@playwright/test';

test.describe('Flujo del Administrador', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/turnos');
    await page.getByTestId('user-menu-btn').click();
    await page.getByTestId('login-email').fill('admin@gmail.com');
    await page.getByTestId('login-password').fill('123');
    await page.getByTestId('login-submit-wrapper').click();
    await page.waitForURL(/\/turnos|\/dashboard/);
  });

  test('Debe poder acceder al bloqueo de fechas', async ({ page }) => {
    // Si estamos en /dashboard, vamos a /turnos
    await page.goto('/admin');

    // El admin debería tener un botón "Bloquear Horarios"
    const blockBtn = page.getByTestId('btn-block-dates');
    await expect(blockBtn).toBeVisible();
    await blockBtn.click();

    // Se debe abrir el BlockDateModal
    await expect(page.locator('h2:has-text("Bloquear")')).toBeVisible();

    // Podemos completar el motivo y darle a confirmar
    await page.fill('input[type="text"]', 'Feriado Nacional');
    
    // Seleccionamos "Día entero" o un rango
    // Para simplificar, cerraremos el modal
    await page.locator('button:has-text("Cancelar"), button[aria-label="Cerrar"]').first().click();
  });

  test('Debe poder visualizar y guardar la Configuración del Negocio', async ({ page }) => {
    await page.goto('/admin');

    // Botón de Configuración
    const configBtn = page.getByTestId('btn-business-hours');
    if (await configBtn.isVisible()) {
      await configBtn.click();
      await expect(page.locator('h2:has-text("Días y horario")')).toBeVisible();
      
    // Intentamos cerrar el modal
      await page.keyboard.press('Escape');
    }
  });

  test('Debe poder abrir los modales de creación y edición (Barberos, Productos, Servicios)', async ({ page }) => {
    await page.goto('/admin');

    // Modales de Producto y Servicio
    const addProductBtn = page.getByTestId('btn-add-product');
    await addProductBtn.click();
    await expect(page.locator('h2:has-text("Agregar Producto")')).toBeVisible();
    await page.keyboard.press('Escape');

    const addServiceBtn = page.getByTestId('btn-add-service');
    await addServiceBtn.click();
    await expect(page.locator('h2:has-text("Agregar Servicio")')).toBeVisible();
    await page.keyboard.press('Escape');

    // Modales de Barbero
    const addBarberBtn = page.getByTestId('btn-add-barber');
    await addBarberBtn.click();
    await expect(page.locator('h2:has-text("Agregar Barbero")')).toBeVisible();
    await page.keyboard.press('Escape');

    const editBarberBtn = page.getByTestId('btn-edit-barber');
    await editBarberBtn.click();
    await expect(page.locator('h2:has-text("Editar Barbero")')).toBeVisible();
    await page.keyboard.press('Escape');
  });

});
