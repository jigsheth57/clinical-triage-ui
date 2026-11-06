import { seconds } from "../api";
export default function StepInspector({ run, events }) {
  return (
    <details className="panel inspector">
      <summary>Inspect this step</summary>
      <h2>Activity and timing</h2>
      <p className="muted">
        Recorded tool calls, handoffs and model summaries. Timings can overlap;
        they do not add up to total elapsed time. Private model reasoning is not
        displayed.
      </p>
      <p className="muted">
        Run {run.id}
        <br />
        Case version {run.caseVersion} · proposal revision {run.revision} ·{" "}
        {run.snapshotVersion || "Record pending"}
      </p>
      <ol className="events">
        {events.map((e) => (
          <li key={e.id}>
            <span className="muted">
              {new Date(e.occurredAt).toLocaleTimeString()} · {e.kind}{" "}
              {e.details.agent && `· ${e.details.agent}`}
            </span>
            <br />
            {e.message}
            {e.details.operation && <code>{e.details.operation}</code>}
            {e.durationMs > 0 && (
              <span className="timing">{seconds(e.durationMs)}</span>
            )}
          </li>
        ))}
      </ol>
      {run.result?.reviews
        .filter((r) => r.modelUsage)
        .map((r, i) => (
          <p key={i}>
            {r.agent}: {r.modelUsage.model} · {seconds(r.modelUsage.durationMs)}{" "}
            · {r.modelUsage.inputTokens ?? "?"} input /{" "}
            {r.modelUsage.outputTokens ?? "?"} output tokens
          </p>
        ))}
    </details>
  );
}
