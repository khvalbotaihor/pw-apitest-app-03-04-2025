import { test, expect } from "@playwright/test";
import tags from '../test-data/tags.json'
import articles from '../test-data/articles.json'

test.beforeEach(async ({ page }) => {
  //await page.route("https://conduit-api.bondaracademy.com/api/tags",async route => {

  await page.route("*/**/api/tags",async route => {
    await route.fulfill({
        body: JSON.stringify(tags),
      });
    }
  );

  //await page.route("https://conduit-api.bondaracademy.com/api/articles?limit=10&offset=0", async route => {
  //await page.route("*/**/api/articles?limit=10&offset=0", async route => {

  await page.route("*/**/api/articles*", async route => {

    const response = await route.fetch();
    const responseBody = await response.json();
    responseBody.articles[0].title = 'This is a test title';
    responseBody.articles[0].description = 'This is a test description';

    await route.fulfill({
      body: JSON.stringify(responseBody),
    });
  });

  await page.goto("https://conduit.bondaracademy.com/");
  await page.waitForLoadState("networkidle");
});

test("has title", async ({ page }) => {
  await expect(page.locator(".navbar-brand")).toHaveText("conduit");
});

test("check updated title and description", async ({ page }) => {
  await expect(page.locator("app-article-list h1").first()).toContainText("This is a test title");
  await expect(page.locator("app-article-list p").first()).toContainText("This is a test description");
});
