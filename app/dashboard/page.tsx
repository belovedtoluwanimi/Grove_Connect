'use client'

import React, { useState, useEffect } from 'react'
import { 
  PlayCircle, Clock, Award, Search, Bell, 
  BookOpen, TrendingUp, User, Zap, Loader2,
  Sparkles, Flame, GraduationCap, AlertCircle
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
const StatCard = ({ icon: Icon, label, value, color, delay }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="relative overflow-hidden bg-neutral-900/60 backdrop-blur-xl border border-white/5 p-5 rounded-2xl group hover:border-white/10 transition-colors"
  >
    <div className={`absolute top-0 right-0 p-16 ${color} opacity-5 blur-[40px] group-hover:opacity-10 transition-opacity`} />
    <div className="relative z-10 flex items-start justify-between mb-4">
        <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-zinc-300 group-hover:text-white transition-colors">
            <Icon size={20} />
        </div>
        {label === 'Streak' && (
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-orange-400 bg-orange-500/10 px-2 py-1 rounded-full border border-orange-500/20 shadow-[0_0_10px_rgba(249,115,22,0.2)]">
                <Flame size={10} fill="currentColor" /> ON FIRE
            </div>
        )}
    </div>
    <div>
        <h3 className="text-2xl font-bold text-white mb-0.5 tracking-tight">{value}</h3>
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{label}</p>
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
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'in-progress' | 'completed'>('in-progress')

  // --- DATA ENGINE ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return router.push('/auth')
        
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        setUser({ ...user, ...profile })

        // 1. Fetch Enrollments & Progress
        const [enrollmentsRes, progressRes] = await Promise.all([
            supabase.from('enrollments').select('course_id, last_accessed_at').eq('user_id', user.id).order('last_accessed_at', { ascending: false }),
            supabase.from('course_progress').select('course_id, completed_at').eq('user_id', user.id)
        ])

        if (enrollmentsRes.error) throw enrollmentsRes.error

        const enrollments = enrollmentsRes.data || []
        const allProgress = progressRes.data || []

        if (enrollments.length > 0) {
            const courseIds = enrollments.map(e => e.course_id)
            
            // 2. Fetch Course Details (With Safe Join)
            const { data: courseData, error: courseError } = await supabase
            .from('courses')
            .select('id, title, thumbnail_url, curriculum_data, profiles(full_name)')
            .in('id', courseIds)

            if (courseError) throw courseError

            let totalCertificates = 0
            
            const formattedCourses = enrollments.map(enrollment => {
                const course = courseData?.find(c => c.id === enrollment.course_id)
                if (!course) return null

                const courseProgress = allProgress.filter(p => p.course_id === course.id)
                const completedCount = courseProgress.length
                
                // Calculate Total Lectures safely
                let totalLectures = 0
                if (Array.isArray(course.curriculum_data)) {
                    totalLectures = course.curriculum_data.reduce((acc: number, section: any) => acc + (section.lectures?.length || 0), 0)
                }
                const safeTotal = totalLectures || 1
                const percent = Math.min(100, Math.round((completedCount / safeTotal) * 100))

                if (percent === 100) totalCertificates++

                // Handle Array vs Object for Profiles
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

            // 3. Stats Calculation
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
      } catch (err: any) {
          console.error("Dashboard Error:", err)
          setError(err.message || "Failed to load dashboard")
      } finally {
          setLoading(false)
      }
    }
    fetchData()
  }, [router, supabase])

  // Logic
  const displayedCourses = courses.filter(c => activeTab === 'in-progress' ? c.progress_percent < 100 : c.progress_percent === 100)
  const resumeCourse = courses[0] 

  if (loading) return (
    <div className="min-h-screen bg-[#020202] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-emerald-500 w-8 h-8" />
            <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest animate-pulse">Syncing Workspace...</p>
        </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-[#020202] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-red-950/20 border border-red-500/20 p-6 rounded-2xl text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-white font-bold mb-2">Dashboard Error</h3>
            <p className="text-red-200/60 text-sm mb-6">{error}</p>
            <button onClick={() => window.location.reload()} className="px-6 py-2 bg-white text-black rounded-full font-bold text-sm">Retry</button>
        </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#020202] text-white font-sans selection:bg-emerald-500/30 pb-24">
      
      {/* --- TOP NAVIGATION --- */}
      <header className="sticky top-0 z-50 bg-[#020202]/80 backdrop-blur-xl border-b border-white/5 h-20">
         <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
             <div className="flex items-center gap-12">
                 <Link href="/" className="flex items-center gap-3 group">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-green-700 flex items-center justify-center text-white shadow-lg shadow-emerald-900/50">
                        <GraduationCap size={18} fill="white" />
                    </div>
                    <span className="font-bold text-lg tracking-tight">Grove<span className="text-emerald-500">Student</span></span>
                 </Link>
             </div>
             <div className="flex items-center gap-6">
                 <div className="relative hidden md:block">
                     <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                     <input type="text" placeholder="Search library..." className="bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-2 text-sm focus:border-emerald-500/50 focus:bg-white/10 outline-none w-64 transition-all" />
                 </div>
                 <div className="h-6 w-px bg-white/10 hidden md:block" />
                 <Link href="/settings">
                    <div className="w-9 h-9 rounded-full p-[2px] bg-gradient-to-tr from-emerald-500 to-cyan-500 cursor-pointer hover:scale-105 transition-transform">
                        <img src={user?.avatar_url || "https://github.com/shadcn.png"} className="w-full h-full rounded-full object-cover border-2 border-[#020202]" alt="Profile" />
                    </div>
                 </Link>
             </div>
         </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-10 space-y-16">
        
        {/* --- HERO WELCOME --- */}
        <section className="relative rounded-3xl overflow-hidden min-h-[300px] flex items-center border border-white/10">
            {/* Background Image Overlay */}
            <div className="absolute inset-0 z-0">
                <Image 
                    src="https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=2670&auto=format&fit=crop" 
                    alt="Abstract Background" 
                    fill 
                    className="object-cover opacity-40"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
            </div>

            <div className="relative z-10 p-8 md:p-12 w-full max-w-3xl">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-4 backdrop-blur-md">
                        <Sparkles size={12} /> Welcome Back
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
                        Ready to learn, <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                            {user?.full_name?.split(' ')[0]}?
                        </span>
                    </h1>
                    <p className="text-zinc-400 text-lg mb-8 max-w-xl">
                        You are on a <span className="text-white font-bold">{stats.streak} day streak</span>. Continue your progress to earn your next certificate.
                    </p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                        <StatCard icon={BookOpen} label="Enrolled" value={stats.enrolled} color="bg-blue-500" delay={0.1} />
                        <StatCard icon={Clock} label="Hours" value={stats.learningHours} color="bg-purple-500" delay={0.2} />
                        <StatCard icon={Award} label="Awards" value={stats.certificates} color="bg-yellow-500" delay={0.3} />
                        <StatCard icon={Zap} label="Streak" value={stats.streak} color="bg-orange-500" delay={0.4} />
                    </div>
                </motion.div>
            </div>
        </section>

        {/* --- RESUME LEARNING (Modern Card) --- */}
        {resumeCourse && (
            <motion.section 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.4 }}
                className="space-y-6"
            >
                <div className="flex items-center gap-3">
                    <div className="h-8 w-1 bg-emerald-500 rounded-full" />
                    <h2 className="text-2xl font-bold">Continue Learning</h2>
                </div>

                <div className="relative group rounded-2xl overflow-hidden border border-white/10 bg-neutral-900/50 hover:border-emerald-500/30 transition-all duration-500">
                    <div className="flex flex-col md:flex-row h-full">
                        {/* Thumbnail Side */}
                        <div className="w-full md:w-2/5 relative h-64 md:h-auto overflow-hidden">
                            <Image src={resumeCourse.thumbnail_url} alt={resumeCourse.title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                                    <PlayCircle size={32} fill="white" className="text-white" />
                                </div>
                            </div>
                        </div>

                        {/* Content Side */}
                        <div className="flex-1 p-8 flex flex-col justify-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[60px] pointer-events-none" />
                            
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-950/50 border border-emerald-500/20 px-3 py-1 rounded-full">
                                        In Progress
                                    </span>
                                    <span className="text-xs text-zinc-500">{resumeCourse.progress_percent}% Complete</span>
                                </div>

                                <h3 className="text-3xl font-bold text-white mb-2">{resumeCourse.title}</h3>
                                <p className="text-zinc-400 text-sm mb-8 flex items-center gap-2">
                                    <User size={14} /> {resumeCourse.instructor_name}
                                </p>

                                <div className="space-y-6">
                                    {/* Progress Bar */}
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full" style={{ width: `${resumeCourse.progress_percent}%` }} />
                                    </div>

                                    <div className="flex gap-4">
                                        <Link href={`/courses/${resumeCourse.id}/learn`} className="flex-1">
                                            <button className="w-full py-3.5 bg-white text-black rounded-xl font-bold hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2">
                                                <PlayCircle size={18} fill="black" /> Resume Lesson
                                            </button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.section>
        )}

        {/* --- LIBRARY GRID --- */}
        <section>
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-1 bg-blue-500 rounded-full" />
                    <h2 className="text-2xl font-bold">Your Library</h2>
                </div>
                <div className="flex bg-white/5 p-1 rounded-lg">
                    {['in-progress', 'completed'].map((tab) => (
                        <button 
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`px-4 py-1.5 rounded-md text-xs font-bold capitalize transition-all ${activeTab === tab ? 'bg-neutral-800 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            {tab.replace('-', ' ')}
                        </button>
                    ))}
                </div>
            </div>

            {displayedCourses.length === 0 ? (
                <div className="py-20 border border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 text-zinc-600">
                        <BookOpen size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">No courses found</h3>
                    <p className="text-zinc-500 text-sm mb-6">Looks like you haven't enrolled in any courses yet.</p>
                    <Link href="/courses" className="px-6 py-2.5 rounded-full bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-500 transition-colors">
                        Browse Catalog
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
                    {displayedCourses.map((course, i) => (
                        <motion.div 
                            key={course.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * i }}
                            className="group bg-neutral-900 border border-white/5 rounded-2xl overflow-hidden hover:border-white/20 hover:shadow-2xl hover:shadow-emerald-900/10 transition-all duration-300"
                        >
                            <div className="relative aspect-video">
                                <Image src={course.thumbnail_url} alt={course.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Link href={`/courses/${course.id}/learn`}>
                                        <button className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-black shadow-lg transform scale-0 group-hover:scale-100 transition-transform duration-300">
                                            <PlayCircle size={24} fill="currentColor" />
                                        </button>
                                    </Link>
                                </div>
                            </div>
                            <div className="p-5">
                                <h4 className="font-bold text-white line-clamp-1 mb-1 group-hover:text-emerald-400 transition-colors">{course.title}</h4>
                                <p className="text-xs text-zinc-500 mb-4">{course.instructor_name}</p>
                                
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-bold uppercase text-zinc-400">
                                        <span>Progress</span>
                                        <span>{course.progress_percent}%</span>
                                    </div>
                                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full ${course.progress_percent === 100 ? 'bg-emerald-500' : 'bg-zinc-600'}`} style={{ width: `${course.progress_percent}%` }} />
                                    </div>
                                </div>
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