import { test, expect } from "@playwright/test";

test("la landing présente la promesse et le CTA", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: /Testez vos factures électroniques avant envoi/i,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Tester une facture gratuitement/i }).first(),
  ).toBeVisible();
});

test("tester la facture d'exemple produit un rapport conforme", async ({ page }) => {
  await page.goto("/tester");
  await page.getByRole("button", { name: /facture d'exemple/i }).click();

  // Le rapport s'affiche (analyse < 10 s)
  await expect(
    page.getByRole("heading", { name: /Résultat de l'analyse/i }),
  ).toBeVisible({ timeout: 15_000 });

  // La facture d'exemple est valide → conforme, score élevé
  await expect(page.getByText("Conforme", { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/Cohérence HT \+ TVA = TTC/i)).toBeVisible();
});

test("l'historique filtre par recherche", async ({ page }) => {
  await page.goto("/historique");
  await expect(page.getByRole("heading", { name: "Historique" })).toBeVisible();
  await page.getByLabel("Rechercher").fill("Conseil");
  await expect(page.getByText("Conseil & Co").first()).toBeVisible();
  await expect(page.getByText("Boulangerie Martin")).toHaveCount(0);
});
