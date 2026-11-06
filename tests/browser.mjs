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
let page;
const apiFailures = [];
try {
  assert.ok(process.env.DEMO_LOGIN_PASSWORD, "DEMO_LOGIN_PASSWORD must be loaded without printing it");
  page = await browser.newPage({ viewport: {width:1440,height:900} });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => {
    const path = new URL(response.url()).pathname;
    if (path.startsWith("/api/") && response.status() >= 400) apiFailures.push({path,status:response.status()});
  });
  await page.goto(process.env.DEMO_UI_URL || "http://localhost:3000");
  await page
    .getByRole("heading", { name: "Clinical review" })
    .waitFor({ timeout: 5000 });
  await page.getByLabel("Password").fill(process.env.DEMO_LOGIN_PASSWORD);
  const loginResponse = page.waitForResponse((response) => new URL(response.url()).pathname === "/api/login" && response.request().method() === "POST");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  assert.equal((await loginResponse).status(), 200, "Login must succeed before waiting for the patient catalog");
  await page.getByRole("heading", {name:"1. Review request",exact:true}).waitFor();
  await page.getByRole("button", {name:"Seeded allergy conflict",exact:true}).waitFor({timeout:45000});
  assert.equal(await page.getByRole("alert").count(),0,"Initial authorized patient catalog and preview must load without errors");
  await page.getByRole("button", {name:"Seeded allergy conflict",exact:true}).click();
  await page.getByRole("button", {name:"Start live review",exact:true}).click();
  await page.locator(".result h2").waitFor({timeout:110000});
  const runId = await page.locator(".run-context").getAttribute("data-run-id");
  const liveRun = await page.evaluate(async (id) => (await fetch(`/api/reviews/${id}`)).json(), runId);
  assert.ok(liveRun.result.attempts?.length > 0, "Real run has typed decision history");
  const firstAttempt = page.locator(".attempts > li").first();
  await firstAttempt.getByText("Amoxicillin", {exact:true}).waitFor();
  assert.equal(await firstAttempt.getAttribute("data-disposition"), "REJECTED", "Seeded original allergy conflict is visible");
  assert.ok(await firstAttempt.locator(".source-observation").count() > 0, "Original finding has an observation source");
  if (liveRun.result.readiness === "READY_FOR_CLINICIAN_REVIEW") {
    const selected = liveRun.result.attempts.find((a) => a.disposition === "SELECTED");
    assert.ok(selected, "Ready has a selected attempt");
    for (const kind of ["SAFETY", "GUIDANCE", "COVERAGE", "FOLLOWUP"]) {
      const check = selected.checks.find((c) => c.kind === kind);
      assert.equal(check?.status, "COMPLETED", `${kind} completed on current attempt`);
    }
    const currentCoverage = liveRun.result.observations.filter((o) => o.proposalRevision === selected.revision && o.checkKind === "COVERAGE");
    assert.ok(currentCoverage.length > 0);
    assert.ok(currentCoverage.every((o) => o.treatment === selected.treatment), "Coverage belongs to the selected treatment");
    assert.ok(await page.getByRole("button", {name:"Approve draft",exact:true}).isDisabled(), "Attestation is required");
  } else {
    assert.equal(await page.getByRole("button", {name:"Approve draft",exact:true}).count(), 0);
  }
  await page.screenshot({path:"../tmp/live-decision-story-desktop.png",fullPage:false});
  await page.setViewportSize({width:1024,height:768});
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.screenshot({path:"../tmp/live-decision-story-laptop.png",fullPage:false});
  await page.getByRole("button", {name:"Edit and re-run",exact:true}).click();
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
  assert.ok(await page.getByRole("button", {name:"Approve draft",exact:true}).isDisabled());
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
  assert.equal(await page.getByRole("button", {name:"Approve draft",exact:true}).count(), 0);
  assert.deepEqual(errors, []);
  assert.deepEqual(apiFailures, []);
  console.log(
    "PASS live browser: login, changed input, incomplete guard, event inspector, mobile, real model outcome, clinician approval and stale follow-up.",
  );
} catch (error) {
  if (page) {
    await page.screenshot({path:"../tmp/live-browser-failure.png",fullPage:false});
    console.error(JSON.stringify({apiFailures,alerts:await page.getByRole("alert").allTextContents(),failureCapture:"tmp/live-browser-failure.png"}));
  }
  throw error;
} finally {
  await browser.close();
}
