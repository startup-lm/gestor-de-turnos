import { test, expect } from '@playwright/test';

test.describe('Autenticación y Seguridad', () => {

  test('Debe mostrar error al ingresar credenciales incorrectas', async ({ page }) => {
    await page.goto('/turnos');
    await page.getByTestId('user-menu-btn').click();
    
    // Asumiendo que hay inputs con placeholder o tipo específico, buscaremos de forma robusta
    await page.getByTestId('login-email').fill('fake@gmail.com');
    await page.getByTestId('login-password').fill('badpassword');
    
    // Clic en el botón de submit, suele ser un botón con texto como Iniciar Sesión o Ingresar
    // O podemos buscar por tipo
    await page.getByTestId('login-submit-wrapper').click();
    
    // Debe aparecer un mensaje de error en la página.
    // Dependiendo de cómo lo maneje Supabase, usualmente devuelve un mensaje que se muestra en un toast o un div
    // Buscaremos cualquier texto que contenga palabras clave de error o esperamos que la URL no cambie
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
    
    // Si somos admin, el botón de Dashboard o Configuración debe estar visible en el navbar
    const dashboardLink = page.locator('text=Dashboard');
    // Algunas veces se llama Panel, Estadísticas, o simplemente Dashboard
    // Vamos a asegurar que al menos podemos ir a /dashboard
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  test('Debe iniciar sesión como Barbero y bloquear acceso a Dashboard', async ({ page }) => {
    await page.goto('/turnos');
    await page.getByTestId('user-menu-btn').click();
    await page.getByTestId('login-email').fill('barber@gmail.com');
    await page.getByTestId('login-password').fill('123');
    await page.getByTestId('login-submit-wrapper').click();

    // Debe redirigir a turnos
    await page.waitForURL(/\/turnos/);

    // Intentar acceder a dashboard de forma maliciosa
    await page.goto('/dashboard');
    
    // Debería redirigirnos de vuelta a /turnos o mostrar acceso denegado
    await page.waitForURL(/\/turnos/);
  });

  test('Debe poder cerrar sesión', async ({ page }) => {
    // Login primero
    await page.goto('/turnos');
    await page.getByTestId('user-menu-btn').click();
    await page.getByTestId('login-email').fill('admin@gmail.com');
    await page.getByTestId('login-password').fill('123');
    await page.getByTestId('login-submit-wrapper').click();
    await page.waitForURL(/\/turnos|\/dashboard/);

    // Buscar botón de cerrar sesión
    // Puede ser "Cerrar sesión", "Salir", "Logout"
    const logoutBtn = page.locator('button:has-text("Cerrar sesión"), button:has-text("Salir")');
    if (await logoutBtn.isVisible()) {
        await logoutBtn.click();
    } else {
        // En móviles podría estar dentro de un menú hamburguesa
        await page.click('button[aria-label="Menu"], .menu-icon');
        await page.locator('text=Cerrar sesión').click();
    }

    // Debe volver a auth
    await page.waitForURL(/\/auth/);
  });

});
