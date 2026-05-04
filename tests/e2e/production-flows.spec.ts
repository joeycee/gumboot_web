import { expect, test } from "@playwright/test";
import {
  applyToJobViaApi,
  authenticateViaApi,
  createJobViaApi,
  getAccount,
  getJobApplicationForWorker,
  getJobTypeForTests,
  getTestAddress,
  loginViaUi,
  selectAddressSuggestion,
  setAuthToken,
  uniqueJobTitle,
} from "./helpers";

test.describe("Production Flow Smoke Tests", () => {
  test("plain signup lands on home with a documents warning", async ({ page }) => {
    const unique = String(Date.now()).slice(-6);

    await page.goto("/auth/signup");
    await page.getByTestId("signup-first-name").fill("Jamie");
    await page.getByTestId("signup-last-name").fill("Starter");
    await page.getByTestId("signup-email").fill(`jamie.${unique}@example.com`);
    await page.getByTestId("signup-country-code").fill("+64");
    await page.getByTestId("signup-phone-number").fill(`211${unique}`);
    await page.getByTestId("signup-continue").click();

    await expect(page).toHaveURL(/\/auth\/verify-otp/);
    await page.getByTestId("otp-code-input").fill("123456");
    await page.getByTestId("otp-verify-button").click();

    await expect(page).toHaveURL(/\/\?signup=1&needs_docs=1$/);
    await expect(page.getByText("One More Step Before Applying")).toBeVisible();
    await expect(page.getByText("you need to upload your license/ID proof and selfie before you can apply for jobs", { exact: false })).toBeVisible();
    await expect(page.getByRole("link", { name: "Add documents" })).toBeVisible();
  });

  test("new signup keeps draft on OTP back and returns to the requested page", async ({ page }) => {
    const unique = String(Date.now()).slice(-6);

    await page.goto("/auth/signup?next=%2Fjobs%2Fpost");
    await page.getByTestId("signup-first-name").fill("Casey");
    await page.getByTestId("signup-last-name").fill("Builder");
    await page.getByTestId("signup-email").fill(`casey.${unique}@example.com`);
    await page.getByTestId("signup-country-code").fill("+64");
    await page.getByTestId("signup-phone-number").fill(`210${unique}`);
    await page.getByTestId("signup-continue").click();

    await expect(page).toHaveURL(/\/auth\/verify-otp/);
    await page.getByRole("link", { name: "Go back" }).click();

    await expect(page).toHaveURL(/\/auth\/signup\?next=/);
    await expect(page.getByTestId("signup-first-name")).toHaveValue("Casey");
    await expect(page.getByTestId("signup-last-name")).toHaveValue("Builder");
    await expect(page.getByTestId("signup-email")).toHaveValue(`casey.${unique}@example.com`);
    await expect(page.getByTestId("signup-phone-number")).toHaveValue(`210${unique}`);

    await page.getByTestId("signup-continue").click();
    await expect(page).toHaveURL(/\/auth\/verify-otp/);

    await page.getByTestId("otp-code-input").fill("123456");
    await page.getByTestId("otp-verify-button").click();

    await expect(page).toHaveURL(/\/jobs\/post$/);
    await expect
      .poll(async () => {
        return page.evaluate(() => window.localStorage.getItem("gumboot_token") || "");
      })
      .not.toBe("");
  });

  test("user can log in", async ({ page }) => {
    await loginViaUi(page, getAccount("owner"));
    await expect(page).toHaveURL(/^(?!.*auth\/verify-otp).*/);
    await expect
      .poll(async () => {
        return page.evaluate(() => window.localStorage.getItem("gumboot_token") || "");
      })
      .not.toBe("");
  });

  test("user can post a job", async ({ page, request }) => {
    const ownerSession = await authenticateViaApi(request, getAccount("owner"));
    const jobType = await getJobTypeForTests(request);
    const address = getTestAddress();
    const jobTitle = uniqueJobTitle("Playwright posted job");

    await setAuthToken(page, ownerSession.token);
    await page.goto("/jobs/post");

    await page.getByPlaceholder("e.g. Fix leaking kitchen tap").fill(jobTitle);
    await page
      .getByPlaceholder("Describe exactly what needs to be done. If you will provide anything for this job please state here.")
      .fill("Playwright end-to-end job posting flow.");
    await page.getByRole("button", { name: "Continue" }).click();

    await page.getByText(jobType.name, { exact: true }).click();
    await page.getByRole("button", { name: "Continue" }).click();

    await page.getByPlaceholder("120").fill("180");
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Continue" }).click();

    await page.getByRole("button", { name: "Today" }).click();
    await page.getByRole("button", { name: "Continue" }).click();

    await selectAddressSuggestion(page, address.address);
    await page.getByRole("button", { name: "Continue" }).click();

    await page.getByRole("button", { name: "Post job" }).click();
    await expect(page).toHaveURL(/\/\?posted=1$/);
  });

  test("mobile image upload step does not overflow horizontally", async ({ page, request }) => {
    const ownerSession = await authenticateViaApi(request, getAccount("owner"));
    const jobType = await getJobTypeForTests(request);
    const tinyPng = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wn7Z4kAAAAASUVORK5CYII=",
      "base64"
    );

    await page.setViewportSize({ width: 390, height: 844 });
    await setAuthToken(page, ownerSession.token);
    await page.goto("/jobs/post");

    await page.getByPlaceholder("e.g. Fix leaking kitchen tap").fill(uniqueJobTitle("Playwright mobile upload job"));
    await page
      .getByPlaceholder("Describe exactly what needs to be done. If you will provide anything for this job please state here.")
      .fill("Playwright mobile overflow regression.");
    await page.getByRole("button", { name: "Continue" }).click();

    await page.getByText(jobType.name, { exact: true }).click();
    await page.getByRole("button", { name: "Continue" }).click();

    await page.getByPlaceholder("120").fill("180");
    await page.getByRole("button", { name: "Continue" }).click();

    await page.getByTestId("job-images-input").setInputFiles({
      name: "tiny-upload-preview.png",
      mimeType: "image/png",
      buffer: tinyPng,
    });

    await expect(page.getByLabel("Selected images preview")).toBeVisible();
    await expect(page.getByText("1 image selected", { exact: false })).toBeVisible();
    await expect
      .poll(async () => {
        return page.evaluate(() => {
          const root = document.documentElement;
          return root.scrollWidth - root.clientWidth;
        });
      })
      .toBeLessThanOrEqual(1);
  });

  test("worker can apply for a job", async ({ page, request }) => {
    const ownerSession = await authenticateViaApi(request, getAccount("owner"));
    const workerSession = await authenticateViaApi(request, getAccount("worker"));
    const job = await createJobViaApi(request, ownerSession, {
      title: uniqueJobTitle("Playwright apply job"),
    });

    await setAuthToken(page, workerSession.token);
    await page.goto(`/jobs/${job.id}/apply`);
    await page.getByTestId("apply-offer-amount").fill("145");
    await page.getByTestId("apply-message").fill("Playwright worker application from the browser.");
    await page.getByTestId("apply-send-offer").click();

    await expect(page).toHaveURL(new RegExp(`/jobs/${job.id}\\?applied=1$`));
    await expect(page.getByText("Your application status:", { exact: false })).toBeVisible();
    await expect(page.getByText("Applied", { exact: false })).toBeVisible();
  });

  test("job details page loads for a worker", async ({ page, request }) => {
    const ownerSession = await authenticateViaApi(request, getAccount("owner"));
    const workerSession = await authenticateViaApi(request, getAccount("worker"));
    const job = await createJobViaApi(request, ownerSession, {
      title: uniqueJobTitle("Playwright details job"),
    });

    await setAuthToken(page, workerSession.token);
    await page.goto(`/jobs/${job.id}`);

    await expect(page.getByRole("heading", { name: job.title })).toBeVisible();
    await expect(page.getByText("Posted by", { exact: true })).toBeVisible();
    await expect(page.getByText("The job id field is mandatory.")).not.toBeVisible();
  });

  test("job owner can accept application", async ({ page, request }) => {
    const ownerSession = await authenticateViaApi(request, getAccount("owner"));
    const workerSession = await authenticateViaApi(request, getAccount("worker"));
    const job = await createJobViaApi(request, ownerSession, {
      title: uniqueJobTitle("Playwright accept job"),
    });

    await applyToJobViaApi(request, workerSession, job.id, "Playwright application ready for acceptance.", "155");
    const application = await getJobApplicationForWorker(request, ownerSession.token, job.id, workerSession.userId);

    await setAuthToken(page, ownerSession.token);
    await page.goto(`/jobs/${job.id}`);
    await page.getByTestId(`accept-application-${application.id}`).click();

    await expect(page.getByText("Application accepted.")).toBeVisible();
    await expect(page.getByText("Job accepted")).toBeVisible();
  });

  test("notification click opens correct page", async ({ page, request }) => {
    const ownerSession = await authenticateViaApi(request, getAccount("owner"));
    const workerSession = await authenticateViaApi(request, getAccount("worker"));
    const job = await createJobViaApi(request, ownerSession, {
      title: uniqueJobTitle("Playwright notification job"),
    });

    await applyToJobViaApi(request, workerSession, job.id, "Playwright notification check application.", "165");
    const application = await getJobApplicationForWorker(request, ownerSession.token, job.id, workerSession.userId);

    await setAuthToken(page, ownerSession.token);
    await page.goto("/notifications");
    const row = page.getByRole("link", { name: /Playwright notification check application\./i }).first();
    await expect(row).toBeVisible();
    await row.click();

    await expect(page).toHaveURL(new RegExp(`/jobs/${job.id}/offers/${application.id}$`));
  });
});
