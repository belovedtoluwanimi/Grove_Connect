'use client'

import React, { useState, useEffect } from 'react'
import { 
  LayoutDashboard, BookOpen, Users, DollarSign, Settings, 
  Bell, Search, Plus, FileText, MoreVertical, LogOut, Loader2,
  TrendingUp, ArrowUpRight, CreditCard, Lock, User, Image as ImageIcon,
  Calendar, ChevronDown, ChevronLeft, Globe, Shield, Smartphone, Trash2, Edit
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
  views?: number // Added for analytics
}

type UserProfile = {
  id: string
  full_name: string
  email: string
  avatar_url?: string
  bio?: string
  nationality?: string
  phone?: string
  website?: string
  payout_method?: string
  payout_details?: any
}

// --- PAYOUT LOGIC ---
const PAYOUT_OPTIONS: Record<string, string[]> = {
  'US': ['Stripe', 'Mastercard', 'PayPal'],
  'UK': ['Stripe', 'Mastercard', 'PayPal'],
  'NG': ['Mastercard', 'Flutterwave', 'Crypto'], // Example for Nigeria
  'IN': ['PayPal', 'Mastercard'],
  'default': ['PayPal', 'Crypto']
}

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  
  // Data State
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [stats, setStats] = useState({ revenue: 0, students: 0, rating: 4.8, completion: 68 })
  
  // UI State
  const [currentView, setCurrentView] = useState<'overview' | 'courses' | 'settings' | 'course_detail'>('overview')
  const [settingsTab, setSettingsTab] = useState<'profile' | 'security' | 'payouts'>('profile')
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  // --- 1. REAL-TIME DATA FETCHING ---
  useEffect(() => {
    const fetchData = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return router.push('/auth')

      // Fetch Profile
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', authUser.id).single()
      setUser(profile)

      // Fetch Courses
      const fetchCourses = async () => {
        const { data: courseData } = await supabase
          .from('courses')
          .select('*')
          .eq('instructor_id', authUser.id)
          .order('created_at', { ascending: false })

        if (courseData) {
          setCourses(courseData)
          setStats(prev => ({
             ...prev,
             revenue: courseData.reduce((acc, c) => acc + (c.total_revenue || 0), 0),
             students: courseData.reduce((acc, c) => acc + (c.students_count || 0), 0)
          }))
        }
      }

      fetchCourses()

      // REAL-TIME SUBSCRIPTION
      const subscription = supabase
        .channel('dashboard-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'courses', filter: `instructor_id=eq.${authUser.id}` }, 
        (payload) => {
            fetchCourses() // Refresh data automatically on any change
        })
        .subscribe()

      setLoading(false)
      return () => { supabase.removeChannel(subscription) }
    }
    fetchData()
  }, [router])

  // --- HANDLERS ---

  // Upload Avatar
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return
    setUploading(true)
    
    const formData = new FormData()
    formData.append('file', e.target.files[0])

    try {
      // Use existing backend
      const res = await fetch(`${API_URL}/api/upload`, { method: 'POST', body: formData })
      const { url } = await res.json()
      
      // Update Database
      await supabase.from('profiles').update({ avatar_url: url }).eq('id', user?.id)
      setUser(prev => prev ? { ...prev, avatar_url: url } : null)
      alert("Profile picture updated!")
    } catch (err) {
      alert("Upload failed")
    } finally {
      setUploading(false)
    }
  }

  // Update Profile Info
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return
    const { error } = await supabase.from('profiles').update(updates).eq('id', user.id)
    if (!error) {
        setUser({ ...user, ...updates })
        alert("Settings saved successfully")
    }
  }

  // Delete Course
  const handleDeleteCourse = async (id: string) => {
    if (!confirm("Are you sure? This cannot be undone.")) return
    await supabase.from('courses').delete().eq('id', id)
    setCourses(prev => prev.filter(c => c.id !== id))
    setActionMenuOpen(null)
  }

  // Navigate to Analytics
  const openCourseAnalytics = (course: Course) => {
    setSelectedCourse(course)
    setCurrentView('course_detail')
  }

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-green-500"><Loader2 className="animate-spin w-10 h-10" /></div>

  return (
    <div className="min-h-screen bg-black flex text-white overflow-hidden font-sans selection:bg-green-500/30">
      
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
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-green-500 to-emerald-700 flex items-center justify-center font-bold text-sm shadow-lg overflow-hidden">
                 {user?.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover" /> : user?.full_name?.charAt(0)}
              </div>
              <div className="overflow-hidden">
                 <p className="text-sm font-bold truncate text-white">{user?.full_name}</p>
                 <p className="text-xs text-gray-500 truncate">{user?.email}</p>
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
              <h1 className="text-3xl font-bold text-white">Dashboard Overview</h1>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="Total Revenue" value={`$${stats.revenue.toLocaleString()}`} icon={DollarSign} trend="+12%" trendUp={true} />
                <StatCard label="Total Students" value={stats.students.toLocaleString()} icon={Users} trend="+8%" trendUp={true} />
                <StatCard label="Avg. Rating" value={stats.rating.toString()} icon={TrendingUp} trend="+0.1" trendUp={true} />
                <StatCard label="Completion Rate" value={`${stats.completion}%`} icon={BookOpen} trend="-2%" trendUp={false} />
              </div>
              
              {/* Revenue Chart */}
              <div className="bg-neutral-900/40 border border-white/5 p-6 rounded-2xl h-[400px]">
                 <h3 className="text-lg font-bold mb-6">Revenue Analytics</h3>
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[
                        {name:'Jan', v:4000}, {name:'Feb', v:3000}, {name:'Mar', v:5000}, {name:'Apr', v:4500}, {name:'May', v:6000}, {name:'Jun', v:7500}
                    ]}>
                        <defs><linearGradient id="colorV" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/><stop offset="95%" stopColor="#22c55e" stopOpacity={0}/></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                        <XAxis dataKey="name" stroke="#666" />
                        <YAxis stroke="#666" />
                        <Tooltip contentStyle={{backgroundColor:'#000', border:'1px solid #333'}} />
                        <Area type="monotone" dataKey="v" stroke="#22c55e" fill="url(#colorV)" />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {/* === COURSES VIEW === */}
          {currentView === 'courses' && (
             <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-6">
                <h1 className="text-3xl font-bold text-white">My Courses</h1>
                <div className="bg-neutral-900/40 border border-white/5 rounded-2xl overflow-visible">
                  <table className="w-full text-left">
                    <thead className="bg-neutral-950 text-xs uppercase text-gray-500 font-bold">
                      <tr><th className="p-5">Course</th><th className="p-5">Status</th><th className="p-5">Price</th><th className="p-5">Students</th><th className="p-5">Revenue</th><th className="p-5"></th></tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {courses.map((course) => (
                        <tr key={course.id} onClick={() => openCourseAnalytics(course)} className="hover:bg-white/[0.02] transition-colors cursor-pointer group relative">
                          <td className="p-5 font-bold text-white flex items-center gap-3">
                             <div className="w-10 h-10 bg-neutral-800 rounded flex items-center justify-center"><BookOpen size={16} className="text-gray-500"/></div>
                             {course.title}
                          </td>
                          <td className="p-5"><span className={`px-3 py-1 rounded-full text-[10px] uppercase font-bold ${course.status === 'Active' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>{course.status}</span></td>
                          <td className="p-5 text-gray-300">${course.price}</td>
                          <td className="p-5 text-gray-300">{course.students_count}</td>
                          <td className="p-5 font-mono text-green-400 font-bold">${course.total_revenue}</td>
                          <td className="p-5 text-right relative" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => setActionMenuOpen(actionMenuOpen === course.id ? null : course.id)} className="p-2 hover:bg-white/10 rounded-full"><MoreVertical size={18} /></button>
                            
                            {/* 3-DOTS ACTION MENU */}
                            {actionMenuOpen === course.id && (
                                <div className="absolute right-10 top-2 bg-neutral-900 border border-white/10 rounded-lg shadow-xl z-50 w-40 overflow-hidden animate-in fade-in zoom-in-95">
                                    <button onClick={() => openCourseAnalytics(course)} className="w-full text-left px-4 py-3 text-sm hover:bg-white/5 flex items-center gap-2"><TrendingUp size={14} /> Analytics</button>
                                    <button onClick={() => router.push(`/admin/create-course?edit=${course.id}`)} className="w-full text-left px-4 py-3 text-sm hover:bg-white/5 flex items-center gap-2"><Edit size={14} /> Edit</button>
                                    <button onClick={() => handleDeleteCourse(course.id)} className="w-full text-left px-4 py-3 text-sm hover:bg-red-500/10 text-red-400 flex items-center gap-2"><Trash2 size={14} /> Delete</button>
                                </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
             </motion.div>
          )}

          {/* === COURSE ANALYTICS DETAIL (DRILL-DOWN) === */}
          {currentView === 'course_detail' && selectedCourse && (
             <motion.div initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} className="space-y-8">
                <button onClick={() => setCurrentView('courses')} className="flex items-center gap-2 text-gray-400 hover:text-white"><ChevronLeft size={16}/> Back to Courses</button>
                
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-white">{selectedCourse.title}</h1>
                        <p className="text-gray-400 mt-1">Real-time performance tracking</p>
                    </div>
                    <div className="flex gap-3">
                        <button className="bg-white text-black px-4 py-2 rounded-lg font-bold text-sm">Edit Course</button>
                        <button className="bg-neutral-800 text-white px-4 py-2 rounded-lg font-bold text-sm border border-white/10">View on Site</button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard label="Revenue" value={`$${selectedCourse.total_revenue}`} icon={DollarSign} trendUp={true} trend="+5%" />
                    <StatCard label="Active Students" value={selectedCourse.students_count} icon={Users} trendUp={true} trend="+12" />
                    <StatCard label="Total Views" value={selectedCourse.views || 0} icon={Eye} trendUp={true} trend="+124" />
                </div>

                {/* Course Specific Chart */}
                <div className="bg-neutral-900/40 border border-white/5 p-6 rounded-2xl h-[400px]">
                    <h3 className="text-lg font-bold mb-6">Engagement Over Time</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={[{n:'Mon', v:10}, {n:'Tue', v:45}, {n:'Wed', v:30}, {n:'Thu', v:70}, {n:'Fri', v:55}, {n:'Sat', v:90}]}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                            <XAxis dataKey="n" stroke="#666" />
                            <YAxis stroke="#666" />
                            <Tooltip contentStyle={{backgroundColor:'#000'}} />
                            <Line type="monotone" dataKey="v" stroke="#3b82f6" strokeWidth={3} dot={{r:4}} />
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

               <div className="lg:col-span-3 bg-neutral-900/40 border border-white/5 rounded-2xl p-8 min-h-[500px]">
                  
                  {/* PROFILE SETTINGS */}
                  {settingsTab === 'profile' && (
                     <div className="space-y-6 max-w-xl animate-in fade-in">
                        <h3 className="text-xl font-bold border-b border-white/10 pb-4">Personal Information</h3>
                        
                        {/* Avatar Upload */}
                        <div className="flex items-center gap-6">
                           <div className="w-24 h-24 rounded-full bg-neutral-800 border-2 border-dashed border-white/20 flex items-center justify-center relative overflow-hidden group">
                              {user.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover" /> : <ImageIcon className="text-gray-500" />}
                              <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                                <span className="text-xs font-bold text-white">{uploading ? '...' : 'Edit'}</span>
                                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                              </label>
                           </div>
                           <div><p className="font-bold">{user.full_name}</p><p className="text-xs text-gray-500">Instructor ID: {user.id.slice(0,8)}</p></div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Nationality</label>
                             <select className="w-full bg-black border border-white/10 rounded-lg p-3 outline-none" value={user.nationality || 'default'} onChange={(e) => updateProfile({ nationality: e.target.value })}>
                                <option value="default">Select Country</option>
                                <option value="US">United States</option>
                                <option value="UK">United Kingdom</option>
                                <option value="NG">Nigeria</option>
                                <option value="IN">India</option>
                             </select>
                           </div>
                           <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Phone</label><input defaultValue={user.phone} onChange={(e)=>updateProfile({phone:e.target.value})} className="w-full bg-black border border-white/10 rounded-lg p-3 outline-none" placeholder="+1..." /></div>
                        </div>
                        <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Bio</label><textarea defaultValue={user.bio} onBlur={(e)=>updateProfile({bio:e.target.value})} className="w-full h-32 bg-black border border-white/10 rounded-lg p-3 outline-none resize-none" /></div>
                     </div>
                  )}

                  {/* SECURITY (2FA) */}
                  {settingsTab === 'security' && (
                     <div className="space-y-6 max-w-xl animate-in fade-in">
                        <h3 className="text-xl font-bold border-b border-white/10 pb-4">Security</h3>
                        
                        <div className="bg-green-900/10 border border-green-500/20 p-6 rounded-xl flex items-center justify-between">
                           <div className="flex items-center gap-4">
                              <div className="p-3 bg-green-500/10 rounded-lg text-green-500"><Shield size={24} /></div>
                              <div><p className="font-bold text-white">2-Factor Authentication</p><p className="text-xs text-gray-400">Secure your account with an authenticator app.</p></div>
                           </div>
                           <button onClick={() => alert("Redirecting to Supabase Auth MFA Enrollment...")} className="px-4 py-2 bg-white text-black text-xs font-bold rounded hover:bg-gray-200">Enable 2FA</button>
                        </div>

                        <div className="space-y-4 pt-4">
                           <h4 className="text-sm font-bold text-gray-400 uppercase">Change Password</h4>
                           <input type="password" placeholder="Current Password" className="w-full bg-black border border-white/10 rounded-lg p-3 outline-none" />
                           <input type="password" placeholder="New Password" className="w-full bg-black border border-white/10 rounded-lg p-3 outline-none" />
                           <button className="bg-white text-black px-6 py-2 rounded-lg font-bold text-sm">Update</button>
                        </div>
                     </div>
                  )}

                  {/* PAYOUTS (Dynamic based on Nationality) */}
                  {settingsTab === 'payouts' && (
                     <div className="space-y-6 max-w-xl animate-in fade-in">
                        <h3 className="text-xl font-bold border-b border-white/10 pb-4">Payout Method</h3>
                        
                        <div className="p-4 bg-blue-900/10 border border-blue-500/20 rounded-lg mb-4">
                            <p className="text-sm text-blue-200"><Globe size={14} className="inline mr-2"/> Detected Region: <strong>{user.nationality || 'Global'}</strong></p>
                        </div>

                        <div className="space-y-3">
                            {(PAYOUT_OPTIONS[user.nationality || 'default'] || []).map(method => (
                                <label key={method} className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all ${user.payout_method === method ? 'bg-green-900/20 border-green-500' : 'bg-neutral-900 border-white/10 hover:border-white/30'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white rounded-full"><CreditCard size={16} className="text-black"/></div>
                                        <span className="font-bold">{method}</span>
                                    </div>
                                    <input type="radio" name="payout" checked={user.payout_method === method} onChange={() => updateProfile({ payout_method: method })} className="accent-green-500 w-5 h-5" />
                                </label>
                            ))}
                        </div>
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

// --- SUB COMPONENTS ---
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