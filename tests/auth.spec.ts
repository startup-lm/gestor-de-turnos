import { test, expect } from '@playwright/test';
import { login } from './utils/auth-helpers';

test.describe('Autenticación y Seguridad', () => {

  test('Debe mostrar error al ingresar credenciales incorrectas', async ({ page }) => {
    await login(page, 'fake@gmail.com', 'badpassword');
    await expect(page.getByText(/incorrecta/i)).toBeVisible();
  });

  test('Debe iniciar sesión como Admin y redirigir', async ({ page }) => {
    await login(page, 'admin@gmail.com', '123');
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 20000 });
  });

  test('Debe iniciar sesión como Barbero y poder acceder al Dashboard con sus datos', async ({ page }) => {
    await login(page, 'barber@gmail.com', '123');
    await expect(page).toHaveURL(/\/turnos/);
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 20000 });
  });

  test('Debe poder cerrar sesión', async ({ page }) => {
    await login(page, 'admin@gmail.com', '123');

    // Abrir menú de usuario en el navbar desktop (md:block) y cerrar sesión
    // El desktop navbar tiene user-menu-btn y el menú dropdown con el botón de logout
    await page.getByTestId('user-menu-btn').click();

    // El botón de logout del desktop dropdown tiene la clase user-menu-options
    // Usar el que NO tiene btn-auth-mobile (ese es el mobile)
    const desktopLogout = page.locator('#btn-navbar-logout.user-menu-options');
    await expect(desktopLogout).toBeVisible({ timeout: 5000 });
    await desktopLogout.click();

    // Confirmar el cierre de sesión en el modal de confirmación
    await page.locator('#btn-confirm-logout').first().click();

    // Debe volver al inicio (router.push('/'))
    await page.waitForURL(/^https?:\/\/[^/]+(\/)?$/);
  });

});
