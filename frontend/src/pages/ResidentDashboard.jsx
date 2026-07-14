import { useEffect, useState } from 'react'
import api from '../api'
import ComplaintCard from '../components/ComplaintCard'

const CATEGORIES = ['Plumbing', 'Electrical', 'Elevator', 'Security', 'Housekeeping', 'Parking', 'Noise', 'Other']

export default function ResidentDashboard() {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [category, setCategory] = useState(CATEGORIES[0])
  const [description, setDescription] = useState('')
  const [photo, setPhoto] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function fetchComplaints() {
    setLoading(true)
    const res = await api.get('/api/complaints/mine')
    setComplaints(res.data)
    setLoading(false)
  }

  useEffect(() => { fetchComplaints() }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('category', category)
      formData.append('description', description)
      if (photo) formData.append('photo', photo)
      await api.post('/api/complaints', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      setDescription('')
      setPhoto(null)
      setShowForm(false)
      fetchComplaints()
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not submit complaint.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 60 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', margin: 0, fontSize: '1.6rem' }}>My Complaints</h1>
          <p style={{ color: 'var(--slate-soft)', margin: '4px 0 0', fontSize: '0.9rem' }}>
            Track every complaint you've raised, with full status history.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Raise a complaint'}
        </button>
      </div>

      {showForm && (
        <div className="panel panel-pad" style={{ marginBottom: 28 }}>
          <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)' }}>New complaint</h3>
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="category">Category</label>
              <select id="category" value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="description">Description</label>
              <textarea id="description" required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the issue in detail…" />
            </div>
            <div className="field">
              <label htmlFor="photo">Photo (optional)</label>
              <input id="photo" type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files[0])} />
            </div>
            {error && <p className="error-text">{error}</p>}
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit complaint'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <p style={{ color: 'var(--slate-soft)' }}>Loading…</p>
      ) : complaints.length === 0 ? (
        <div className="empty-state panel">
          <p>You haven't raised any complaints yet.</p>
        </div>
      ) : (
        complaints.map((c) => <ComplaintCard key={c.id} complaint={c} />)
      )}
    </div>
  )
}
