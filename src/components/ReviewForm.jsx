const showcases = [
  { label: "Seeded allergy conflict", patientId: "P101", diagnosis: "Acute bacterial pharyngitis", proposedTreatment: "Amoxicillin", story: "The original medicine deliberately conflicts with a synthetic allergy. Watch candidates receive fresh checks; candidate order can vary." },
  { label: "Straightforward review", patientId: "P104", diagnosis: "Synthetic pain review", proposedTreatment: "Acetaminophen", story: "A simpler authored request for demonstrating current evidence and the separate human approval step." },
  { label: "Unsupported request", patientId: "P104", diagnosis: "Synthetic pain review", proposedTreatment: "Unlisted demo medicine", story: "An unsupported medicine should remain incomplete and offer no approval." },
];
export default function ReviewForm({
  patients,
  patient,
  form,
  setForm,
  disabled,
  onSubmit,
  canSubmit,
}) {
  return (
    <form onSubmit={onSubmit} className="panel">
      <h2>1. Review request</h2>
      <p>One clinician request, three specialist checks, then a human decision in a fictional care setting.</p>
      <fieldset className="showcases" disabled={disabled}>
        <legend>Authored showcase scenarios</legend>
        <p className="muted">These requests use deliberately seeded fixtures. Inputs remain editable.</p>
        {showcases.filter((s) => patients.some((p) => p.patientId === s.patientId)).map((scenario) => <button key={scenario.label} className="secondary" type="button" onClick={() => setForm({ patientId: scenario.patientId, diagnosis: scenario.diagnosis, proposedTreatment: scenario.proposedTreatment })}>{scenario.label}</button>)}
        {showcases.find((s) => s.patientId === form.patientId && s.proposedTreatment === form.proposedTreatment) && <p className="scenario-story">{showcases.find((s) => s.patientId === form.patientId && s.proposedTreatment === form.proposedTreatment).story}</p>}
      </fieldset>
      <p className="muted">Browse all authorized synthetic patients below. Other patients are not all rehearsed scenarios.</p>
      <div className="field">
        <label htmlFor="patient">Patient</label>
        <select
          id="patient"
          value={form.patientId}
          disabled={disabled}
          onChange={(e) => setForm({ ...form, patientId: e.target.value })}
        >
          {patients.map((p) => (
            <option key={p.patientId} value={p.patientId}>
              {p.patientId} · {p.name} · {p.age}
            </option>
          ))}
        </select>
      </div>
      {patient && (
        <p className="patient-facts">
          Allergies:{" "}
          {patient.allergies
            .map((a) => `${a.substance} (${a.reaction})`)
            .join(", ") || patient.allergyStatus}
          .<br />
          Current medicines:{" "}
          {patient.medications.map((m) => m.name).join(", ") || "None recorded"}
          .<br />
          Preference: {patient.preference || "None recorded"}.
        </p>
      )}
      <label>
        Working diagnosis
        <input
          required
          maxLength={500}
          disabled={disabled}
          value={form.diagnosis}
          onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
        />
      </label>
      <label>
        Proposed treatment
        <input
          required
          maxLength={500}
          disabled={disabled}
          value={form.proposedTreatment}
          onChange={(e) =>
            setForm({ ...form, proposedTreatment: e.target.value })
          }
        />
      </label>
      <p className="muted">
        The demo checks selected allergies, interactions, policy evidence,
        coverage and follow-up. It does not validate diagnosis or dose.
      </p>
      <button disabled={disabled || !patient || !canSubmit} type="submit">
        Start live review
      </button>
    </form>
  );
}
