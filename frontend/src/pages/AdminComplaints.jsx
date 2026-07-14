import { useEffect, useState } from 'react'
import api from '../api'
import ComplaintCard from '../components/ComplaintCard'

const CATEGORIES = ['Plumbing', 'Electrical', 'Elevator', 'Security', 'Housekeeping', 'Parking', 'Noise', 'Other']
const STATUSES = ['Open', 'In Progress', 'Resolved']
const PRIORITIES = ['Low', 'Medium', 'High']

function AdminControls({ complaint, onUpdated }) {
  const [status, setStatus] = useState(complaint.status)
  const [note, setNote] = useState('')
  const [priority, setPriority] = useState(complaint.priority)
  const [busy, setBusy] = useState(false)

  async function saveStatus() {
    setBusy(true)
    try {
      await api.patch(`/api/complaints/${complaint.id}/status`, { status, note: note || undefined })
      setNote('')
      onUpdated()
    } finally {
      setBusy(false)
    }
  }

  async function savePriority(newPriority) {
    setPriority(newPriority)
    await api.patch(`/api/complaints/${complaint.id}/priority`, { priority: newPriority })
    onUpdated()
  }

  return (
    <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--line)', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
      <div style={{ flex: '1 1 220px' }}>
        <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--slate)', marginBottom: 6 }}>
          Priority
        </label>
        <div style={{ display: 'flex', gap: 6 }}>
          {PRIORITIES.map((p) => (
            <button
              key={p}
              className={p === priority ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'}
              onClick={() => savePriority(p)}
              disabled={complaint.is_closed}
              type="button"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: '2 1 320px' }}>
        <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--slate)', marginBottom: 6 }}>
          Update status
        </label>
        {complaint.is_closed ? (
          <p style={{ fontSize: '0.85rem', color: 'var(--slate-soft)', margin: 0 }}>Resolved and closed.</p>
        ) : (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ padding: '8px 10px', border: '1px solid var(--line)', borderRadius: 3 }}>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <input
              placeholder="Optional note…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={{ flex: 1, minWidth: 140, padding: '8px 10px', border: '1px solid var(--line)', borderRadius: 3 }}
            />
            <button className="btn btn-primary btn-sm" onClick={saveStatus} disabled={busy}>
              {busy ? 'Saving…' : 'Save'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminComplaints() {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ category: '', status: '' })

  async function fetchComplaints() {
    setLoading(true)
    const params = {}
    if (filters.category) params.category = filters.category
    if (filters.status) params.status = filters.status
    const res = await api.get('/api/complaints', { params })
    setComplaints(res.data)
    setLoading(false)
  }

  useEffect(() => { fetchComplaints() }, [filters])

  const overdueCount = complaints.filter((c) => c.is_overdue).length

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 60 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', margin: 0, fontSize: '1.6rem' }}>All Complaints</h1>
        <p style={{ color: 'var(--slate-soft)', margin: '4px 0 0', fontSize: '0.9rem' }}>
          {overdueCount > 0 && <strong style={{ color: 'var(--red)' }}>{overdueCount} overdue · </strong>}
          Overdue complaints are surfaced at the top, sorted by priority.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <select value={filters.category} onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))} style={{ padding: '8px 10px', border: '1px solid var(--line)', borderRadius: 3, background: 'var(--paper-raised)' }}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))} style={{ padding: '8px 10px', border: '1px solid var(--line)', borderRadius: 3, background: 'var(--paper-raised)' }}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? (
        <p style={{ color: 'var(--slate-soft)' }}>Loading…</p>
      ) : complaints.length === 0 ? (
        <div className="empty-state panel"><p>No complaints match these filters.</p></div>
      ) : (
        complaints.map((c) => (
          <ComplaintCard
            key={c.id}
            complaint={c}
            adminControls={<AdminControls complaint={c} onUpdated={fetchComplaints} />}
          />
        ))
      )}
    </div>
  )
}
