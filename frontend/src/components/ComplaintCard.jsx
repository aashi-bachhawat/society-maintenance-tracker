import { useState } from 'react'
import { StatusBadge, PriorityBadge, OverdueBadge } from './Badges'
import { API_URL } from '../api'

function formatDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

export default function ComplaintCard({ complaint, adminControls }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="panel" style={{ marginBottom: 14 }}>
      <div className="panel-pad" style={{ paddingBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--slate-soft)' }}>
                #{complaint.id.slice(0, 8)}
              </span>
              {complaint.is_overdue && <OverdueBadge />}
            </div>
            <h3 style={{ margin: '0 0 4px', fontFamily: 'var(--font-display)', fontSize: '1.05rem' }}>
              {complaint.category}
            </h3>
            <p style={{ margin: '0 0 8px', color: 'var(--slate)', fontSize: '0.92rem', lineHeight: 1.5 }}>
              {complaint.description}
            </p>
            {complaint.resident_name && (
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--slate-soft)' }}>
                {complaint.resident_name}{complaint.apartment_number ? ` · ${complaint.apartment_number}` : ''}
              </p>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, minWidth: 140 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <StatusBadge status={complaint.status} />
              <PriorityBadge priority={complaint.priority} />
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--slate-soft)' }}>
              {complaint.days_open} day{complaint.days_open === 1 ? '' : 's'} open
            </span>
          </div>
        </div>

        {complaint.photo_url && (
          <a href={`${API_URL}${complaint.photo_url}`} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: 12 }}>
            <img
              src={`${API_URL}${complaint.photo_url}`}
              alt="Complaint attachment"
              style={{ maxHeight: 140, borderRadius: 3, border: '1px solid var(--line)' }}
            />
          </a>
        )}

        {adminControls}

        <button
          className="btn-sm"
          style={{ marginTop: 12, background: 'none', border: 'none', color: 'var(--blueprint)', fontWeight: 600, cursor: 'pointer', padding: 0 }}
          onClick={() => setOpen(!open)}
        >
          {open ? 'Hide history' : `View history (${complaint.history.length})`}
        </button>

        {open && (
          <ol style={{ marginTop: 12, paddingLeft: 0, listStyle: 'none', borderTop: '1px solid var(--line)', paddingTop: 12 }}>
            {complaint.history.map((h) => (
              <li key={h.id} style={{ marginBottom: 10, fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                  <StatusBadge status={h.status} />
                  <span style={{ color: 'var(--slate-soft)', fontSize: '0.78rem' }}>{formatDate(h.timestamp)}</span>
                </div>
                <div style={{ color: 'var(--slate)', marginTop: 3 }}>
                  {h.note && <span>{h.note} — </span>}
                  <span style={{ fontStyle: 'italic' }}>{h.actor_name}</span>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  )
}
