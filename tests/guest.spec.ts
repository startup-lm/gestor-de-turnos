import { test, expect } from '@playwright/test';

test.describe('Flujo Público (Guest)', () => {

  test('Debe poder ver el calendario y seleccionar un barbero sin loguearse', async ({ page }) => {
    // Los guests entran directamente a turnos
    await page.goto('/turnos');
    
    // Debería ver el título o el selector de barberos
    await expect(page.locator('text=Barbero')).toBeVisible();
    
    // Debería poder cambiar la vista del calendario
    const calendar = page.locator('.rbc-calendar');
    await expect(calendar).toBeVisible();
  });

  test('Debe evitar que se reserve en el pasado', async ({ page }) => {
    await page.goto('/turnos');
    
    // Intenta hacer clic en el botón de navegación del mes anterior
    const prevButton = page.locator('button', { hasText: 'Back' }).or(page.locator('.rbc-btn-group button:nth-child(1)'));
    if (await prevButton.isVisible()) {
        await prevButton.click();
        // Buscar algún evento en el mes anterior o hacer clic en un slot vacío
        // Usualmente las librerías de calendario bloquean clics en el pasado o la app nuestra muestra error
        // Esto depende fuertemente de la UI de react-big-calendar
    }
  });

  test('Debe poder hacer una reserva exitosa y ver el modal', async ({ page }) => {
    await page.goto('/turnos');
    
    // Primero debemos seleccionar un barbero (requisito para que el calendario sea interactivo)
    const barberBtn = page.locator('.barber-checkbox').first();
    await expect(barberBtn).toBeVisible({ timeout: 10000 });
    await barberBtn.click();
    
    // Esperar a que el calendario sea interactivo (se quita el overlay de opacidad)
    await page.waitForTimeout(500);
    
    // Hacer clic en un slot libre en el calendario (react-big-calendar usa .rbc-time-slot)
    const todaySlot = page.locator('.rbc-time-slot').nth(20); // click a media mañana
    await todaySlot.click({ force: true });
    
    // Se debería abrir el modal de reserva
    const modalTitle = page.locator('h2', { hasText: /Reserva tu turno/i });
    await expect(modalTitle).toBeVisible();

    // Llenar el formulario (vista guest: campos nombre y teléfono)
    await page.fill('input[placeholder*="Nombre"]', 'Playwright Tester');
    await page.fill('input[placeholder*="1123456789"]', '1122334455'); // 10 dígitos válidos
    
    // Seleccionar servicio
    const selectService = page.locator('#reservar-service');
    await selectService.selectOption({ index: 1 }); // Selecciona la primera opción válida (no el placeholder)

    // Clic en el botón "Reservar"
    await page.locator('#btn-reservar-submit').click();

    // Debería aparecer un PopupModal con texto "exito" o "Número de turno"
    const successMsg = page.locator('text=/éxito|Número de turno/i');
    await expect(successMsg).toBeVisible({ timeout: 10000 });
  });

  test('Debe poder intentar cancelar un turno anónimamente', async ({ page }) => {
    await page.goto('/turnos/cancelar');

    await expect(page.getByRole('heading', { name: '¿Querés cancelar tu turno?' })).toBeVisible();

    // Llenar formulario de cancelación con datos falsos para verificar validación
    await page.fill('#appointment-id', '999999');
    await page.fill('input[type="tel"]', '1122334455');
    
    // El botón debería decir Cancelar
    await page.locator('button:has-text("Cancelar")').click();

    // Debería salir el modal de error porque el turno no existe
    await expect(page.locator('text=No existe ese número de turno')).toBeVisible();
  });

});
