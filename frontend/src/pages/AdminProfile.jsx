import { useState, useEffect } from 'react'
import { getMe, updateName } from '../services/api'
import AdminLayout from '../components/AdminLayout'
import {
  User, Mail, Shield, Edit2, Check, X, Loader2
} from 'lucide-react'

export default function AdminProfile() {
  const [profile, setProfile]   = useState(null)
  const [loading, setLoading]   = useState(true)

  const [name, setName] = useState(localStorage.getItem('name') || 'Admin')
  const initials  = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  const [isEditing, setIsEditing] = useState(false)
  const [editNameValue, setEditNameValue] = useState(name)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [])

  const handleSaveName = async () => {
    if (!editNameValue.trim() || editNameValue.trim() === name) {
      setIsEditing(false)
      return
    }
    setIsSaving(true)
    try {
      await updateName({ name: editNameValue.trim() })
      localStorage.setItem('name', editNameValue.trim())
      setName(editNameValue.trim())
      setIsEditing(false)
    } catch (err) {
      console.error('Error saving name:', err)
      alert('Failed to update name')
    } finally {
      setIsSaving(false)
    }
  }

  const loadProfile = async () => {
    try {
      const meRes = await getMe()
      setProfile(meRes.data)
    } catch (err) {
      console.error('Error loading profile:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminLayout>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px' }}>

        {/* Page header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#111827', margin: 0 }}>
            Admin Profile
          </h1>
          <p style={{ color: '#6B7280', marginTop: 4, fontSize: 14 }}>
            Your administrator account details
          </p>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
            <div style={{
              width: 32, height: 32,
              border: '3px solid #F97316',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
          <>
            {/* Avatar + Name Card */}
            <div style={{
              background: '#fff',
              border: '1px solid #E5E7EB',
              borderRadius: 16,
              padding: '32px 28px',
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 24,
            }}>
              {/* Avatar */}
              <div style={{
                width: 80,
                height: 80,
                borderRadius: 20,
                background: '#F97316',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 700,
                fontSize: 28,
                flexShrink: 0,
                boxShadow: '0 4px 14px 0 rgba(249, 115, 22, 0.3)',
              }}>
                {initials}
              </div>

              {/* Name / Edit Info */}
              <div style={{ flex: 1 }}>
                {isEditing ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input
                      type="text"
                      value={editNameValue}
                      onChange={e => setEditNameValue(e.target.value)}
                      disabled={isSaving}
                      autoFocus
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleSaveName()
                        if (e.key === 'Escape') {
                          setIsEditing(false)
                          setEditNameValue(name)
                        }
                      }}
                      style={{
                        fontSize: 20,
                        fontWeight: 700,
                        color: '#111827',
                        padding: '6px 12px',
                        borderRadius: 8,
                        border: '2px solid #F97316',
                        outline: 'none',
                        width: '100%',
                        maxWidth: 300,
                      }}
                    />
                    {isSaving ? (
                      <Loader2 style={{ animation: 'spin 1s linear infinite', color: '#F97316' }} />
                    ) : (
                      <>
                        <button
                          onClick={handleSaveName}
                          style={{ background: '#10B981', color: '#fff', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer' }}
                        >
                          <Check size={18} />
                        </button>
                        <button
                          onClick={() => {
                            setIsEditing(false)
                            setEditNameValue(name)
                          }}
                          style={{ background: '#EF4444', color: '#fff', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer' }}
                        >
                          <X size={18} />
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>
                      {name}
                    </h2>
                    <button
                      onClick={() => setIsEditing(true)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#6B7280',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 6,
                        borderRadius: 6,
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#F3F4F6'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      title="Edit name"
                    >
                      <Edit2 size={16} />
                    </button>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 10px',
                    background: '#FEF2F2',
                    color: '#EF4444',
                    borderRadius: 99,
                    fontSize: 12,
                    fontWeight: 600,
                  }}>
                    Administrator
                  </span>
                </div>
              </div>
            </div>

            {/* Account Details List */}
            <div style={{
              background: '#fff',
              border: '1px solid #E5E7EB',
              borderRadius: 16,
              overflow: 'hidden',
            }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #E5E7EB', background: '#F9FAFB' }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#111827' }}>
                  Account Information
                </h3>
              </div>

              <div style={{ padding: '0 24px' }}>
                {/* Email Row */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '20px 0',
                  borderBottom: '1px solid #E5E7EB'
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: '#F3F4F6', color: '#6B7280',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginRight: 16
                  }}>
                    <Mail size={18} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 13, color: '#6B7280' }}>Email Address</p>
                    <p style={{ margin: '2px 0 0', fontSize: 15, fontWeight: 500, color: '#111827' }}>
                      {profile?.email || 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Role Row */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '20px 0',
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: '#F3F4F6', color: '#6B7280',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginRight: 16
                  }}>
                    <Shield size={18} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 13, color: '#6B7280' }}>System Role</p>
                    <p style={{ margin: '2px 0 0', fontSize: 15, fontWeight: 500, color: '#111827', textTransform: 'capitalize' }}>
                      {profile?.role || 'Admin'}
                    </p>
                  </div>
                </div>

              </div>
            </div>
          </>
        )}

      </div>
    </AdminLayout>
  )
}
