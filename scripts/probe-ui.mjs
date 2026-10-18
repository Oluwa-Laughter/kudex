import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, writeFile } from 'node:fs/promises';
const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox'],
});
const report = [];
const routes = process.env.KUDEX_UI_ROUTES?.split(',') || [
  '/',
  '/app/agents',
  '/app/vaults',
];
const output = process.env.KUDEX_UI_ARTIFACT_DIR || 'artifacts/ui/verified';
await mkdir(output, { recursive: true });
try {
  for (const width of [320, 1280])
    for (const theme of ['light', 'dark'])
      for (const route of routes) {
        const context = await browser.newContext({
          viewport: { width, height: 900 },
          colorScheme: theme,
          reducedMotion: 'reduce',
        });
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', (error) => errors.push(error.message));
        page.on('requestfailed', (request) =>
          errors.push('Request failed: ' + request.url().split('?')[0]),
        );
        page.on('console', (message) => {
          if (message.type() === 'error') errors.push(message.text());
        });
        await page.goto('http://localhost:3017' + route, { waitUntil: 'networkidle' });
        await page.locator('h1').first().waitFor();
        await page.evaluate(() => document.fonts.ready);
        const slug = route === '/' ? 'home' : route.split('/').pop();
        const prefix = `${output}/${slug}-${width}-${theme}`;
        const actualTheme = await page.evaluate(() =>
          document.documentElement.classList.contains('dark') ? 'dark' : 'light',
        );
        if (actualTheme !== theme)
          throw new Error('Theme did not match the requested condition.');
        const overflow = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
        }));
        const axe = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
          .analyze();
        await writeFile(prefix + '-axe.json', JSON.stringify(axe, null, 2));
        await page.screenshot({ path: prefix + '.png', fullPage: true });
        report.push({
          route,
          width,
          theme,
          actualTheme,
          overflow,
          violations: axe.violations.map((v) => ({
            id: v.id,
            impact: v.impact,
            nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })),
          })),
          errors,
        });
        await context.close();
      }
} finally {
  await browser.close();
}
await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
console.log(
  JSON.stringify(
    report.map(({ route, width, theme, overflow, violations, errors }) => ({
      route,
      width,
      theme,
      overflow,
      violations: violations.map((v) => v.id),
      errors,
    })),
    null,
    2,
  ),
);
