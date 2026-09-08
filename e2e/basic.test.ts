import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript({ path: 'e2e/tauri-mock.js' })
})

test('should load the project center', async ({ page }) => {
  await page.goto('/projects')
  await expect(page.locator('h1')).toContainText('Projects')
})

test('should show empty state when no projects', async ({ page }) => {
  await page.goto('/projects')
  await expect(page.getByText('Your library is empty')).toBeVisible()
})

test('creates a Next.js project and shows it in the library', async ({ page }) => {
  await page.goto('/nextjs')
  await page.getByLabel('Project name').fill('e2e-next-app')
  await page.getByRole('button', { name: /Create project/ }).click()

  await expect(page.getByText('Project created successfully!')).toBeVisible()
  await page.getByRole('link', { name: 'Projects' }).click()
  await expect(page.getByText('e2e-next-app', { exact: true })).toBeVisible()
})

test('searches and pins a project', async ({ page }) => {
  await page.goto('/nextjs')
  await page.getByLabel('Project name').fill('searchable-app')
  await page.getByRole('button', { name: /Create project/ }).click()
  await page.getByRole('link', { name: 'Projects' }).click()

  const search = page.getByLabel('Search projects')
  await search.fill('searchable')
  await expect(page.getByText('searchable-app', { exact: true })).toBeVisible()
  await page.getByText('searchable-app', { exact: true }).click()
  await page.getByRole('button', { name: 'More actions' }).click()
  await page.getByRole('menuitem', { name: 'Pin project' }).click()

  await expect(page.getByText('searchable-app pinned.')).toBeVisible()
  await expect(page.locator('section').getByText('Pinned', { exact: true })).toBeVisible()
})

test('cleans and deletes a project', async ({ page }) => {
  await page.goto('/nextjs')
  await page.getByLabel('Project name').fill('cleanup-app')
  await page.getByRole('button', { name: /Create project/ }).click()
  await page.getByRole('link', { name: 'Projects' }).click()
  await page.getByText('cleanup-app', { exact: true }).click()

  await page.getByRole('button', { name: 'More actions' }).click()
  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('menuitem', { name: 'Clean project' }).click()
  await expect(page.getByText('cleanup-app has been cleaned.')).toBeVisible()

  await page.getByRole('button', { name: 'More actions' }).click()
  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('menuitem', { name: 'Delete project' }).click()
  await expect(page.getByText('cleanup-app deleted successfully.')).toBeVisible()
  await expect(page.getByText('Your library is empty')).toBeVisible()
})
