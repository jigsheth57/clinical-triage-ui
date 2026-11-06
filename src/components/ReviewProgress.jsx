export default function ReviewProgress({ run, connected, onCancel }) {
  return (
    <section className="panel" aria-live="polite">
      <p className="eyebrow">
        2. Checks in progress ·{" "}
        {connected ? "Connected to live events" : "Reconnecting to service"}
      </p>
      <h2>{run.stage}</h2>
      <p>
        The coordinator requires the checks. Specialists retrieve evidence and
        return their assessments.
      </p>
      <button className="secondary" onClick={onCancel}>
        Cancel review
      </button>
    </section>
  );
}
