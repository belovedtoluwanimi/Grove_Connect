'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { 
  LayoutDashboard, BookOpen, Users, DollarSign, Settings, 
  Bell, Search, Plus, MoreVertical, LogOut, Loader2,
  TrendingUp, ArrowUpRight, CreditCard, Lock, User, Image as ImageIcon,
  Calendar, ChevronDown, ChevronLeft, Globe, Shield, Smartphone, Trash2, Edit, MapPin, CheckCircle2, AlertCircle, X, QrCode
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/app/utils/supabase/client'
import API_URL from '@/app/utils/api'
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line 
} from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'

// --- TYPES ---
type Course = {
  id: string
  title: string
  status: 'Draft' | 'Review' | 'Active'
  price: number
  students_count: number
  total_revenue: number
  created_at: string
  views?: number 
}

type UserProfile = {
  id: string
  full_name: string
  email: string
  avatar_url?: string
  bio?: string
  nationality?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zip?: string
  payout_method?: string
  two_factor_enabled?: boolean
}

type Notification = {
  id: string
  title: string
  message: string
  time: string
  read: boolean
  type: 'info' | 'success' | 'warning'
}

// --- CONSTANTS ---
const COUNTRIES = [
  "United States", "United Kingdom", "Nigeria", "India", "Canada", "Germany", "Australia", 
  "France", "Brazil", "Japan", "South Africa", "Kenya", "Ghana", "Singapore", "United Arab Emirates"
].sort();

const PAYOUT_MAPPING: Record<string, string[]> = {
  'United States': ['Stripe', 'Bank Transfer (ACH)', 'PayPal'],
  'United Kingdom': ['Stripe', 'Bank Transfer (BACS)', 'PayPal'],
  'Nigeria': ['Flutterwave', 'Paystack', 'Bank Transfer', 'Crypto (USDT)'],
  'India': ['Razorpay', 'PayPal', 'Bank Transfer'],
  'default': ['PayPal', 'International Wire', 'Crypto (USDT)']
}

// --- TOAST COMPONENT ---
const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => (
  <motion.div 
    initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
    className={`fixed bottom-8 right-8 z-[100] flex items-center gap-4 pl-4 pr-6 py-4 rounded-xl shadow-2xl backdrop-blur-xl border border-white/10 ${
      type === 'success' ? 'bg-green-900/90 text-white' : 'bg-red-900/90 text-white'
    }`}
  >
    <div className={`p-2 rounded-full ${type === 'success' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
      {type === 'success' ? <CheckCircle2 size={20} className="text-green-400" /> : <AlertCircle size={20} className="text-red-400" />}
    </div>
    <div>
      <h4 className="font-bold text-sm">{type === 'success' ? 'Success' : 'Error'}</h4>
      <p className="text-xs opacity-90">{message}</p>
    </div>
    <button onClick={onClose} className="ml-2 opacity-50 hover:opacity-100"><X size={14} /></button>
  </motion.div>
)

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  
  // --- STATE ---
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  
  // UI State
  const [currentView, setCurrentView] = useState<'overview' | 'courses' | 'settings' | 'course_detail'>('overview')
  const [settingsTab, setSettingsTab] = useState<'profile' | 'security' | 'payouts'>('profile')
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'} | null>(null)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  
  // 2FA State
  const [show2FASetup, setShow2FASetup] = useState(false)
  const [twoFACode, setTwoFACode] = useState("")

  // Mock Notifications
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: '1', title: 'Payout Processed', message: 'Your earnings of $1,240 have been sent.', time: '2h ago', read: false, type: 'success' },
    { id: '2', title: 'New Review', message: 'Sarah J. gave your course 5 stars!', time: '5h ago', read: false, type: 'info' },
    { id: '3', title: 'System Alert', message: 'Please update your tax information.', time: '1d ago', read: true, type: 'warning' },
  ])

  // --- HELPERS ---
  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  // --- 1. DATA ENGINE ---
  useEffect(() => {
    const init = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return router.push('/auth')

      // Fetch Profile
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', authUser.id).single()
      setUser(profile)

      // Fetch Courses
      const { data: courseData } = await supabase
        .from('courses')
        .select('*')
        .eq('instructor_id', authUser.id)
        .order('created_at', { ascending: false })

      if (courseData) {
        // Calculate Real Revenue
        const processedCourses = courseData.map((c: any) => ({
            ...c,
            total_revenue: c.total_revenue || (c.price * (c.students_count || 0))
        }))
        setCourses(processedCourses)
      }
      setLoading(false)
    }
    init()
  }, [router])

  // --- 2. ANALYTICS GENERATOR ---
  const analyticsData = useMemo(() => {
    const totalRev = courses.reduce((acc, c) => acc + c.total_revenue, 0)
    const totalStudents = courses.reduce((acc, c) => acc + (c.students_count || 0), 0)
    
    const months = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan']
    return months.map((m, i) => {
        const factor = (i + 1) / 6 
        return {
            name: m,
            revenue: Math.floor(totalRev * factor * 0.8) + Math.random() * 500,
            students: Math.floor(totalStudents * factor * 0.9)
        }
    })
  }, [courses])

  const overallStats = {
      revenue: courses.reduce((acc, c) => acc + c.total_revenue, 0),
      students: courses.reduce((acc, c) => acc + (c.students_count || 0), 0),
      rating: 4.8,
      courses: courses.length
  }

  // --- HANDLERS ---

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return
    setIsUploadingAvatar(true)
    
    const formData = new FormData()
    formData.append('file', e.target.files[0])

    try {
      const res = await fetch(`${API_URL}/api/upload`, { method: 'POST', body: formData })
      if(!res.ok) throw new Error()
      const { url } = await res.json()
      
      await supabase.from('profiles').update({ avatar_url: url }).eq('id', user?.id)
      setUser(prev => prev ? { ...prev, avatar_url: url } : null)
      showToast("Profile picture updated successfully!", 'success')
    } catch (err) {
      showToast("Upload failed. Try a smaller image.", 'error')
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return
    const { error } = await supabase.from('profiles').update(updates).eq('id', user.id)
    if (!error) {
        setUser({ ...user, ...updates })
        showToast("Profile information saved.", 'success')
    } else {
        showToast("Failed to save settings.", 'error')
    }
  }

  const handleEnable2FA = () => {
      if(twoFACode === "123456") {
          updateProfile({ two_factor_enabled: true })
          setShow2FASetup(false)
          showToast("Two-Factor Authentication Enabled!", 'success')
      } else {
          showToast("Invalid code. Try again.", 'error')
      }
  }

  const handleEditCourse = (id: string) => router.push(`/admin/create-course?edit=${id}`)
  
  const handleDeleteCourse = async (id: string) => {
      if(!confirm("Are you sure? This action is irreversible.")) return
      await supabase.from('courses').delete().eq('id', id)
      setCourses(prev => prev.filter(c => c.id !== id))
      showToast("Course deleted.", 'success')
  }

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-green-500"><Loader2 className="animate-spin w-10 h-10" /></div>

  return (
    <div className="min-h-screen bg-black flex text-white overflow-hidden font-sans selection:bg-green-500/30">
      <AnimatePresence>{toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}</AnimatePresence>

      {/* SIDEBAR */}
      <aside className="w-72 bg-neutral-950 border-r border-white/5 hidden lg:flex flex-col z-20 shadow-2xl">
        <div className="p-8 pb-4">
          <h2 className="text-2xl font-bold tracking-tighter flex items-center gap-2">GROVE<span className="text-green-500 text-xs bg-green-500/10 px-2 py-1 rounded border border-green-500/20">AGENCY</span></h2>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <NavButton active={currentView === 'overview'} onClick={() => setCurrentView('overview')} icon={LayoutDashboard}>Dashboard</NavButton>
          <NavButton active={currentView === 'courses' || currentView === 'course_detail'} onClick={() => setCurrentView('courses')} icon={BookOpen}>My Courses</NavButton>
          <NavButton active={currentView === 'settings'} onClick={() => setCurrentView('settings')} icon={Settings}>Settings</NavButton>
        </nav>

        <div className="p-4 m-4 bg-neutral-900/50 rounded-xl border border-white/5">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-green-500 to-emerald-700 flex items-center justify-center font-bold text-sm shadow-lg overflow-hidden shrink-0">
                 {user?.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover" /> : user?.full_name?.charAt(0)}
              </div>
              <div className="overflow-hidden">
                 <p className="text-sm font-bold truncate text-white">{user?.full_name}</p>
                 <p className="text-xs text-gray-500 truncate capitalize">{user?.nationality || 'Global'}</p>
              </div>
           </div>
           <button onClick={async () => { await supabase.auth.signOut(); router.push('/auth') }} className="mt-4 w-full flex items-center justify-center gap-2 text-xs text-red-400 hover:bg-red-500/10 py-2 rounded-lg transition-colors">
             <LogOut size={14} /> Sign Out
           </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col relative overflow-y-auto h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900 via-black to-black">
        
        {/* Header */}
        <header className="h-20 border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0 z-10 flex items-center justify-between px-8">
          <div className="flex items-center gap-4 text-gray-400 bg-white/5 px-4 py-2.5 rounded-full border border-white/10 w-96">
            <Search size={16} />
            <input type="text" placeholder="Search analytics..." className="bg-transparent outline-none text-sm w-full text-white" />
          </div>
          <div className="flex items-center gap-6">
             <div className="relative">
                <button onClick={() => setNotificationsOpen(!notificationsOpen)} className="relative text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full">
                  <Bell size={20} />
                  {notifications.some(n => !n.read) && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
                </button>
                {notificationsOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-neutral-900 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                        <div className="p-4 border-b border-white/5 font-bold text-sm">Notifications</div>
                        <div className="max-h-64 overflow-y-auto">
                            {notifications.map(n => (
                                <div key={n.id} className={`p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer ${n.read ? 'opacity-50' : 'opacity-100'}`}>
                                    <div className="flex justify-between mb-1">
                                        <h5 className="text-sm font-bold text-white">{n.title}</h5>
                                        <span className="text-[10px] text-gray-500">{n.time}</span>
                                    </div>
                                    <p className="text-xs text-gray-400">{n.message}</p>
                                </div>
                            ))}
                        </div>
                        <button className="w-full py-2 text-xs text-center text-gray-500 hover:text-white hover:bg-white/5">Mark all as read</button>
                    </div>
                )}
             </div>
             
             <Link href="/admin/create-course">
               <button className="bg-white text-black px-5 py-2 rounded-full text-sm font-bold hover:bg-gray-200 transition-colors shadow-lg flex items-center gap-2">
                 <Plus size={16} /> New Course
               </button>
             </Link>
          </div>
        </header>

        <div className="p-8 space-y-8 max-w-[1600px] mx-auto w-full">
          
          {/* === OVERVIEW VIEW === */}
          {currentView === 'overview' && (
            <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="space-y-8">
              <h1 className="text-3xl font-bold text-white">Performance Overview</h1>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="Total Revenue" value={`$${overallStats.revenue.toLocaleString()}`} icon={DollarSign} trend="+12%" trendUp={true} />
                <StatCard label="Total Enrollments" value={overallStats.students.toLocaleString()} icon={Users} trend="+8%" trendUp={true} />
                <StatCard label="Active Courses" value={overallStats.courses.toString()} icon={BookOpen} trend="+1" trendUp={true} />
                <StatCard label="Avg. Rating" value="4.8" icon={TrendingUp} trend="+0.1" trendUp={true} />
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[400px]">
                 {/* Revenue Chart */}
                 <div className="lg:col-span-2 bg-neutral-900/40 border border-white/5 p-6 rounded-2xl relative">
                    <h3 className="text-lg font-bold mb-6 text-white">Revenue Growth</h3>
                    {/* UPDATED HEIGHT TO 100% */}
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={analyticsData}>
                            <defs><linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/><stop offset="95%" stopColor="#22c55e" stopOpacity={0}/></linearGradient></defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                            <XAxis dataKey="name" stroke="#666" tickLine={false} axisLine={false} />
                            <YAxis stroke="#666" tickLine={false} axisLine={false} tickFormatter={(v)=>`$${v}`} />
                            <Tooltip contentStyle={{backgroundColor:'#000', border:'1px solid #333', borderRadius:'8px'}} />
                            <Area type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={3} fill="url(#colorRev)" />
                        </AreaChart>
                    </ResponsiveContainer>
                 </div>

                 {/* Enrollments Bar Chart */}
                 <div className="bg-neutral-900/40 border border-white/5 p-6 rounded-2xl">
                    <h3 className="text-lg font-bold mb-6 text-white">Monthly Enrollments</h3>
                    {/* UPDATED HEIGHT TO 100% */}
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analyticsData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                            <XAxis dataKey="name" stroke="#666" tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={{backgroundColor:'#000', border:'1px solid #333', borderRadius:'8px'}} cursor={{fill:'rgba(255,255,255,0.05)'}} />
                            <Bar dataKey="students" fill="#fff" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                 </div>
              </div>

              <h3 className="text-xl font-bold pt-4 text-white">Recent Courses</h3>
              <CoursesTable courses={courses.slice(0, 5)} onAction={handleEditCourse} onDelete={handleDeleteCourse} onView={(c: Course) => { setSelectedCourse(c); setCurrentView('course_detail') }} />
            </motion.div>
          )}

          {/* === COURSES VIEW === */}
          {currentView === 'courses' && (
             <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-white">My Courses</h1>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-neutral-900 border border-white/10 rounded-lg text-sm text-gray-400">Filter</button>
                        <button className="px-4 py-2 bg-neutral-900 border border-white/10 rounded-lg text-sm text-gray-400">Sort</button>
                    </div>
                </div>
                <CoursesTable courses={courses} onAction={handleEditCourse} onDelete={handleDeleteCourse} onView={(c: Course) => { setSelectedCourse(c); setCurrentView('course_detail') }} />
             </motion.div>
          )}

          {/* === COURSE DETAIL ANALYTICS === */}
          {currentView === 'course_detail' && selectedCourse && (
             <motion.div initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} className="space-y-8">
                <button onClick={() => setCurrentView('courses')} className="flex items-center gap-2 text-gray-400 hover:text-white"><ChevronLeft size={16}/> Back to Courses</button>
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-white">{selectedCourse.title}</h1>
                        <p className="text-gray-400 mt-1">Status: <span className="text-green-400 font-bold uppercase">{selectedCourse.status}</span> • Created: {new Date(selectedCourse.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => handleEditCourse(selectedCourse.id)} className="bg-white text-black px-4 py-2 rounded-lg font-bold text-sm hover:bg-gray-200">Edit Content</button>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard label="Revenue" value={`$${selectedCourse.total_revenue}`} icon={DollarSign} trendUp={true} trend="+5%" />
                    <StatCard label="Active Students" value={selectedCourse.students_count} icon={Users} trendUp={true} trend="+12" />
                    <StatCard label="Price Point" value={`$${selectedCourse.price}`} icon={CreditCard} trendUp={true} trend="Fixed" />
                </div>
                <div className="bg-neutral-900/40 border border-white/5 p-6 rounded-2xl h-[400px]">
                    <h3 className="text-lg font-bold mb-6">Engagement Trend</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={analyticsData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                            <XAxis dataKey="name" stroke="#666" />
                            <YAxis stroke="#666" />
                            <Tooltip contentStyle={{backgroundColor:'#000'}} />
                            <Line type="monotone" dataKey="students" stroke="#3b82f6" strokeWidth={3} dot={{r:4, fill:'#3b82f6'}} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
             </motion.div>
          )}

          {/* === SETTINGS VIEW === */}
          {currentView === 'settings' && user && (
            <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="grid grid-cols-1 lg:grid-cols-4 gap-8">
               <div className="lg:col-span-1 space-y-1">
                  {['profile', 'security', 'payouts'].map((tab) => (
                     <button key={tab} onClick={() => setSettingsTab(tab as any)} className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium capitalize transition-all ${settingsTab === tab ? 'bg-white text-black font-bold' : 'text-gray-400 hover:bg-white/5'}`}>{tab}</button>
                  ))}
               </div>

               <div className="lg:col-span-3 bg-neutral-900/40 border border-white/5 rounded-2xl p-8 min-h-[600px]">
                  
                  {/* PROFILE SETTINGS */}
                  {settingsTab === 'profile' && (
                     <div className="space-y-8 animate-in fade-in">
                        <h3 className="text-xl font-bold border-b border-white/10 pb-4">Personal Information</h3>
                        
                        <div className="flex items-center gap-6">
                           <div className="w-24 h-24 rounded-full bg-neutral-800 border-2 border-dashed border-white/20 flex items-center justify-center relative overflow-hidden group">
                              {user.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover" /> : <ImageIcon className="text-gray-500" />}
                              <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                                {isUploadingAvatar ? <Loader2 className="animate-spin text-white" /> : <><Edit size={16} className="text-white mb-1"/><span className="text-[10px] font-bold text-white">CHANGE</span></>}
                                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                              </label>
                           </div>
                           <div><p className="font-bold text-lg">{user.full_name}</p><p className="text-sm text-gray-500">{user.email}</p></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Nationality</label>
                             <select className="w-full bg-black border border-white/10 rounded-lg p-3 outline-none focus:border-green-500" value={user.nationality || ''} onChange={(e) => updateProfile({ nationality: e.target.value })}>
                                <option value="" disabled>Select Country</option>
                                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                             </select>
                           </div>
                           <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Phone Number</label><input defaultValue={user.phone} onBlur={(e)=>updateProfile({phone:e.target.value})} className="w-full bg-black border border-white/10 rounded-lg p-3 outline-none focus:border-green-500" placeholder="+1 (555) 000-0000" /></div>
                           <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Address Line</label><input defaultValue={user.address} onBlur={(e)=>updateProfile({address:e.target.value})} className="w-full bg-black border border-white/10 rounded-lg p-3 outline-none focus:border-green-500" /></div>
                           <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">City</label><input defaultValue={user.city} onBlur={(e)=>updateProfile({city:e.target.value})} className="w-full bg-black border border-white/10 rounded-lg p-3 outline-none" /></div>
                              <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Zip Code</label><input defaultValue={user.zip} onBlur={(e)=>updateProfile({zip:e.target.value})} className="w-full bg-black border border-white/10 rounded-lg p-3 outline-none" /></div>
                           </div>
                        </div>
                        <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Bio</label><textarea defaultValue={user.bio} onBlur={(e)=>updateProfile({bio:e.target.value})} className="w-full h-32 bg-black border border-white/10 rounded-lg p-3 outline-none resize-none focus:border-green-500" /></div>
                        <div className="flex justify-end"><button onClick={()=>updateProfile({})} className="bg-white text-black px-6 py-2 rounded-lg font-bold text-sm hover:bg-gray-200">Save Changes</button></div>
                     </div>
                  )}

                  {/* SECURITY (2FA) */}
                  {settingsTab === 'security' && (
                     <div className="space-y-8 animate-in fade-in">
                        <h3 className="text-xl font-bold border-b border-white/10 pb-4">Security Settings</h3>
                        
                        {!show2FASetup && !user.two_factor_enabled ? (
                            <div className="bg-neutral-800/50 border border-white/10 p-6 rounded-xl flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-neutral-700 rounded-lg"><Shield size={24} className="text-green-400" /></div>
                                    <div><p className="font-bold text-white">Two-Factor Authentication</p><p className="text-xs text-gray-400">Add an extra layer of security to your account.</p></div>
                                </div>
                                <button onClick={() => setShow2FASetup(true)} className="px-4 py-2 bg-green-600 text-white text-xs font-bold rounded hover:bg-green-500">Enable 2FA</button>
                            </div>
                        ) : user.two_factor_enabled ? (
                            <div className="bg-green-900/20 border border-green-500/30 p-6 rounded-xl flex items-center gap-4">
                                <CheckCircle2 size={24} className="text-green-500" />
                                <div><p className="font-bold text-green-400">2FA is Enabled</p><p className="text-xs text-green-200/70">Your account is secure.</p></div>
                            </div>
                        ) : (
                            <div className="bg-neutral-800 p-6 rounded-xl border border-white/10 space-y-4">
                                <div className="flex items-center gap-2 text-sm font-bold text-white"><QrCode size={16}/> Scan QR Code</div>
                                <div className="w-32 h-32 bg-white mx-auto rounded p-2"><img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=otpauth://totp/GroveConnect:${user.email}?secret=JBSWY3DPEHPK3PXP`} alt="QR" /></div>
                                <p className="text-center text-xs text-gray-400">Scan with Google Authenticator</p>
                                <div className="flex gap-2">
                                    <input value={twoFACode} onChange={(e)=>setTwoFACode(e.target.value)} placeholder="Enter 6-digit code" className="flex-1 bg-black border border-white/10 rounded p-2 text-center tracking-widest font-mono" maxLength={6} />
                                    <button onClick={handleEnable2FA} className="bg-green-600 px-4 rounded font-bold text-sm">Verify</button>
                                </div>
                            </div>
                        )}

                        <div className="space-y-4 pt-4 border-t border-white/10">
                           <h4 className="text-sm font-bold text-gray-400 uppercase">Change Password</h4>
                           <input type="password" placeholder="Current Password" className="w-full bg-black border border-white/10 rounded-lg p-3 outline-none" />
                           <input type="password" placeholder="New Password" className="w-full bg-black border border-white/10 rounded-lg p-3 outline-none" />
                           <button className="bg-white text-black px-6 py-2 rounded-lg font-bold text-sm">Update Password</button>
                        </div>
                     </div>
                  )}

                  {/* PAYOUTS */}
                  {settingsTab === 'payouts' && (
                     <div className="space-y-6 animate-in fade-in">
                        <h3 className="text-xl font-bold border-b border-white/10 pb-4">Payout Preferences</h3>
                        <div className="p-4 bg-blue-900/10 border border-blue-500/20 rounded-lg mb-4">
                            <p className="text-sm text-blue-200"><Globe size={14} className="inline mr-2"/> Region: <strong>{user.nationality || 'Not Set'}</strong></p>
                        </div>
                        {(!user.nationality) ? (
                            <div className="text-center py-10 text-gray-500"><p>Please set your Nationality in the Profile tab to see payout options.</p></div>
                        ) : (
                            <div className="space-y-3">
                                {(PAYOUT_MAPPING[user.nationality] || PAYOUT_MAPPING['default']).map(method => (
                                    <label key={method} className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all ${user.payout_method === method ? 'bg-green-900/20 border-green-500' : 'bg-neutral-900 border-white/10 hover:border-white/30'}`}>
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white rounded-full"><CreditCard size={16} className="text-black"/></div>
                                            <span className="font-bold">{method}</span>
                                        </div>
                                        <input type="radio" name="payout" checked={user.payout_method === method} onChange={() => updateProfile({ payout_method: method })} className="accent-green-500 w-5 h-5" />
                                    </label>
                                ))}
                            </div>
                        )}
                     </div>
                  )}
               </div>
            </motion.div>
          )}

        </div>
      </main>
    </div>
  )
}

// --- SUB-COMPONENTS ---
const NavButton = ({ active, children, onClick, icon: Icon }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${active ? 'bg-white text-black shadow-lg font-bold' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
    <Icon size={18} className={active ? "text-black" : "text-gray-500"} /> {children}
  </button>
)

const StatCard = ({ label, value, icon: Icon, trend, trendUp }: any) => (
  <div className="bg-neutral-900/40 border border-white/5 p-6 rounded-2xl hover:bg-neutral-900/60 transition-colors group">
    <div className="flex justify-between items-start mb-4">
      <div className="p-3 bg-neutral-800 rounded-xl text-gray-400 group-hover:text-white transition-all"><Icon size={20} /></div>
      <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${trendUp ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
        {trendUp ? <TrendingUp size={12} /> : <ArrowUpRight size={12} className="rotate-90" />} {trend}
      </div>
    </div>
    <h3 className="text-3xl font-bold text-white mb-1">{value}</h3>
    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">{label}</p>
  </div>
)

// Define Props for CoursesTable
interface CoursesTableProps {
  courses: Course[];
  onAction: (id: string) => void;
  onDelete: (id: string) => void;
  onView?: (course: Course) => void;
}

const CoursesTable = ({ courses, onAction, onDelete, onView }: CoursesTableProps) => (
  <div className="bg-neutral-900/40 border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-neutral-950 text-xs uppercase text-gray-500 font-bold">
          <tr><th className="p-5">Course</th><th className="p-5">Status</th><th className="p-5">Price</th><th className="p-5">Students</th><th className="p-5">Revenue</th><th className="p-5"></th></tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {courses.map((course: Course) => (
            <tr key={course.id} onClick={() => onView && onView(course)} className="hover:bg-white/[0.02] transition-colors cursor-pointer group">
              <td className="p-5 font-bold text-white flex items-center gap-3"><div className="w-10 h-10 bg-neutral-800 rounded flex items-center justify-center"><BookOpen size={16} className="text-gray-500"/></div>{course.title}</td>
              <td className="p-5"><span className={`px-3 py-1 rounded-full text-[10px] uppercase font-bold ${course.status === 'Active' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>{course.status}</span></td>
              <td className="p-5 text-gray-300">${course.price}</td>
              <td className="p-5 text-gray-300">{course.students_count}</td>
              <td className="p-5 font-mono text-green-400 font-bold">${course.total_revenue}</td>
              <td className="p-5 text-right"><button onClick={(e) => { e.stopPropagation(); onAction(course.id) }} className="text-gray-500 hover:text-white mr-4"><Edit size={16} /></button><button onClick={(e) => { e.stopPropagation(); onDelete(course.id) }} className="text-gray-500 hover:text-red-400"><Trash2 size={16} /></button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)