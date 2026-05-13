import { test, expect } from '@playwright/test'

test('should load the project center', async ({ page }) => {
  await page.goto('http://localhost:5173') // Assumes dev server is running
  await expect(page.locator('h1')).toContainText('Project Center')
})

test('should show empty state when no projects', async ({ page }) => {
  await page.goto('http://localhost:5173')
  await expect(page.locator('text=No projects yet')).toBeVisible()
})
