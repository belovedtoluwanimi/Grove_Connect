'use client'

import React, { useState, useEffect } from 'react'
import { 
  LayoutDashboard, BookOpen, Users, DollarSign, Settings, 
  Bell, Search, Plus, FileText, MoreVertical, LogOut, Loader2,
  TrendingUp, ArrowUpRight, CreditCard, Lock, User, Image as ImageIcon,
  Calendar, ChevronDown
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/app/utils/supabase/client'
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar 
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
}

type UserProfile = {
  full_name: string
  email: string
  avatar_url?: string
  bio?: string
}

// --- MOCK DATA FOR CHARTS (Replace with real aggregation later) ---
const REVENUE_DATA = [
  { name: 'Jan', revenue: 4000, students: 240 },
  { name: 'Feb', revenue: 3000, students: 139 },
  { name: 'Mar', revenue: 2000, students: 980 },
  { name: 'Apr', revenue: 2780, students: 390 },
  { name: 'May', revenue: 1890, students: 480 },
  { name: 'Jun', revenue: 2390, students: 380 },
  { name: 'Jul', revenue: 3490, students: 430 },
]

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  
  // State
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [stats, setStats] = useState({ revenue: 0, students: 0, rating: 4.8, completion: 68 })
  const [currentView, setCurrentView] = useState<'overview' | 'courses' | 'settings'>('overview')
  const [settingsTab, setSettingsTab] = useState<'profile' | 'security' | 'payouts'>('profile')

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
        if (authError || !authUser) return router.push('/auth')

        const { data: profile } = await supabase.from('profiles').select('*').eq('id', authUser.id).single()
        setUser(profile)

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
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-green-500"><Loader2 className="animate-spin w-10 h-10" /></div>

  return (
    <div className="min-h-screen bg-black flex text-white overflow-hidden font-sans selection:bg-green-500/30">
      
      {/* SIDEBAR */}
      <aside className="w-72 bg-neutral-950 border-r border-white/5 hidden lg:flex flex-col z-20 shadow-2xl">
        <div className="p-8 pb-4">
          <h2 className="text-2xl font-bold tracking-tighter flex items-center gap-2">GROVE<span className="text-green-500 text-xs bg-green-500/10 px-2 py-1 rounded border border-green-500/20">PRO</span></h2>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <NavButton active={currentView === 'overview'} onClick={() => setCurrentView('overview')} icon={LayoutDashboard}>Dashboard</NavButton>
          <NavButton active={currentView === 'courses'} onClick={() => setCurrentView('courses')} icon={BookOpen}>My Courses</NavButton>
          <NavButton active={currentView === 'settings'} onClick={() => setCurrentView('settings')} icon={Settings}>Settings</NavButton>
        </nav>

        <div className="p-4 m-4 bg-neutral-900/50 rounded-xl border border-white/5">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-green-500 to-emerald-700 flex items-center justify-center font-bold text-sm shadow-lg shadow-green-500/20">
                 {user?.full_name?.charAt(0) || 'U'}
              </div>
              <div className="overflow-hidden">
                 <p className="text-sm font-bold truncate text-white">{user?.full_name}</p>
                 <p className="text-xs text-gray-500 truncate">Instructor</p>
              </div>
           </div>
           <button onClick={handleLogout} className="mt-4 w-full flex items-center justify-center gap-2 text-xs text-red-400 hover:bg-red-500/10 py-2 rounded-lg transition-colors">
             <LogOut size={14} /> Sign Out
           </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col relative overflow-y-auto h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900 via-black to-black">
        
        {/* Header */}
        <header className="h-20 border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0 z-10 flex items-center justify-between px-8">
          <div className="flex items-center gap-4 text-gray-400 bg-white/5 px-4 py-2.5 rounded-full border border-white/10 w-96 transition-colors focus-within:border-green-500/50 focus-within:bg-black">
            <Search size={16} />
            <input type="text" placeholder="Search analytics, courses..." className="bg-transparent outline-none text-sm w-full text-white placeholder-gray-600" />
          </div>
          <div className="flex items-center gap-6">
             <button className="relative text-gray-400 hover:text-white transition-colors">
               <Bell size={20} />
               <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
             </button>
             <Link href="/admin/create-course">
               <button className="bg-white text-black px-5 py-2 rounded-full text-sm font-bold hover:bg-gray-200 transition-colors shadow-lg shadow-white/10 flex items-center gap-2">
                 <Plus size={16} /> New Course
               </button>
             </Link>
          </div>
        </header>

        <div className="p-8 space-y-8 max-w-[1600px] mx-auto w-full">
          
          {/* TITLE & BREADCRUMBS */}
          <div className="flex justify-between items-end animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">
                {currentView === 'overview' ? 'Performance Overview' : 
                 currentView === 'courses' ? 'Course Management' : 'Account Settings'}
              </h1>
              <p className="text-gray-400 mt-1 flex items-center gap-2 text-sm">
                <Calendar size={14} /> {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>

          {/* === OVERVIEW VIEW === */}
          {currentView === 'overview' && (
            <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="Total Revenue" value={`$${stats.revenue.toLocaleString()}`} icon={DollarSign} trend="+12.5%" trendUp={true} />
                <StatCard label="Total Students" value={stats.students.toLocaleString()} icon={Users} trend="+8.2%" trendUp={true} />
                <StatCard label="Avg. Rating" value={stats.rating.toString()} icon={TrendingUp} trend="+0.1" trendUp={true} />
                <StatCard label="Completion Rate" value={`${stats.completion}%`} icon={BookOpen} trend="-2.4%" trendUp={false} />
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[400px]">
                 {/* Revenue Chart */}
                 <div className="lg:col-span-2 bg-neutral-900/40 border border-white/5 p-6 rounded-2xl relative overflow-hidden">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">Revenue Analytics <span className="text-xs font-normal text-gray-500 bg-white/5 px-2 py-1 rounded">Last 6 Months</span></h3>
                    <div className="h-[300px] w-full">
                       <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={REVENUE_DATA}>
                             <defs>
                                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                   <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                                   <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                                </linearGradient>
                             </defs>
                             <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                             <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                             <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                             <Tooltip contentStyle={{backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px'}} itemStyle={{color: '#fff'}} />
                             <Area type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                          </AreaChart>
                       </ResponsiveContainer>
                    </div>
                 </div>

                 {/* Students Bar Chart */}
                 <div className="bg-neutral-900/40 border border-white/5 p-6 rounded-2xl">
                    <h3 className="text-lg font-bold mb-6">New Enrollments</h3>
                    <div className="h-[300px] w-full">
                       <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={REVENUE_DATA}>
                             <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                             <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                             <Tooltip contentStyle={{backgroundColor: '#000', border: '1px solid #333'}} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                             <Bar dataKey="students" fill="#fff" radius={[4, 4, 0, 0]} barSize={20} />
                          </BarChart>
                       </ResponsiveContainer>
                    </div>
                 </div>
              </div>

              <h3 className="text-xl font-bold pt-4">Recent Courses</h3>
              <CoursesTable courses={courses.slice(0, 5)} />
            </motion.div>
          )}

          {/* === COURSES VIEW === */}
          {currentView === 'courses' && (
             <motion.div initial={{opacity:0}} animate={{opacity:1}}>
                <CoursesTable courses={courses} />
             </motion.div>
          )}

          {/* === SETTINGS VIEW (IMPLEMENTED) === */}
          {currentView === 'settings' && (
            <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="grid grid-cols-1 lg:grid-cols-4 gap-8">
               
               {/* Settings Nav */}
               <div className="lg:col-span-1 space-y-1">
                  {['profile', 'security', 'payouts'].map((tab) => (
                     <button 
                       key={tab} 
                       onClick={() => setSettingsTab(tab as any)}
                       className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium capitalize transition-all ${settingsTab === tab ? 'bg-white text-black font-bold' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                     >
                       {tab}
                     </button>
                  ))}
               </div>

               {/* Settings Content */}
               <div className="lg:col-span-3 bg-neutral-900/40 border border-white/5 rounded-2xl p-8 min-h-[500px]">
                  
                  {settingsTab === 'profile' && (
                     <div className="space-y-6 max-w-xl animate-in fade-in">
                        <h3 className="text-xl font-bold border-b border-white/10 pb-4">Public Profile</h3>
                        <div className="flex items-center gap-6">
                           <div className="w-24 h-24 rounded-full bg-neutral-800 border-2 border-dashed border-white/20 flex items-center justify-center cursor-pointer hover:border-green-500 transition-colors group">
                              <ImageIcon className="text-gray-500 group-hover:text-green-500" />
                           </div>
                           <div className="space-y-2">
                              <button className="px-4 py-2 bg-white text-black text-xs font-bold rounded hover:bg-gray-200">Upload New Photo</button>
                              <p className="text-xs text-gray-500">Recommended 400x400 px.</p>
                           </div>
                        </div>
                        <div className="space-y-4">
                           <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Full Name</label><input defaultValue={user?.full_name} className="w-full bg-black border border-white/10 rounded-lg p-3 outline-none focus:border-green-500" /></div>
                           <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Bio</label><textarea defaultValue={user?.bio} className="w-full h-32 bg-black border border-white/10 rounded-lg p-3 outline-none focus:border-green-500 resize-none" placeholder="Tell students about yourself..." /></div>
                        </div>
                        <button className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-500">Save Changes</button>
                     </div>
                  )}

                  {settingsTab === 'security' && (
                     <div className="space-y-6 max-w-xl animate-in fade-in">
                        <h3 className="text-xl font-bold border-b border-white/10 pb-4">Security</h3>
                        <div className="space-y-4">
                           <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Email</label><input disabled value={user?.email} className="w-full bg-neutral-900 border border-white/10 rounded-lg p-3 text-gray-500 cursor-not-allowed" /></div>
                           <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">New Password</label><input type="password" className="w-full bg-black border border-white/10 rounded-lg p-3 outline-none focus:border-green-500" /></div>
                           <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Confirm Password</label><input type="password" className="w-full bg-black border border-white/10 rounded-lg p-3 outline-none focus:border-green-500" /></div>
                        </div>
                        <button className="bg-white text-black px-6 py-2 rounded-lg font-medium hover:bg-gray-200">Update Password</button>
                     </div>
                  )}

                  {settingsTab === 'payouts' && (
                     <div className="space-y-6 max-w-xl animate-in fade-in">
                        <h3 className="text-xl font-bold border-b border-white/10 pb-4">Payout Method</h3>
                        <div className="bg-gradient-to-r from-neutral-800 to-neutral-900 border border-white/10 p-6 rounded-xl flex items-center justify-between">
                           <div className="flex items-center gap-4">
                              <div className="p-3 bg-white/5 rounded-lg"><CreditCard size={24} /></div>
                              <div><p className="font-bold">Stripe Connect</p><p className="text-xs text-gray-400">Connected</p></div>
                           </div>
                           <span className="text-green-400 text-xs font-bold bg-green-500/10 px-3 py-1 rounded-full">Active</span>
                        </div>
                        <p className="text-sm text-gray-400">Payouts are processed automatically on the 1st of every month for balances over $50.</p>
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

// --- COMPONENTS ---

const NavButton = ({ active, children, onClick, icon: Icon }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${active ? 'bg-white text-black shadow-lg shadow-white/5 font-bold' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
    <Icon size={18} className={active ? "text-black" : "text-gray-500"} /> {children}
  </button>
)

const StatCard = ({ label, value, icon: Icon, trend, trendUp }: any) => (
  <div className="bg-neutral-900/40 border border-white/5 p-6 rounded-2xl hover:bg-neutral-900/60 transition-colors group">
    <div className="flex justify-between items-start mb-4">
      <div className="p-3 bg-gradient-to-br from-neutral-800 to-neutral-900 border border-white/5 rounded-xl text-gray-400 group-hover:text-white group-hover:border-white/20 transition-all shadow-lg">
        <Icon size={20} />
      </div>
      <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${trendUp ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
        {trendUp ? <TrendingUp size={12} /> : <ArrowUpRight size={12} className="rotate-90" />} {trend}
      </div>
    </div>
    <h3 className="text-3xl font-bold text-white mb-1 tracking-tight">{value}</h3>
    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">{label}</p>
  </div>
)

const CoursesTable = ({ courses }: { courses: Course[] }) => (
  <div className="bg-neutral-900/40 border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-neutral-950 text-xs uppercase text-gray-500 font-bold tracking-wider">
          <tr>
            <th className="p-5">Course</th>
            <th className="p-5">Status</th>
            <th className="p-5">Price</th>
            <th className="p-5">Students</th>
            <th className="p-5">Revenue</th>
            <th className="p-5"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {courses.length === 0 ? (
             <tr><td colSpan={6} className="p-12 text-center text-gray-500 italic">No data available.</td></tr>
          ) : courses.map((course) => (
            <tr key={course.id} className="hover:bg-white/[0.02] transition-colors group">
              <td className="p-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-neutral-800 rounded-lg border border-white/5 flex items-center justify-center group-hover:border-white/20 transition-colors">
                    <BookOpen size={20} className="text-gray-600 group-hover:text-white" />
                  </div>
                  <span className="font-bold text-white text-sm">{course.title}</span>
                </div>
              </td>
              <td className="p-5">
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                  course.status === 'Active' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                  course.status === 'Review' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                  'bg-gray-500/10 text-gray-400 border-gray-500/20'
                }`}>
                  {course.status}
                </span>
              </td>
              <td className="p-5 text-sm text-gray-300 font-medium">${course.price}</td>
              <td className="p-5 text-sm text-gray-300">{course.students_count || 0}</td>
              <td className="p-5 font-mono text-green-400 font-bold">${course.total_revenue || 0}</td>
              <td className="p-5 text-right">
                <button className="text-gray-600 hover:text-white transition-colors"><MoreVertical size={18} /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)