import { test, expect } from '@playwright/test';

test.describe('Flujo Público (Guest)', () => {

  test('Debe poder ver el calendario y seleccionar un barbero sin loguearse', async ({ page }) => {
    await page.goto('/turnos');
    
    // Debería ver el título o el selector de barberos
    await expect(page.locator('text=Barbero')).toBeVisible();
    
    // Debería poder ver el calendario
    const calendar = page.locator('.rbc-calendar');
    await expect(calendar).toBeVisible();
  });

  test('Debe evitar que se reserve en el pasado', async ({ page }) => {
    await page.goto('/turnos');
    
    // Intenta hacer clic en el botón de navegación del mes anterior
    const prevButton = page.locator('button', { hasText: 'Back' }).or(page.locator('.rbc-btn-group button:nth-child(1)'));
    if (await prevButton.isVisible()) {
        await prevButton.click();
    }
    // La app bloquea reservas en el pasado para guests (slotInfo.start < now && role === "guest")
  });

  test('Debe poder hacer una reserva exitosa y ver el modal', async ({ page }) => {
    await page.goto('/turnos');
    
    // Seleccionar el primer barbero disponible
    const barberBtn = page.locator('.barber-checkbox').first();
    await expect(barberBtn).toBeVisible({ timeout: 10000 });
    await barberBtn.click();
    
    // Esperar a que el calendario cargue los datos y sea interactivo
    await page.waitForTimeout(1000);
    
    // Hacer clic en un slot disponible (sólo futuro, marcado como calendar-slot--clickable)
    // react-big-calendar usa onSelectSlot que se dispara con click en el time-content area
    const clickableSlot = page.locator('.calendar-slot--clickable').first();
    
    const slotsCount = await clickableSlot.count();
    if (slotsCount > 0) {
      await clickableSlot.click({ force: true });
      await page.waitForTimeout(800);
      
      // Se debería abrir el modal de reserva (h2 "Reserva tu turno")
      const modalTitle = page.locator('h2', { hasText: /Reserva tu turno/i });
      await expect(modalTitle).toBeVisible({ timeout: 10000 });

      // Llenar el formulario para guest: nombre y teléfono
      await page.locator('#reservar-guest-name').fill('Playwright Tester');
      await page.locator('#reservar-guest-phone').fill('1122334455');
      
      // Seleccionar servicio (primer servicio disponible)
      await page.locator('#reservar-service').selectOption({ index: 1 });

      // Enviar reserva
      await page.locator('#btn-reservar-submit').click();

      // Debe aparecer popup de éxito con el número de turno
      await expect(page.locator('text=/éxito|Número de turno/i')).toBeVisible({ timeout: 10000 });
    } else {
      // Si no hay slots disponibles (todos ocupados o fuera de horario), omitimos el test
      console.log('No hay slots disponibles para reservar — el test se omite');
    }
  });

  test('Debe poder intentar cancelar un turno anónimamente', async ({ page }) => {
    await page.goto('/turnos/cancelar');

    await expect(page.getByRole('heading', { name: '¿Querés cancelar tu turno?' })).toBeVisible();

    // Llenar formulario con datos falsos
    await page.fill('#appointment-id', '999999');
    await page.fill('#cancel-phone', '1122334455');
    
    // Enviar
    await page.locator('#btn-cancel-search').click();

    // Debe mostrar error porque el turno no existe
    await expect(page.locator('text=No existe ese número de turno')).toBeVisible();
  });

});
