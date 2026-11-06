const visibleKinds = new Set(["RECORD", "A2A", "HANDOFF", "ASSESSMENT", "ERROR"]);
export default function ReviewProgress({ run, events, connected, onCancel, onRefresh, busy }) {
  const milestones = events.filter((event) => visibleKinds.has(event.kind));
  return (
    <section className="panel">
      <p className="eyebrow">2. Checks in progress · {connected ? "Connected to live events" : "Reconnecting to service"}</p>
      <h2 aria-live="polite">{run.stage}</h2>
      <p>Each changed treatment gets a fresh safety check. Only completed checks can support the final draft.</p>
      <ol className="milestones" aria-label="Recorded review milestones">
        {milestones.map((event) => <li key={event.id}>
          {event.message}
          {(event.details?.candidate || event.details?.revision) && <span className="muted"> · {event.details.candidate}{event.details.revision ? ` · revision ${event.details.revision}` : ""}</span>}
        </li>)}
      </ol>
      {!connected && <p className="muted">The event connection will retry automatically. You can also refresh the recorded status; this does not start another review.</p>}
      {!connected && <button className="secondary" disabled={busy} onClick={onRefresh}>Refresh review status</button>}
      <button className="secondary" disabled={busy} onClick={onCancel}>Cancel review</button>
    </section>
  );
}
