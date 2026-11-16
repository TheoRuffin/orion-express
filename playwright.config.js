import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir:'tests/mobile', fullyParallel:false, workers:1,
  use:{...devices['iPhone 13'], browserName:'webkit', acceptDownloads:true},
  projects:[{name:'webkit-iphone',use:{browserName:'webkit'}},{name:'chromium-mobile',use:{browserName:'chromium'}}],
  reporter:'list', timeout:30000,
});
