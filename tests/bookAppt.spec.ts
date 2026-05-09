import { test, expect } from '@playwright/test';

test.describe('Flujo Reservar Turno - Validaciones', () => {

  const barbers = ['Admin', 'Barber'];

  // Test success for every barber as requested
  for (const name of barbers) {
    test(`Debe poder hacer una reserva exitosa con ${name}`, async ({ page }) => {
      await page.goto('/turnos');
      await page.locator('.barber-checkbox').filter({ hasText: name }).click();
      
      const clickableSlot = page.locator('.calendar-slot--clickable').first();
      await expect(clickableSlot).toBeVisible();
      await clickableSlot.click({ force: true });
      
      await page.locator('#reservar-guest-name').fill('Playwright Tester');
      await page.locator('#reservar-guest-phone').fill('1122334455');
      await page.locator('#reservar-service').selectOption({ index: 1 });
      await page.locator('#btn-reservar-submit').click();

      await expect(page.locator('text=Tu turno fue reservado con éxito.')).toBeVisible();
    });
  }

  // Common setup for specific validation tests (using the first barber)
  test.beforeEach(async ({ page }) => {
    await page.goto('/turnos');
    const firstBarber = page.locator('.barber-checkbox').first();
    await expect(firstBarber).toBeVisible();
    await firstBarber.click();
  });

  test('No debe permitir abrir el modal en un slot que ya pasó', async ({ page }) => {
    // Select a slot that is explicitly NOT clickable (the past)
    const pastSlot = page.locator('.calendar-slot:not(.calendar-slot--clickable)').first();
    
    if (await pastSlot.count() > 0) {
      await pastSlot.click({ force: true });
      // Verify modal does NOT appear
      const modalTitle = page.locator('h2', { hasText: /Reserva tu turno/i });
      await expect(modalTitle).not.toBeVisible();
    }
  });

  test('Debe validar campos obligatorios y mantener botón Reservar deshabilitado por defecto', async ({ page }) => {
    const clickableSlot = page.locator('.calendar-slot--clickable').first();
    await clickableSlot.click({ force: true });

    // Verify initial states
    await expect(page.locator('#reservar-guest-name')).toBeEmpty();
    await expect(page.locator('#reservar-guest-phone')).toBeEmpty();
    
    // Verify default select option
    const select = page.locator('#reservar-service');
    await expect(select).toHaveValue('-1');
    await expect(page.locator('option[value="-1"]')).toHaveText('Selecciona un servicio');

    // Verify button is disabled
    const submitBtn = page.locator('#btn-reservar-submit');
    await expect(submitBtn).toBeDisabled();
  });

  test('Debe mostrar error por solapamiento al elegir un servicio largo antes de un turno ocupado', async ({ page }) => {
  await page.goto('/turnos');
  await page.locator('.barber-checkbox').first().click();
  const slots = await page.locator('.calendar-slot').all();
  let found = false;
  for (let i = 0; i < slots.length - 1; i++) {
    const currentIsAvailable = await slots[i].evaluate(el => el.classList.contains('calendar-slot--clickable'));
    const nextIsBooked = await slots[i+1].evaluate(el => !el.classList.contains('calendar-slot--clickable'));
    if (currentIsAvailable && nextIsBooked) {
      await slots[i].click({ force: true });
      found = true;
      break;
    }
  }
  if (!found) {
    console.log('No se encontró un escenario de solapamiento disponible en la vista actual.');
    return;
  }
  await page.locator('#reservar-guest-name').fill('Tester Overlap');
  await page.locator('#reservar-guest-phone').fill('1122334455');
  await page.locator('#reservar-service').selectOption({ label: 'Corte + Barba' });
  await page.locator('#btn-reservar-submit').click();
  const errorMessage = page.locator('text=/coincide con otro ya agendado/i');
  await expect(errorMessage).toBeVisible();
});
});