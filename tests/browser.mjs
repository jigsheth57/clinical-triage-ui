import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
await mkdir("../tmp", { recursive: true });
const browser = await chromium.launch({
  executablePath:
    process.env.CHROME_PATH ||
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});
try {
  const page = await browser.newPage();
  await page.goto("http://localhost:3000");
  await page
    .getByRole("heading", { name: "Clinical review" })
    .waitFor({ timeout: 5000 });
  await page.getByLabel("Password").fill(process.env.DEMO_LOGIN_PASSWORD);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.getByLabel("Patient", { exact: true }).selectOption("P104");
  await page.getByLabel("Working diagnosis").fill("Synthetic pain review");
  await page.getByLabel("Proposed treatment").fill("Unlisted demo medicine");
  await page.getByRole("button", { name: "Start live review" }).click();
  await page
    .getByText("Checks incomplete", { exact: true })
    .waitFor({ timeout: 110000 });
  assert.equal(
    await page.getByRole("button", { name: "Approve draft" }).count(),
    0,
  );
  await page.getByText("Inspect this step", { exact: true }).click();
  await page.getByRole("heading", { name: "Activity and timing" }).waitFor();
  assert.ok(
    (await page.getByText("getPatientSnapshot", { exact: false }).count()) > 0,
  );
  await page.screenshot({
    path: "../tmp/live-ui-desktop.png",
    fullPage: false,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await page.screenshot({ path: "../tmp/live-ui-mobile.png", fullPage: false });
  await page.getByText("Inspect this step", { exact: true }).click();
  await page.getByRole("button", { name: "Edit and re-run" }).click();
  await page.getByLabel("Proposed treatment").fill("Acetaminophen");
  await page.getByRole("button", { name: "Start live review" }).click();
  await page
    .getByRole("heading", {
      name: "Draft ready for clinician review",
      exact: true,
    })
    .waitFor({ timeout: 110000 });
  await page
    .getByLabel(
      "I reviewed the evidence and limitations of this synthetic draft.",
    )
    .check();
  await page
    .getByRole("button", { name: "Approve draft", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Draft approved by clinician" })
    .waitFor();
  await page
    .getByText("Add later information or view case memory", { exact: true })
    .click();
  await page.getByLabel("Patient-reported medicine").fill("Apixaban");
  await page.getByLabel("Clinician confirmed this report").check();
  await page.getByRole("button", { name: "Save information" }).click();
  await page
    .getByRole("heading", { name: "This review is out of date" })
    .waitFor();
  console.log(
    "PASS live browser: login, changed input, incomplete guard, event inspector, mobile, real model outcome, clinician approval and stale follow-up.",
  );
} finally {
  await browser.close();
}
