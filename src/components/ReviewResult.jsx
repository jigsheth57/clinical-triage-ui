import { useState } from "react";
import { seconds } from "../api";
const labels = {
  BLOCKED: "Treatment blocked",
  REVIEW_REQUIRED: "Clinician review required",
  INCOMPLETE: "Checks incomplete",
  READY_FOR_CLINICIAN_REVIEW: "Draft ready for clinician review",
};
export default function ReviewResult({ run, canApprove, onApprove, onEdit }) {
  const [attested, setAttested] = useState(false);
  const result = run.result;
  return (
    <section className="panel" aria-live="polite">
      <p className="eyebrow">
        3. Review outcome ·{" "}
        {result ? seconds(result.durationMs) : run.state.toLowerCase()}
      </p>
      <h2>
        {run.stale
          ? "This review is out of date"
          : run.approved
            ? "Draft approved by clinician"
            : labels[result?.readiness] || run.stage}
      </h2>
      {result && (
        <>
          <p>
            <strong>Reviewed treatment:</strong> {result.selectedTreatment}
          </p>
          <p>{result.summary}</p>
          {result.findings.map((f, i) => (
            <p className="finding" key={i}>
              {f.message}
            </p>
          ))}
          <details>
            <summary>Specialist assessments and sources</summary>
            {result.reviews.map((r, i) => (
              <article key={i}>
                <h3>
                  {r.agent} · revision {r.revision}
                </h3>
                <p>{r.summary}</p>
              </article>
            ))}
            {result.evidence.map((e) => (
              <article id={`source-${e.id}`} key={e.id}>
                <h3>{e.title}</h3>
                <p className="muted">
                  {e.id} · {e.version} · {e.section}
                </p>
                <p>{e.text}</p>
              </article>
            ))}
          </details>
        </>
      )}
      {run.stale && (
        <p>
          Patient information or the case version changed. Start a fresh review
          before approving.
        </p>
      )}
      {canApprove &&
        !run.stale &&
        !run.approved &&
        result?.readiness === "READY_FOR_CLINICIAN_REVIEW" && (
          <div className="approval">
            <label className="check">
              <input
                type="checkbox"
                checked={attested}
                onChange={(e) => setAttested(e.target.checked)}
              />
              I reviewed the evidence and limitations of this synthetic draft.
            </label>
            <button disabled={!attested} onClick={onApprove}>
              Approve draft
            </button>
          </div>
        )}
      <button className="secondary" onClick={onEdit}>
        Edit and re-run
      </button>
      <p className="muted">
        Approval records a demo decision. No prescription, booking or patient
        message is sent.
      </p>
    </section>
  );
}
