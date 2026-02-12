'use client'

import React, { useState, useEffect } from 'react'
import { 
  PlayCircle, Clock, Award, MoreVertical, Search, Bell, 
  BookOpen, Calendar, Star, TrendingUp, CheckCircle2, 
  ArrowRight, Layout, LogOut, User, Zap, Loader2
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

type UserStats = {
    enrolled: number
    learningHours: number
    certificates: number
    streak: number
}

const StudentDashboard = () => {
  const router = useRouter()
  const supabase = createClient()
  
  const [user, setUser] = useState<any>(null)
  const [courses, setCourses] = useState<EnrolledCourse[]>([])
  const [stats, setStats] = useState<UserStats>({ enrolled: 0, learningHours: 0, certificates: 0, streak: 0 })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'in-progress' | 'completed' | 'saved'>('in-progress')

  // --- DATA ENGINE ---
  useEffect(() => {
    const fetchData = async () => {
      // 1. Get User
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/auth')
      
      // Get Profile
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setUser({ ...user, ...profile })

      // 2. Fetch Enrollments & Progress (Parallel Requests for Speed)
      const [enrollmentsRes, progressRes] = await Promise.all([
          supabase.from('enrollments').select('course_id, last_accessed_at').eq('user_id', user.id).order('last_accessed_at', { ascending: false }),
          supabase.from('course_progress').select('course_id, completed_at').eq('user_id', user.id)
      ])

      const enrollments = enrollmentsRes.data || []
      const allProgress = progressRes.data || []

      if (enrollments.length > 0) {
        // 3. Fetch Course Details
        const courseIds = enrollments.map(e => e.course_id)
        const { data: courseData } = await supabase
          .from('courses')
          .select('id, title, thumbnail_url, curriculum_data, profiles(full_name)')
          .in('id', courseIds)

        // 4. Process Data & Calculate Stats
        let totalCertificates = 0
        
        const formattedCourses = enrollments.map(enrollment => {
            const course = courseData?.find(c => c.id === enrollment.course_id)
            if (!course) return null

            // Calculate Progress
            const courseProgress = allProgress.filter(p => p.course_id === course.id)
            const completedCount = courseProgress.length
            
            // Calculate Total Lectures from JSON Curriculum
            let totalLectures = 0
            if (Array.isArray(course.curriculum_data)) {
                totalLectures = course.curriculum_data.reduce((acc: number, section: any) => acc + (section.lectures?.length || 0), 0)
            }
            const safeTotal = totalLectures || 1 // Avoid divide by zero
            const percent = Math.min(100, Math.round((completedCount / safeTotal) * 100))

            if (percent === 100) totalCertificates++

            return {
                id: course.id,
                title: course.title,
                thumbnail_url: course.thumbnail_url || "/placeholder-course.jpg",
                instructor_name: course.profiles?.full_name || "Grove Instructor",
                total_lectures: safeTotal,
                completed_lectures: completedCount,
                progress_percent: percent,
                last_accessed: enrollment.last_accessed_at
            }
        }).filter(Boolean) as EnrolledCourse[]

        setCourses(formattedCourses)

        // 5. Calculate "Real" Learning Stats
        // Estimate: 15 mins per lecture completed
        const totalMinutes = allProgress.length * 15 
        const hours = Math.floor(totalMinutes / 60)

        // Calculate Streak (Consecutive days with activity)
        // Group progress by date
        const activityDates = new Set(allProgress.map(p => new Date(p.completed_at).toDateString()))
        let streak = 0
        let checkDate = new Date()
        
        // Check today, then yesterday, etc.
        while (activityDates.has(checkDate.toDateString())) {
            streak++
            checkDate.setDate(checkDate.getDate() - 1)
        }

        setStats({
            enrolled: enrollments.length,
            learningHours: hours,
            certificates: totalCertificates,
            streak: streak || (activityDates.has(new Date().toDateString()) ? 1 : 0) // Minimum 1 if active today
        })
      }
      setLoading(false)
    }
    fetchData()
  }, [router])

  // Filter Logic
  const displayedCourses = courses.filter(c => {
      if (activeTab === 'in-progress') return c.progress_percent < 100
      if (activeTab === 'completed') return c.progress_percent === 100
      return true
  })

  // Resume Course (The one accessed most recently)
  const resumeCourse = courses[0] 

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-green-500 w-10 h-10" />
            <p className="text-gray-500 text-sm animate-pulse">Syncing your progress...</p>
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
                 <Link href="/dashboard" className="text-white font-bold">My Learning</Link>
                 <Link href="/courses" className="hover:text-white transition-colors">Browse Courses</Link>
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
                    {user?.avatar_url ? (
                        <img src={user.avatar_url} className="w-full h-full rounded-full object-cover border-2 border-black" alt="Profile" />
                    ) : (
                        <div className="w-full h-full rounded-full bg-neutral-800 flex items-center justify-center font-bold text-xs">{user?.full_name?.charAt(0)}</div>
                    )}
                </div>
             </Link>
         </div>
      </header>

      <main className="p-6 lg:p-12 max-w-7xl mx-auto space-y-12">
        
        {/* --- WELCOME & STATS --- */}
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.full_name?.split(' ')[0] || 'Student'} 👋</h1>
            <p className="text-gray-400 mb-8">You've invested <span className="text-green-400 font-bold">{stats.learningHours} hours</span> in yourself. Keep it up!</p>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-neutral-900/50 border border-white/10 p-6 rounded-2xl flex items-center gap-4 hover:bg-neutral-900 transition-colors cursor-pointer group">
                    <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 group-hover:scale-110 transition-transform"><BookOpen size={24} /></div>
                    <div><h3 className="text-2xl font-bold">{stats.enrolled}</h3><p className="text-xs text-gray-500 font-bold uppercase">Enrolled Courses</p></div>
                </div>
                <div className="bg-neutral-900/50 border border-white/10 p-6 rounded-2xl flex items-center gap-4 hover:bg-neutral-900 transition-colors cursor-pointer group">
                    <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400 group-hover:scale-110 transition-transform"><Clock size={24} /></div>
                    <div><h3 className="text-2xl font-bold">{stats.learningHours}h</h3><p className="text-xs text-gray-500 font-bold uppercase">Learning Time</p></div>
                </div>
                <div className="bg-neutral-900/50 border border-white/10 p-6 rounded-2xl flex items-center gap-4 hover:bg-neutral-900 transition-colors cursor-pointer group">
                    <div className="p-3 bg-yellow-500/10 rounded-xl text-yellow-400 group-hover:scale-110 transition-transform"><Award size={24} /></div>
                    <div><h3 className="text-2xl font-bold">{stats.certificates}</h3><p className="text-xs text-gray-500 font-bold uppercase">Certificates</p></div>
                </div>
                <div className="bg-gradient-to-br from-green-900/40 to-emerald-900/20 border border-green-500/20 p-6 rounded-2xl flex items-center gap-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-20"><Zap size={64} /></div>
                    <div className="p-3 bg-green-500 rounded-xl text-black shadow-[0_0_15px_rgba(34,197,94,0.6)]"><TrendingUp size={24} /></div>
                    <div><h3 className="text-2xl font-bold text-green-400">{stats.streak} Day</h3><p className="text-xs text-green-200/60 font-bold uppercase">Current Streak</p></div>
                </div>
            </div>
        </section>

        {/* --- HERO: RESUME LEARNING (Dynamic) --- */}
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
                            <div className="h-full bg-green-500 rounded-full transition-all duration-1000" style={{ width: `${resumeCourse.progress_percent}%` }} />
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
                    {['in-progress', 'completed'].map((tab) => (
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