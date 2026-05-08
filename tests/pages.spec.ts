import { test, expect } from '@playwright/test';

test.describe('Páginas Públicas (Guest)', () => {

  test('Debe cargar el listado de Servicios', async ({ page }) => {
    await page.goto('/servicios');
    // Verificamos que el título esté visible
    await expect(page.getByRole('heading', { name: 'Nuestros Servicios' })).toBeVisible();
    // Verificamos que haya al menos un servicio en la grilla (tarjetas)
    const services = page.locator('.grid > div');
    expect(await services.count()).toBeGreaterThan(0);
  });

  test('Debe cargar el listado de Productos', async ({ page }) => {
    await page.goto('/productos');
    // Verificamos que el título esté visible
    await expect(page.getByRole('heading', { name: 'Nuestros Productos' })).toBeVisible();
    // Verificamos que haya al menos un producto en la grilla
    const products = page.locator('.grid > div');
    expect(await products.count()).toBeGreaterThan(0);
  });

  test('Debe cargar la página Nosotros con información y mapa', async ({ page }) => {
    await page.goto('/nosotros');
    // Verificar título principal
    await expect(page.getByRole('heading', { name: 'Nuestro Equipo' })).toBeVisible();
    
    // Verificar que los barberos aparezcan en la página
    const barbers = page.locator('.grid > div');
    expect(await barbers.count()).toBeGreaterThan(0);

    // Verificar mapa y redes sociales
    await expect(page.getByRole('heading', { name: '¿Dónde estamos?' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Nuestras Redes' })).toBeVisible();
    
    // Verificar que el iframe del mapa esté cargado
    const iframe = page.locator('iframe');
    await expect(iframe).toBeVisible();
  });

});
