import { useState } from "react";
import { seconds } from "../api";
const labels = {
  BLOCKED: "Treatment blocked",
  REVIEW_REQUIRED: "Clinician review required",
  INCOMPLETE: "Checks incomplete",
  READY_FOR_CLINICIAN_REVIEW: "Draft ready for clinician review",
};
const words = (value) => String(value || "Unknown").toLowerCase().replaceAll("_", " ");

function Source({ observation }) {
  const source = observation.source;
  if (!source) return null;
  return (
    <details className="source-observation" data-observation-id={observation.observationId}>
      <summary>{source.title} · {observation.treatment} · revision {observation.proposalRevision}</summary>
      <p className="muted">{observation.sourceId} · {observation.sourceVersion} · {source.section}</p>
      <p>{source.text}</p>
    </details>
  );
}

export default function ReviewResult({ run, canApprove, onApprove, onEdit, busy }) {
  const [attested, setAttested] = useState(false);
  const result = run.result;
  const attempts = result?.attempts || [];
  const observations = result?.observations || [];
  return (
    <section className="panel result">
      <p className="eyebrow">3. Review outcome · {result ? seconds(result.durationMs) : words(run.state)}</p>
      <h2 aria-live="polite">
        {run.stale ? "This review is out of date" : run.approved ? "Draft approved by clinician" : labels[result?.readiness] || run.stage}
      </h2>
      {result && <>
        <dl className="draft-facts">
          <div><dt>Original request</dt><dd>{result.originalTreatment || run.input.proposedTreatment}</dd></div>
          <div><dt>Current draft</dt><dd>{result.selectedTreatment}</dd></div>
        </dl>
        <p className="outcome-summary">{result.summary}</p>
        {attempts.length > 0 ? <div className="decision-story">
          <h3>How the draft changed</h3>
          <ol className="attempts">
            {attempts.map((attempt) => <li key={attempt.revision} data-revision={attempt.revision} data-disposition={attempt.disposition}>
              <div className="attempt-title"><strong>{attempt.treatment}</strong><span className="status-label">{words(attempt.disposition)} · revision {attempt.revision}</span></div>
              <p>{attempt.reason}</p>
              <ul className="check-list" aria-label={`Checks for ${attempt.treatment}, revision ${attempt.revision}`}>
                {(attempt.checks || []).map((check) => <li key={check.kind} data-check={check.kind}>
                  <strong>{words(check.kind)}:</strong> {words(check.status)} · {words(check.outcomeCode)}
                  {(check.evidenceObservationIds || []).map((id) => {
                    const observation = observations.find((o) => o.observationId === id);
                    return observation ? <Source key={id} observation={observation} /> : null;
                  })}
                </li>)}
              </ul>
            </li>)}
          </ol>
        </div> : <p className="muted">{result.originalTreatment == null && result.nextAction == null ? "This saved review predates the decision-history format. Its original assessments remain available below." : "No completed candidate decision history was recorded for this run."}</p>}
        {(result.findings || []).map((f, i) => <p className="finding" key={i}>{f.message}</p>)}
        <div className="next-action">
          <h3>Human next action</h3>
          <p>{run.stale ? "New information invalidated this review. Edit and re-run so every required check uses the current case." : run.approved ? "The clinician's attestation is recorded for this version. New information requires another review." : result.nextAction || (result.readiness === "READY_FOR_CLINICIAN_REVIEW" ? "Review the current draft and its evidence, then explicitly attest before approving." : "Inspect the incomplete or blocked checks. Edit the request or restore the unavailable service and re-run.")}</p>
          {run.stale && run.approved && <p>Earlier approval remains historical; it does not approve the changed case.</p>}
        </div>
        <details className="current-evidence">
          <summary>Current draft evidence · {result.selectedTreatment}</summary>
          <p className="muted">Selected revision checks and shared guidance passages. Earlier candidate observations stay with their revision above.</p>
          {(result.evidence || []).map((e, i) => <article key={`${e.id}-${i}`}>
            <h3>{e.title}</h3><p className="muted">{e.id} · {e.version} · {e.section}</p><p>{e.text}</p>
          </article>)}
        </details>
        <details className="specialist-assessments">
          <summary>Specialist commentary by revision</summary>
          <p className="muted">Supplementary model explanations. The outcome and next action above come from application checks.</p>
          {(result.reviews || []).map((r, i) => <article key={i}>
            <h3>{r.agent} · revision {r.revision}{r.revision !== run.revision ? " · historical" : ""}</h3>
            <p>{r.summary}</p>
          </article>)}
        </details>
      </>}
      {!result && <p>This run has no completed draft. Edit and re-run to request fresh checks.</p>}
      {run.stale && <p>Patient information or the case version changed. Start a fresh review before approving.</p>}
      {canApprove && !run.stale && !run.approved && result?.readiness === "READY_FOR_CLINICIAN_REVIEW" && <div className="approval">
        <label className="check"><input type="checkbox" checked={attested} disabled={busy} onChange={(e) => setAttested(e.target.checked)} />I reviewed the evidence and limitations of this synthetic draft.</label>
        <button disabled={!attested || busy} onClick={onApprove}>Approve draft</button>
      </div>}
      <button className="secondary" disabled={busy} onClick={onEdit}>Edit and re-run</button>
      <p className="muted">Approval records a demo decision. No prescription, booking or patient message is sent.</p>
    </section>
  );
}
