import { test as base, expect, devices } from '@playwright/test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
// A disk-backed profile reflects normal browsing. WebKit's ephemeral context cannot
// commit Blob/File to IndexedDB on this host; the same write succeeds in this profile.
export const test = base.extend({
  context: async ({ playwright, browserName }, use) => {
    // ASCII path also works with WebKit GTK on runners using the C locale.
    const profile = await mkdtemp(join(tmpdir(),'orion-profile-'));
    const context = await playwright[browserName].launchPersistentContext(profile,{
      ...devices['iPhone 13'], headless:true, acceptDownloads:true,
    });
    try { await use(context); } finally { await context.close(); await rm(profile,{recursive:true,force:true}); }
  },
});
export { expect };
