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
