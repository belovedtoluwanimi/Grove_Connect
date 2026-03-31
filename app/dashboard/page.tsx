'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { 
  PlayCircle, Clock, Award, Search, Bell, 
  BookOpen, TrendingUp, User, Zap, Loader2,
  Sparkles, Flame, ChevronRight, GraduationCap, X,
  Download, LogOut, Settings, HelpCircle, Bot, Calendar
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/app/utils/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'

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
  
  // Premium UI States
  const [activeTab, setActiveTab] = useState<'in-progress' | 'completed'>('in-progress')
  const [certificateCourse, setCertificateCourse] = useState<EnrolledCourse | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [showAIAssistant, setShowAIAssistant] = useState(false)
  
  const profileMenuRef = useRef<HTMLDivElement>(null)

  // Close profile menu when clicking outside
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
              setProfileMenuOpen(false)
          }
      }
      if (profileMenuOpen) document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [profileMenuOpen])

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

  // --- PREMIUM FILTER & SEARCH LOGIC ---
  const displayedCourses = useMemo(() => {
      return courses.filter(c => {
          // 1. Tab Filter
          if (activeTab === 'in-progress' && c.progress_percent === 100) return false
          if (activeTab === 'completed' && c.progress_percent < 100) return false
          
          // 2. Live Search Filter
          if (searchQuery.trim()) {
              return c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                     c.instructor_name.toLowerCase().includes(searchQuery.toLowerCase())
          }
          return true
      })
  }, [courses, activeTab, searchQuery])

  const resumeCourse = courses.find(c => c.progress_percent < 100) || courses[0] 

  const handleLogout = async () => {
      await supabase.auth.signOut()
      router.push('/auth')
  }

  if (loading) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
            <div className="relative">
                <div className="w-12 h-12 rounded-full border-4 border-white/10 border-t-green-500 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center"><Sparkles size={16} className="text-green-500" /></div>
            </div>
            <p className="text-zinc-500 text-sm font-medium animate-pulse">Loading your curriculum...</p>
        </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-green-500/30 pb-20 overflow-x-hidden">
      
      {/* --- BACKGROUND ACCENTS --- */}
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15] pointer-events-none z-0" />
      <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-green-900/10 rounded-full blur-[128px] pointer-events-none z-0" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[128px] pointer-events-none z-0" />

      {/* --- TOP NAVIGATION --- */}
      <header className="sticky top-0 z-50 bg-[#050505]/80 backdrop-blur-xl border-b border-white/5 h-20 flex items-center justify-between px-6 lg:px-12">
         <div className="flex items-center gap-12">
             <Link href="/" className="text-2xl font-bold tracking-tighter flex items-center gap-2 group">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-green-500 group-hover:text-black transition-colors shadow-lg">
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
             
             {/* Functional Global Search */}
             <div className="relative hidden lg:block group">
                 <Search size={16} className="absolute left-3 top-2.5 text-zinc-500 group-focus-within:text-emerald-400 transition-colors" />
                 <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search your courses..." 
                    className="bg-black/50 border border-white/10 rounded-full pl-10 pr-4 py-2 text-sm focus:border-green-500/50 focus:bg-black outline-none w-64 transition-all text-white placeholder-zinc-500" 
                 />
                 {searchQuery && (
                     <button onClick={() => setSearchQuery("")} className="absolute right-3 top-2.5 text-zinc-500 hover:text-white">
                         <X size={14} />
                     </button>
                 )}
             </div>

             <div className="h-6 w-px bg-white/10 hidden md:block" />
             
             {/* Premium Profile Dropdown */}
             <div className="relative" ref={profileMenuRef}>
                 <div onClick={() => setProfileMenuOpen(!profileMenuOpen)} className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
                     <div className="text-right hidden md:block">
                         <p className="text-xs font-bold text-white">{user?.full_name}</p>
                         <p className="text-[10px] text-zinc-500">Learner Account</p>
                     </div>
                     <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-green-500 to-emerald-700 p-[2px] shadow-lg">
                         {user?.avatar_url ? (
                             <img src={user.avatar_url} className="w-full h-full rounded-full object-cover border-2 border-[#050505]" alt="Profile" />
                         ) : (
                             <div className="w-full h-full rounded-full bg-neutral-800 flex items-center justify-center font-bold text-xs border-2 border-[#050505]">{user?.full_name?.charAt(0)}</div>
                         )}
                     </div>
                 </div>

                 {/* Dropdown Menu */}
                 <AnimatePresence>
                     {profileMenuOpen && (
                         <motion.div 
                             initial={{ opacity: 0, y: 10, scale: 0.95 }}
                             animate={{ opacity: 1, y: 0, scale: 1 }}
                             exit={{ opacity: 0, y: 10, scale: 0.95 }}
                             className="absolute right-0 mt-3 w-56 bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden origin-top-right z-50"
                         >
                             <div className="p-4 border-b border-white/5 bg-black/50">
                                 <p className="text-sm font-bold text-white truncate">{user?.full_name}</p>
                                 <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
                             </div>
                             <div className="p-2">
                                 <Link href="/settings" onClick={() => setProfileMenuOpen(false)} className="flex items-center gap-3 w-full px-3 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                                     <Settings size={16} className="text-zinc-500" /> Account Settings
                                 </Link>
                                 <button className="flex items-center gap-3 w-full px-3 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                                     <HelpCircle size={16} className="text-zinc-500" /> Help & Support
                                 </button>
                             </div>
                             <div className="p-2 border-t border-white/5">
                                 <button onClick={handleLogout} className="flex items-center gap-3 w-full px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors font-bold">
                                     <LogOut size={16} /> Sign Out
                                 </button>
                             </div>
                         </motion.div>
                     )}
                 </AnimatePresence>
             </div>
         </div>
      </header>

      <main className="relative z-10 p-6 lg:p-10 max-w-7xl mx-auto space-y-12">
        
        {/* --- WELCOME BANNER & STATS --- */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Welcome Card with Weekly Goal */}
            <div className="lg:col-span-2 relative overflow-hidden rounded-3xl bg-gradient-to-br from-neutral-900 to-black border border-white/10 p-8 flex flex-col md:flex-row justify-between items-center md:items-start gap-8">
                <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-green-500/10 rounded-full blur-[80px]" />
                
                <div className="relative z-10 flex-1 text-center md:text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold mb-4">
                        <Sparkles size={12} /> Daily Motivation
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold mb-2 text-white">
                        Ready to learn, <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">{user?.full_name?.split(' ')[0]}</span>?
                    </h1>
                    <p className="text-zinc-400 max-w-md mb-6 text-sm leading-relaxed">
                        Consistency builds mastery. You're on a <span className="text-white font-bold">{stats.streak} day streak</span>. Keep the momentum going today.
                    </p>
                    
                    {resumeCourse && (
                        <button onClick={() => document.getElementById('resume-section')?.scrollIntoView({behavior: 'smooth'})} className="px-6 py-3 bg-white text-black rounded-full text-sm font-bold hover:bg-zinc-200 transition-transform hover:scale-105 flex items-center gap-2 mx-auto md:mx-0 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                            <PlayCircle size={18} /> Resume Learning
                        </button>
                    )}
                </div>

                {/* Weekly Goal Tracker Widget */}
                <div className="relative z-10 w-full md:w-48 bg-black/50 border border-white/5 rounded-2xl p-5 backdrop-blur-md">
                    <div className="flex justify-between items-center mb-3">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Weekly Goal</h4>
                        <Calendar size={14} className="text-zinc-500" />
                    </div>
                    <div className="flex items-baseline gap-1 mb-3">
                        <span className="text-3xl font-black text-white">{Math.min(stats.streak, 7)}</span>
                        <span className="text-sm font-bold text-zinc-500">/ 7 Days</span>
                    </div>
                    <div className="flex gap-1 justify-between w-full">
                        {[1,2,3,4,5,6,7].map((day) => (
                            <div key={day} className={`h-8 w-full rounded-md ${day <= (stats.streak % 7 || (stats.streak > 0 ? 7 : 0)) ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-white/5'}`} />
                        ))}
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
        {resumeCourse && !searchQuery && (
            <section id="resume-section" className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <PlayCircle className="text-green-500" size={20} /> Continue Watching
                    </h2>
                </div>
                
                <div className="relative group w-full h-[350px] rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-zinc-900">
                    <Image 
                        src={resumeCourse.thumbnail_url} 
                        alt="Resume" 
                        fill 
                        className="object-cover transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-100" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                    
                    <div className="absolute bottom-0 left-0 p-8 w-full md:w-2/3">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-[10px] font-bold uppercase tracking-widest bg-white/20 backdrop-blur-md px-3 py-1 rounded text-white">
                                Next Lesson
                            </span>
                            <span className="text-[10px] font-bold text-green-400 flex items-center gap-1 bg-green-500/10 px-2 py-1 rounded border border-green-500/20 backdrop-blur-md">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"/> Auto-Synced
                            </span>
                        </div>
                        
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-2 leading-tight drop-shadow-lg">{resumeCourse.title}</h2>
                        <p className="text-zinc-300 text-sm mb-6 line-clamp-2 max-w-md drop-shadow-md">Jump right back into the curriculum. You're doing great!</p>
                        
                        <div className="flex flex-col sm:flex-row sm:items-end gap-6">
                            <Link href={`/courses/${resumeCourse.id}/learn`}>
                                <button className="h-12 px-8 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full font-bold flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] hover:-translate-y-1">
                                    <PlayCircle fill="currentColor" size={20} /> Resume Course
                                </button>
                            </Link>
                            <div className="flex-1 max-w-xs pb-1">
                                <div className="flex justify-between text-xs font-bold text-zinc-300 mb-2">
                                    <span>{resumeCourse.progress_percent}% Complete</span>
                                    <span>{resumeCourse.completed_lectures}/{resumeCourse.total_lectures} Lessons</span>
                                </div>
                                <div className="h-2 w-full bg-black/50 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
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
            <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-1">
                <div className="flex items-center gap-6">
                    {['in-progress', 'completed'].map((tab) => (
                        <button 
                            key={tab}
                            onClick={() => { setActiveTab(tab as any); setSearchQuery(""); }}
                            className={`pb-3 text-sm font-bold capitalize transition-all relative ${activeTab === tab ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            {tab.replace('-', ' ')}
                            {activeTab === tab && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-500" />}
                        </button>
                    ))}
                </div>
                {searchQuery && <p className="text-xs font-bold text-zinc-500 pb-3">Showing results for "{searchQuery}"</p>}
            </div>

            {displayedCourses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-neutral-900/30 rounded-3xl border border-dashed border-white/10">
                    <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mb-4 text-zinc-600 shadow-inner"><BookOpen size={24}/></div>
                    <h3 className="text-xl font-bold text-white mb-2">{searchQuery ? "No matching courses found" : "No courses here yet"}</h3>
                    <p className="text-zinc-500 mb-6 text-sm">{searchQuery ? "Try a different search term." : "Start your journey by enrolling in a new course."}</p>
                    {!searchQuery && <Link href="/courses" className="px-6 py-2.5 bg-white text-black rounded-full font-bold text-sm hover:bg-zinc-200 transition-colors">Browse Library</Link>}
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
                            className="group bg-neutral-900/80 backdrop-blur-sm border border-white/5 rounded-2xl overflow-hidden hover:border-white/20 transition-all shadow-lg flex flex-col"
                        >
                            <div className="relative aspect-video bg-neutral-800 shrink-0">
                                <Image src={course.thumbnail_url} alt={course.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                    <Link href={`/courses/${course.id}/learn`}>
                                        <button className="bg-white/90 text-black p-3.5 rounded-full shadow-xl hover:scale-110 transition-transform">
                                            <PlayCircle size={24} fill="currentColor" />
                                        </button>
                                    </Link>
                                </div>
                                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold text-white border border-white/10">
                                    {course.progress_percent === 100 ? 'Completed' : `${course.total_lectures - course.completed_lectures} Left`}
                                </div>
                            </div>
                            
                            <div className="p-5 flex-1 flex flex-col">
                                <h3 className="font-bold text-white mb-1.5 line-clamp-2 group-hover:text-green-400 transition-colors text-base leading-tight">{course.title}</h3>
                                <div className="flex items-center gap-2 mb-4 mt-auto pt-2">
                                   <div className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-[8px] font-bold text-white border border-white/10 shrink-0">
                                      {course.instructor_name.charAt(0)}
                                   </div>
                                   <p className="text-xs text-zinc-500 truncate">{course.instructor_name}</p>
                                </div>
                                
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] uppercase tracking-wider font-bold text-zinc-500">
                                        <span>Progress</span>
                                        <span className={course.progress_percent === 100 ? 'text-green-400' : 'text-zinc-300'}>{course.progress_percent}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full transition-all duration-1000 ${course.progress_percent === 100 ? 'bg-green-500' : 'bg-gradient-to-r from-green-600 to-green-800'}`} style={{ width: `${course.progress_percent}%` }} />
                                    </div>
                                </div>

                                {course.progress_percent === 100 && (
                                    <button
                                    onClick={() => setCertificateCourse(course)}
                                    className="mt-4 w-full py-2.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-yellow-500 hover:text-black transition-all">
                                        <Award size={14} /> View Certificate
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </section>

        {/* --- GROVE AI FLOATING ACTION BUTTON --- */}
        <div className="fixed bottom-6 right-6 z-40 print:hidden">
            <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAIAssistant(!showAIAssistant)}
                className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.4)] border border-emerald-300 relative group"
            >
                <Bot size={24} className="text-black" />
                {/* Ping dot */}
                <span className="absolute top-0 right-0 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                </span>
            </motion.button>
            
            <AnimatePresence>
                {showAIAssistant && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className="absolute bottom-20 right-0 w-80 bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl p-5 origin-bottom-right"
                    >
                        <div className="flex justify-between items-center mb-4 pb-3 border-b border-white/5">
                            <h4 className="font-bold text-white flex items-center gap-2"><Sparkles size={16} className="text-emerald-400"/> Grove AI Tutor</h4>
                            <button onClick={() => setShowAIAssistant(false)} className="text-zinc-500 hover:text-white"><X size={16}/></button>
                        </div>
                        <p className="text-xs text-zinc-400 mb-4 leading-relaxed">Hi {user?.full_name?.split(' ')[0]}, I'm your AI learning assistant. How can I help you with your coursework today?</p>
                        <input type="text" placeholder="Ask a question..." className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500/50 text-white mb-2" />
                        <p className="text-[10px] text-zinc-600 text-center">Powered by Advanced AI Models</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        {/* --- PREMIUM CERTIFICATE MODAL --- */}
        <AnimatePresence>
          {certificateCourse && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                  <motion.div 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      exit={{ opacity: 0 }} 
                      onClick={() => setCertificateCourse(null)}
                      className="absolute inset-0 bg-black/80 backdrop-blur-md print:hidden" 
                  />
                  
                  <motion.div 
                      initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                      animate={{ opacity: 1, scale: 1, y: 0 }} 
                      exit={{ opacity: 0, scale: 0.95, y: 20 }}
                      className="relative w-full max-w-5xl aspect-[1.414/1] bg-[#0a0a0a] rounded-xl border-[8px] border-double border-yellow-600/30 overflow-hidden shadow-[0_0_60px_rgba(234,179,8,0.15)] flex flex-col items-center justify-center text-center p-8 sm:p-12 z-10 certificate-print-container"
                  >
                      {/* Decorative Background Elements */}
                      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none" />
                      <div className="absolute top-[-20%] left-[-10%] w-[400px] h-[400px] bg-yellow-500/10 blur-[120px] rounded-full pointer-events-none" />
                      <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />
                      
                      <div className="absolute top-6 left-6 w-12 h-12 border-t-2 border-l-2 border-yellow-500/40" />
                      <div className="absolute top-6 right-6 w-12 h-12 border-t-2 border-r-2 border-yellow-500/40" />
                      <div className="absolute bottom-6 left-6 w-12 h-12 border-b-2 border-l-2 border-yellow-500/40" />
                      <div className="absolute bottom-6 right-6 w-12 h-12 border-b-2 border-r-2 border-yellow-500/40" />

                      <div className="relative z-10 w-full h-full border border-white/5 bg-black/60 backdrop-blur-sm p-8 sm:p-16 flex flex-col items-center justify-between">
                          
                          <div className="flex flex-col items-center gap-4 mb-4">
                              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-black shadow-lg">
                                  <GraduationCap size={28} />
                              </div>
                              <span className="text-xl font-black tracking-[0.2em] text-white">GROVE<span className="text-emerald-500">CONNECT</span></span>
                          </div>

                          <div className="space-y-6 w-full">
                              <h2 className="text-xs sm:text-sm text-yellow-500 uppercase tracking-[0.4em] font-bold">Certificate of Completion</h2>
                              <p className="text-zinc-400 text-base italic font-serif">This is to proudly certify that</p>
                              
                              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white py-6 border-b border-white/10 w-3/4 mx-auto font-serif tracking-tight">
                                  {user?.full_name || 'Grove Student'}
                              </h1>
                              
                              <p className="text-zinc-400 text-base italic font-serif pt-4">has successfully mastered the curriculum and completed</p>
                              <h3 className="text-2xl sm:text-3xl font-bold text-emerald-400 max-w-2xl mx-auto leading-tight">
                                  {certificateCourse.title}
                              </h3>
                          </div>

                          <div className="w-full flex justify-between items-end mt-12 px-4 sm:px-12">
                              <div className="text-center w-48">
                                  <p className="text-white border-b border-white/20 pb-2 font-medium font-serif">
                                      {new Date(certificateCourse.last_accessed).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                  </p>
                                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-3">Date Conferred</p>
                              </div>
                              
                              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-600/20 to-amber-500/10 border border-yellow-500/30 flex items-center justify-center shrink-0 shadow-[0_0_30px_rgba(234,179,8,0.2)]">
                                  <Award size={40} className="text-yellow-500" />
                              </div>

                              <div className="text-center w-48">
                                  <p className="text-emerald-100 border-b border-white/20 pb-2 text-4xl" style={{ fontFamily: "'Brush Script MT', 'Dancing Script', cursive", transform: 'rotate(-3deg)' }}>
                                      Beloved Toluwanimi
                                  </p>
                                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-3">CEO, Grove Connect</p>
                              </div>
                          </div>
                      </div>
                  </motion.div>

                  <div className="absolute bottom-6 right-6 flex gap-4 z-20 print:hidden">
                      <button onClick={() => window.print()} className="px-6 py-3 bg-white text-black font-bold rounded-xl shadow-lg hover:scale-105 transition-transform flex items-center gap-2">
                          <Download size={18} /> Save PDF
                      </button>
                      <button onClick={() => setCertificateCourse(null)} className="p-3 bg-zinc-800 text-white rounded-xl shadow-lg hover:bg-red-500 hover:text-white transition-colors">
                          <X size={20} />
                      </button>
                  </div>

                  <style dangerouslySetInnerHTML={{__html: `
                      @media print {
                          body * { visibility: hidden; }
                          .certificate-print-container, .certificate-print-container * { visibility: visible; }
                          .certificate-print-container {
                              position: fixed !important; left: 50% !important; top: 50% !important;
                              transform: translate(-50%, -50%) !important; width: 100vw !important; height: 100vh !important;
                              border: none !important; border-radius: 0 !important; box-shadow: none !important; margin: 0 !important;
                              background: #050505 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;
                          }
                          @page { size: landscape; margin: 0; }
                      }
                  `}} />
              </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}

export default StudentDashboard