'use client'

import React, { useState, useEffect } from 'react'
import { 
  PlayCircle, Clock, Award, Search, Bell, 
  BookOpen, TrendingUp, User, Zap, Loader2,
  Sparkles, Flame, ChevronRight, GraduationCap
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

// --- COMPONENTS ---

const StatCard = ({ icon: Icon, label, value, subtext, gradient }: any) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="relative overflow-hidden bg-neutral-900/40 backdrop-blur-md border border-white/5 p-5 rounded-2xl group"
  >
    <div className={`absolute top-0 right-0 p-20 ${gradient} opacity-10 blur-[50px] transition-opacity group-hover:opacity-20`} />
    <div className="relative z-10 flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl bg-white/5 border border-white/5 ${subtext}`}>
            <Icon size={22} />
        </div>
        {label === 'Streak' && (
            <div className="flex items-center gap-1 text-[10px] font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">
                <Flame size={10} fill="currentColor" /> ON FIRE
            </div>
        )}
    </div>
    <div>
        <h3 className="text-3xl font-bold text-white mb-1 tracking-tight">{value}</h3>
        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">{label}</p>
    </div>
  </motion.div>
)

const StudentDashboard = () => {
  const router = useRouter()
  const supabase = createClient()
  
  const [user, setUser] = useState<any>(null)
  const [courses, setCourses] = useState<EnrolledCourse[]>([])
  const [stats, setStats] = useState<UserStats>({ enrolled: 0, learningHours: 0, certificates: 0, streak: 0 })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'in-progress' | 'completed'>('in-progress')

  // --- DATA ENGINE ---
  useEffect(() => {
    const fetchData = async () => {
      // 1. Get User
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/auth')
      
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setUser({ ...user, ...profile })

      // 2. Fetch Enrollments & Progress
      const [enrollmentsRes, progressRes] = await Promise.all([
          supabase.from('enrollments').select('course_id, last_accessed_at').eq('user_id', user.id).order('last_accessed_at', { ascending: false }),
          supabase.from('course_progress').select('course_id, completed_at').eq('user_id', user.id)
      ])

      const enrollments = enrollmentsRes.data || []
      const allProgress = progressRes.data || []

      if (enrollments.length > 0) {
        const courseIds = enrollments.map(e => e.course_id)
        const { data: courseData } = await supabase
          .from('courses')
          .select('id, title, thumbnail_url, curriculum_data, profiles(full_name)')
          .in('id', courseIds)

        let totalCertificates = 0
        
        const formattedCourses = enrollments.map(enrollment => {
            const course = courseData?.find(c => c.id === enrollment.course_id)
            if (!course) return null

            const courseProgress = allProgress.filter(p => p.course_id === course.id)
            const completedCount = courseProgress.length
            
            let totalLectures = 0
            if (Array.isArray(course.curriculum_data)) {
                totalLectures = course.curriculum_data.reduce((acc: number, section: any) => acc + (section.lectures?.length || 0), 0)
            }
            const safeTotal = totalLectures || 1
            const percent = Math.min(100, Math.round((completedCount / safeTotal) * 100))

            if (percent === 100) totalCertificates++

            const instructorProfile = Array.isArray(course.profiles) ? course.profiles[0] : course.profiles;
            const instructorName = (instructorProfile as any)?.full_name || "Grove Instructor";

            return {
                id: course.id,
                title: course.title,
                thumbnail_url: course.thumbnail_url || "/placeholder-course.jpg",
                instructor_name: instructorName,
                total_lectures: safeTotal,
                completed_lectures: completedCount,
                progress_percent: percent,
                last_accessed: enrollment.last_accessed_at
            }
        }).filter(Boolean) as EnrolledCourse[]

        setCourses(formattedCourses)

        // Calculate Stats
        const totalMinutes = allProgress.length * 15 
        const hours = Math.floor(totalMinutes / 60)

        const activityDates = new Set(allProgress.map(p => new Date(p.completed_at).toDateString()))
        let streak = 0
        let checkDate = new Date()
        while (activityDates.has(checkDate.toDateString())) {
            streak++
            checkDate.setDate(checkDate.getDate() - 1)
        }

        setStats({
            enrolled: enrollments.length,
            learningHours: hours,
            certificates: totalCertificates,
            streak: streak || (activityDates.has(new Date().toDateString()) ? 1 : 0)
        })
      }
      setLoading(false)
    }
    fetchData()
  }, [router, supabase])

  // Filter Logic
  const displayedCourses = courses.filter(c => {
      if (activeTab === 'in-progress') return c.progress_percent < 100
      if (activeTab === 'completed') return c.progress_percent === 100
      return true
  })

  const resumeCourse = courses[0] 

  if (loading) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
            <div className="relative">
                <div className="w-12 h-12 rounded-full border-4 border-white/10 border-t-green-500 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center"><Sparkles size={16} className="text-green-500" /></div>
            </div>
            <p className="text-zinc-500 text-sm font-medium animate-pulse">Building your dashboard...</p>
        </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-green-500/30 pb-20">
      
      {/* --- BACKGROUND ACCENTS --- */}
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none z-0" />
      <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-green-900/10 rounded-full blur-[128px] pointer-events-none z-0" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[128px] pointer-events-none z-0" />

      {/* --- TOP NAVIGATION --- */}
      <header className="sticky top-0 z-50 bg-[#050505]/80 backdrop-blur-xl border-b border-white/5 h-20 flex items-center justify-between px-6 lg:px-12">
         <div className="flex items-center gap-12">
             <Link href="/" className="text-2xl font-bold tracking-tighter flex items-center gap-2 group">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-green-500 group-hover:text-black transition-colors">
                    <GraduationCap size={18} />
                </div>
                <span>GROVE<span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">STUDENT</span></span>
             </Link>
             <nav className="hidden md:flex gap-1 p-1 bg-white/5 rounded-full border border-white/5">
                 <Link href="/dashboard" className="px-4 py-1.5 rounded-full bg-neutral-800 text-white text-xs font-bold shadow-lg">My Learning</Link>
                 <Link href="/courses" className="px-4 py-1.5 rounded-full text-zinc-400 hover:text-white text-xs font-bold transition-colors">Browse</Link>
             </nav>
         </div>
         <div className="flex items-center gap-5">
             <div className="relative hidden lg:block group">
                 <Search size={16} className="absolute left-3 top-2.5 text-zinc-500 group-focus-within:text-white transition-colors" />
                 <input type="text" placeholder="Search..." className="bg-transparent border border-white/10 rounded-full pl-10 pr-4 py-2 text-sm focus:border-green-500/50 focus:bg-white/5 outline-none w-48 transition-all" />
             </div>
             <div className="h-6 w-px bg-white/10 hidden md:block" />
             <Link href="/settings">
                <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
                    <div className="text-right hidden md:block">
                        <p className="text-xs font-bold text-white">{user?.full_name}</p>
                        <p className="text-[10px] text-zinc-500">Free Plan</p>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-green-500 to-emerald-700 p-[2px]">
                        {user?.avatar_url ? (
                            <img src={user.avatar_url} className="w-full h-full rounded-full object-cover border-2 border-[#050505]" alt="Profile" />
                        ) : (
                            <div className="w-full h-full rounded-full bg-neutral-800 flex items-center justify-center font-bold text-xs border-2 border-[#050505]">{user?.full_name?.charAt(0)}</div>
                        )}
                    </div>
                </div>
             </Link>
         </div>
      </header>

      <main className="relative z-10 p-6 lg:p-10 max-w-7xl mx-auto space-y-12">
        
        {/* --- WELCOME BANNER & STATS --- */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Welcome Card */}
            <div className="lg:col-span-2 relative overflow-hidden rounded-3xl bg-gradient-to-br from-neutral-900 to-black border border-white/10 p-8 flex flex-col justify-center">
                <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-green-500/10 rounded-full blur-[80px]" />
                <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold mb-4">
                        <Sparkles size={12} /> Daily Motivation
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold mb-2 text-white">
                        Keep pushing, <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">{user?.full_name?.split(' ')[0]}</span>!
                    </h1>
                    <p className="text-zinc-400 max-w-lg mb-6 text-sm md:text-base leading-relaxed">
                        You've reached a <span className="text-white font-bold">{stats.streak} day streak</span>. Consistency is the key to mastering your craft. Don't stop now.
                    </p>
                    <div className="flex gap-3">
                        <button onClick={() => document.getElementById('resume-section')?.scrollIntoView({behavior: 'smooth'})} className="px-6 py-2.5 bg-white text-black rounded-full text-sm font-bold hover:bg-zinc-200 transition-colors flex items-center gap-2">
                           <PlayCircle size={16} /> Resume Learning
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
                <StatCard icon={BookOpen} label="Courses" value={stats.enrolled} subtext="text-blue-400" gradient="bg-blue-500" />
                <StatCard icon={Clock} label="Hours" value={stats.learningHours} subtext="text-purple-400" gradient="bg-purple-500" />
                <StatCard icon={Award} label="Certificates" value={stats.certificates} subtext="text-yellow-400" gradient="bg-yellow-500" />
                <StatCard icon={Zap} label="Streak" value={stats.streak} subtext="text-orange-400" gradient="bg-orange-500" />
            </div>
        </section>

        {/* --- RESUME LEARNING (Cinematic Card) --- */}
        {resumeCourse && (
            <section id="resume-section" className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <PlayCircle className="text-green-500" size={20} /> Continue Watching
                    </h2>
                </div>
                
                <div className="relative group w-full h-[350px] rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
                    <Image 
                        src={resumeCourse.thumbnail_url} 
                        alt="Resume" 
                        fill 
                        className="object-cover transition-transform duration-700 group-hover:scale-105" 
                    />
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                    
                    <div className="absolute bottom-0 left-0 p-8 w-full md:w-2/3">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-[10px] font-bold uppercase tracking-widest bg-white/20 backdrop-blur-md px-2 py-1 rounded text-white">
                                Course in Progress
                            </span>
                            <span className="text-[10px] font-bold text-green-400 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"/> Live Sync
                            </span>
                        </div>
                        
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-2 leading-tight">{resumeCourse.title}</h2>
                        <p className="text-zinc-300 text-sm mb-6 line-clamp-2">Picked up exactly where you left off. Dive back into the details of this module.</p>
                        
                        <div className="flex items-end gap-6">
                            <Link href={`/courses/${resumeCourse.id}/learn`}>
                                <button className="h-12 px-8 bg-green-600 hover:bg-green-500 text-white rounded-full font-bold flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:shadow-[0_0_30px_rgba(34,197,94,0.6)] hover:-translate-y-1">
                                    <PlayCircle fill="currentColor" size={20} /> Play Lesson
                                </button>
                            </Link>
                            <div className="flex-1 max-w-xs pb-1">
                                <div className="flex justify-between text-xs text-zinc-400 mb-2">
                                    <span>{resumeCourse.progress_percent}% Complete</span>
                                    <span>{resumeCourse.completed_lectures}/{resumeCourse.total_lectures} Lessons</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
                                    <div className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full" style={{ width: `${resumeCourse.progress_percent}%` }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        )}

        {/* --- COURSE LIBRARY GRID --- */}
        <section>
            <div className="flex items-center gap-6 mb-8 border-b border-white/5 pb-1">
                {['in-progress', 'completed'].map((tab) => (
                    <button 
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`pb-3 text-sm font-bold capitalize transition-all relative ${activeTab === tab ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        {tab.replace('-', ' ')}
                        {activeTab === tab && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-500" />}
                    </button>
                ))}
            </div>

            {displayedCourses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-neutral-900/30 rounded-3xl border border-dashed border-white/10">
                    <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mb-4 text-zinc-600 shadow-inner"><BookOpen size={24}/></div>
                    <h3 className="text-xl font-bold text-white mb-2">No courses here yet</h3>
                    <p className="text-zinc-500 mb-6 text-sm">Start your journey by enrolling in a new course.</p>
                    <Link href="/courses" className="px-6 py-2.5 bg-white text-black rounded-full font-bold text-sm hover:bg-zinc-200 transition-colors">Browse Library</Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {displayedCourses.map((course) => (
                        <motion.div 
                            key={course.id} 
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            whileHover={{ y: -5 }}
                            className="group bg-neutral-900 border border-white/5 rounded-2xl overflow-hidden hover:border-white/20 transition-all shadow-lg"
                        >
                            <div className="relative aspect-video bg-neutral-800">
                                <Image src={course.thumbnail_url} alt={course.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                    <Link href={`/courses/${course.id}/learn`}>
                                        <button className="bg-white/90 text-black p-3.5 rounded-full shadow-xl hover:scale-110 transition-transform">
                                            <PlayCircle size={24} fill="currentColor" />
                                        </button>
                                    </Link>
                                </div>
                                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold text-white border border-white/10">
                                    {course.total_lectures - course.completed_lectures} Left
                                </div>
                            </div>
                            
                            <div className="p-5">
                                <h3 className="font-bold text-white mb-1.5 line-clamp-1 group-hover:text-green-400 transition-colors text-lg">{course.title}</h3>
                                <div className="flex items-center gap-2 mb-4">
                                   <div className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-[8px] text-white border border-white/10">
                                      {course.instructor_name.charAt(0)}
                                   </div>
                                   <p className="text-xs text-zinc-500">{course.instructor_name}</p>
                                </div>
                                
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[11px] font-bold text-zinc-400">
                                        <span>Progress</span>
                                        <span className={course.progress_percent === 100 ? 'text-green-400' : ''}>{course.progress_percent}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full transition-all duration-1000 ${course.progress_percent === 100 ? 'bg-green-500' : 'bg-gradient-to-r from-green-600 to-green-800'}`} style={{ width: `${course.progress_percent}%` }} />
                                    </div>
                                </div>

                                {course.progress_percent === 100 && (
                                    <button className="mt-4 w-full py-2.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-yellow-500 hover:text-black transition-all">
                                        <Award size={14} /> View Certificate
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </section>

      </main>
    </div>
  )
}

export default StudentDashboard