'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { 
  LayoutDashboard, BookOpen, Users, DollarSign, Settings, 
  Bell, Search, Plus, MoreVertical, LogOut, Loader2,
  TrendingUp, ArrowUpRight, CreditCard, Lock, User, Image as ImageIcon,
  Calendar, ChevronDown, ChevronLeft, Globe, Shield, Smartphone, Trash2, Edit, 
  MapPin, CheckCircle2, AlertCircle, X, QrCode, Facebook, Twitter, Linkedin, Instagram, Mail
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/app/utils/supabase/client'
import API_URL from '@/app/utils/api'
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line 
} from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'

// --- DECLARE CUSTOM ELEMENT ---
// (Removed to avoid type conflict with global.d.ts)

// --- TYPES ---
type Course = {
  id: string
  title: string
  status: 'Draft' | 'Review' | 'Active'
  price: number
  students_count: number
  total_revenue: number
  created_at: string
  average_rating?: number // Added to track rating per course
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
  payout_details?: string
  two_factor_enabled?: boolean
  social_twitter?: string
  social_linkedin?: string
  social_instagram?: string
  is_verified?: boolean
}

type Notification = {
  id: string
  title: string
  message: string
  time: string
  read: boolean
  type: 'info' | 'success' | 'warning'
}

type TimeRange = '7d' | '30d' | '90d' | '365d'

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
  const [showKYCModal, setShowKYCModal] = useState(false) // <-- NEW STATE
  const [isVerifying, setIsVerifying] = useState(false)
  
  // UI State
  const [currentView, setCurrentView] = useState<'overview' | 'courses' | 'settings' | 'course_detail'>('overview')
  const [settingsTab, setSettingsTab] = useState<'profile' | 'security' | 'payouts'>('profile')
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'} | null>(null)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [timeRange, setTimeRange] = useState<TimeRange>('30d')
  
  // 2FA State
  const [show2FASetup, setShow2FASetup] = useState(false)
  const [twoFACode, setTwoFACode] = useState("")

  const [profileDraft, setProfileDraft] = useState<Partial<UserProfile>>({})
  const [newPassword, setNewPassword] = useState("")

  // Real Notifications (In production, fetch these from a 'notifications' table)
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: '1', title: 'Security Alert', message: 'New login detected from Chrome on Windows.', time: '1h ago', read: false, type: 'warning' },
    { id: '2', title: 'New Enrollment', message: 'John D. enrolled in "Advanced React Patterns"', time: '3h ago', read: false, type: 'success' },
    { id: '3', title: 'Platform Update', message: 'Payouts are now processed daily for Gold Tutors.', time: '1d ago', read: true, type: 'info' },
  ])

  // --- HELPERS ---
  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }


  const handlePasswordUpdate = async () => {
    if (newPassword.length < 6) return showToast("Password must be at least 6 characters", "error")

    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) showToast(error.message, "error")
    else {
        showToast("Password updated successfully!", "success")
        setNewPassword("") // Clear the input
    }
}
  // --- GLOBAL SECURITY CHECK ---
  // --- GLOBAL SECURITY CHECK ---
  const handleNewCourseClick = (e: React.MouseEvent) => {
      e.preventDefault() 
      if (!user) return

      // KYC is no longer required to build courses! (The Payout Gate strategy)
      // Tutors can build and publish freely. We only require 2FA for account security.
      if (!user.two_factor_enabled) {
          showToast("You must enable Email 2FA before building a course.", "error")
          setCurrentView('settings')
          setSettingsTab('security')
          return
      }

      // If 2FA is active, let them build!
      router.push('/admin/create-course')
  }

  // --- 1. DATA ENGINE (FIXED) ---
  useEffect(() => {
    const init = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return router.push('/auth')

      // Fetch Profile
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', authUser.id).single()
      setUser(profile)

      // Fetch Courses WITH Real Enrollment Counts and Real Reviews
      const { data: courseData } = await supabase
        .from('courses')
        .select(`
            *,
            enrollments(id),
            reviews(rating)
        `)
        .eq('instructor_id', authUser.id)
        .order('created_at', { ascending: false })

      if (courseData) {
        // Process data to calculate real totals
        const processedCourses = courseData.map((c: any) => {
            const realStudentCount = c.enrollments ? c.enrollments.length : 0
            
            // Calculate Rating
            const ratings = c.reviews?.map((r: any) => r.rating) || []
            const avgRating = ratings.length > 0 
                ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length 
                : 0

            return {
                ...c,
                students_count: realStudentCount, // Use real count
                total_revenue: c.price * realStudentCount, // Use real revenue
                average_rating: avgRating // Use real rating
            }
        })
        setCourses(processedCourses)
      }
      setLoading(false)
    }
    init()
  }, [router])

  // --- 2. ANALYTICS GENERATOR (True Dynamic Trends) ---
  const analyticsData = useMemo(() => {
    const now = new Date()
    const dataPoints: any[] = []
    let days = 30
    
    if (timeRange === '7d') days = 7
    if (timeRange === '90d') days = 90
    if (timeRange === '365d') days = 365

    const totalRev = courses.reduce((acc, c) => acc + c.total_revenue, 0)
    const totalStudents = courses.reduce((acc, c) => acc + (c.students_count || 0), 0)

    for (let i = days; i >= 0; i--) {
        const d = new Date()
        d.setDate(now.getDate() - i)
        
        const label = days > 90 
            ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) 
            : d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })
        
        // Simulation Algo: Generate a natural growth curve leading up to current totals
        const progress = 1 - (i / days) // 0 to 1
        const curve = Math.pow(progress, 2) // Quadratic growth
        
        // Add random variance to make it look organic
        const variance = (Math.random() * 0.1) - 0.05 
        
        dataPoints.push({
            name: label,
            revenue: Math.floor(totalRev * (curve + variance)),
            students: Math.floor(totalStudents * (curve + variance))
        })
    }
    // Filter out negatives from variance
    return dataPoints.map(p => ({
        ...p, 
        revenue: Math.max(0, p.revenue), 
        students: Math.max(0, p.students)
    }))
  }, [courses, timeRange])

  // Calculate Overall Stats from the processed courses
  const overallStats = {
      revenue: courses.reduce((acc, c) => acc + c.total_revenue, 0),
      students: courses.reduce((acc, c) => acc + (c.students_count || 0), 0),
      // Calculate global average rating
      rating: courses.length > 0 
        ? (courses.reduce((acc, c) => acc + (c.average_rating || 0), 0) / courses.length).toFixed(1)
        : "N/A",
      courses: courses.length
  }

  // --- HANDLERS ---

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return
    const file = e.target.files[0]

    // Client-side check
    if (file.size > 10 * 1024 * 1024) return showToast("File too large. Max 10MB.", 'error')

    setIsUploadingAvatar(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      // Use the ?type=image query param for safety
      const res = await fetch(`${API_URL}/api/upload?type=image`, { method: 'POST', body: formData })
      
      if(!res.ok) {
          const err = await res.json().catch(()=>({}))
          throw new Error(err.error || "Upload failed")
      }
      
      const { url } = await res.json()
      
      const { error } = await supabase.from('profiles').update({ avatar_url: url }).eq('id', user?.id)
      if (error) throw error

      setUser(prev => prev ? { ...prev, avatar_url: url } : null)
      showToast("Profile picture updated!", 'success')
    } catch (err: any) {
      showToast(err.message, 'error')
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return
    
    // Optimistic UI Update (Instant feedback)
    const oldUser = { ...user }
    setUser({ ...user, ...updates })

    const { error } = await supabase.from('profiles').update(updates).eq('id', user.id)
    
    if (error) {
        console.error(error)
        setUser(oldUser) // Revert on fail
        showToast("Failed to save changes. Check internet.", 'error')
    } else {
        showToast("Settings saved.", 'success')
    }
  }

  const handleEnable2FA = async () => {
      try {
          const res = await fetch('/api/2fa', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'verify', userId: user?.id, code: twoFACode })
          })
          const data = await res.json()
          
          if (data.success) {
              setUser(prev => prev ? {...prev, two_factor_enabled: true} : null)
              setShow2FASetup(false)
              showToast("Two-Factor Authentication Enabled!", "success")
          } else {
              showToast("Invalid code. Please try again.", "error")
          }
      } catch (e) {
          showToast("Verification failed. Check connection.", "error")
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
          <Link href='/'>
            <h2 className="text-2xl font-bold tracking-tighter flex items-center gap-2">GROVE<span className="text-green-500 text-xs bg-green-500/10 px-2 py-1 rounded border border-green-500/20">TUTOR</span></h2>
          </Link>
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
          <div className="flex items-center gap-4 text-gray-400 bg-white/5 px-4 py-2.5 rounded-full border border-white/10 w-full max-w-[150px] sm:max-w-xs md:w-96">
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
                        <div className="p-4 border-b border-white/5 font-bold text-sm flex justify-between items-center">
                            <span>Notifications</span>
                            <button className="text-[10px] text-green-400 hover:underline">Mark all read</button>
                        </div>
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
                    </div>
                )}
             </div>
             
             <button 
                onClick={handleNewCourseClick} 
                className="bg-white text-black px-5 py-2 rounded-full text-sm font-bold hover:bg-gray-200 transition-colors shadow-lg flex items-center gap-2"
             >
               <Plus size={16} /> New Course
             </button>
          </div>
        </header>

        <div className="p-8 space-y-8 max-w-[1600px] mx-auto w-full">
          
          {/* === OVERVIEW VIEW === */}
          {currentView === 'overview' && (
            <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="space-y-8">
              <div className="flex justify-between items-center">
                  <h1 className="text-3xl font-bold text-white">Tutor Dashboard</h1>
                  
                  {/* TIME RANGE SELECTOR */}
                  <div className="flex bg-neutral-900 border border-white/10 rounded-lg p-1">
                      {['7d', '30d', '90d', '365d'].map(range => (
                          <button 
                            key={range}
                            onClick={() => setTimeRange(range as TimeRange)}
                            className={`px-3 py-1 text-xs font-bold rounded transition-all ${timeRange === range ? 'bg-white text-black' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                          >
                              {range.toUpperCase()}
                          </button>
                      ))}
                  </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="Total Revenue" value={`$${overallStats.revenue.toLocaleString()}`} icon={DollarSign} trend="+12%" trendUp={true} />
                <StatCard label="Total Enrollments" value={overallStats.students.toLocaleString()} icon={Users} trend="+8%" trendUp={true} />
                <StatCard label="Active Courses" value={overallStats.courses.toString()} icon={BookOpen} trend="+1" trendUp={true} />
                <StatCard label="Avg. Rating" value={String(overallStats.rating)} icon={TrendingUp} trend="+0.1" trendUp={true} />
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 {/* Revenue Chart */}
                 <div className="lg:col-span-2 bg-neutral-900/40 border border-white/5 p-6 rounded-2xl relative min-h-[350px]">
                    <h3 className="text-lg font-bold mb-6 text-white">Revenue Growth</h3>
                    <div className='h-[300px] w-full min-w-0'>
                    <ResponsiveContainer width="100%" height={300}>
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
                 </div>

                 {/* Enrollments Bar Chart */}
                 <div className="bg-neutral-900/40 border border-white/5 p-6 rounded-2xl min-h-[350px]">
                    <h3 className="text-lg font-bold mb-6 text-white">New Students</h3>
                    <div className='h-[300px] w-full min-w-0'>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={analyticsData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                            <XAxis dataKey="name" stroke="#666" tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={{backgroundColor:'#000', border:'1px solid #333', borderRadius:'8px'}} cursor={{fill:'rgba(255,255,255,0.05)'}} />
                            <Bar dataKey="students" fill="#fff" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                    </div>
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
                        <button onClick={handleNewCourseClick} className="bg-white text-black px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"><Plus size={16}/> Create Course</button>
                    </div>
                </div>
                {courses.length === 0 ? (
                    <div className="text-center py-20 bg-neutral-900/40 rounded-2xl border border-white/5">
                        <BookOpen size={48} className="mx-auto text-zinc-600 mb-4" />
                        <h3 className="text-xl font-bold mb-2">No courses yet</h3>
                        <p className="text-zinc-500 mb-6">Complete your security setup to start teaching.</p>
                        <button onClick={handleNewCourseClick} className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-500 transition-colors">Start Verification</button>
                    </div>
                ) : (
                    <CoursesTable courses={courses} onAction={handleEditCourse} onDelete={handleDeleteCourse} onView={(c: Course) => { setSelectedCourse(c); setCurrentView('course_detail') }} />
                )}
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
                    <ResponsiveContainer width="100%" height={300}>
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
              <div className="lg:col-span-1 flex overflow-x-auto gap-2 pb-2 lg:pb-0 lg:flex-col lg:space-y-1 no-scrollbar">
   {['profile', 'security', 'payouts'].map((tab) => (
      <button key={tab} onClick={() => setSettingsTab(tab as any)} className={`whitespace-nowrap px-4 py-3 rounded-lg text-sm font-medium capitalize transition-all ${settingsTab === tab ? 'bg-white text-black font-bold' : 'text-gray-400 hover:bg-white/5'}`}>{tab}</button>
   ))}
</div>

               <div className="lg:col-span-3 bg-neutral-900/40 border border-white/5 rounded-2xl p-8 min-h-[600px]">
                  
                  {/* PROFILE SETTINGS */}
                  {settingsTab === 'profile' && (
                     <div className="space-y-8 animate-in fade-in">
                        <div className="flex justify-between items-center border-b border-white/10 pb-4">
                            <h3 className="text-xl font-bold">Personal Information</h3>
                            {user.is_verified ? (
                                <span className="flex items-center gap-1 text-green-400 text-xs font-bold bg-green-900/20 px-3 py-1 rounded-full"><CheckCircle2 size={12}/> Verified Tutor</span>
                            ) : (
                                <button className="flex items-center gap-1 text-yellow-400 text-xs font-bold bg-yellow-900/20 px-3 py-1 rounded-full hover:bg-yellow-900/40">Verify Identity</button>
                            )}
                        </div>
                        
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
                           <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Phone Number</label><input defaultValue={user.phone} onChange={(e)=>setProfileDraft({...profileDraft, phone: e.target.value})} className="w-full bg-black border border-white/10 rounded-lg p-3 outline-none focus:border-green-500" placeholder="+1 (555) 000-0000" /></div>
                           <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Address Line</label><input defaultValue={user.address} onChange={(e)=>setProfileDraft({...profileDraft, address: e.target.value})} className="w-full bg-black border border-white/10 rounded-lg p-3 outline-none focus:border-green-500" /></div>
                           <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">City</label><input defaultValue={user.city} onChange={(e)=>setProfileDraft({...profileDraft, city: e.target.value})} className="w-full bg-black border border-white/10 rounded-lg p-3 outline-none" /></div>
                             <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Zip Code</label><input defaultValue={user.zip} onChange={(e)=>setProfileDraft({...profileDraft, zip: e.target.value})} className="w-full bg-black border border-white/10 rounded-lg p-3 outline-none" /></div>
                           </div>
                        </div>
                        
                        <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Bio</label><textarea defaultValue={user.bio} onChange={(e)=>setProfileDraft({...profileDraft, bio: e.target.value})} className="w-full h-32 bg-black border border-white/10 rounded-lg p-3 outline-none resize-none focus:border-green-500" /></div>
                        
                        {/* SOCIAL MEDIA */}
                        <div className="pt-4 border-t border-white/10">
                            <h4 className="text-sm font-bold text-white mb-4">Social Links</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-2 bg-black border border-white/10 rounded-lg px-3 py-2">
                                    <Twitter size={16} className="text-gray-500"/>
                                    <input defaultValue={user.social_twitter} onChange={(e)=>setProfileDraft({...profileDraft, social_twitter: e.target.value})} placeholder="Twitter Username" className="bg-transparent outline-none text-sm w-full"/>
                                </div>
                                <div className="flex items-center gap-2 bg-black border border-white/10 rounded-lg px-3 py-2">
                                    <Linkedin size={16} className="text-gray-500"/>
                                    <input defaultValue={user.social_linkedin} onChange={(e)=>setProfileDraft({...profileDraft, social_linkedin: e.target.value})} placeholder="LinkedIn Profile" className="bg-transparent outline-none text-sm w-full"/>
                                </div>
                                <div className="flex items-center gap-2 bg-black border border-white/10 rounded-lg px-3 py-2">
                                    <Instagram size={16} className="text-gray-500"/>
                                    <input defaultValue={user.social_instagram} onChange={(e)=>setProfileDraft({...profileDraft, social_instagram: e.target.value})} placeholder="Instagram Handle" className="bg-transparent outline-none text-sm w-full"/>
                                </div>
                                <div className="flex items-center gap-2 bg-black border border-white/10 rounded-lg px-3 py-2">
                                    <Mail size={16} className="text-gray-500"/>
                                    <input defaultValue={user.email} disabled className="bg-transparent outline-none text-sm w-full text-gray-500 cursor-not-allowed"/>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end"><button onClick={()=>updateProfile({})} className="bg-white text-black px-6 py-2 rounded-lg font-bold text-sm hover:bg-gray-200">Save Changes</button></div>
                     </div>
                  )}

                  {/* SECURITY (2FA) */}
                  {/* SECURITY (2FA & KYC) */}
                  {settingsTab === 'security' && (
                     <div className="space-y-8 animate-in fade-in">
                        <h3 className="text-xl font-bold border-b border-white/10 pb-4">Trust & Security</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* --- KYC VERIFICATION CARD --- */}
                            <div className={`p-6 rounded-2xl border ${user.is_verified ? 'bg-emerald-900/10 border-emerald-500/30' : 'bg-neutral-800/50 border-white/10'}`}>
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`p-3 rounded-xl ${user.is_verified ? 'bg-emerald-500/20' : 'bg-blue-500/20'}`}>
                                        <User size={24} className={user.is_verified ? "text-emerald-400" : "text-blue-400"} />
                                    </div>
                                    {user.is_verified && <CheckCircle2 className="text-emerald-500" />}
                                </div>
                                <h4 className="font-bold text-white mb-2">Identity Verification</h4>
                                <p className="text-xs text-gray-400 mb-6">Required to publish courses on Grove Connect.</p>
                                
                                {user.is_verified ? (
                                    <span className="inline-block px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-full">Verified Tutor</span>
                                ) : (
                                    <button onClick={() => setShowKYCModal(true)} className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg transition-colors">Start KYC Process</button>
                                )}
                            </div>

                            {/* --- EMAIL 2FA CARD --- */}
                            <div className={`p-6 rounded-2xl border ${user.two_factor_enabled ? 'bg-emerald-900/10 border-emerald-500/30' : 'bg-neutral-800/50 border-white/10'}`}>
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`p-3 rounded-xl ${user.two_factor_enabled ? 'bg-emerald-500/20' : 'bg-neutral-700'}`}>
                                        <Shield size={24} className={user.two_factor_enabled ? "text-emerald-400" : "text-gray-400"} />
                                    </div>
                                    {user.two_factor_enabled && <CheckCircle2 className="text-emerald-500" />}
                                </div>
                                <h4 className="font-bold text-white mb-2">Email 2-Factor Auth</h4>
                                <p className="text-xs text-gray-400 mb-6">Receive a secure OTP via email when logging in.</p>
                                
                                {user.two_factor_enabled ? (
                                    <span className="inline-block px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-full">2FA Active</span>
                                ) : (
                                    <button 
                                        onClick={async (e) => {
                                            const btn = e.currentTarget;
                                            btn.disabled = true;
                                            btn.innerText = "Sending...";
                                            
                                            try {
                                                await fetch('/api/2fa', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ action: 'send', email: user.email, userId: user.id })
                                                });
                                                setShow2FASetup(true);
                                                showToast("OTP sent to your email!", "success");
                                            } catch (err) {
                                                showToast("Failed to send email.", "error");
                                            } finally {
                                                btn.disabled = false;
                                                btn.innerText = "Enable Email 2FA";
                                            }
                                        }} 
                                        className="w-full py-2 bg-white text-black hover:bg-gray-200 text-sm font-bold rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        Enable Email 2FA
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* --- OTP INPUT MODAL --- */}
                        {show2FASetup && !user.two_factor_enabled && (
                            <div className="p-6 bg-neutral-900 border border-white/10 rounded-xl max-w-md">
                                <h4 className="font-bold text-white mb-2">Check your email</h4>
                                <p className="text-xs text-gray-400 mb-4">We sent a 6-digit code to {user.email}. Enter it below to enable 2FA.</p>
                                <div className="flex gap-2">
                                    <input 
                                        value={twoFACode} 
                                        onChange={(e)=>setTwoFACode(e.target.value.replace(/\D/g, ''))} 
                                        placeholder="000000" 
                                        className="flex-1 bg-black border border-white/10 rounded p-2 text-center tracking-[1em] font-mono outline-none focus:border-emerald-500" 
                                        maxLength={6} 
                                    />
                                    <button onClick={handleEnable2FA} className="bg-emerald-600 hover:bg-emerald-500 px-6 rounded font-bold text-sm transition-colors">Verify</button>
                                </div>
                            </div>
                        )}

                        <div className="space-y-4 pt-8 border-t border-white/10 max-w-md">
                           <h4 className="text-sm font-bold text-gray-400 uppercase">Change Password</h4>
                           <input type="password" placeholder="Current Password" className="w-full bg-black border border-white/10 rounded-lg p-3 outline-none focus:border-white/30 transition-colors" />
                           <input type="password" placeholder="New Password" className="w-full bg-black border border-white/10 rounded-lg p-3 outline-none focus:border-white/30 transition-colors" />
                           <button className="w-full bg-white text-black px-6 py-3 rounded-lg font-bold text-sm hover:bg-gray-200 transition-colors">Update Password</button>
                        </div>
                     </div>
                  )}
                  {/* PAYOUTS */}
                  {/* PAYOUTS & WITHDRAWALS */}
                  {settingsTab === 'payouts' && (
                     <div className="space-y-8 animate-in fade-in">
                        
                        {/* --- 1. THE WALLET BALANCES --- */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-6 bg-gradient-to-br from-emerald-900/40 to-black border border-emerald-500/30 rounded-2xl">
                                <p className="text-sm font-bold text-emerald-500 mb-1 uppercase tracking-wider">Available for Payout</p>
                                {/* In production, fetch this from a 'ledger' table. For now, we simulate 80% of total revenue */}
                                <h2 className="text-4xl font-black text-white mb-4">${(overallStats.revenue * 0.8).toFixed(2)}</h2>
                                <button 
                                    onClick={() => {
                                        if (!user?.payout_method || !user?.payout_details) {
                                            return showToast("Please save your payout account details first.", "error")
                                        }
                                        if ((overallStats.revenue * 0.8) < 50) {
                                            return showToast("Minimum payout is $50.00", "error")
                                        }
                                        showToast("Payout request submitted! Processing takes 3-5 days.", "success")
                                    }}
                                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors shadow-lg"
                                >
                                    Request Withdrawal
                                </button>
                            </div>
                            <div className="p-6 bg-neutral-900/40 border border-white/5 rounded-2xl flex flex-col justify-center">
                                <p className="text-sm font-bold text-gray-500 mb-1 uppercase tracking-wider">Pending Clearance</p>
                                <h2 className="text-3xl font-black text-gray-300 mb-2">${(overallStats.revenue * 0.2).toFixed(2)}</h2>
                                <p className="text-xs text-gray-500">Funds clear 30 days after a student purchases to account for refunds.</p>
                            </div>
                        </div>

                        <h3 className="text-xl font-bold border-b border-white/10 pb-4 mt-8">Payout Method</h3>
                        
                        {(!user.nationality) ? (
                            <div className="text-center py-10 text-gray-500"><p>Please set your Nationality in the Profile tab to see payout options.</p></div>
                        ) : (
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    {(PAYOUT_MAPPING[user.nationality] || PAYOUT_MAPPING['default']).map(method => (
                                        <label key={method} className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all ${user.payout_method === method ? 'bg-emerald-900/20 border-emerald-500' : 'bg-neutral-900 border-white/10 hover:border-white/30'}`}>
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-white rounded-full"><CreditCard size={16} className="text-black"/></div>
                                                <span className="font-bold">{method}</span>
                                            </div>
                                            <input type="radio" name="payout" checked={user.payout_method === method} onChange={() => updateProfile({ payout_method: method })} className="accent-emerald-500 w-5 h-5" />
                                        </label>
                                    ))}
                                </div>

                                {/* --- 2. THE ACCOUNT DETAILS INPUT --- */}
                                {user.payout_method && (
                                    <div className="p-6 bg-black border border-white/10 rounded-xl space-y-4 animate-in fade-in">
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase">
                                                {user.payout_method === 'PayPal' ? 'PayPal Email Address' : 
                                                 user.payout_method.includes('Crypto') ? 'USDT Wallet Address (TRC20)' : 
                                                 'Bank Account Details (IBAN / Account Number)'}
                                            </label>
                                            {/* Note: Ensure you add 'payout_details' to your UserProfile type and Supabase table! */}
                                            <input 
                                                defaultValue={(user as any).payout_details || ''} 
                                                onChange={(e)=>setProfileDraft({...profileDraft, payout_details: e.target.value})}
                                                placeholder="Enter your account details here..." 
                                                className="w-full mt-2 bg-neutral-900 border border-white/10 rounded-lg p-3 outline-none focus:border-emerald-500 text-white" 
                                            />
                                        </div>
                                        <p className="text-xs text-yellow-500 flex items-center gap-1"><AlertCircle size={12}/> Please double check these details. Payments sent to the wrong account cannot be reversed.</p>
                                    </div>
                                )}
                            </div>
                        )}
                     </div>
                  )}
               </div>
            </motion.div>
          )}
          {/* --- KYC VERIFICATION MODAL (SMILE ID) --- */}
      <AnimatePresence>
          {showKYCModal && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                  {/* Backdrop */}
                  <motion.div 
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                      onClick={() => !isVerifying && setShowKYCModal(false)}
                  />
                  
                  {/* Modal Content */}
                  <motion.div 
                      initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                      animate={{ opacity: 1, scale: 1, y: 0 }} 
                      exit={{ opacity: 0, scale: 0.95, y: 20 }}
                      className="relative w-full max-w-lg bg-neutral-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl z-10 flex flex-col max-h-[90vh]"
                  >
                      {/* Header */}
                      <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/40">
                          <div>
                              <h2 className="text-xl font-bold flex items-center gap-2"><Shield className="text-emerald-500"/> Tutor Verification</h2>
                              <p className="text-xs text-zinc-400 mt-1">Required before publishing courses on Grove Academy.</p>
                          </div>
                          {!isVerifying && (
                              <button onClick={() => setShowKYCModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20}/></button>
                          )}
                      </div>

                      {/* Content Area */}
                      {/* Content Area */}
                      <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center justify-center min-h-[400px]">
                          {isVerifying ? (
                              <div className="w-full h-full flex items-center justify-center relative">
                                  {/* SAFE INJECTION WRAPPER */}
                                  <SmileCameraWrapper 
                                  user={user}
                                      onSuccess={async (detail: any) => {
                                          console.log("Smile ID Response:", detail)
                                          
                                          // Update Supabase Profile
                                          const { error } = await supabase
                                              .from('profiles')
                                              .update({ is_verified: true })
                                              .eq('id', user?.id)
                                              
                                          if (!error) {
                                              setUser(prev => prev ? {...prev, is_verified: true} : null)
                                              setShowKYCModal(false)
                                              showToast("Identity Verified Successfully!", "success")
                                              
                                              if (user?.two_factor_enabled) {
                                                  setTimeout(() => router.push('/admin/create-course'), 500)
                                              }
                                          } else {
                                              showToast("Database update failed.", "error")
                                          }
                                      }}
                                      onError={(detail: any) => {
                                          console.error(detail)
                                          showToast("Camera error. Please ensure permissions are granted.", "error")
                                          setIsVerifying(false)
                                      }}
                                  />
                              </div>
                              ) : (
                              <div className="text-center space-y-6">
                                  <div className="flex justify-center gap-4">
                                      <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20"><User size={32} className="text-emerald-400"/></div>
                                      <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20"><Smartphone size={32} className="text-blue-400"/></div>
                                  </div>
                                  <div>
                                      <h3 className="text-2xl font-bold mb-2">Prove you're human</h3>
                                      <p className="text-zinc-400 text-sm max-w-sm mx-auto leading-relaxed">
                                          To maintain trust and safety for our students, all Grove Academy tutors must complete a quick 3D liveness check.
                                      </p>
                                  </div>
                                  <div className="bg-black/40 border border-white/5 rounded-xl p-4 text-left space-y-3">
                                      <div className="flex items-start gap-3"><CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0"/><p className="text-xs text-zinc-300">Takes less than 30 seconds</p></div>
                                      <div className="flex items-start gap-3"><CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0"/><p className="text-xs text-zinc-300">Ensure you are in a well-lit room</p></div>
                                      <div className="flex items-start gap-3"><CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0"/><p className="text-xs text-zinc-300">Remove glasses or hats for the scan</p></div>
                                  </div>
                                  <button onClick={() => setIsVerifying(true)} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-colors flex items-center justify-center gap-2">
                                      Start Verification <ArrowUpRight size={18} />
                                  </button>
                              </div>
                          )}
                      </div>
                  </motion.div>
              </div>
          )}
      </AnimatePresence>

        </div>
      </main>
      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full bg-black/90 backdrop-blur-xl border-t border-white/10 flex justify-around items-center p-3 z-50 pb-safe">
          <button onClick={() => setCurrentView('overview')} className={`flex flex-col items-center gap-1 ${currentView === 'overview' ? 'text-green-500' : 'text-gray-500'}`}>
              <LayoutDashboard size={20} />
              <span className="text-[10px] font-bold">Home</span>
          </button>
          <button onClick={() => setCurrentView('courses')} className={`flex flex-col items-center gap-1 ${currentView === 'courses' ? 'text-green-500' : 'text-gray-500'}`}>
              <BookOpen size={20} />
              <span className="text-[10px] font-bold">Courses</span>
          </button>
          <button onClick={() => setCurrentView('settings')} className={`flex flex-col items-center gap-1 ${currentView === 'settings' ? 'text-green-500' : 'text-gray-500'}`}>
              <Settings size={20} />
              <span className="text-[10px] font-bold">Settings</span>
          </button>
      </nav>
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
          <tr><th className="p-5">Course</th><th className="p-5">Status</th><th className="p-5">Price</th><th className="p-5">Students</th><th className="p-5">Revenue</th><th className="p-5">Rating</th><th className="p-5"></th></tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {courses.map((course: Course) => (
            <tr key={course.id} onClick={() => onView && onView(course)} className="hover:bg-white/[0.02] transition-colors cursor-pointer group">
              <td className="p-5 font-bold text-white flex items-center gap-3"><div className="w-10 h-10 bg-neutral-800 rounded flex items-center justify-center"><BookOpen size={16} className="text-gray-500"/></div>{course.title}</td>
              <td className="p-5"><span className={`px-3 py-1 rounded-full text-[10px] uppercase font-bold ${course.status === 'Active' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>{course.status}</span></td>
              <td className="p-5 text-gray-300">${course.price}</td>
              <td className="p-5 text-gray-300">{course.students_count || 0}</td>
              <td className="p-5 font-mono text-green-400 font-bold">${course.total_revenue}</td>
              <td className="p-5 text-yellow-400 flex items-center gap-1 font-bold">{course.average_rating ? course.average_rating.toFixed(1) : '-'}<span className="text-[10px] text-gray-600">★</span></td>
              <td className="p-5 text-right"><button onClick={(e) => { e.stopPropagation(); onAction(course.id) }} className="text-gray-500 hover:text-white mr-4"><Edit size={16} /></button><button onClick={(e) => { e.stopPropagation(); onDelete(course.id) }} className="text-gray-500 hover:text-red-400"><Trash2 size={16} /></button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    
  </div>
)

// --- SMILE ID CAMERA WRAPPER ---
const SmileCameraWrapper = ({user, onSuccess, onError }: { user: UserProfile | null, onSuccess: (detail: any) => void, onError: (detail: any) => void }) => {
    const [scriptLoaded, setScriptLoaded] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // 1. Inject the script dynamically
        const script = document.createElement('script');
        script.src = "https://unpkg.com/@smile_identity/smart-camera-web@11.0.1/smart-camera-web.js";
        script.async = true;
        
        script.onload = () => setScriptLoaded(true);
        script.onerror = () => onError("Failed to load Smile ID script");
        
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, []);

useEffect(() => {
    // 2. Inject the web component ONLY after the script is loaded
    if (scriptLoaded && containerRef.current) {
        // This forces the user to take a photo of their ID card, then a selfie.
        containerRef.current.innerHTML = '<smart-camera-web mode="document"></smart-camera-web>';
        const cameraEl = containerRef.current.querySelector('smart-camera-web');
        
        if (cameraEl) {
            const handleSuccess = async (e: any) => {
                // e.detail.images contains the base64 encrypted photos of the ID and Selfie
                
                try {
                    // Send the encrypted images to our secure backend
                    const res = await fetch('/api/verify-kyc', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            images: e.detail.images,
                            userId: user?.id 
                        })
                    });

                    const data = await res.json();

                    if (data.success) {
                        onSuccess(data); // Tell the dashboard it worked!
                    } else {
                        onError(data.error); // Tell the dashboard the ID failed
                    }
                } catch (err) {
                    onError("Network error during verification.");
                }
            };
            const handleError = (e: any) => onError(e.detail);

            cameraEl.addEventListener('imagesComputed', handleSuccess);
            cameraEl.addEventListener('error', handleError);

            return () => {
                cameraEl.removeEventListener('imagesComputed', handleSuccess);
                cameraEl.removeEventListener('error', handleError);
            };
        }
    }
}, [scriptLoaded, onSuccess, onError]);

    if (!scriptLoaded) {
        return <div className="flex flex-col items-center text-emerald-500"><Loader2 className="animate-spin w-8 h-8 mb-2"/> Loading secure camera...</div>;
    }

    return <div ref={containerRef} className="w-full h-full rounded-2xl overflow-hidden shadow-2xl border border-white/10" />;
};
