import { test, expect } from '@playwright/test';

test.describe('End-to-End User Journeys', () => {
  const testUser = `user_${Date.now()}`;
  const testPass = 'password123';

  test('Login, Monitor Creation, Dashboard View', async ({ page }) => {
    // 1. Register / Login
    await page.goto('/register');
    
    await page.fill('input[placeholder="Username"]', testUser);
    await page.fill('input[placeholder="Password"]', testPass);
    await page.click('button:has-text("Sign Up")');

    // Wait for redirect to dashboard
    await page.waitForURL('/');

    // 2. Dashboard View & Monitor Creation
    await expect(page.locator('text=Welcome')).toBeVisible();

    // Create a new monitor
    const monitorName = `My Monitor ${Date.now()}`;
    const quickAddInput = page.locator('input[placeholder="Quick Add: Type a check name and press Enter..."]');
    await quickAddInput.fill(monitorName);
    await quickAddInput.press('Enter');

    // Monitor should appear in the list
    await expect(page.locator(`text=${monitorName}`)).toBeVisible();

    // Click on details
    await page.click('button:has-text("Details / Edit")');

    // Should navigate to details
    await page.waitForURL(/\/checks\/.+/);
    await expect(page.locator(`text=${monitorName}`).first()).toBeVisible();
  });
});
