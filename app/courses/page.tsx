'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Search, Star, Clock, BarChart, BookOpen, 
  CheckCircle2, Loader2, ArrowRight, Zap, Crown, Lock, PlayCircle
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import CTASection from '../components/CTASection' 
import { useAuth } from '@/app/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { createClient } from '@/app/utils/supabase/client'
import { motion } from 'framer-motion'

// --- CONSTANTS ---
const CATEGORIES = ["All", "Web Development", "UI/UX Design", "Video Editing", "Marketing", "Business", "Music Production"]

// --- TYPES ---
type Course = {
  id: string
  title: string
  instructor_name: string
  instructor_avatar?: string
  rating: number
  review_count: number
  students: number
  price: number
  original_price?: number
  thumbnail_url: string
  category: string
  level: string
  total_hours: string
  total_lessons: number
  is_exclusive?: boolean 
}

export default function CoursesPage() {
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClient()
  
  // State
  const [courses, setCourses] = useState<Course[]>([])
  const [exclusiveCourses, setExclusiveCourses] = useState<Course[]>([])
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeCategory, setActiveCategory] = useState("All")

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true)
      try {
        // 1. Fetch Courses
        let query = supabase
          .from('courses')
          .select(`*, profiles:instructor_id(full_name, avatar_url), reviews(rating), enrollments(count)`)
          .eq('status', 'Active')

        if (activeCategory !== "All") query = query.eq('category', activeCategory)
        if (searchTerm) query = query.ilike('title', `%${searchTerm}%`)

        const { data, error } = await query
        if (error) throw error

        const formatted: Course[] = data?.map((c: any) => {
            // Calc Rating
            const ratings = c.reviews?.map((r: any) => r.rating) || []
            const avgRating = ratings.length ? (ratings.reduce((a:number,b:number)=>a+b,0)/ratings.length).toFixed(1) : "New"
            
            // Calc Lessons/Duration
            const curriculum = typeof c.curriculum_data === 'string' ? JSON.parse(c.curriculum_data || '[]') : c.curriculum_data || []
            const lessonCount = curriculum.reduce((acc: number, sec: any) => acc + (sec.lectures?.length || 0), 0) || 12
            const hours = c.duration || "10h 30m"

            return {
                id: c.id,
                title: c.title,
                instructor_name: c.profiles?.full_name || "Grove Instructor",
                instructor_avatar: c.profiles?.avatar_url,
                rating: Number(avgRating) || 5.0,
                review_count: ratings.length,
                students: c.enrollments?.[0]?.count || 0,
                price: c.price,
                original_price: c.price * 1.2,
                thumbnail_url: c.thumbnail_url || "/placeholder.jpg",
                category: c.category || "General",
                level: c.level || "All Levels",
                total_hours: hours,
                total_lessons: lessonCount,
                is_exclusive: c.price > 100 
            }
        }) || []

        setCourses(formatted.filter(c => !c.is_exclusive))
        setExclusiveCourses(formatted.filter(c => c.is_exclusive))

        // 2. Fetch User Enrollments
        if (user) {
            const { data: userEnrollments } = await supabase
                .from('enrollments')
                .select('course_id')
                .eq('user_id', user.id)
            if (userEnrollments) {
                setEnrolledIds(new Set(userEnrollments.map((e: any) => e.course_id)))
            }
        }

      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    const timer = setTimeout(fetchCourses, 300)
    return () => clearTimeout(timer)
  }, [searchTerm, activeCategory, user])

  // --- HANDLER ---
  const handleCourseAction = (e: React.MouseEvent, courseId: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) router.push('/auth')
    else if (enrolledIds.has(courseId)) router.push(`/courses/${courseId}/learn`)
    else router.push(`/courses/${courseId}/checkout`)
  }

  return (
    <main className="bg-[#050505] min-h-screen text-white font-sans selection:bg-emerald-500/30">
      <Navbar />

      {/* --- 1. CINEMATIC HERO SECTION --- */}
      <section className="relative pt-40 pb-32 px-6 overflow-hidden">
        {/* Background Image & Overlay */}
        <div className="absolute inset-0 z-0">
            <Image 
                src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2670&auto=format&fit=crop"
                alt="Background"
                fill
                className="object-cover opacity-40"
                priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/80 to-black/40" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#050505_100%)]" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center">
            <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-6 backdrop-blur-md">
                <Zap size={14} fill="currentColor" /> The Grove Library
            </motion.div>
            
            <motion.h1 initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay:0.1}} className="text-5xl md:text-7xl font-black mb-8 leading-[1.1] tracking-tight text-white drop-shadow-2xl">
                Master a New Skill. <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-600">
                    Build Your Future.
                </span>
            </motion.h1>

            {/* Premium Search Bar */}
            <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} transition={{delay:0.2}} className="relative max-w-2xl mx-auto group">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/30 to-cyan-500/30 blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-500 rounded-full" />
                <div className="relative flex items-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-full px-6 py-4 shadow-2xl focus-within:border-emerald-500/50 focus-within:bg-black/60 transition-all">
                    <Search className="text-zinc-400 w-6 h-6 mr-4" />
                    <input 
                        type="text" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search for Python, Design, Marketing..." 
                        className="bg-transparent border-none outline-none text-white w-full placeholder-zinc-400 text-lg"
                    />
                </div>
            </motion.div>
        </div>
      </section>

      {/* --- 2. YOUTUBE-STYLE STICKY FILTERS --- */}
      <div className="sticky top-20 z-40 bg-[#050505]/80 backdrop-blur-xl border-b border-white/5 py-4">
        <div className="max-w-[1600px] mx-auto px-6 overflow-x-auto no-scrollbar">
            <div className="flex gap-3 w-max">
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`
                            px-5 py-2 rounded-lg text-sm font-bold transition-all duration-300 whitespace-nowrap
                            ${activeCategory === cat 
                                ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)] scale-105' 
                                : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'}
                        `}
                    >
                        {cat}
                    </button>
                ))}
            </div>
        </div>
      </div>

      {/* --- 3. MAIN COURSE GRID --- */}
      <section className="py-16 px-6 max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="text-emerald-500" /> 
                {activeCategory === "All" ? "Recommended For You" : `${activeCategory} Courses`}
            </h2>
        </div>

        {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {[1,2,3,4].map(i => <div key={i} className="h-[400px] bg-zinc-900/50 rounded-2xl animate-pulse"/>)}
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {courses.map(course => (
                    <CourseCard 
                        key={course.id} 
                        course={course} 
                        isEnrolled={enrolledIds.has(course.id)} 
                        onAction={handleCourseAction} 
                    />
                ))}
            </div>
        )}
      </section>

      {/* --- 4. EXCLUSIVE SUBSCRIPTION SECTION (Grove+) --- */}
      <section className="relative py-24 px-6 border-y border-white/5 bg-gradient-to-b from-[#0A0A0A] to-black overflow-hidden">
         {/* Gold/Purple Glows for Premium Feel */}
         <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-900/20 blur-[150px] rounded-full pointer-events-none" />
         <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-yellow-600/10 blur-[150px] rounded-full pointer-events-none" />

         <div className="max-w-[1600px] mx-auto relative z-10">
            <div className="text-center mb-16">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-xs font-bold uppercase tracking-widest mb-4">
                    <Crown size={14} fill="currentColor" /> Grove+ Exclusive
                </span>
                <h2 className="text-4xl md:text-5xl font-black text-white mb-4">Professional Career Paths</h2>
                <p className="text-zinc-400 max-w-2xl mx-auto">
                    Deep-dive curriculums designed to take you from zero to hired. Included with Grove+ subscription.
                </p>
            </div>

            {/* Exclusive Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Manual or Fetched Exclusive Items */}
                <ExclusiveCard 
                    title="Full Stack Web Development" 
                    subtitle="The complete MERN stack bootcamp." 
                    image="https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=2670&auto=format&fit=crop"
                    lessons="140" hours="60"
                />
                <ExclusiveCard 
                    title="Advanced AI & Machine Learning" 
                    subtitle="Build real neural networks from scratch." 
                    image="https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=2565&auto=format&fit=crop"
                    lessons="95" hours="45"
                />
                <ExclusiveCard 
                    title="Cinematic Filmmaking Masterclass" 
                    subtitle="Direct, shoot, and edit like a pro." 
                    image="https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=2600&auto=format&fit=crop"
                    lessons="110" hours="50"
                />
            </div>

            <div className="mt-12 text-center">
                <button className="px-8 py-4 bg-white text-black font-bold rounded-full hover:scale-105 transition-transform shadow-[0_0_40px_rgba(255,255,255,0.2)]">
                    Unlock All with Grove+
                </button>
            </div>
         </div>
      </section>

      {/* --- 5. CTA SECTION --- */}
      <CTASection />

      {/* --- 6. FOOTER --- */}
      <Footer />
    </main>
  )
}

// --- SUB-COMPONENTS ---

const CourseCard = ({ course, isEnrolled, onAction }: { course: Course, isEnrolled: boolean, onAction: (e: any, id: string) => void }) => {
    return (
        <Link href={`/courses/${course.id}`} className="block group h-full">
            <div className="w-full bg-zinc-900/60 border border-white/10 rounded-3xl overflow-hidden hover:border-emerald-500/50 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] flex flex-col h-full relative">
                
                {/* 1. IMAGE & BADGES */}
                <div className="relative h-52 overflow-hidden">
                    <Image 
                        src={course.thumbnail_url} 
                        alt={course.title} 
                        fill 
                        className="object-cover transition-transform duration-700 group-hover:scale-110" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent opacity-90" />
                    
                    <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-wider text-white shadow-lg">
                            {course.category}
                        </span>
                    </div>

                    {/* Play Button Overlay (On Hover) */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20">
                            <PlayCircle size={24} className="text-white fill-white/20" />
                        </div>
                    </div>
                </div>

                {/* 2. CONTENT */}
                <div className="p-5 flex flex-col flex-grow">
                    
                    {/* Instructor Info */}
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-zinc-800 overflow-hidden border border-white/10">
                                {course.instructor_avatar ? (
                                    <Image src={course.instructor_avatar} alt={course.instructor_name} width={24} height={24} />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[8px] bg-emerald-900 text-emerald-400">T</div>
                                )}
                            </div>
                            <span className="text-xs text-zinc-400 font-medium truncate max-w-[120px]">{course.instructor_name}</span>
                        </div>
                        <div className="flex items-center gap-1 text-yellow-500 text-xs font-bold">
                            <Star size={12} fill="currentColor"/> {course.rating} <span className="text-zinc-600 font-normal">({course.review_count})</span>
                        </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 leading-tight group-hover:text-emerald-400 transition-colors">
                        {course.title}
                    </h3>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-2 mt-auto mb-4">
                        <div className="bg-white/5 rounded-lg p-2 flex items-center gap-2 border border-white/5">
                            <BookOpen size={14} className="text-zinc-500" />
                            <span className="text-xs text-zinc-300 font-medium">{course.total_lessons} Lessons</span>
                        </div>
                        <div className="bg-white/5 rounded-lg p-2 flex items-center gap-2 border border-white/5">
                            <Clock size={14} className="text-zinc-500" />
                            <span className="text-xs text-zinc-300 font-medium">{course.total_hours}</span>
                        </div>
                    </div>

                    {/* Footer: Price & Enroll */}
                    <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Price</span>
                            <span className="text-xl font-bold text-white">{isEnrolled ? "Owned" : `$${course.price}`}</span>
                        </div>
                        <button 
                            onClick={(e) => onAction(e, course.id)}
                            className={`px-4 py-2 text-xs font-bold rounded-full transition-all shadow-lg flex items-center gap-2 ${isEnrolled ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-500 hover:text-black' : 'bg-white text-black hover:bg-emerald-400'}`}
                        >
                            {isEnrolled ? <><CheckCircle2 size={14} /> Resume</> : "Enroll Now"}
                        </button>
                    </div>
                </div>
            </div>
        </Link>
    )
}

const ExclusiveCard = ({ title, subtitle, image, lessons, hours }: any) => (
    <div className="group relative h-[450px] rounded-3xl overflow-hidden cursor-pointer">
        <Image src={image} alt={title} fill className="object-cover transition-transform duration-700 group-hover:scale-110 group-hover:rotate-1" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90" />
        
        <div className="absolute inset-0 p-8 flex flex-col justify-end">
            <div className="mb-auto flex justify-between items-start">
                <span className="bg-yellow-500 text-black text-[10px] font-black px-3 py-1 rounded uppercase tracking-widest">Premium</span>
                <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:bg-yellow-500 group-hover:text-black transition-colors">
                    <Lock size={18} />
                </div>
            </div>

            <h3 className="text-3xl font-bold text-white mb-2 leading-tight">{title}</h3>
            <p className="text-zinc-300 mb-6">{subtitle}</p>
            
            <div className="flex items-center gap-6 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                <span className="flex items-center gap-2"><BarChart size={14} className="text-yellow-500"/> {lessons} Lessons</span>
                <span className="flex items-center gap-2"><Clock size={14} className="text-yellow-500"/> {hours} Hours</span>
            </div>
        </div>
    </div>
)