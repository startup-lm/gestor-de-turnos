import { test, expect } from "@playwright/test";

test.describe("Pantalla de cancelación de turnos online", () => {
  test("debe cargar la vista de cancelación y validar turno inexistente sin crash", async ({ page }) => {
    await page.goto("/turnos/cancelar");
    await expect(page.getByRole("heading", { name: /cancelar tu turno/i })).toBeVisible();

    const idInput = page.locator("#appointment-id");
    const phoneInput = page.locator("#cancel-phone");
    const searchBtn = page.locator("#btn-cancel-search");

    await idInput.fill("9999999");
    await phoneInput.fill("1122334455");
    await searchBtn.click();

    await expect(page.locator("text=/no existe ningún turno/i")).toBeVisible({ timeout: 10000 });
  });
});
