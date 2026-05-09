import { test, expect } from '@playwright/test';

test.describe('Autenticación y Seguridad', () => {

  test('Debe mostrar error al ingresar credenciales incorrectas', async ({ page }) => {
    await page.goto('/turnos');
    await page.getByTestId('user-menu-btn').click();
    
    await page.getByTestId('login-email').fill('fake@gmail.com');
    await page.getByTestId('login-password').fill('badpassword');
    await page.getByTestId('login-submit-wrapper').click();
    
    // Debe permanecer en /turnos y mostrar un mensaje de error
    await expect(page).toHaveURL(/\/turnos/);
    await expect(page.getByText(/incorrecta/i)).toBeVisible();
  });

  test('Debe iniciar sesión como Admin y redirigir', async ({ page }) => {
    await page.goto('/turnos');
    await page.getByTestId('user-menu-btn').click();
    await page.getByTestId('login-email').fill('admin@gmail.com');
    await page.getByTestId('login-password').fill('123');
    await page.getByTestId('login-submit-wrapper').click();

    // Debe redirigir a turnos o dashboard
    await page.waitForURL(/\/turnos|\/dashboard/);
    
    // El admin puede acceder a /dashboard
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  test('Debe iniciar sesión como Barbero y poder acceder al Dashboard con sus datos', async ({ page }) => {
    await page.goto('/turnos');
    await page.getByTestId('user-menu-btn').click();
    await page.getByTestId('login-email').fill('barber@gmail.com');
    await page.getByTestId('login-password').fill('123');
    await page.getByTestId('login-submit-wrapper').click();

    // Debe redirigir a turnos
    await page.waitForURL(/\/turnos/);

    // El barbero tiene acceso a /dashboard (ve sus propios datos)
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  test('Debe poder cerrar sesión', async ({ page }) => {
    // Login primero
    await page.goto('/turnos');
    await page.getByTestId('user-menu-btn').click();
    await page.getByTestId('login-email').fill('admin@gmail.com');
    await page.getByTestId('login-password').fill('123');
    await page.getByTestId('login-submit-wrapper').click();
    await page.waitForURL(/\/turnos|\/dashboard/);

    // Abrir menú de usuario y hacer clic en Cerrar sesión usando id específico
    await page.getByTestId('user-menu-btn').click();
    await page.locator('#btn-navbar-logout').click();

    // Confirmar el cierre de sesión en el modal de confirmación
    await page.locator('#btn-confirm-logout').click();

    // Debe volver al inicio (router.push('/'))
    await page.waitForURL(/^https?:\/\/[^/]+(\/)?$/);
  });

});
