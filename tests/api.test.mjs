import test from "node:test";
import assert from "node:assert/strict";
import { getSession, signIn } from "../src/api.js";
test("share the initial session request, then refresh it after signing in", async () => {
  const calls = [];
  globalThis.fetch = async (path, options) => {
    calls.push({ path, options });
    await new Promise((resolve) => setImmediate(resolve));
    return {
      ok: true,
      status: 200,
      json: async () => ({
        authenticated: true,
        csrfHeader: "X-CSRF-TOKEN",
        csrfToken: "test-token",
      }),
    };
  };
  await Promise.all([getSession(), getSession()]);
  assert.equal(
    calls.length,
    1,
    "Concurrent initial loads must not create competing sessions",
  );
  await signIn("clinician", "test-only");
  assert.equal(calls.length, 3);
  assert.equal(calls[1].options.headers["X-CSRF-TOKEN"], "test-token");
  assert.equal(
    calls[2].path,
    "/api/session",
    "Refresh the rotated session after login",
  );
});
