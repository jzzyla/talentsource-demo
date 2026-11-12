import {defineConfig, devices} from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: true,
  workers: 2,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: 'http://127.0.0.1:8091',
    // Use installed Chrome locally; CI uses Playwright's Chromium.
    channel: process.env.CI ? undefined : 'chrome',
    trace: 'retain-on-failure',
  },
  projects: [
    {name:'desktop', use:{...devices['Desktop Chrome']}},
    {name:'mobile', use:{...devices['Desktop Chrome'], viewport:{width:390,height:844}}},
  ],
  webServer: {
    command:'python3 -m http.server 8091 --bind 127.0.0.1',
    url:'http://127.0.0.1:8091',
    reuseExistingServer:false,
  },
});
