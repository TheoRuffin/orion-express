import { test as base, expect, devices } from '@playwright/test';
import { mkdir, rm } from 'node:fs/promises';
// A disk-backed profile reflects normal browsing. WebKit's ephemeral context cannot
// commit Blob/File to IndexedDB on this host; the same write succeeds in this profile.
export const test = base.extend({
  context: async ({ playwright, browserName }, use, testInfo) => {
    const profile = testInfo.outputPath('profile'); await mkdir(profile,{recursive:true});
    const context = await playwright[browserName].launchPersistentContext(profile,{
      ...devices['iPhone 13'], headless:true, acceptDownloads:true,
    });
    await use(context); await context.close(); await rm(profile,{recursive:true,force:true});
  },
});
export { expect };
