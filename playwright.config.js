module.exports = {
  testDir: "./tests",
  timeout: 60000,
  reporter: "list",
  use: {
    baseURL: process.env.BASE_URL || "http://127.0.0.1:4173/",
    viewport: { width: 1440, height: 900 },
    screenshot: "only-on-failure",
    trace: "retain-on-failure"
  },
  webServer: process.env.PLAYWRIGHT_SKIP_WEB_SERVER
    ? undefined
    : {
        command: "npm run dev",
        url: process.env.BASE_URL || "http://127.0.0.1:4173/",
        reuseExistingServer: true,
        timeout: 10000
      }
};
