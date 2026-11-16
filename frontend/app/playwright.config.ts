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
  // A runner under load can stall one step of a test; a retry keeps that from blocking a deploy, and the report still
  // names the test as flaky, so it is not hidden.
  retries: process.env['CI'] ? 2 : 0,
  reporter: process.env['CI'] ? 'line' : 'list',
  use: { baseURL: `http://localhost:${PORT}`, trace: 'off' },
  // A timing test is only worth something with the machine to itself, so it runs after every other project is done.
  projects: [
    ...names.map((name) => ({ name, use: all[name], testIgnore: /performance/ })),
    ...names.map((name) => ({
      name: `${name}-performance`,
      use: all[name],
      testMatch: /performance/,
      dependencies: names,
    })),
  ],
  webServer: {
    command: `deno run --config ../../deno.json --allow-net --allow-read jsr:@std/http@1.1.4/file-server ../../generated/fixture-app --port ${PORT}`,
    port: PORT,
    reuseExistingServer: !process.env['CI'],
  },
});
