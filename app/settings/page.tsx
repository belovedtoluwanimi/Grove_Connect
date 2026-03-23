'use client'

import React, { useState, useEffect } from 'react'
import { 
  User, Shield, Camera, Lock, Key, Smartphone, 
  Loader2, ArrowLeft, CheckCircle2, AlertCircle
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/app/utils/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'

export default function StudentSettingsPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null)

  // User State
  const [user, setUser] = useState<any>(null)
  const [fullName, setFullName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [email, setEmail] = useState('')

  // Security State
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/auth')
      
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      
      setUser(user)
      setEmail(user.email || '')
      setFullName(profile?.full_name || user.user_metadata?.full_name || '')
      setAvatarUrl(profile?.avatar_url || user.user_metadata?.avatar_url || '')
      setLoading(false)
    }
    fetchUser()
  }, [router, supabase])

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 4000)
  }

  // --- HANDLERS ---

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      // Update Auth Metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: fullName, avatar_url: avatarUrl }
      })
      if (authError) throw authError

      // Update Public Profile Table
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: user.id,
        full_name: fullName,
        avatar_url: avatarUrl,
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

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPassword) return showMessage('Please enter a new password', 'error')
    
    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      
      showMessage('Password updated successfully!', 'success')
      setCurrentPassword('')
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
      
      // Assumes you have an 'avatars' bucket in Supabase storage
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file)
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName)
      setAvatarUrl(publicUrl)
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
      {/* Background Accents */}
      <div className="fixed top-[-20%] left-[-10%] w-[500px] h-[500px] bg-green-900/10 rounded-full blur-[128px] pointer-events-none z-0" />
      
      {/* Top Bar */}
      <header className="sticky top-0 z-50 bg-[#050505]/80 backdrop-blur-xl border-b border-white/5 h-20 flex items-center px-6 lg:px-12">
         <Link href="/dashboard" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
            <span className="font-bold text-sm">Back to Dashboard</span>
         </Link>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto p-6 lg:p-10 pt-12">
        <div className="mb-10">
            <h1 className="text-4xl font-bold text-white mb-2">Account Settings</h1>
            <p className="text-zinc-400">Manage your profile, security, and preferences.</p>
        </div>

        {/* Toast Message */}
        <AnimatePresence>
            {message && (
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className={`mb-6 p-4 rounded-xl border flex items-center gap-3 ${message.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                    {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                    <span className="text-sm font-bold">{message.text}</span>
                </motion.div>
            )}
        </AnimatePresence>

        <div className="flex flex-col lg:flex-row gap-10">
            
            {/* Sidebar Tabs */}
            <aside className="w-full lg:w-64 shrink-0">
                <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto no-scrollbar">
                    <button onClick={() => setActiveTab('profile')} className={`flex items-center gap-3 px-5 py-4 rounded-2xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'profile' ? 'bg-white text-black shadow-lg' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}>
                        <User size={18} /> Profile Details
                    </button>
                    <button onClick={() => setActiveTab('security')} className={`flex items-center gap-3 px-5 py-4 rounded-2xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'security' ? 'bg-white text-black shadow-lg' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}>
                        <Shield size={18} /> Security & Password
                    </button>
                </div>
            </aside>

            {/* Content Area */}
            <div className="flex-1">
                <AnimatePresence mode="wait">
                    
                    {/* PROFILE TAB */}
                    {activeTab === 'profile' && (
                        <motion.form key="profile" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleUpdateProfile} className="bg-neutral-900/40 backdrop-blur-md border border-white/5 rounded-3xl p-8 shadow-2xl">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><User className="text-green-500"/> Public Profile</h2>
                            
                            {/* Avatar Upload */}
                            <div className="flex items-center gap-6 mb-8">
                                <div className="relative w-24 h-24 rounded-full bg-neutral-800 border-2 border-white/10 overflow-hidden group">
                                    {avatarUrl ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : <User size={40} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-zinc-600" />}
                                    <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer cursor-pointer">
                                        <Camera size={24} className="text-white" />
                                        <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={saving} />
                                    </label>
                                </div>
                                <div>
                                    <h3 className="font-bold text-white">Profile Picture</h3>
                                    <p className="text-xs text-zinc-500 mt-1">JPG, GIF or PNG. Max size of 2MB.</p>
                                </div>
                            </div>

                            <div className="space-y-5">
                                <div>
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">Full Name</label>
                                    <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500 transition-colors" placeholder="John Doe" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">Email Address</label>
                                    <input type="email" value={email} disabled className="w-full bg-white/5 border border-transparent rounded-xl px-4 py-3 text-zinc-400 cursor-not-allowed" />
                                    <p className="text-[10px] text-zinc-500 mt-2">Email cannot be changed directly. Contact support if needed.</p>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-white/5 flex justify-end">
                                <button type="submit" disabled={saving} className="px-8 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition-all disabled:opacity-50 flex items-center gap-2">
                                    {saving && <Loader2 size={16} className="animate-spin" />} Save Changes
                                </button>
                            </div>
                        </motion.form>
                    )}

                    {/* SECURITY TAB */}
                    {activeTab === 'security' && (
                        <motion.div key="security" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                            
                            {/* Change Password */}
                            <form onSubmit={handleUpdatePassword} className="bg-neutral-900/40 backdrop-blur-md border border-white/5 rounded-3xl p-8 shadow-2xl">
                                <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Key className="text-blue-500"/> Change Password</h2>
                                <div className="space-y-5">
                                    <div>
                                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">New Password</label>
                                        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors" placeholder="••••••••" minLength={6} />
                                    </div>
                                </div>
                                <div className="mt-8 pt-6 border-t border-white/5 flex justify-end">
                                    <button type="submit" disabled={saving} className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all disabled:opacity-50 flex items-center gap-2">
                                        {saving && <Loader2 size={16} className="animate-spin" />} Update Password
                                    </button>
                                </div>
                            </form>

                            {/* 2-Factor Authentication (UI Only) */}
                            <div className="bg-neutral-900/40 backdrop-blur-md border border-white/5 rounded-3xl p-8 shadow-2xl">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h2 className="text-xl font-bold mb-2 flex items-center gap-2"><Smartphone className="text-purple-500"/> Two-Factor Authentication</h2>
                                        <p className="text-sm text-zinc-400 max-w-sm">Add an extra layer of security to your account by requiring a code from your mobile device when logging in.</p>
                                    </div>
                                    <button 
                                        onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${twoFactorEnabled ? 'bg-green-500' : 'bg-zinc-700'}`}
                                    >
                                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>
                                {twoFactorEnabled && (
                                    <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl text-sm text-purple-200 flex items-center gap-3">
                                        <Lock size={18} className="text-purple-400 shrink-0" />
                                        <span>2FA is currently in beta. You will be prompted to scan a QR code on your next login.</span>
                                    </div>
                                )}
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
