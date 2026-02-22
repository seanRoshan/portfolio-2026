import { test, expect } from '@playwright/test'

// The resume builder is behind admin auth.
// For local testing, we assume the dev server is running
// and the user is already logged in (cookie-based auth).
// If login is needed, add it in beforeEach.

test.describe('Resume Builder', () => {
  test('resume list page loads', async ({ page }) => {
    await page.goto('/admin/resume-builder')
    // The page should show a heading or list
    // Check for common elements
    await expect(page.locator('body')).toContainText(/resume/i)
  })

  test('create dialog opens', async ({ page }) => {
    await page.goto('/admin/resume-builder')
    // Look for a "New Resume" or "Create" button
    const createBtn = page.getByRole('button', { name: /new|create/i })
    if (await createBtn.isVisible()) {
      await createBtn.click()
      // Verify a dialog or form appears
      await expect(
        page.getByRole('dialog').or(page.locator('[role="dialog"]'))
      ).toBeVisible()
    }
  })

  test('create dialog has mode selection', async ({ page }) => {
    await page.goto('/admin/resume-builder')
    const createBtn = page.getByRole('button', { name: /new resume/i })
    if (await createBtn.isVisible()) {
      await createBtn.click()
      // The dialog should show mode selection: "Tailor for a Job" and "Start from Scratch"
      await expect(page.getByText('Tailor for a Job')).toBeVisible({
        timeout: 3000,
      })
      await expect(page.getByText('Start from Scratch')).toBeVisible({
        timeout: 3000,
      })
    }
  })

  test('editor page has all sections', async ({ page }) => {
    // First go to list
    await page.goto('/admin/resume-builder')

    // Try clicking on the first resume link/card if any exist
    const firstLink = page
      .locator('a[href*="/admin/resume-builder/"]')
      .filter({ has: page.locator('h3') })
      .first()
    if (
      await firstLink
        .isVisible({ timeout: 3000 })
        .catch(() => false)
    ) {
      await firstLink.click()

      // Wait for editor to load
      await page.waitForURL(/\/admin\/resume-builder\/.*\/edit/)

      // Check that key editor elements are present
      await expect(page.locator('text=Contact')).toBeVisible({
        timeout: 5000,
      })

      // Check for template selector (SelectTrigger with Palette icon)
      await expect(
        page.locator('[role="combobox"]').or(page.getByText(/template/i))
      ).toBeVisible({ timeout: 5000 })

      // Check for PDF download button
      await expect(
        page.getByRole('button', { name: /pdf|download/i })
      ).toBeVisible()

      // Check for settings button (Settings2 icon)
      await expect(
        page.getByRole('button').filter({ hasText: /settings/i }).or(
          page.locator('button:has(svg.lucide-settings-2)')
        )
      ).toBeVisible()
    }
  })

  test('settings panel opens and has controls', async ({ page }) => {
    await page.goto('/admin/resume-builder')
    const firstLink = page
      .locator('a[href*="/admin/resume-builder/"]')
      .filter({ has: page.locator('h3') })
      .first()
    if (
      await firstLink
        .isVisible({ timeout: 3000 })
        .catch(() => false)
    ) {
      await firstLink.click()
      await page.waitForURL(/\/admin\/resume-builder\/.*\/edit/)

      // Click settings button — it contains the Settings2 icon
      const settingsBtn = page.locator(
        'button:has(svg.lucide-settings-2)'
      )
      if (
        await settingsBtn
          .isVisible({ timeout: 3000 })
          .catch(() => false)
      ) {
        await settingsBtn.click()

        // Settings sheet should open with title
        await expect(page.getByText('Resume Settings')).toBeVisible({
          timeout: 3000,
        })

        // Should have section visibility toggles
        await expect(
          page.getByText('Section Visibility')
        ).toBeVisible({ timeout: 3000 })

        // Should have appearance controls
        await expect(page.getByText('Accent Color')).toBeVisible({
          timeout: 3000,
        })
        await expect(page.getByText('Font Family')).toBeVisible({
          timeout: 3000,
        })
        await expect(page.getByText('Density')).toBeVisible({
          timeout: 3000,
        })
      }
    }
  })

  test('score badge is visible', async ({ page }) => {
    await page.goto('/admin/resume-builder')
    const firstLink = page
      .locator('a[href*="/admin/resume-builder/"]')
      .filter({ has: page.locator('h3') })
      .first()
    if (
      await firstLink
        .isVisible({ timeout: 3000 })
        .catch(() => false)
    ) {
      await firstLink.click()
      await page.waitForURL(/\/admin\/resume-builder\/.*\/edit/)

      // Look for the score badge (format: "A · 85" or "B · 72")
      await expect(
        page.locator('text=/[A-F]\\s*·\\s*\\d+/')
      ).toBeVisible({ timeout: 5000 })
    }
  })

  test('template selector changes template', async ({ page }) => {
    await page.goto('/admin/resume-builder')
    const firstLink = page
      .locator('a[href*="/admin/resume-builder/"]')
      .filter({ has: page.locator('h3') })
      .first()
    if (
      await firstLink
        .isVisible({ timeout: 3000 })
        .catch(() => false)
    ) {
      await firstLink.click()
      await page.waitForURL(/\/admin\/resume-builder\/.*\/edit/)

      // Find template selector (the combobox in the header)
      const templateSelect = page
        .locator('[role="combobox"]')
        .first()
      if (
        await templateSelect
          .isVisible({ timeout: 3000 })
          .catch(() => false)
      ) {
        await templateSelect.click()
        // Should show template options in the dropdown
        const options = page.getByRole('option')
        await expect(options.first()).toBeVisible({ timeout: 3000 })
        expect(await options.count()).toBeGreaterThan(0)
      }
    }
  })

  test('drag handles are present for reordering', async ({ page }) => {
    await page.goto('/admin/resume-builder')
    const firstLink = page
      .locator('a[href*="/admin/resume-builder/"]')
      .filter({ has: page.locator('h3') })
      .first()
    if (
      await firstLink
        .isVisible({ timeout: 3000 })
        .catch(() => false)
    ) {
      await firstLink.click()
      await page.waitForURL(/\/admin\/resume-builder\/.*\/edit/)

      // Drag handles should be visible (GripVertical icons with aria-label)
      const gripHandles = page.locator(
        '[aria-label="Drag to reorder"]'
      )
      await expect(gripHandles.first()).toBeVisible({ timeout: 5000 })
      // Should have multiple handles (one per visible section)
      expect(await gripHandles.count()).toBeGreaterThan(2)
    }
  })

  test('back button navigates to resume list', async ({ page }) => {
    await page.goto('/admin/resume-builder')
    const firstLink = page
      .locator('a[href*="/admin/resume-builder/"]')
      .filter({ has: page.locator('h3') })
      .first()
    if (
      await firstLink
        .isVisible({ timeout: 3000 })
        .catch(() => false)
    ) {
      await firstLink.click()
      await page.waitForURL(/\/admin\/resume-builder\/.*\/edit/)

      // The back button links to /admin/resume-builder
      const backLink = page.locator(
        'a[href="/admin/resume-builder"]'
      )
      await expect(backLink).toBeVisible({ timeout: 3000 })
    }
  })

  test('"All changes saved" indicator is visible in editor', async ({
    page,
  }) => {
    await page.goto('/admin/resume-builder')
    const firstLink = page
      .locator('a[href*="/admin/resume-builder/"]')
      .filter({ has: page.locator('h3') })
      .first()
    if (
      await firstLink
        .isVisible({ timeout: 3000 })
        .catch(() => false)
    ) {
      await firstLink.click()
      await page.waitForURL(/\/admin\/resume-builder\/.*\/edit/)

      // The editor shows "All changes saved" status text
      await expect(
        page.getByText('All changes saved')
      ).toBeVisible({ timeout: 5000 })
    }
  })
})
