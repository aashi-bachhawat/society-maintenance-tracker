import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Register from './pages/Register'
import ResidentDashboard from './pages/ResidentDashboard'
import AdminComplaints from './pages/AdminComplaints'
import AdminDashboard from './pages/AdminDashboard'
import NoticeBoard from './pages/NoticeBoard'

function ProtectedRoute({ children, role }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to={user.role === 'admin' ? '/admin' : '/complaints'} replace />
  return children
}

function Layout({ children }) {
  return (
    <div className="app-shell">
      <Navbar />
      {children}
    </div>
  )
}

function HomeRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={user.role === 'admin' ? '/admin' : '/complaints'} replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/complaints" element={
            <ProtectedRoute role="resident"><Layout><ResidentDashboard /></Layout></ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute role="admin"><Layout><AdminComplaints /></Layout></ProtectedRoute>
          } />
          <Route path="/admin/dashboard" element={
            <ProtectedRoute role="admin"><Layout><AdminDashboard /></Layout></ProtectedRoute>
          } />
          <Route path="/notices" element={
            <ProtectedRoute><Layout><NoticeBoard /></Layout></ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
