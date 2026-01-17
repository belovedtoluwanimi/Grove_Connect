'use client'

import React, { useState, useEffect } from 'react'
import { 
  LayoutDashboard, BookOpen, Users, DollarSign, Settings, 
  Bell, Search, Plus, FileText, MoreVertical, LogOut, Loader2
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/app/utils/supabase/client'

// --- TYPES ---
type Course = {
  id: string
  title: string
  status: 'Draft' | 'Review' | 'Active'
  price: number
  students_count: number
  total_revenue: number
}

type UserProfile = {
  full_name: string
  email: string
}

// --- MAIN DASHBOARD PAGE ---
const DashboardPage = () => {
  const router = useRouter()
  const supabase = createClient()
  
  // State for Data
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [stats, setStats] = useState({
    revenue: 0,
    students: 0,
    rating: 4.8, // Placeholder until we build ratings
    completion: 68 // Placeholder
  })

  // State for UI
  const [currentView, setCurrentView] = useState<'overview' | 'courses' | 'settings'>('overview')

  // --- FETCH DATA ON LOAD ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Get Current User
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
        if (authError || !authUser) {
          router.push('/admin/auth') // Redirect if not logged in
          return
        }

        // 2. Get Profile (Name)
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', authUser.id)
          .single()
        
        setUser(profile)

        // 3. Get Courses for this Instructor
        const { data: courseData } = await supabase
          .from('courses')
          .select('*')
          .eq('instructor_id', authUser.id)
          .order('created_at', { ascending: false })

        if (courseData) {
          setCourses(courseData)
          
          // Calculate Stats dynamically
          const totalRev = courseData.reduce((acc, c) => acc + (c.total_revenue || 0), 0)
          const totalStud = courseData.reduce((acc, c) => acc + (c.students_count || 0), 0)
          
          setStats(prev => ({ ...prev, revenue: totalRev, students: totalStud }))
        }

      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router, supabase])

  // --- LOGOUT HANDLER ---
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/admin/auth')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-green-500">
        <Loader2 className="animate-spin w-10 h-10" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex text-white overflow-hidden font-sans">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-neutral-950 border-r border-white/10 hidden lg:flex flex-col z-20">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-bold tracking-tighter">GROVE <span className="text-green-500">ADMIN</span></h2>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setCurrentView('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${currentView === 'overview' ? 'bg-green-600/10 text-green-400 border border-green-600/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <LayoutDashboard size={18} /> Overview
          </button>
          
          <button 
            onClick={() => setCurrentView('courses')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${currentView === 'courses' ? 'bg-green-600/10 text-green-400 border border-green-600/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <BookOpen size={18} /> My Courses
          </button>

          <button 
            onClick={() => setCurrentView('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${currentView === 'settings' ? 'bg-green-600/10 text-green-400 border border-green-600/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <Settings size={18} /> Settings
          </button>
        </nav>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-4">
             <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-green-500 to-emerald-700 flex items-center justify-center font-bold text-sm">
                {user?.full_name?.charAt(0) || 'U'}
             </div>
             <div className="overflow-hidden">
                <p className="text-sm font-bold truncate">{user?.full_name || 'Instructor'}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
             </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 text-xs text-red-400 hover:bg-red-900/10 py-2 rounded transition-colors">
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col relative overflow-y-auto h-screen">
        
        {/* Header */}
        <header className="h-16 border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between px-8">
          <div className="flex items-center gap-4 text-gray-400 bg-white/5 px-4 py-2 rounded-full border border-white/10 w-96">
            <Search size={16} />
            <input type="text" placeholder="Search..." className="bg-transparent outline-none text-sm w-full text-white" />
          </div>
          <button className="relative text-gray-400 hover:text-white">
            <Bell size={20} />
          </button>
        </header>

        {/* Dashboard Body */}
        <div className="p-8 space-y-8 max-w-[1600px] mx-auto w-full">
          
          {/* Header Action */}
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-bold text-white">
                {currentView === 'overview' ? 'Dashboard Overview' : 
                 currentView === 'courses' ? 'My Courses' : 'Settings'}
              </h1>
              <p className="text-gray-400 mt-1">
                Welcome back, {user?.full_name?.split(' ')[0]}. Here's what's happening today.
              </p>
            </div>
            {currentView !== 'settings' && (
              <Link href="/admin/create-course">
                <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 shadow-lg shadow-green-900/20 transition-all hover:scale-105">
                  <Plus size={18} /> Create New Course
                </button>
              </Link>
            )}
          </div>

          {/* VIEW: OVERVIEW */}
          {currentView === 'overview' && (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="Total Revenue" value={`$${stats.revenue}`} icon={DollarSign} />
                <StatCard label="Active Students" value={stats.students.toString()} icon={Users} />
                <StatCard label="Course Rating" value={stats.rating.toString()} icon={Settings} /> {/* Replace icon if needed */}
                <StatCard label="Completion Rate" value={`${stats.completion}%`} icon={BookOpen} />
              </div>

              {/* Recent Courses Table */}
              <CoursesTable courses={courses.slice(0, 5)} />
            </>
          )}

          {/* VIEW: COURSES (Shows All) */}
          {currentView === 'courses' && (
             <CoursesTable courses={courses} />
          )}

           {/* VIEW: SETTINGS */}
           {currentView === 'settings' && (
             <div className="bg-neutral-900/30 border border-white/10 p-8 rounded-xl text-center text-gray-400">
                <Settings size={48} className="mx-auto mb-4 opacity-50" />
                <p>Profile & Payment settings coming soon.</p>
             </div>
          )}

        </div>
      </main>
    </div>
  )
}

// --- SUB-COMPONENTS FOR CLEANER CODE ---

const StatCard = ({ label, value, icon: Icon }: any) => (
  <div className="bg-neutral-900/50 border border-white/10 p-6 rounded-xl hover:border-green-500/30 transition-colors group">
    <div className="flex justify-between items-start mb-4">
      <div className="p-3 bg-white/5 rounded-lg text-green-400 group-hover:bg-green-500 group-hover:text-white transition-colors">
        <Icon size={20} />
      </div>
    </div>
    <h3 className="text-3xl font-bold text-white mb-1">{value}</h3>
    <p className="text-sm text-gray-500">{label}</p>
  </div>
)

const CoursesTable = ({ courses }: { courses: Course[] }) => (
  <div className="bg-neutral-900/30 border border-white/10 rounded-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
    <div className="p-6 border-b border-white/10 flex justify-between items-center">
      <h3 className="text-lg font-bold">Course List</h3>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-white/5 text-xs uppercase text-gray-400">
          <tr>
            <th className="p-4">Course Name</th>
            <th className="p-4">Status</th>
            <th className="p-4">Price</th>
            <th className="p-4">Students</th>
            <th className="p-4">Revenue</th>
            <th className="p-4">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {courses.length === 0 ? (
             <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500 italic">
                   No courses found. Create your first one!
                </td>
             </tr>
          ) : courses.map((course) => (
            <tr key={course.id} className="hover:bg-white/5 transition-colors">
              <td className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-neutral-800 rounded-md border border-white/10 flex items-center justify-center">
                    <FileText size={16} className="text-gray-500" />
                  </div>
                  <span className="font-medium text-white">{course.title}</span>
                </div>
              </td>
              <td className="p-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                  course.status === 'Active' ? 'bg-green-900/20 text-green-400 border-green-500/30' :
                  course.status === 'Review' ? 'bg-yellow-900/20 text-yellow-400 border-yellow-500/30' :
                  'bg-gray-800 text-gray-400 border-gray-600'
                }`}>
                  {course.status}
                </span>
              </td>
              <td className="p-4 text-gray-300">${course.price}</td>
              <td className="p-4 text-gray-300">{course.students_count || 0}</td>
              <td className="p-4 font-mono text-green-400">${course.total_revenue || 0}</td>
              <td className="p-4">
                <button className="text-gray-500 hover:text-white">
                  <MoreVertical size={18} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)

export default DashboardPage