import { Page } from '@playwright/test';

export async function login(page: Page, email: string, password: string) {
  await page.goto('/turnos');
  await page.getByTestId('user-menu-btn').click();
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill(password);
  await page.getByTestId('login-submit-wrapper').click();
  if (email === 'admin@gmail.com') await page.locator('#nav-link-admin').waitFor({ state: 'visible' });
  else if (email === 'barber@gmail.com') await page.locator('#nav-link-dashboard').waitFor({ state: 'visible' });
}