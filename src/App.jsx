import { useEffect, useRef, useState } from "react";
import { getSession, request, signIn, isRunning } from "./api";
import ReviewForm from "./components/ReviewForm";
import ReviewProgress from "./components/ReviewProgress";
import ReviewResult from "./components/ReviewResult";
import StepInspector from "./components/StepInspector";

// Follow this component to understand the screen: sign in, enter a request, watch a run, review it.
export default function App() {
  const [session, setSession] = useState(null),
    [error, setError] = useState("");
  const [patients, setPatients] = useState([]),
    [patient, setPatient] = useState(null);
  const [form, updateForm] = useState({
    patientId: "P101",
    diagnosis: "Acute bacterial pharyngitis",
    proposedTreatment: "Amoxicillin",
  });
  const [run, setRun] = useState(null),
    [events, setEvents] = useState([]),
    [connected, setConnected] = useState(false);
  const [editing, setEditing] = useState(true),
    [busy, setBusy] = useState(false),
    [recent, setRecent] = useState([]);
  const [reportedMedicine, setReportedMedicine] = useState(""),
    [confirmed, setConfirmed] = useState(false);
  const [caseVersion, setCaseVersion] = useState(null),
    [history, setHistory] = useState(null);
  const [savedView, setSavedView] = useState(false);
  const submission = useRef(null);
  useEffect(() => {
    getSession()
      .then(setSession)
      .catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    if (!session?.authenticated) return;
    request("/api/patients")
      .then(setPatients)
      .catch((e) => setError(e.message));
    request("/api/reviews")
      .then(async (rows) => {
        const details = await Promise.all(rows.map(async (row) => {
          try { return { ...row, saved: await request(`/api/reviews/${row.id}`) }; }
          catch { return row; }
        }));
        setRecent(details);
      })
      .catch((e) => setError(e.message));
  }, [session]);
  useEffect(() => {
    if (!session?.authenticated) return;
    let current = true;
    request(`/api/patients/${encodeURIComponent(form.patientId)}`)
      .then((p) => {
        if (current) setPatient(p);
      })
      .catch((e) => {
        if (current) setError(e.message);
      });
    return () => {
      current = false;
    };
  }, [session, form.patientId]);
  useEffect(() => {
    if (!run?.id) return;
    // EventSource reconnects with Last-Event-ID; persisted event ids prevent duplicate rows.
    const stream = new EventSource(`/api/reviews/${run.id}/events`);
    stream.onopen = () => setConnected(true);
    stream.onerror = () => setConnected(false);
    stream.addEventListener("activity", (message) => {
      const event = JSON.parse(message.data);
      setEvents((previous) =>
        previous.some((e) => e.id === event.id)
          ? previous
          : [...previous, event],
      );
    });
    stream.addEventListener("review", (message) => {
      const updated = JSON.parse(message.data);
      setRun(updated);
      if (!isRunning(updated)) {
        stream.close();
        setConnected(false);
      }
    });
    return () => {
      stream.close();
      setConnected(false);
    };
  }, [run?.id]);
  function setForm(next) {
    submission.current = null;
    if (next.patientId !== form.patientId) {
      setPatient(null);
      setRun(null);
      setEvents([]);
      setHistory(null);
      setCaseVersion(null);
    }
    updateForm(next);
  }
  async function act(work) {
    setBusy(true);
    setError("");
    try {
      await work();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function start(event) {
    event.preventDefault();
    await act(async () => {
      // Keep the same key if a network failure makes the presenter retry the same submission.
      submission.current ||= {
        ...form,
        caseId: run?.caseId || null,
        expectedVersion: caseVersion ?? run?.caseVersion ?? null,
        idempotencyKey: crypto.randomUUID(),
      };
      const next = await request("/api/reviews", submission.current);
      setEvents([]);
      setSavedView(false);
      setRun(next);
      setEditing(false);
      setHistory(null);
      setCaseVersion(null);
      submission.current = null;
    });
  }
  async function resume(id) {
    await act(async () => {
      const saved = await request(`/api/reviews/${id}`);
      updateForm({
        patientId: saved.input.patientId,
        diagnosis: saved.input.diagnosis,
        proposedTreatment: saved.input.proposedTreatment,
      });
      setEvents([]);
      setSavedView(true);
      setRun(saved);
      setEditing(false);
      setCaseVersion(null);
      setHistory(null);
    });
  }
  return (
    <main>
      <header>
        <div>
          <h1>Clinical review</h1>
          <p>Multi-agent demonstration · synthetic patients only</p>
        </div>
        {session?.authenticated && (
          <span className="muted">{session.username}</span>
        )}
      </header>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {!session ? (
        <p>Connecting to the demo service…</p>
      ) : !session.authenticated ? (
        <form
          className="panel login"
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            act(async () =>
              setSession(
                await signIn(data.get("username"), data.get("password")),
              ),
            );
          }}
        >
          <h2>Sign in to the local demo</h2>
          <label>
            Username
            <input
              name="username"
              defaultValue="clinician"
              autoComplete="username"
              required
            />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          <button disabled={busy}>Sign in</button>
          <p className="muted">Use the password from your local .env file.</p>
        </form>
      ) : (
        <>
          {editing && (
            <ReviewForm
              patients={patients}
              patient={patient}
              form={form}
              setForm={setForm}
              disabled={busy || isRunning(run)}
              canSubmit={session.canApprove}
              onSubmit={start}
            />
          )}
          {!editing && run && (
            <>
              <p className="run-context" data-run-id={run.id}>{savedView ? "Saved review · original timings and recorded activity" : "Live review · started in this session"} · {new Date(run.createdAt).toLocaleString()}</p>
              <p className="request-line">
                {run.input.patientId} · {run.input.diagnosis} · Requested:{" "}
                {run.input.proposedTreatment}
              </p>
              {isRunning(run) ? (
                <ReviewProgress
                  run={run}
                  events={events}
                  busy={busy}
                  onRefresh={() => act(async () => setRun(await request(`/api/reviews/${run.id}`)))}
                  connected={connected}
                  onCancel={() =>
                    act(async () =>
                      setRun(
                        await request(`/api/reviews/${run.id}/cancel`, {}),
                      ),
                    )
                  }
                />
              ) : (
                <ReviewResult
                  key={run.id}
                  run={run}
                  busy={busy}
                  canApprove={session.canApprove}
                  onApprove={() =>
                    act(async () =>
                      setRun(
                        await request(`/api/reviews/${run.id}/approvals`, {
                          caseVersion: run.caseVersion,
                          proposalRevision: run.revision,
                          snapshotVersion: run.snapshotVersion,
                          attested: true,
                        }),
                      ),
                    )
                  }
                  onEdit={() => {
                    setEditing(true);
                    submission.current = null;
                  }}
                />
              )}
              <StepInspector run={run} events={events} />
              {!isRunning(run) && (
                <details className="panel">
                  <summary>Add later information or view case memory</summary>
                  <p>
                    A confirmed new medication changes the case version and
                    requires a fresh review. Any earlier approval remains a historical decision for the earlier version.
                  </p>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      act(async () => {
                        const h = await request(
                          `/api/cases/${run.caseId}/changes`,
                          {
                            expectedVersion: caseVersion ?? run.caseVersion,
                            medication: reportedMedicine,
                            confirmed,
                          },
                        );
                        setHistory(h);
                        setCaseVersion(h.version);
                        setRun(await request(`/api/reviews/${run.id}`));
                        setReportedMedicine("");
                        setConfirmed(false);
                      });
                    }}
                  >
                    <label>
                      Patient-reported medicine
                      <input
                        value={reportedMedicine}
                        maxLength={200}
                        required
                        onChange={(e) => setReportedMedicine(e.target.value)}
                      />
                    </label>
                    <label className="check">
                      <input
                        type="checkbox"
                        checked={confirmed}
                        onChange={(e) => setConfirmed(e.target.checked)}
                      />
                      Clinician confirmed this report
                    </label>
                    <button disabled={busy || !session.canApprove || !confirmed || !reportedMedicine.trim()}>
                      Save information
                    </button>
                  </form>
                  <button
                    className="secondary"
                    onClick={() =>
                      act(async () =>
                        setHistory(await request(`/api/cases/${run.caseId}`)),
                      )
                    }
                  >
                    View case memory
                  </button>
                  {history && (
                    <>
                      <p>
                        Case version {history.version} · {history.preference}
                      </p>
                      {history.memory.map((m, i) => (
                        <p key={i}>
                          {m.kind}: {m.value} ·{" "}
                          {m.confirmed ? "confirmed" : "unconfirmed"} ·{" "}
                          {m.source}
                        </p>
                      ))}
                    </>
                  )}
                </details>
              )}
            </>
          )}
          {editing && recent.length > 0 && (
            <details className="panel">
              <summary>Open a saved review</summary>
              <p className="muted">
                Saved results retain their original inputs and timings.
              </p>
              {recent.map((r) => (
                <p key={r.id}>
                  <button className="secondary" onClick={() => resume(r.id)}>
                    {r.saved ? `${r.saved.input.patientId} · ${r.saved.input.proposedTreatment} · ${r.saved.result?.readiness?.toLowerCase().replaceAll("_", " ") || r.saved.state.toLowerCase()}` : r.stage} · {new Date(r.created_at).toLocaleString()}
                  </button>
                </p>
              ))}
            </details>
          )}
        </>
      )}
      <footer>
        Demonstration software. No real clinical care. Review all evidence and
        limitations.
      </footer>
    </main>
  );
}
