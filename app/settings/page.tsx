'use client'

import React, { useState, useEffect } from 'react'
import { 
  User, Shield, Camera, Lock, Key, Smartphone, 
  Loader2, ArrowLeft, CheckCircle2, AlertCircle,
  MonitorPlay, HardDriveDownload, Bell, Palette, Link as LinkIcon
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/app/utils/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'

export default function StudentSettingsPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'playback' | 'downloads' | 'notifications' | 'appearance' | 'connections'>('profile')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null)

  // User State
  const [user, setUser] = useState<any>(null)
  const [profileDraft, setProfileDraft] = useState<any>({})
  
  // Security State
  const [newPassword, setNewPassword] = useState('')
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [activeSessions, setActiveSessions] = useState<any[]>([])

  // Premium Learner Preferences State
  const [prefs, setPrefs] = useState({
      autoplay: true,
      defaultSpeed: '1x',
      defaultQuality: 'Auto',
      captions: false,
      wifiOnly: true,
      downloadQuality: 'Standard',
      weeklyReminders: true,
      qaReplies: true,
      theme: 'dark',
      reduceMotion: false,
      highContrast: false
  })

  // --- DATA INITIALIZATION ---
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/auth')
      
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      
      setUser(user)
      setProfileDraft({
          full_name: profile?.full_name || user.user_metadata?.full_name || '',
          avatar_url: profile?.avatar_url || user.user_metadata?.avatar_url || '',
          email: user.email || ''
      })
      
      // Load real preferences from database
      if (profile?.student_prefs) {
          setPrefs({ ...prefs, ...profile.student_prefs })
      }
      
      setTwoFactorEnabled(profile?.two_factor_enabled || false)

      // Get real session data (Supabase auth sessions)
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
          setActiveSessions([{
              id: session.access_token,
              device: navigator.userAgent.includes('Mac') ? 'macOS' : navigator.userAgent.includes('Win') ? 'Windows' : 'Mobile Device',
              browser: navigator.userAgent.includes('Chrome') ? 'Chrome' : navigator.userAgent.includes('Safari') ? 'Safari' : 'Browser',
              current: true,
              ip: 'Current IP'
          }])
      }

      setLoading(false)
    }
    fetchUser()
  }, [router, supabase])

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 4000)
  }

  // --- REAL BACKEND HANDLERS ---

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: profileDraft.full_name, avatar_url: profileDraft.avatar_url }
      })
      if (authError) throw authError

      const { error: profileError } = await supabase.from('profiles').upsert({
        id: user.id,
        full_name: profileDraft.full_name,
        avatar_url: profileDraft.avatar_url,
        updated_at: new Date().toISOString()
      })
      if (profileError) throw profileError

      showMessage('Profile updated successfully!', 'success')
    } catch (err: any) {
      showMessage(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleSavePreferences = async () => {
      setSaving(true)
      try {
          // REAL GLOBAL SAVE: Writes directly to the JSONB column in Supabase
          const { error } = await supabase
              .from('profiles')
              .update({ student_prefs: prefs })
              .eq('id', user.id)
              
          if (error) throw error
          
          showMessage('Preferences saved globally!', 'success')
          
          // Apply theme settings immediately to the DOM if needed
          if (prefs.theme === 'light') document.documentElement.classList.add('light-theme')
          else document.documentElement.classList.remove('light-theme')
          
      } catch (err: any) {
          showMessage('Failed to save preferences.', 'error')
      } finally {
          setSaving(false)
      }
  }

  // Real Web API Cache Clearing
  const handleClearCache = async () => {
      if ('caches' in window) {
          try {
              const cacheKeys = await caches.keys()
              await Promise.all(cacheKeys.map(key => caches.delete(key)))
              showMessage("Offline video cache cleared successfully. Storage freed.", "success")
          } catch (e) {
              showMessage("Failed to clear local cache.", "error")
          }
      } else {
          showMessage("Your browser does not support offline caching.", "error")
      }
  }

  const handleUpdatePassword = async () => {
    if (!newPassword || newPassword.length < 6) return showMessage('Password must be at least 6 characters', 'error')
    
    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      
      showMessage('Password updated securely!', 'success')
      setNewPassword('')
    } catch (err: any) {
      showMessage(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setSaving(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Math.random()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file)
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName)
      setProfileDraft({ ...profileDraft, avatar_url: publicUrl })
      showMessage('Avatar uploaded! Click Save to apply globally.', 'success')
    } catch (err: any) {
      showMessage(err.message || 'Failed to upload image', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleOAuthConnect = async (provider: 'google' | 'github') => {
      try {
          const { error } = await supabase.auth.signInWithOAuth({
              provider: provider,
              options: { redirectTo: `${window.location.origin}/student/settings` }
          })
          if (error) throw error
      } catch (err: any) {
          showMessage(`Failed to connect ${provider}`, 'error')
      }
  }

  if (loading) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="animate-spin text-green-500" size={40} />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-green-500/30 pb-20 relative">
      <div className="fixed top-[-20%] left-[-10%] w-[500px] h-[500px] bg-green-900/10 rounded-full blur-[128px] pointer-events-none z-0" />
      
      <header className="sticky top-0 z-50 bg-[#050505]/80 backdrop-blur-xl border-b border-white/5 h-20 flex items-center px-6 lg:px-12">
         <Link href="/student/dashboard" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
            <span className="font-bold text-sm">Back to Dashboard</span>
         </Link>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto p-6 lg:p-10 pt-12">
        <div className="mb-10">
            <h1 className="text-4xl font-black text-white mb-2">Account Settings</h1>
            <p className="text-zinc-400">Manage your learning environment, security, and global preferences.</p>
        </div>

        <AnimatePresence>
            {message && (
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className={`mb-8 p-4 rounded-xl border flex items-center gap-3 ${message.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                    {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                    <span className="text-sm font-bold">{message.text}</span>
                </motion.div>
            )}
        </AnimatePresence>

        <div className="flex flex-col lg:flex-row gap-8">
            
            {/* PREMIUM SIDEBAR NAV */}
            <aside className="w-full lg:w-64 shrink-0 flex overflow-x-auto lg:flex-col gap-2 pb-4 lg:pb-0 no-scrollbar">
                <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-4 mb-2 hidden lg:block">Account</h3>
                {[
                  { id: 'profile', label: 'Public Profile', icon: User },
                  { id: 'security', label: 'Password & Security', icon: Shield },
                  { id: 'connections', label: 'Connected Accounts', icon: LinkIcon },
                ].map((tab) => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${ activeTab === tab.id ? 'bg-zinc-800/80 text-white shadow-sm border border-white/10' : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent' }`}>
                    <tab.icon size={18} className={activeTab === tab.id ? "text-emerald-400" : "text-zinc-500"} /> {tab.label}
                  </button>
                ))}

                <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-4 mb-2 mt-6 hidden lg:block">App Settings</h3>
                {[
                  { id: 'playback', label: 'Video & Playback', icon: MonitorPlay },
                  { id: 'downloads', label: 'Offline Downloads', icon: HardDriveDownload },
                  { id: 'appearance', label: 'Appearance & UI', icon: Palette },
                  { id: 'notifications', label: 'Study Reminders', icon: Bell },
                ].map((tab) => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${ activeTab === tab.id ? 'bg-zinc-800/80 text-white shadow-sm border border-white/10' : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent' }`}>
                    <tab.icon size={18} className={activeTab === tab.id ? "text-emerald-400" : "text-zinc-500"} /> {tab.label}
                  </button>
                ))}
            </aside>

            {/* CONTENT AREA */}
            <div className="flex-1 min-h-[600px] pb-24">
                <AnimatePresence mode="wait">
                    
                    {/* 1. PROFILE TAB */}
                    {activeTab === 'profile' && (
                        <motion.div key="profile" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                            <div className="p-8 bg-[#0a0a0a] border border-white/5 rounded-3xl">
                                <h2 className="text-xl font-bold mb-6 border-b border-white/5 pb-4">Personal Information</h2>
                                
                                <div className="flex items-center gap-6 mb-8">
                                    <div className="relative w-24 h-24 rounded-full bg-zinc-900 border-2 border-white/10 overflow-hidden group shadow-xl">
                                        {profileDraft.avatar_url ? <img src={profileDraft.avatar_url} alt="Avatar" className="w-full h-full object-cover" /> : <User size={40} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-zinc-600" />}
                                        <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer backdrop-blur-sm">
                                            {saving ? <Loader2 size={24} className="animate-spin text-white" /> : <><Camera size={20} className="text-white mb-1" /><span className="text-[10px] font-bold text-white uppercase tracking-wider">Change</span></>}
                                            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={saving} />
                                        </label>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white">Profile Picture</h3>
                                        <p className="text-xs text-zinc-500 mt-1">JPG, GIF or PNG. Max size of 2MB.</p>
                                    </div>
                                </div>

                                <div className="space-y-5 max-w-md">
                                    <div>
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2">Full Name</label>
                                        <input type="text" value={profileDraft.full_name} onChange={(e) => setProfileDraft({...profileDraft, full_name: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500/50 transition-colors" placeholder="John Doe" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2">Email Address</label>
                                        <input type="email" value={profileDraft.email} disabled className="w-full bg-white/5 border border-transparent rounded-xl px-4 py-3 text-zinc-500 cursor-not-allowed" />
                                        <p className="text-[10px] text-zinc-600 mt-2">Email cannot be changed directly. Contact support if needed.</p>
                                    </div>
                                </div>
                                <div className="mt-8 pt-6 border-t border-white/5 flex justify-end">
                                    <button onClick={handleSaveProfile} disabled={saving} className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-emerald-500/20 disabled:opacity-50">
                                        Save Profile
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* 2. SECURITY TAB */}
                    {activeTab === 'security' && (
                        <motion.div key="security" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                            
                            {/* Change Password */}
                            <div className="p-8 bg-[#0a0a0a] border border-white/5 rounded-3xl">
                                <h2 className="text-xl font-bold mb-6 border-b border-white/5 pb-4">Change Password</h2>
                                <div className="space-y-5 max-w-md">
                                    <div>
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2">New Password</label>
                                        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500/50 transition-colors" placeholder="••••••••" minLength={6} />
                                    </div>
                                </div>
                                <div className="mt-8 pt-6 border-t border-white/5 flex justify-end">
                                    <button onClick={handleUpdatePassword} disabled={saving || !newPassword} className="px-8 py-3 bg-white text-black hover:bg-zinc-200 font-bold rounded-xl transition-all disabled:opacity-50">
                                        Update Password
                                    </button>
                                </div>
                            </div>

                            {/* Active Sessions (Device Management) */}
                            <div className="p-8 bg-[#0a0a0a] border border-white/5 rounded-3xl">
                                <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-6">
                                    <h2 className="text-xl font-bold">Active Sessions</h2>
                                    <button className="text-xs font-bold text-red-400 hover:text-red-300 transition-colors">Sign out of all other devices</button>
                                </div>
                                <div className="space-y-3">
                                    {activeSessions.map((session, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 bg-black border border-white/5 rounded-2xl">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-zinc-900 rounded-xl"><Smartphone size={20} className={session.current ? "text-emerald-500" : "text-zinc-500"}/></div>
                                                <div>
                                                    <p className="font-bold text-sm text-white flex items-center gap-2">
                                                        {session.device} • {session.browser} 
                                                        {session.current && <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded uppercase tracking-widest">Current</span>}
                                                    </p>
                                                    <p className="text-xs text-zinc-500">IP: {session.ip} • Active Now</p>
                                                </div>
                                            </div>
                                            {!session.current && <button className="text-xs text-red-500 hover:text-red-400">Revoke</button>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* 3. CONNECTED ACCOUNTS */}
                    {activeTab === 'connections' && (
                        <motion.div key="connections" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                            <div className="p-8 bg-[#0a0a0a] border border-white/5 rounded-3xl">
                                <h2 className="text-xl font-bold mb-2">Connected Accounts</h2>
                                <p className="text-sm text-zinc-400 border-b border-white/5 pb-6 mb-6">Link your social accounts for faster login.</p>
                                
                                <div className="space-y-4 max-w-2xl">
                                    {/* Google Link */}
                                    <div className="flex items-center justify-between p-5 bg-black border border-white/5 rounded-2xl">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                                                <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.7 17.74 9.5 24 9.5z"></path><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path></svg>
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-white text-sm">Google</h4>
                                                <p className="text-xs text-zinc-500">Not connected</p>
                                            </div>
                                        </div>
                                        <button onClick={() => handleOAuthConnect('google')} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-bold transition-colors">Connect</button>
                                    </div>

                                    {/* GitHub Link */}
                                    <div className="flex items-center justify-between p-5 bg-black border border-white/5 rounded-2xl">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.46 2 11.97C2 16.38 4.905 20.12 8.877 21.46C9.377 21.55 9.562 21.25 9.562 20.98C9.562 20.74 9.553 19.92 9.548 18.99C6.766 19.59 6.18 17.75 6.18 17.75C5.726 16.61 5.226 16.3 5.226 16.3C4.446 15.77 5.286 15.78 5.286 15.78C6.148 15.84 6.602 16.66 6.602 16.66C7.368 17.97 8.599 17.59 9.08 17.37C9.158 16.82 9.356 16.44 9.574 16.22C7.355 15.97 5.02 15.12 5.02 11.45C5.02 10.4 5.434 9.54 6.111 8.86C6.002 8.6 5.638 7.62 6.216 6.3C6.216 6.3 7.106 6.02 9.54 7.66C10.384 7.43 11.284 7.31 12.18 7.31C13.076 7.31 13.976 7.43 14.822 7.66C17.254 6.02 18.142 6.3 18.142 6.3C18.722 7.62 18.358 8.6 18.25 8.86C18.928 9.54 19.34 10.4 19.34 11.45C19.34 15.13 17 15.97 14.776 16.21C15.05 16.44 15.294 16.91 15.294 17.65C15.294 18.71 15.285 19.56 15.285 19.83C15.285 20.1 15.471 20.4 15.977 20.31C19.948 18.96 22.85 15.24 22.85 10.74C22.85 5.23 18.373 0.77 12.85 0.77H12Z"/></svg>
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-white text-sm">GitHub</h4>
                                                <p className="text-xs text-zinc-500">Not connected</p>
                                            </div>
                                        </div>
                                        <button onClick={() => handleOAuthConnect('github')} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-bold transition-colors">Connect</button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* 4. PLAYBACK TAB */}
                    {activeTab === 'playback' && (
                        <motion.div key="playback" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                            <div className="p-8 bg-[#0a0a0a] border border-white/5 rounded-3xl">
                                <h2 className="text-xl font-bold mb-6 border-b border-white/5 pb-4">Video & Playback</h2>
                                
                                <div className="space-y-6 max-w-2xl">
                                    <div className="flex items-center justify-between p-4 bg-black border border-white/5 rounded-2xl">
                                        <div>
                                            <h4 className="font-bold text-sm">Autoplay Next Lesson</h4>
                                            <p className="text-xs text-zinc-500 mt-1">Automatically start the next video when the current one finishes.</p>
                                        </div>
                                        <div onClick={() => setPrefs({...prefs, autoplay: !prefs.autoplay})} className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${prefs.autoplay ? 'bg-emerald-500' : 'bg-zinc-800'}`}>
                                            <motion.div layout className="w-4 h-4 bg-white rounded-full shadow-sm" style={{ marginLeft: prefs.autoplay ? '24px' : '0px' }} />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-black border border-white/5 rounded-2xl">
                                        <div>
                                            <h4 className="font-bold text-sm">Always Show Captions</h4>
                                            <p className="text-xs text-zinc-500 mt-1">Enable auto-generated closed captions by default.</p>
                                        </div>
                                        <div onClick={() => setPrefs({...prefs, captions: !prefs.captions})} className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${prefs.captions ? 'bg-emerald-500' : 'bg-zinc-800'}`}>
                                            <motion.div layout className="w-4 h-4 bg-white rounded-full shadow-sm" style={{ marginLeft: prefs.captions ? '24px' : '0px' }} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="p-4 bg-black border border-white/5 rounded-2xl">
                                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2">Default Resolution</label>
                                            <select value={prefs.defaultQuality} onChange={(e) => setPrefs({...prefs, defaultQuality: e.target.value})} className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/50">
                                                <option>Auto (Recommended)</option>
                                                <option>1080p (High)</option>
                                                <option>720p (Medium)</option>
                                                <option>480p (Data Saver)</option>
                                            </select>
                                        </div>
                                        <div className="p-4 bg-black border border-white/5 rounded-2xl">
                                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2">Default Speed</label>
                                            <select value={prefs.defaultSpeed} onChange={(e) => setPrefs({...prefs, defaultSpeed: e.target.value})} className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/50">
                                                <option>0.75x</option>
                                                <option>1x (Normal)</option>
                                                <option>1.25x</option>
                                                <option>1.5x</option>
                                                <option>2x</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 pt-6 border-t border-white/5 flex justify-end">
                                    <button onClick={handleSavePreferences} disabled={saving} className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg disabled:opacity-50">
                                        {saving ? <Loader2 size={16} className="animate-spin inline" /> : 'Save Preferences'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* 5. DOWNLOADS TAB */}
                    {activeTab === 'downloads' && (
                        <motion.div key="downloads" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                            <div className="p-8 bg-[#0a0a0a] border border-white/5 rounded-3xl">
                                <h2 className="text-xl font-bold mb-6 border-b border-white/5 pb-4">Offline Viewing</h2>
                                
                                <div className="space-y-6 max-w-2xl">
                                    <div className="flex items-center justify-between p-4 bg-black border border-white/5 rounded-2xl">
                                        <div>
                                            <h4 className="font-bold text-sm">Download over Wi-Fi only</h4>
                                            <p className="text-xs text-zinc-500 mt-1">Prevent downloading large course files when using cellular data.</p>
                                        </div>
                                        <div onClick={() => setPrefs({...prefs, wifiOnly: !prefs.wifiOnly})} className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${prefs.wifiOnly ? 'bg-blue-500' : 'bg-zinc-800'}`}>
                                            <motion.div layout className="w-4 h-4 bg-white rounded-full shadow-sm" style={{ marginLeft: prefs.wifiOnly ? '24px' : '0px' }} />
                                        </div>
                                    </div>

                                    <div className="p-4 bg-black border border-white/5 rounded-2xl">
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2">Video Download Quality</label>
                                        <select value={prefs.downloadQuality} onChange={(e) => setPrefs({...prefs, downloadQuality: e.target.value})} className="w-full sm:w-1/2 bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-blue-500/50">
                                            <option value="High">High (1080p) - Takes more storage</option>
                                            <option value="Standard">Standard (720p) - Recommended</option>
                                            <option value="Data Saver">Data Saver (480p) - Faster downloads</option>
                                        </select>
                                    </div>

                                    <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl flex items-center justify-between">
                                        <div>
                                            <h4 className="font-bold text-sm text-red-400">Clear Download Cache</h4>
                                            <p className="text-xs text-red-400/60 mt-1">Delete all offline videos to free up device storage.</p>
                                        </div>
                                        <button onClick={handleClearCache} className="px-4 py-2 bg-red-500/10 text-red-500 rounded-lg text-xs font-bold hover:bg-red-500 hover:text-white transition-colors">
                                            Clear Data
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-8 pt-6 border-t border-white/5 flex justify-end">
                                    <button onClick={handleSavePreferences} disabled={saving} className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all disabled:opacity-50">
                                        Save Settings
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* 6. APPEARANCE TAB (PREMIUM) */}
                    {activeTab === 'appearance' && (
                        <motion.div key="appearance" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                            <div className="p-8 bg-[#0a0a0a] border border-white/5 rounded-3xl">
                                <h2 className="text-xl font-bold mb-6 border-b border-white/5 pb-4">Appearance & Accessibility</h2>
                                
                                <div className="space-y-6 max-w-2xl">
                                    <div className="p-4 bg-black border border-white/5 rounded-2xl">
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-3">Platform Theme</label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <button onClick={() => setPrefs({...prefs, theme: 'dark'})} className={`p-4 border rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-colors ${prefs.theme === 'dark' ? 'bg-zinc-800 border-emerald-500 text-white' : 'bg-transparent border-white/10 text-zinc-500 hover:border-white/30'}`}>
                                                <div className="w-4 h-4 rounded-full bg-black border border-white/20"/> Dark Mode
                                            </button>
                                            <button onClick={() => setPrefs({...prefs, theme: 'light'})} className={`p-4 border rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-colors ${prefs.theme === 'light' ? 'bg-zinc-200 border-emerald-500 text-black' : 'bg-transparent border-white/10 text-zinc-500 hover:border-white/30'}`}>
                                                <div className="w-4 h-4 rounded-full bg-white border border-black/20"/> Light Mode
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-black border border-white/5 rounded-2xl">
                                        <div>
                                            <h4 className="font-bold text-sm">Reduce Motion</h4>
                                            <p className="text-xs text-zinc-500 mt-1">Disable complex animations and transitions across the platform.</p>
                                        </div>
                                        <div onClick={() => setPrefs({...prefs, reduceMotion: !prefs.reduceMotion})} className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${prefs.reduceMotion ? 'bg-emerald-500' : 'bg-zinc-800'}`}>
                                            <motion.div layout className="w-4 h-4 bg-white rounded-full shadow-sm" style={{ marginLeft: prefs.reduceMotion ? '24px' : '0px' }} />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-black border border-white/5 rounded-2xl">
                                        <div>
                                            <h4 className="font-bold text-sm">High Contrast Mode</h4>
                                            <p className="text-xs text-zinc-500 mt-1">Increase text legibility and border visibility.</p>
                                        </div>
                                        <div onClick={() => setPrefs({...prefs, highContrast: !prefs.highContrast})} className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${prefs.highContrast ? 'bg-emerald-500' : 'bg-zinc-800'}`}>
                                            <motion.div layout className="w-4 h-4 bg-white rounded-full shadow-sm" style={{ marginLeft: prefs.highContrast ? '24px' : '0px' }} />
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 pt-6 border-t border-white/5 flex justify-end">
                                    <button onClick={handleSavePreferences} disabled={saving} className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg disabled:opacity-50">
                                        Apply Appearance
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* 7. NOTIFICATIONS TAB */}
                    {activeTab === 'notifications' && (
                        <motion.div key="notifications" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                            <div className="p-8 bg-[#0a0a0a] border border-white/5 rounded-3xl">
                                <h2 className="text-xl font-bold mb-6 border-b border-white/5 pb-4">Study Reminders & Alerts</h2>
                                
                                <div className="space-y-4 max-w-2xl">
                                    <div className="flex items-center justify-between p-5 bg-black border border-white/5 rounded-2xl">
                                        <div>
                                            <h4 className="font-bold text-sm">Weekly Learning Reminders</h4>
                                            <p className="text-xs text-zinc-500 mt-1">Receive an email to help you maintain your learning streak.</p>
                                        </div>
                                        <div onClick={() => setPrefs({...prefs, weeklyReminders: !prefs.weeklyReminders})} className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${prefs.weeklyReminders ? 'bg-emerald-500' : 'bg-zinc-800'}`}>
                                            <motion.div layout className="w-4 h-4 bg-white rounded-full shadow-sm" style={{ marginLeft: prefs.weeklyReminders ? '24px' : '0px' }} />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-5 bg-black border border-white/5 rounded-2xl">
                                        <div>
                                            <h4 className="font-bold text-sm">Q&A Responses</h4>
                                            <p className="text-xs text-zinc-500 mt-1">Notify me when an instructor or student replies to my question.</p>
                                        </div>
                                        <div onClick={() => setPrefs({...prefs, qaReplies: !prefs.qaReplies})} className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${prefs.qaReplies ? 'bg-emerald-500' : 'bg-zinc-800'}`}>
                                            <motion.div layout className="w-4 h-4 bg-white rounded-full shadow-sm" style={{ marginLeft: prefs.qaReplies ? '24px' : '0px' }} />
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 pt-6 border-t border-white/5 flex justify-end">
                                    <button onClick={handleSavePreferences} disabled={saving} className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg disabled:opacity-50">
                                        Save Preferences
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>
        </div>
      </main>
    </div>
  )
}