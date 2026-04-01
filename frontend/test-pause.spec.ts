import { test, expect } from '@playwright/test';

test('pause checks button', async ({ page }) => {
  // Login
  await page.goto('http://localhost:5173/login');

  // Wait for the form to appear
  await page.waitForSelector('form');

  // Find inputs by placeholder or other stable selectors
  await page.fill('input[placeholder="Username"]', 'admin');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button:has-text("Sign In")');

  // Wait for dashboard to load
  await page.waitForURL('http://localhost:5173/');

  // Create a new check
  const checkName = `Test Check ${Date.now()}`;
  await page.fill('input[placeholder="Quick Add: Type a check name and press Enter..."]', checkName);
  await page.keyboard.press('Enter');

  // Wait for the new check to appear in the table
  await expect(page.locator(`text=${checkName}`)).toBeVisible();

  // Find the new check and click "Details / Edit"
  const row = page.locator('tr').filter({ hasText: checkName });
  await row.locator('button', { hasText: 'Details / Edit' }).click();

  // Wait for the check details page to load
  await page.waitForSelector(`h1:has-text("${checkName}")`);

  // Verify initial status is "NEW"
  await expect(page.locator('span', { hasText: 'NEW' })).toBeVisible();

  // Find the Pause/Resume button
  const toggleButton = page.locator('button', { hasText: /Pause|Resume/ });

  // Wait for the button to be visible
  await expect(toggleButton).toBeVisible();

  // Click the Pause button
  await toggleButton.click();

  // Verify status changes to PAUSED
  await expect(page.locator('span', { hasText: 'PAUSED' })).toBeVisible();

  // Click the Resume button
  const resumeButton = page.locator('button', { hasText: 'Resume' });
  await resumeButton.click();

  // Verify status changes to NEW (since it has no pings)
  await expect(page.locator('span', { hasText: 'NEW' })).toBeVisible();
});
