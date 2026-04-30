import { defineConfig, devices, ReporterDescription } from "@playwright/test";
import * as dotenv from "dotenv";

dotenv.config();

const slackReporter: ReporterDescription = [
  "./node_modules/playwright-slack-report/dist/src/SlackReporter.js",
  {
    slackOAuthToken: process.env.SLACK_BOT_TOKEN,
    channels: [process.env.SLACK_CHANNEL_ID ?? ""],
    sendResults: "always",
    maxNumberOfFailuresToShow: 0,
    meta: [
      {
        key: ":essential-addons-logo: E2E Automation - Test Results",
        value: process.env.PAGES_URL
          ? `🖥️ <${process.env.PAGES_URL}|View Results!>`
          : "Local run",
      },
    ],
  },
];

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 1,

  reporter: [
    process.env.CI ? ["github"] : ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ...(process.env.SLACK_BOT_TOKEN ? [slackReporter] : []),
  ],

  expect: {
    toHaveScreenshot: {
      maxDiffPixels: 150,
      animations: "disabled",
      scale: "css",
    },
  },

  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:8888",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  projects: [
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "playwright/.auth/admin.json",
      },
      dependencies: ["setup"],
    },
  ],

  outputDir: "test-results",
});
