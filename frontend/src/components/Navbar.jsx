import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  if (!user) return null

  const linkStyle = ({ isActive }) => ({
    padding: '8px 4px',
    fontWeight: 600,
    fontSize: '0.9rem',
    color: isActive ? 'var(--ink)' : 'var(--slate-soft)',
    borderBottom: isActive ? '2px solid var(--blueprint)' : '2px solid transparent',
    textDecoration: 'none',
  })

  return (
    <header style={{ borderBottom: '1px solid var(--line)', background: 'var(--paper-raised)' }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', letterSpacing: '-0.01em' }}>
            Society<span style={{ color: 'var(--blueprint)' }}>Tracker</span>
          </span>
          <nav style={{ display: 'flex', gap: 24 }}>
            {user.role === 'resident' && (
              <NavLink to="/complaints" style={linkStyle}>My Complaints</NavLink>
            )}
            {user.role === 'admin' && (
              <>
                <NavLink to="/admin" style={linkStyle}>Complaints</NavLink>
                <NavLink to="/admin/dashboard" style={linkStyle}>Dashboard</NavLink>
              </>
            )}
            <NavLink to="/notices" style={linkStyle}>Notice Board</NavLink>
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--slate)' }}>
            {user.name} <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--slate-soft)' }}>· {user.role}</span>
          </span>
          <button className="btn btn-outline btn-sm" onClick={() => { logout(); navigate('/login') }}>
            Log out
          </button>
        </div>
      </div>
    </header>
  )
}
