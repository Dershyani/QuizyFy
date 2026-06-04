import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Upload, User, LogOut,
  ChevronLeft, ChevronRight, BookOpen
} from 'lucide-react'

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard',    path: '/dashboard' },
  { icon: Upload,          label: 'Upload Notes', path: '/upload'    },
  { icon: User,            label: 'Profile',      path: '/profile'   },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate  = useNavigate()
  const location  = useLocation()

  const name      = localStorage.getItem('name')      || 'Student'
  const studentId = localStorage.getItem('student_id') || ''
  const initials  = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  const logout = () => {
    localStorage.clear()
    navigate('/login')
  }

  const isActive = (path) => location.pathname === path

  return (
    <aside
      style={{
        width: collapsed ? '72px' : '240px',
        transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
        minHeight: '100vh',
        background: '#fff',
        borderRight: '1px solid #E5E7EB',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh',
        flexShrink: 0,
        zIndex: 40,
        overflow: 'hidden',
      }}
    >
      {/* Logo + Toggle */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        padding: collapsed ? '20px 0' : '20px 16px',
        borderBottom: '1px solid #E5E7EB',
        minHeight: '65px',
      }}>
        {!collapsed && (
          <span
            onClick={() => navigate('/dashboard')}
            style={{
              fontSize: '20px',
              fontWeight: 800,
              color: '#1E3A8A',
              cursor: 'pointer',
              letterSpacing: '-0.5px',
              whiteSpace: 'nowrap',
              userSelect: 'none',
            }}
          >
            Quizy<span style={{ color: '#06B6D4' }}>Fy</span>
          </span>
        )}

        {collapsed && (
          <span
            onClick={() => navigate('/dashboard')}
            style={{ cursor: 'pointer', userSelect: 'none' }}
          >
            <BookOpen style={{ width: 22, height: 22, color: '#1E3A8A' }} />
          </span>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 28,
            borderRadius: '8px',
            border: '1px solid #E5E7EB',
            background: '#F9FAFB',
            cursor: 'pointer',
            color: '#6B7280',
            flexShrink: 0,
            marginLeft: collapsed ? 0 : 0,
            transition: 'background 0.15s, color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#F97316'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#F97316' }}
          onMouseLeave={e => { e.currentTarget.style.background = '#F9FAFB'; e.currentTarget.style.color = '#6B7280'; e.currentTarget.style.borderColor = '#E5E7EB' }}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed
            ? <ChevronRight style={{ width: 14, height: 14 }} />
            : <ChevronLeft  style={{ width: 14, height: 14 }} />
          }
        </button>
      </div>

      {/* Nav Links */}
      <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {NAV_ITEMS.map(({ icon: Icon, label, path }) => {
          const active = isActive(path)
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              title={collapsed ? label : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: collapsed ? '10px 0' : '10px 12px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                borderRadius: '10px',
                border: 'none',
                cursor: 'pointer',
                width: '100%',
                background: active ? '#FFF7ED' : 'transparent',
                color: active ? '#F97316' : '#6B7280',
                fontWeight: active ? 600 : 400,
                fontSize: 14,
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
              }}
              onMouseEnter={e => {
                if (!active) {
                  e.currentTarget.style.background = '#F9FAFB'
                  e.currentTarget.style.color = '#111827'
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = '#6B7280'
                }
              }}
            >
              {/* Active indicator bar */}
              {active && (
                <span style={{
                  position: 'absolute',
                  left: 0,
                  width: 3,
                  height: 28,
                  background: '#F97316',
                  borderRadius: '0 4px 4px 0',
                }} />
              )}
              <Icon style={{ width: 18, height: 18, flexShrink: 0 }} />
              {!collapsed && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>}
            </button>
          )
        })}
      </nav>

      {/* User + Logout */}
      <div style={{
        borderTop: '1px solid #E5E7EB',
        padding: collapsed ? '12px 0' : '12px 8px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}>
        {/* User info */}
        {!collapsed && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '8px 12px',
            borderRadius: 10,
            background: '#F9FAFB',
            marginBottom: 4,
          }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #1E3A8A 0%, #06B6D4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: 12,
              flexShrink: 0,
            }}>
              {initials}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <p style={{
                fontSize: 13,
                fontWeight: 600,
                color: '#111827',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                margin: 0,
              }}>{name}</p>
              <p style={{
                fontSize: 11,
                color: '#9CA3AF',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                margin: 0,
              }}>{studentId}</p>
            </div>
          </div>
        )}

        {/* Avatar only when collapsed */}
        {collapsed && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #1E3A8A 0%, #06B6D4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: 12,
            }}>
              {initials}
            </div>
          </div>
        )}

        {/* Logout button */}
        <button
          onClick={logout}
          title="Logout"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: collapsed ? '10px 0' : '10px 12px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            borderRadius: 10,
            border: 'none',
            cursor: 'pointer',
            width: '100%',
            background: 'transparent',
            color: '#6B7280',
            fontSize: 14,
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#FEF2F2'
            e.currentTarget.style.color = '#EF4444'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = '#6B7280'
          }}
        >
          <LogOut style={{ width: 18, height: 18, flexShrink: 0 }} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  )
}
