import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;
/** The professional edition is served beside the complete one, and only its own tests look at it. */
const PRO_PORT = 4174;
const PRO_TESTS = /edition\.spec\.ts$/;
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
  // A runner under load can stall one step of a test; a retry keeps that from blocking a deploy, and the report still
  // names the test as flaky, so it is not hidden.
  retries: process.env['CI'] ? 2 : 0,
  reporter: process.env['CI'] ? 'line' : 'list',
  use: { baseURL: `http://localhost:${PORT}`, trace: 'off' },
  projects: [
    ...names.map((name) => ({ name, use: all[name], testIgnore: PRO_TESTS })),
    {
      name: 'pro',
      use: { ...devices['Desktop Chrome'], baseURL: `http://localhost:${PRO_PORT}` },
      testMatch: PRO_TESTS,
    },
  ],
  webServer: [
    { dir: 'fixture-app', port: PORT },
    { dir: 'fixture-app-pro', port: PRO_PORT },
  ].map(({ dir, port }) => ({
    command: `deno run --config ../../deno.json --allow-net --allow-read jsr:@std/http@1.1.4/file-server ../../generated/${dir} --port ${port}`,
    port,
    reuseExistingServer: !process.env['CI'],
  })),
});
