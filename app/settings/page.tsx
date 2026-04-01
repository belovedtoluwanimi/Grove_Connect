'use client'

import React, { useState, useEffect } from 'react'
import { 
  User, Shield, Camera, Lock, Key, Smartphone, 
  Loader2, ArrowLeft, CheckCircle2, AlertCircle,
  MonitorPlay, HardDriveDownload, Bell, Edit
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/app/utils/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'

export default function StudentSettingsPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'playback' | 'downloads' | 'notifications'>('profile')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null)

  // User State
  const [user, setUser] = useState<any>(null)
  const [profileDraft, setProfileDraft] = useState<any>({})
  
  // Security State
  const [newPassword, setNewPassword] = useState('')
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)

  // Premium Learner Preferences State
  const [prefs, setPrefs] = useState({
      autoplay: true,
      defaultSpeed: '1x',
      defaultQuality: 'Auto',
      captions: false,
      wifiOnly: true,
      downloadQuality: 'Standard',
      weeklyReminders: true,
      qaReplies: true
  })

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
      
      // If you have a student_prefs JSON column in Supabase, you would load it here:
      // if (profile?.student_prefs) setPrefs(profile.student_prefs)
      
      setTwoFactorEnabled(profile?.two_factor_enabled || false)
      setLoading(false)
    }
    fetchUser()
  }, [router, supabase])

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 4000)
  }

  // --- HANDLERS ---

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
          // In production, save 'prefs' to a JSONB column named 'student_prefs' in your profiles table
          /*
          const { error } = await supabase.from('profiles').update({ student_prefs: prefs }).eq('id', user.id)
          if (error) throw error
          */
          
          // Simulating network delay for the MVP
          await new Promise(r => setTimeout(r, 800))
          showMessage('Learning preferences saved!', 'success')
      } catch (err: any) {
          showMessage('Failed to save preferences.', 'error')
      } finally {
          setSaving(false)
      }
  }

  const handleUpdatePassword = async () => {
    if (!newPassword || newPassword.length < 6) return showMessage('Password must be at least 6 characters', 'error')
    
    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      
      showMessage('Password updated successfully!', 'success')
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
      showMessage('Avatar uploaded! Click Save to apply.', 'success')
    } catch (err: any) {
      showMessage(err.message || 'Failed to upload image', 'error')
    } finally {
      setSaving(false)
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

      <main className="relative z-10 max-w-6xl mx-auto p-6 lg:p-10 pt-12">
        <div className="mb-10">
            <h1 className="text-4xl font-black text-white mb-2">Account Settings</h1>
            <p className="text-zinc-400">Manage your learning environment and profile details.</p>
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
                ].map((tab) => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${ activeTab === tab.id ? 'bg-zinc-800/80 text-white shadow-sm border border-white/10' : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent' }`}>
                    <tab.icon size={18} className={activeTab === tab.id ? "text-emerald-400" : "text-zinc-500"} /> {tab.label}
                  </button>
                ))}

                <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-4 mb-2 mt-6 hidden lg:block">App Settings</h3>
                {[
                  { id: 'playback', label: 'Video & Playback', icon: MonitorPlay },
                  { id: 'downloads', label: 'Offline Downloads', icon: HardDriveDownload },
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

                            <div className="p-8 bg-[#0a0a0a] border border-white/5 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                                <div>
                                    <h2 className="text-lg font-bold mb-1 flex items-center gap-2">Two-Factor Authentication {twoFactorEnabled && <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] uppercase tracking-widest rounded border border-emerald-500/20">Active</span>}</h2>
                                    <p className="text-sm text-zinc-400 max-w-sm">Secure your learner account with an email OTP code.</p>
                                </div>
                                <button className="px-6 py-2.5 bg-zinc-800 text-white rounded-xl text-sm font-bold hover:bg-zinc-700 transition-colors border border-white/5 whitespace-nowrap">
                                    {twoFactorEnabled ? 'Manage 2FA' : 'Enable 2FA'}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* 3. PLAYBACK TAB (PREMIUM) */}
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
                                            <p className="text-xs text-zinc-500 mt-1">Enable English (Auto-generated) closed captions by default.</p>
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
                                    <button onClick={handleSavePreferences} disabled={saving} className="px-6 py-2.5 bg-white text-black font-bold rounded-xl transition-all shadow-lg hover:bg-zinc-200">
                                        Save Preferences
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* 4. DOWNLOADS TAB (PREMIUM) */}
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
                                            <p className="text-xs text-red-400/60 mt-1">Delete all offline videos to free up device storage. (0 MB used)</p>
                                        </div>
                                        <button className="px-4 py-2 bg-red-500/10 text-red-500 rounded-lg text-xs font-bold hover:bg-red-500 hover:text-white transition-colors">
                                            Clear Data
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-8 pt-6 border-t border-white/5 flex justify-end">
                                    <button onClick={handleSavePreferences} disabled={saving} className="px-6 py-2.5 bg-white text-black font-bold rounded-xl transition-all shadow-lg hover:bg-zinc-200">
                                        Save Preferences
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* 5. NOTIFICATIONS TAB */}
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
                                    <button onClick={handleSavePreferences} disabled={saving} className="px-6 py-2.5 bg-white text-black font-bold rounded-xl transition-all shadow-lg hover:bg-zinc-200">
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