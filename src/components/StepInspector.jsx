import { seconds } from "../api";
export default function StepInspector({ run, events }) {
  const consultation = events.find((e) => e.kind === "A2A" && e.durationMs > 0);
  const tool = events.find((e) => e.kind === "MCP" && e.durationMs > 0);
  const model = run.result?.reviews?.find((r) => r.modelUsage);
  const retrievedSource = run.result?.reviews?.find((r) => r.agent === "guidance")?.evidence?.[0];
  const source = retrievedSource || run.result?.evidence?.find((e) => e.section);
  return (
    <>
    {(consultation || tool || model || source) && <section className="panel technical-overview">
      <h2>What ran</h2>
      <p className="muted">Examples from this review's recorded activity. Expand the inspector for the full sequence.</p>
      <dl>
        {consultation && <div><dt>Specialist consultation · A2A</dt><dd>{consultation.details?.agent} · {seconds(consultation.durationMs)}</dd></div>}
        {tool && <div><dt>Tool call · MCP</dt><dd>{tool.details?.operation} · {seconds(tool.durationMs)}</dd></div>}
        {model && <div><dt>Model operation</dt><dd>{model.agent} · {model.modelUsage.model} · {seconds(model.modelUsage.durationMs)}</dd></div>}
        {source && <div><dt>{retrievedSource ? "Retrieved guidance source" : "Evidence source"}</dt><dd>{source.title} · {source.section} · {source.version}</dd></div>}
      </dl>
    </section>}
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
              {e.details?.agent && `· ${e.details?.agent}`}
            </span>
            <br />
            {e.message}
            {e.details?.operation && <code>{e.details.operation}</code>}
            {(e.details?.candidate || e.details?.revision) && <p className="muted">{e.details.candidate}{e.details.revision ? ` · revision ${e.details.revision}` : ""}</p>}
            {e.durationMs > 0 && (
              <span className="timing">{seconds(e.durationMs)}</span>
            )}
          </li>
        ))}
      </ol>
      {run.result?.reviews
        ?.filter((r) => r.modelUsage)
        .map((r, i) => (
          <p key={i}>
            {r.agent}: {r.modelUsage.model} · {seconds(r.modelUsage.durationMs)}{" "}
            · {r.modelUsage.inputTokens ?? "?"} input /{" "}
            {r.modelUsage.outputTokens ?? "?"} output tokens
          </p>
        ))}
    </details>
    </>
  );
}
