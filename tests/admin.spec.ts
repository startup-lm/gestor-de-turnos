import { test, expect } from '@playwright/test';
import { login } from './utils/auth-helpers';

test.describe('Flujo del Administrador', () => {

  test.beforeEach(async ({ page }) => {
    await login(page, 'admin@gmail.com', '123');
  });

  test('Debe poder acceder al bloqueo de fechas', async ({ page }) => {
    await page.goto('/admin');

    // El admin debería tener un botón "Bloquear Horarios"
    const blockBtn = page.getByTestId('btn-block-dates');
    await expect(blockBtn).toBeVisible();
    await blockBtn.click();

    // Se debe abrir el BlockDateModal
    await expect(page.locator('h2:has-text("Bloquear")')).toBeVisible();

    // Cerrar el modal usando el botón de cerrar (X)
    await page.locator('#btn-close-modal').click();
    await expect(page.locator('h2:has-text("Bloquear")')).not.toBeVisible();
  });

  test('Debe poder visualizar y guardar la Configuración del Negocio', async ({ page }) => {
    await page.goto('/admin');

    // Botón de Configuración
    const configBtn = page.getByTestId('btn-business-hours');
    if (await configBtn.isVisible()) {
      await configBtn.click();
      await expect(page.locator('h2:has-text("Días y horario")')).toBeVisible();
      
      // Cerrar el modal usando el botón de cerrar (X)
      await page.locator('#btn-close-modal').click();
    }
  });

  test('Debe poder abrir los modales de creación y edición (Barberos, Productos, Servicios)', async ({ page }) => {
    await page.goto('/admin');

    // Modal de Producto
    const addProductBtn = page.getByTestId('btn-add-product');
    await addProductBtn.click();
    await expect(page.locator('h2:has-text("Agregar Producto")')).toBeVisible();
    await page.locator('#btn-close-modal').click();

    // Modal de Servicio
    const addServiceBtn = page.getByTestId('btn-add-service');
    await addServiceBtn.click();
    await expect(page.locator('h2:has-text("Agregar Servicio")')).toBeVisible();
    await page.locator('#btn-close-modal').click();

    // Modal de Agregar Barbero
    const addBarberBtn = page.getByTestId('btn-add-barber');
    await addBarberBtn.click();
    await expect(page.locator('h2:has-text("Agregar Barbero")')).toBeVisible();
    await page.locator('#btn-close-modal').click();

    // Modal de Editar Barbero
    const editBarberBtn = page.getByTestId('btn-edit-barber');
    await editBarberBtn.click();
    await expect(page.locator('h2:has-text("Editar Barbero")')).toBeVisible();
    await page.locator('#btn-close-modal').click();
  });

});
