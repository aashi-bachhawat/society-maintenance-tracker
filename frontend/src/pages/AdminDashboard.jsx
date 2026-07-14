import { useEffect, useState } from 'react'
import api from '../api'

function StatCard({ label, value, accent }) {
  return (
    <div className="panel panel-pad" style={{ flex: '1 1 180px' }}>
      <div style={{ fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--slate-soft)', marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: accent || 'var(--ink)' }}>
        {value}
      </div>
    </div>
  )
}

function BreakdownBar({ label, count, total, color }) {
  const pct = total ? Math.round((count / total) * 100) : 0
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 4 }}>
        <span>{label}</span>
        <span className="mono" style={{ color: 'var(--slate-soft)' }}>{count}</span>
      </div>
      <div style={{ background: 'var(--line)', borderRadius: 20, height: 8, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, background: color, height: '100%' }} />
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [threshold, setThreshold] = useState(3)
  const [savingThreshold, setSavingThreshold] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')

  async function fetchStats() {
    const res = await api.get('/api/dashboard')
    setStats(res.data)
  }

  async function fetchSettings() {
    const res = await api.get('/api/dashboard/settings')
    setThreshold(res.data.overdue_threshold_days)
  }

  useEffect(() => { fetchStats(); fetchSettings() }, [])

  async function saveThreshold(e) {
    e.preventDefault()
    setSavingThreshold(true)
    try {
      await api.put('/api/dashboard/settings', { overdue_threshold_days: Number(threshold) })
      setSavedMsg('Saved')
      fetchStats()
      setTimeout(() => setSavedMsg(''), 1800)
    } finally {
      setSavingThreshold(false)
    }
  }

  if (!stats) return <div className="container" style={{ paddingTop: 32 }}><p style={{ color: 'var(--slate-soft)' }}>Loading…</p></div>

  const statusColors = { 'Open': 'var(--red)', 'In Progress': 'var(--amber)', 'Resolved': 'var(--green)' }

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 60 }}>
      <h1 style={{ fontFamily: 'var(--font-display)', margin: '0 0 24px', fontSize: '1.6rem' }}>Dashboard</h1>

      <div style={{ display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
        <StatCard label="Total Complaints" value={stats.total_complaints} />
        <StatCard label="Overdue" value={stats.overdue_count} accent="var(--red)" />
        <StatCard label="Resolved" value={stats.by_status['Resolved'] || 0} accent="var(--green)" />
      </div>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <div className="panel panel-pad" style={{ flex: '1 1 320px' }}>
          <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)', fontSize: '1.05rem' }}>By status</h3>
          {Object.keys(stats.by_status).length === 0 && <p style={{ color: 'var(--slate-soft)', fontSize: '0.85rem' }}>No data yet.</p>}
          {Object.entries(stats.by_status).map(([status, count]) => (
            <BreakdownBar key={status} label={status} count={count} total={stats.total_complaints} color={statusColors[status] || 'var(--slate)'} />
          ))}
        </div>

        <div className="panel panel-pad" style={{ flex: '1 1 320px' }}>
          <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)', fontSize: '1.05rem' }}>By category</h3>
          {Object.keys(stats.by_category).length === 0 && <p style={{ color: 'var(--slate-soft)', fontSize: '0.85rem' }}>No data yet.</p>}
          {Object.entries(stats.by_category).map(([cat, count]) => (
            <BreakdownBar key={cat} label={cat} count={count} total={stats.total_complaints} color="var(--blueprint)" />
          ))}
        </div>
      </div>

      <div className="panel panel-pad" style={{ marginTop: 24, maxWidth: 420 }}>
        <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)', fontSize: '1.05rem' }}>Overdue threshold</h3>
        <p style={{ color: 'var(--slate-soft)', fontSize: '0.85rem', marginTop: -6 }}>
          Complaints still open past this many days are flagged overdue.
        </p>
        <form onSubmit={saveThreshold} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="number"
            min={1}
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            style={{ width: 80, padding: '8px 10px', border: '1px solid var(--line)', borderRadius: 3 }}
          />
          <span style={{ fontSize: '0.85rem', color: 'var(--slate)' }}>days</span>
          <button className="btn btn-primary btn-sm" type="submit" disabled={savingThreshold}>
            {savingThreshold ? 'Saving…' : 'Save'}
          </button>
          {savedMsg && <span style={{ color: 'var(--green)', fontSize: '0.85rem' }}>{savedMsg}</span>}
        </form>
      </div>
    </div>
  )
}
