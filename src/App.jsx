import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Activity, ShieldAlert, CheckCircle, Loader2, Pill } from 'lucide-react'

export default function App() {
  const [formData, setFormData] = useState({
    patientId: 'P101',
    diagnosis: 'Acute Bacterial Pharyngitis',
    proposedPrescription: 'Amoxicillin 500mg TID'
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/triage/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`)
      }

      const text = await response.text()
      setResult(text)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans text-slate-900">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <header className="flex items-center space-x-3 pb-4 border-b border-slate-200">
          <Activity className="w-8 h-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-slate-800">Clinical Triage & Safety Dashboard</h1>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Left Column: Input Form */}
          <div className="md:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-fit">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Pill className="w-5 h-5 mr-2 text-slate-500" />
              New Prescription
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Patient ID</label>
                <input
                  type="text"
                  name="patientId"
                  value={formData.patientId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Diagnosis</label>
                <input
                  type="text"
                  name="diagnosis"
                  value={formData.diagnosis}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Proposed Prescription</label>
                <input
                  type="text"
                  name="proposedPrescription"
                  value={formData.proposedPrescription}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors flex justify-center items-center"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Run Safety Evaluation'}
              </button>
            </form>
          </div>

          {/* Right Column: Multi-Agent Analysis Result */}
          <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100 min-h-[400px]">
            <h2 className="text-lg font-semibold mb-4 text-slate-800">Multi-Agent Safety Assessment</h2>

            {loading && (
              <div className="flex flex-col items-center justify-center h-64 text-slate-500 space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <p className="animate-pulse">Delegating to Pharmacist Agent via A2A...</p>
                <p className="text-sm opacity-70">Cross-referencing EHR over MCP Protocol...</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 text-red-700 p-4 rounded-md flex items-start">
                <ShieldAlert className="w-5 h-5 mr-2 shrink-0 mt-0.5" />
                <p><strong>Error connecting to Triage Agent:</strong> {error}</p>
              </div>
            )}

            {!loading && !error && !result && (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <CheckCircle className="w-12 h-12 mb-3 opacity-20" />
                <p>Submit a prescription to initiate A2A + MCP clinical evaluation.</p>
              </div>
            )}

            {!loading && result && (
              <div className="prose prose-slate max-w-none">
                {/* Visual Indicator based on AI output content */}
                {result.toLowerCase().includes('reject') || result.toLowerCase().includes('contraindication') ? (
                  <div className="mb-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 font-medium flex items-center rounded-r-md">
                    <ShieldAlert className="w-6 h-6 mr-2" />
                    Contraindication Flagged by Pharmacist Agent
                  </div>
                ) : (
                  <div className="mb-4 bg-green-100 border-l-4 border-green-500 text-green-800 p-4 font-medium flex items-center rounded-r-md">
                    <CheckCircle className="w-6 h-6 mr-2" />
                    Prescription Cleared
                  </div>
                )}
                <ReactMarkdown>{result}</ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
