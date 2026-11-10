import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;
const all = {
  chromium: devices['Desktop Chrome'],
  firefox: devices['Desktop Firefox'],
  webkit: devices['Desktop Safari'],
};
// A machine with fewer browsers installed asks for the ones it has, for example APP_BROWSERS=chromium.
const names = (process.env['APP_BROWSERS'] ?? 'chromium,firefox,webkit').split(',') as (keyof typeof all)[];

export default defineConfig({
  testDir: 'tests',
  fullyParallel: true,
  forbidOnly: Boolean(process.env['CI']),
  reporter: process.env['CI'] ? 'line' : 'list',
  use: { baseURL: `http://localhost:${PORT}`, trace: 'off' },
  projects: names.map((name) => ({ name, use: all[name] })),
  webServer: {
    command: `deno run --allow-net --allow-read jsr:@std/http@1.1.4/file-server ../../generated/fixture-app --port ${PORT}`,
    port: PORT,
    reuseExistingServer: !process.env['CI'],
  },
});
