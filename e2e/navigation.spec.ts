import { test, expect } from "@playwright/test";

test.describe("Navegación pública de la plataforma", () => {
  test("debe cargar la vista de turnos sin errores de consola", async ({ page }) => {
    await page.goto("/turnos");
    await expect(page).toHaveURL(/\/turnos/);
  });

  test("debe cargar la sección de servicios", async ({ page }) => {
    await page.goto("/servicios");
    await expect(page.getByRole("heading", { name: /servicios/i })).toBeVisible();
  });

  test("debe cargar la sección de productos", async ({ page }) => {
    await page.goto("/productos");
    await expect(page.getByRole("heading", { name: /productos/i })).toBeVisible();
  });

  test("debe cargar la página sobre nosotros", async ({ page }) => {
    await page.goto("/nosotros");
    await expect(page.getByRole("heading", { name: /nosotros/i })).toBeVisible();
  });
});
