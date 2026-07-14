import { useEffect, useState } from 'react'
import api from '../api'
import { useAuth } from '../context/AuthContext'

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function NoticeBoard() {
  const { user } = useAuth()
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [important, setImportant] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function fetchNotices() {
    setLoading(true)
    const res = await api.get('/api/notices')
    setNotices(res.data)
    setLoading(false)
  }

  useEffect(() => { fetchNotices() }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post('/api/notices', { title, content, is_important: important })
      setTitle('')
      setContent('')
      setImportant(false)
      setShowForm(false)
      fetchNotices()
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this notice?')) return
    await api.delete(`/api/notices/${id}`)
    fetchNotices()
  }

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 60 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', margin: 0, fontSize: '1.6rem' }}>Notice Board</h1>
          <p style={{ color: 'var(--slate-soft)', margin: '4px 0 0', fontSize: '0.9rem' }}>
            Pinned notices are marked important and emailed to residents.
          </p>
        </div>
        {user?.role === 'admin' && (
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ Post notice'}
          </button>
        )}
      </div>

      {showForm && (
        <div className="panel panel-pad" style={{ marginBottom: 28 }}>
          <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)' }}>New notice</h3>
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="title">Title</label>
              <input id="title" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Water supply interruption" />
            </div>
            <div className="field">
              <label htmlFor="content">Content</label>
              <textarea id="content" required value={content} onChange={(e) => setContent(e.target.value)} placeholder="Notice details…" />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.88rem', marginBottom: 16, cursor: 'pointer' }}>
              <input type="checkbox" checked={important} onChange={(e) => setImportant(e.target.checked)} />
              Mark as important (pins to top and emails all residents)
            </label>
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? 'Posting…' : 'Post notice'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <p style={{ color: 'var(--slate-soft)' }}>Loading…</p>
      ) : notices.length === 0 ? (
        <div className="empty-state panel"><p>No notices posted yet.</p></div>
      ) : (
        notices.map((n) => (
          <div key={n.id} className="panel panel-pad" style={{ marginBottom: 14, borderLeft: n.is_important ? '3px solid var(--amber)' : '1px solid var(--line)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  {n.is_important && <span className="badge" style={{ background: 'var(--amber-soft)', color: 'var(--amber)' }}>📌 Important</span>}
                  <span style={{ fontSize: '0.78rem', color: 'var(--slate-soft)' }}>{formatDate(n.created_at)}</span>
                </div>
                <h3 style={{ margin: '0 0 6px', fontFamily: 'var(--font-display)', fontSize: '1.05rem' }}>{n.title}</h3>
                <p style={{ margin: 0, color: 'var(--slate)', fontSize: '0.92rem', lineHeight: 1.5 }}>{n.content}</p>
              </div>
              {user?.role === 'admin' && (
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(n.id)}>Delete</button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
