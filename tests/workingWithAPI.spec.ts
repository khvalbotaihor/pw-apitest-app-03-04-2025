import { test, expect } from "@playwright/test";
import tags from '../test-data/tags.json'
import articles from '../test-data/articles.json'
import { request } from "http";

test.beforeEach(async ({ page }) => {
  //await page.route("https://conduit-api.bondaracademy.com/api/tags",async route => {

  await page.route("*/**/api/tags",async route => {
    await route.fulfill({
        body: JSON.stringify(tags),
      });
    }
  );

  await page.goto("https://conduit.bondaracademy.com/");
  await page.waitForLoadState("networkidle");

  await page.getByText("Sign in").click();
  await page.getByRole('textbox', { name: 'Email' }).fill('ihor@test.com');
  await page.getByRole('textbox', { name: "Password" }).fill('ihor_test');
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForLoadState("networkidle");

});

test("has title", async ({ page }) => {
  await expect(page.locator(".navbar-brand")).toHaveText("conduit");
});

test("check updated title and description", async ({ page }) => {
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

  await page.reload();

  await expect(page.locator("app-article-list h1").first()).toContainText("This is a test title");
  await expect(page.locator("app-article-list p").first()).toContainText("This is a test description");
});

test("create article and delete article", async ({ page, request }) => {
  const loginResponse = await request.post("https://conduit-api.bondaracademy.com/api/users/login", {
    data: {
      "user":{"email":"ihor@test.com","password":"ihor_test"}
    }
  });
  const loginResponseJson = await loginResponse.json();
  const token = loginResponseJson.user.token;

  // await page.addInitScript((token) => {
  //   localStorage.setItem('jwtToken', token);
  // }, loginResponseJson.user.token);
  // await page.reload();

  const newArticle = await request.post("https://conduit-api.bondaracademy.com/api/articles",{
    data: {
      article: {
        title: "Test Title",  
        description: "Test Description",
        body: "Test Body",    
        tagList: []
      }
    },
    headers: {
      Authorization: `Token ${token}`,
    }
  }); 

  const newArticleResponse = await newArticle.json();
  expect(newArticle.status()).toBe(201);
  const articleId = newArticleResponse.article.slug;

  await page.getByText(" Global Feed ").click();
  await page.getByText("Test Title").click();
  await page.getByRole("button", { name: "Delete Article" }).first().click();
  await page.getByText(" Global Feed ").click();
  await expect(page.locator("app-article-list h1").first()).not.toContainText("Test Title");
  await expect(page.getByText("Test Title")).not.toBeVisible();



  // const r = await request.delete(`https://conduit-api.bondaracademy.com/api/articles/${articleId}`, {
  //   headers: {
  //     Authorization: `Token ${token}`,
  //   }
  // })
  // expect(r.status()).toBe(204);
});