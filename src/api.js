// Session cookies stay in the browser. Every write also carries Spring's CSRF token.
let session;
let pendingSession;
export function getSession() {
  // React may load the screen twice in development. Share the first request so two
  // anonymous sessions cannot race to install different cookies and CSRF tokens.
  pendingSession ||= request("/api/session")
    .then((value) => {
      session = value;
      return value;
    })
    .finally(() => {
      pendingSession = null;
    });
  return pendingSession;
}
export async function request(path, body, form = false) {
  const headers = {};
  if (body !== undefined) {
    headers[session.csrfHeader] = session.csrfToken;
    headers["Content-Type"] = form
      ? "application/x-www-form-urlencoded"
      : "application/json";
  }
  const response = await fetch(path, {
    credentials: "same-origin",
    headers,
    method: body === undefined ? "GET" : "POST",
    body:
      body === undefined
        ? undefined
        : form
          ? new URLSearchParams(body)
          : JSON.stringify(body),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      data.error ||
        data.message ||
        `Request failed (${response.status}). Refresh and retry.`,
    );
  }
  return response.status === 204 ? null : response.json();
}
export async function signIn(username, password) {
  await request("/api/login", { username, password }, true);
  return getSession(); // Signing in rotates the session and CSRF token.
}
export const isRunning = (run) =>
  run && ["QUEUED", "RUNNING"].includes(run.state);
export const seconds = (ms) => `${(ms / 1000).toFixed(1)} s`;
