import { defineConfig } from '@playwright/test';
export default defineConfig({testDir:'tests',testMatch:'ui.spec.ts',use:{browserName:'chromium',headless:true,viewport:{width:1280,height:900}},reporter:[['json',{outputFile:'delivery/ui-results.json'}]],workers:1});
