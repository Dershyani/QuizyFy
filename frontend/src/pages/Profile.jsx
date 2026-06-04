import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMe, updateName } from '../services/api'
import StudentLayout from '../components/StudentLayout'
import {
  User, Mail, Hash, Shield, Edit2, Check, X, Loader2
} from 'lucide-react'

export default function Profile() {
  const navigate  = useNavigate()
  const [profile, setProfile]   = useState(null)
  const [loading, setLoading]   = useState(true)

  const [name, setName] = useState(localStorage.getItem('name') || 'Student')
  const studentId = localStorage.getItem('student_id') || ''
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
    <StudentLayout>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px' }}>

        {/* Page header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#111827', margin: 0 }}>
            My Profile
          </h1>
          <p style={{ color: '#6B7280', marginTop: 4, fontSize: 14 }}>
            Your account details and learning stats
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
                background: 'linear-gradient(135deg, #1E3A8A 0%, #06B6D4 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 800,
                fontSize: 28,
                flexShrink: 0,
                boxShadow: '0 4px 20px rgba(6,182,212,0.25)',
              }}>
                {initials}
              </div>

              {/* Name + ID */}
              <div style={{ flex: 1 }}>
                {isEditing ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <input 
                      type="text" 
                      value={editNameValue}
                      onChange={(e) => setEditNameValue(e.target.value)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 8,
                        border: '1px solid #E5E7EB',
                        fontSize: 16,
                        fontWeight: 600,
                        color: '#111827',
                        outline: 'none',
                      }}
                      autoFocus
                    />
                    <button 
                      onClick={handleSaveName}
                      disabled={isSaving}
                      style={{
                        padding: '6px 10px',
                        background: '#10B981',
                        color: 'white',
                        border: 'none',
                        borderRadius: 6,
                        cursor: isSaving ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {isSaving ? <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} /> : <Check style={{ width: 16, height: 16 }} />}
                    </button>
                    <button 
                      onClick={() => { setIsEditing(false); setEditNameValue(name); }}
                      disabled={isSaving}
                      style={{
                        padding: '6px 10px',
                        background: '#F3F4F6',
                        color: '#4B5563',
                        border: 'none',
                        borderRadius: 6,
                        cursor: isSaving ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <X style={{ width: 16, height: 16 }} />
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <h2 style={{
                      fontSize: 22,
                      fontWeight: 700,
                      color: '#111827',
                      margin: 0,
                    }}>
                      {name}
                    </h2>
                    <button 
                      onClick={() => { setIsEditing(true); setEditNameValue(name); }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#9CA3AF',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 4,
                      }}
                      title="Edit Name"
                    >
                      <Edit2 style={{ width: 16, height: 16 }} />
                    </button>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: '#F3F4F6',
                    borderRadius: 8,
                    padding: '4px 10px',
                  }}>
                    <Hash style={{ width: 13, height: 13, color: '#6B7280' }} />
                    <span style={{ fontSize: 13, color: '#6B7280', fontFamily: 'monospace' }}>
                      {studentId}
                    </span>
                  </div>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: '#EFF6FF',
                    borderRadius: 8,
                    padding: '4px 10px',
                  }}>
                    <Shield style={{ width: 13, height: 13, color: '#1E3A8A' }} />
                    <span style={{ fontSize: 13, color: '#1E3A8A', fontWeight: 600 }}>
                      Student
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Info */}
            <div style={{
              background: '#fff',
              border: '1px solid #E5E7EB',
              borderRadius: 16,
              marginBottom: 20,
              overflow: 'hidden',
            }}>
              <div style={{
                padding: '16px 24px',
                borderBottom: '1px solid #E5E7EB',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                <User style={{ width: 18, height: 18, color: '#F97316' }} />
                <span style={{ fontWeight: 600, color: '#111827', fontSize: 15 }}>
                  Account Information
                </span>
              </div>

              {[
                {
                  icon: Mail,
                  label: 'Email Address',
                  value: profile?.email || 'N/A',
                },
                {
                  icon: Hash,
                  label: 'Student ID',
                  value: profile?.student_id || studentId || 'N/A',
                  mono: true,
                },
              ].map(({ icon: Icon, label, value, mono }, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '16px 24px',
                    borderBottom: i < 2 ? '1px solid #F3F4F6' : 'none',
                    gap: 16,
                  }}
                >
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: '#FFF7ED',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Icon style={{ width: 16, height: 16, color: '#F97316' }} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 12, color: '#9CA3AF', fontWeight: 500 }}>{label}</p>
                    <p style={{
                      margin: '2px 0 0 0',
                      fontSize: 14,
                      color: '#111827',
                      fontWeight: 500,
                      fontFamily: mono ? 'monospace' : 'inherit',
                    }}>
                      {value}
                    </p>
                  </div>
                </div>
              ))}
            </div>




          </>
        )}
      </div>
    </StudentLayout>
  )
}
