'use client'

import React, { useState, useEffect } from 'react'
import { 
  PlayCircle, Clock, Award, MoreVertical, Search, Bell, 
  BookOpen, Calendar, Star, TrendingUp, CheckCircle2, 
  ArrowRight, Layout, LogOut, User, Zap
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/app/utils/supabase/client'
import { motion } from 'framer-motion'

// --- TYPES ---
type EnrolledCourse = {
  id: string
  title: string
  thumbnail_url: string
  instructor_name: string
  total_lectures: number
  completed_lectures: number
  progress_percent: number
  last_accessed: string
}

const StudentDashboard = () => {
  const router = useRouter()
  const supabase = createClient()
  
  const [user, setUser] = useState<any>(null)
  const [courses, setCourses] = useState<EnrolledCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'in-progress' | 'completed' | 'saved'>('in-progress')

  // --- DATA FETCHING ---
  useEffect(() => {
    const fetchData = async () => {
      // 1. Get User
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/auth')
      
      // Get Profile for UI
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setUser({ ...user, ...profile })

      // 2. Fetch Enrolled Courses + Progress
      // This is a complex join. We fetch enrollments, then join courses, then count progress.
      // For MVP simplicity, we will fetch enrollments and courses separately then merge.
      
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('course_id, enrolled_at')
        .eq('user_id', user.id)

      if (enrollments && enrollments.length > 0) {
        const courseIds = enrollments.map(e => e.course_id)
        
        // Fetch Course Details
        const { data: courseData } = await supabase
          .from('courses')
          .select('*, profiles(full_name)')
          .in('id', courseIds)

        // Fetch Progress Counts
        const { data: progressData } = await supabase
          .from('course_progress')
          .select('course_id')
          .eq('user_id', user.id)

        // Merge Data
        const formatted = courseData?.map(course => {
            const completedCount = progressData?.filter(p => p.course_id === course.id).length || 0
            // Estimate total lectures from JSON or use a fixed number if parsing is hard
            const totalLectures = 25 // Replace with: course.curriculum_data?.reduce(...) 
            const percent = Math.round((completedCount / totalLectures) * 100)

            return {
                id: course.id,
                title: course.title,
                thumbnail_url: course.thumbnail_url || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop",
                instructor_name: course.profiles?.full_name || "Grove Instructor",
                total_lectures: totalLectures,
                completed_lectures: completedCount,
                progress_percent: percent,
                last_accessed: new Date().toISOString() // Mock for now
            }
        }) || []

        setCourses(formatted)
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  // Filter Logic
  const displayedCourses = courses.filter(c => {
      if (activeTab === 'in-progress') return c.progress_percent < 100
      if (activeTab === 'completed') return c.progress_percent === 100
      return true
  })

  // Resume Course (The most recent one)
  const resumeCourse = courses[0] 

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
            <p className="text-gray-500 text-sm animate-pulse">Loading your learning space...</p>
        </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans selection:bg-green-500/30">
      
      {/* --- TOP NAVIGATION --- */}
      <header className="sticky top-0 z-50 bg-neutral-950/80 backdrop-blur-xl border-b border-white/5 h-20 flex items-center justify-between px-6 lg:px-12">
         <div className="flex items-center gap-12">
             <Link href="/" className="text-2xl font-bold tracking-tighter flex items-center gap-2">
                GROVE<span className="text-green-500 text-xs bg-green-900/30 px-2 py-1 rounded border border-green-500/20">STUDENT</span>
             </Link>
             <nav className="hidden md:flex gap-6 text-sm font-medium text-gray-400">
                 <Link href="/dashboard" className="text-white">My Learning</Link>
                 <Link href="/courses" className="hover:text-white transition-colors">Browse Courses</Link>
                 <Link href="/wishlist" className="hover:text-white transition-colors">Wishlist</Link>
             </nav>
         </div>
         <div className="flex items-center gap-6">
             <div className="relative hidden md:block">
                 <Search size={18} className="absolute left-3 top-2.5 text-gray-500" />
                 <input type="text" placeholder="Search my courses..." className="bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-2 text-sm focus:border-green-500 outline-none w-64 transition-all" />
             </div>
             <button className="relative p-2 text-gray-400 hover:text-white"><Bell size={20} /><span className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full animate-pulse" /></button>
             <Link href="/settings">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-green-500 to-emerald-700 p-[2px] cursor-pointer hover:scale-105 transition-transform">
                    <img src={user?.avatar_url || "https://github.com/shadcn.png"} className="w-full h-full rounded-full object-cover border-2 border-black" alt="Profile" />
                </div>
             </Link>
         </div>
      </header>

      <main className="p-6 lg:p-12 max-w-7xl mx-auto space-y-12">
        
        {/* --- WELCOME & STATS --- */}
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.full_name?.split(' ')[0] || 'Student'} 👋</h1>
            <p className="text-gray-400 mb-8">You've learned for <span className="text-green-400 font-bold">124 minutes</span> this week. Keep it up!</p>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-neutral-900/50 border border-white/10 p-6 rounded-2xl flex items-center gap-4 hover:bg-neutral-900 transition-colors cursor-pointer group">
                    <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 group-hover:scale-110 transition-transform"><BookOpen size={24} /></div>
                    <div><h3 className="text-2xl font-bold">{courses.length}</h3><p className="text-xs text-gray-500 font-bold uppercase">Enrolled Courses</p></div>
                </div>
                <div className="bg-neutral-900/50 border border-white/10 p-6 rounded-2xl flex items-center gap-4 hover:bg-neutral-900 transition-colors cursor-pointer group">
                    <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400 group-hover:scale-110 transition-transform"><Clock size={24} /></div>
                    <div><h3 className="text-2xl font-bold">12h</h3><p className="text-xs text-gray-500 font-bold uppercase">Learning Time</p></div>
                </div>
                <div className="bg-neutral-900/50 border border-white/10 p-6 rounded-2xl flex items-center gap-4 hover:bg-neutral-900 transition-colors cursor-pointer group">
                    <div className="p-3 bg-yellow-500/10 rounded-xl text-yellow-400 group-hover:scale-110 transition-transform"><Award size={24} /></div>
                    <div><h3 className="text-2xl font-bold">0</h3><p className="text-xs text-gray-500 font-bold uppercase">Certificates</p></div>
                </div>
                <div className="bg-gradient-to-br from-green-900/40 to-emerald-900/20 border border-green-500/20 p-6 rounded-2xl flex items-center gap-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-20"><Zap size={64} /></div>
                    <div className="p-3 bg-green-500 rounded-xl text-black shadow-[0_0_15px_rgba(34,197,94,0.6)]"><TrendingUp size={24} /></div>
                    <div><h3 className="text-2xl font-bold text-green-400">3 Day</h3><p className="text-xs text-green-200/60 font-bold uppercase">Current Streak</p></div>
                </div>
            </div>
        </section>

        {/* --- HERO: RESUME LEARNING (The "Udemy" Feature) --- */}
        {resumeCourse && (
            <section className="relative group rounded-3xl overflow-hidden border border-white/10 shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="absolute inset-0">
                    <Image src={resumeCourse.thumbnail_url} alt="Resume" fill className="object-cover opacity-40 group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
                </div>
                <div className="relative p-8 md:p-12 flex flex-col items-start gap-6 max-w-3xl">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-green-400 bg-green-900/30 px-3 py-1 rounded-full border border-green-500/30">
                        <Zap size={12} fill="currentColor" /> Jump Back In
                    </div>
                    <div>
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-2 leading-tight">{resumeCourse.title}</h2>
                        <p className="text-gray-400 flex items-center gap-2 text-sm"><User size={14}/> {resumeCourse.instructor_name}</p>
                    </div>
                    
                    <div className="w-full max-w-md space-y-2">
                        <div className="flex justify-between text-xs text-gray-300">
                            <span>{resumeCourse.progress_percent}% Complete</span>
                            <span>{resumeCourse.completed_lectures}/{resumeCourse.total_lectures} Lessons</span>
                        </div>
                        <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 rounded-full" style={{ width: `${resumeCourse.progress_percent}%` }} />
                        </div>
                    </div>

                    <Link href={`/courses/${resumeCourse.id}/learn`}>
                        <button className="bg-white text-black px-8 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-gray-200 hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                            <PlayCircle size={20} fill="black" /> Continue Learning
                        </button>
                    </Link>
                </div>
            </section>
        )}

        {/* --- MY COURSES GRID --- */}
        <section>
            <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
                <div className="flex gap-8">
                    {['in-progress', 'completed', 'saved'].map((tab) => (
                        <button 
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`pb-4 text-sm font-bold capitalize transition-all relative ${activeTab === tab ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            {tab.replace('-', ' ')}
                            {activeTab === tab && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-1 bg-green-500 rounded-t-full" />}
                        </button>
                    ))}
                </div>
                <div className="flex gap-2">
                    <button className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors"><Layout size={20}/></button>
                    <button className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors"><MoreVertical size={20}/></button>
                </div>
            </div>

            {displayedCourses.length === 0 ? (
                <div className="text-center py-20 bg-neutral-900/30 rounded-2xl border border-dashed border-white/10">
                    <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-600"><BookOpen size={24}/></div>
                    <h3 className="text-xl font-bold text-white mb-2">No courses found</h3>
                    <p className="text-gray-500 mb-6">Looks like you haven't started anything yet.</p>
                    <Link href="/courses" className="px-6 py-2 bg-white/10 border border-white/10 rounded-full hover:bg-white text-white hover:text-black transition-all font-bold text-sm">Browse Library</Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {displayedCourses.map((course) => (
                        <div key={course.id} className="group bg-neutral-900 border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-all hover:-translate-y-1">
                            <div className="relative aspect-video bg-neutral-800">
                                <Image src={course.thumbnail_url} alt={course.title} fill className="object-cover" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Link href={`/courses/${course.id}/learn`}>
                                        <button className="bg-green-600 p-3 rounded-full text-white shadow-lg hover:scale-110 transition-transform"><PlayCircle size={24} fill="white" /></button>
                                    </Link>
                                </div>
                            </div>
                            <div className="p-5">
                                <h3 className="font-bold text-white mb-1 line-clamp-1 group-hover:text-green-400 transition-colors">{course.title}</h3>
                                <p className="text-xs text-gray-500 mb-4">{course.instructor_name}</p>
                                
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-[10px] font-bold uppercase text-gray-400">
                                        <span>{course.progress_percent}% Completed</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-green-500 rounded-full transition-all duration-1000" style={{ width: `${course.progress_percent}%` }} />
                                    </div>
                                </div>

                                {course.progress_percent === 100 && (
                                    <button className="mt-4 w-full py-2 border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-yellow-500 hover:text-black transition-colors">
                                        <Award size={14} /> Get Certificate
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>

      </main>
    </div>
  )
}

export default StudentDashboard