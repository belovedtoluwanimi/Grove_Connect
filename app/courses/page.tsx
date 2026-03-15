'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Search, Star, Clock, BookOpen, CheckCircle2, Loader2, ArrowRight, 
  PlayCircle, Sparkles, TrendingUp, Compass, Award, Shield, Lock
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import CTASection from '../components/CTASection' 
import { useAuth } from '@/app/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { createClient } from '@/app/utils/supabase/client'
import { motion, useScroll, useTransform } from 'framer-motion'

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
  thumbnail_url: string
  category: string
  level: string
  total_hours_numeric: number
  total_hours_string: string
  total_lessons: number
  is_premium: boolean 
  progress?: number // Simulated or real progress
}

export default function CoursesPage() {
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClient()
  const heroRef = useRef(null)
  
  // Parallax Scroll Effects
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] })
  const yBg = useTransform(scrollYProgress, [0, 1], ["0%", "50%"])
  const opacityBg = useTransform(scrollYProgress, [0, 1], [1, 0])

  // --- STATE ---
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [allCourses, setAllCourses] = useState<Course[]>([])
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set())

  // --- FETCH & COMPUTE DATA ---
  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true)
      try {
        let userEnrolledIds = new Set<string>()
        if (user) {
            const { data: progressData } = await supabase.from('course_progress').select('course_id').eq('user_id', user.id)
            const { data: enrollData } = await supabase.from('enrollments').select('course_id').eq('user_id', user.id)
            userEnrolledIds = new Set([...(progressData?.map(e => e.course_id) || []), ...(enrollData?.map(e => e.course_id) || [])])
            setEnrolledIds(userEnrolledIds)
        }

        const { data, error } = await supabase
          .from('courses')
          .select(`*, profiles:instructor_id(full_name, avatar_url), reviews(rating), enrollments(count)`)
          .in('status', ['published', 'active', 'Active'])

        if (error) throw error

        const formatted: Course[] = data?.map((c: any) => {
            const ratings = c.reviews?.map((r: any) => r.rating) || []
            const avgRating = ratings.length ? (ratings.reduce((a:number,b:number)=>a+b,0)/ratings.length).toFixed(1) : "5.0"
            
            const curriculum = typeof c.curriculum_data === 'string' ? JSON.parse(c.curriculum_data || '[]') : c.curriculum_data || []
            const lessonCount = curriculum.reduce((acc: number, sec: any) => acc + (sec.items?.length || sec.lectures?.length || 0), 0) || 12
            
            // Robust Duration Parsing & Premium Logic
            let numHours = 0;
            if (c.duration) {
                const match = c.duration.match(/(\d+)\s*h/i);
                numHours = match ? parseInt(match[1]) : parseInt(c.duration);
            }
            if (!numHours || isNaN(numHours)) numHours = Math.floor(lessonCount * 0.75);
            
            const isPremium = numHours >= 25

            return {
                id: c.id,
                title: c.title,
                instructor_name: c.profiles?.full_name || "Grove Expert",
                instructor_avatar: c.profiles?.avatar_url,
                rating: Number(avgRating),
                review_count: ratings.length || Math.floor(Math.random() * 120) + 10,
                students: c.enrollments?.[0]?.count || Math.floor(Math.random() * 800) + 200,
                price: c.price,
                thumbnail_url: c.thumbnail_url || "/placeholder.jpg",
                category: c.category || "Masterclass",
                level: c.level || "All Levels",
                total_hours_numeric: numHours,
                total_hours_string: c.duration || `${numHours}h ${Math.floor(Math.random() * 45)}m`,
                total_lessons: lessonCount,
                is_premium: isPremium,
                progress: userEnrolledIds.has(c.id) ? Math.floor(Math.random() * 80) + 10 : 0 // Simulated progress for UI
            }
        }) || []

        setAllCourses(formatted)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchCourses()
  }, [user, supabase])

  // --- SMART RECOMMENDATION ENGINE ---
  const myLearning = allCourses.filter(c => enrolledIds.has(c.id))
  const purchasedCategories = new Set(myLearning.map(c => c.category))
  
  let recommendedCourses = allCourses.filter(c => !enrolledIds.has(c.id))
  
  // Logic: If searching, search EVERYTHING. If not, curate based on history.
  if (searchTerm) {
      recommendedCourses = recommendedCourses.filter(c => 
          c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
          c.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
  } else if (purchasedCategories.size > 0) {
      // Curate specifically to their interests
      recommendedCourses = recommendedCourses.filter(c => purchasedCategories.has(c.category))
  } else {
      // New user default: Show highest rated/most popular
      recommendedCourses = [...recommendedCourses].sort((a, b) => b.students - a.students).slice(0, 8)
  }

  const premiumCourses = allCourses.filter(c => c.is_premium && !enrolledIds.has(c.id))

  // --- HANDLER ---
  const handleCourseAction = (e: React.MouseEvent, courseId: string) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) router.push('/auth')
    else if (enrolledIds.has(courseId)) router.push(`/courses/${courseId}/learn`)
    else router.push(`/courses/${courseId}/checkout`)
  }

  if (loading) return (
      <div className="bg-[#050505] min-h-screen flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.1)_0%,transparent_50%)] animate-pulse" />
          <Loader2 className="animate-spin text-emerald-500 relative z-10" size={48} />
      </div>
  )

  return (
    <main className="bg-[#050505] min-h-screen text-white font-sans selection:bg-emerald-500/30 overflow-x-hidden">
      <Navbar />

      {/* --- 1. IMMERSIVE HERO SECTION --- */}
      <section ref={heroRef} className="relative pt-32 pb-24 lg:pt-48 lg:pb-40 px-6 overflow-hidden flex items-center justify-center min-h-[85vh]">
          {/* Parallax Background */}
          <motion.div style={{ y: yBg, opacity: opacityBg }} className="absolute inset-0 z-0 pointer-events-none">
              <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[70%] bg-emerald-900/20 blur-[120px] rounded-full mix-blend-screen" />
              <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[70%] bg-blue-900/20 blur-[120px] rounded-full mix-blend-screen" />
              <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
          </motion.div>

          {/* Interactive Floating Physics Elements */}
          <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden hidden md:block">
              <FloatingBadge text="React 19" top="20%" left="15%" delay={0} />
              <FloatingBadge text="UI/UX" top="60%" left="10%" delay={1} />
              <FloatingBadge text="Python AI" top="30%" right="15%" delay={0.5} />
              <FloatingBadge text="Business" top="70%" right="12%" delay={1.5} />
              <motion.div drag dragConstraints={{ left: -50, right: 50, top: -50, bottom: 50 }} dragElastic={0.2} className="absolute top-[40%] left-[5%] w-24 h-24 bg-gradient-to-br from-emerald-500/20 to-cyan-500/5 rounded-2xl border border-emerald-500/20 backdrop-blur-md rotate-12 pointer-events-auto cursor-grab active:cursor-grabbing hover:scale-110 transition-transform flex items-center justify-center"><BookOpen className="text-emerald-500/50" size={32}/></motion.div>
              <motion.div drag dragConstraints={{ left: -50, right: 50, top: -50, bottom: 50 }} dragElastic={0.2} className="absolute top-[20%] right-[8%] w-32 h-32 bg-gradient-to-bl from-blue-500/20 to-purple-500/5 rounded-full border border-blue-500/20 backdrop-blur-md -rotate-12 pointer-events-auto cursor-grab active:cursor-grabbing hover:scale-110 transition-transform flex items-center justify-center"><PlayCircle className="text-blue-500/50" size={40}/></motion.div>
          </div>

          <div className="relative z-20 max-w-4xl mx-auto text-center">
              <motion.div initial={{opacity:0, scale:0.8}} animate={{opacity:1, scale:1}} transition={{duration:0.8, ease:"easeOut"}} className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/5 border border-white/10 text-zinc-300 text-xs font-bold uppercase tracking-widest mb-8 backdrop-blur-xl shadow-2xl">
                  <Sparkles size={14} className="text-emerald-400" /> Unlock Your Potential
              </motion.div>
              
              <motion.h1 initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay:0.2, duration:0.8}} className="text-5xl md:text-7xl lg:text-8xl font-black mb-8 leading-[1.05] tracking-tight text-white">
                  Learn without <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500">
                      limits.
                  </span>
              </motion.h1>

              {/* Glassmorphic Smart Search */}
              <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay:0.4, duration:0.8}} className="relative max-w-2xl mx-auto group mt-12 z-30">
                  <div className="absolute inset-[-4px] bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 rounded-full blur-lg opacity-30 group-hover:opacity-60 transition-opacity duration-500" />
                  <div className="relative flex items-center bg-black/80 backdrop-blur-2xl border border-white/20 rounded-full px-6 py-5 shadow-2xl transition-all">
                      <Search className="text-emerald-400 w-6 h-6 mr-4 shrink-0" />
                      <input 
                          type="text" 
                          value={searchTerm}
                          onChange={(e) => {
                              setSearchTerm(e.target.value);
                              if(e.target.value) window.scrollTo({ top: window.innerHeight * 0.8, behavior: 'smooth' });
                          }}
                          placeholder="What do you want to learn today?" 
                          className="bg-transparent border-none outline-none text-white w-full placeholder-zinc-500 text-lg font-medium"
                      />
                  </div>
              </motion.div>
          </div>
      </section>

      {/* --- 2. CONTINUE LEARNING (ENROLLED COURSES) --- */}
      {myLearning.length > 0 && (
          <motion.section initial={{opacity:0}} whileInView={{opacity:1}} viewport={{once:true}} className="py-20 px-6 max-w-[1600px] mx-auto border-b border-white/5 relative z-20">
            <div className="flex items-center justify-between mb-10">
                <h2 className="text-3xl font-black text-white flex items-center gap-3">
                    <TrendingUp className="text-emerald-500" size={32}/> Pick Up Where You Left Off
                </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {myLearning.slice(0, 3).map((course, idx) => (
                    <motion.div key={course.id} initial={{opacity:0, y:20}} whileInView={{opacity:1, y:0}} transition={{delay: idx * 0.1}} viewport={{once:true}}>
                        <ProgressCard course={course} onAction={handleCourseAction} />
                    </motion.div>
                ))}
            </div>
          </motion.section>
      )}

      {/* --- 3. SMART DISCOVERY SECTION --- */}
      <section className="py-24 relative z-20 bg-[#050505]">
        <div className="px-6 max-w-[1600px] mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                <div>
                    <h2 className="text-3xl md:text-4xl font-black text-white flex items-center gap-3 mb-3">
                        <Compass className="text-blue-500" size={36}/> 
                        {searchTerm ? `Results for "${searchTerm}"` : purchasedCategories.size > 0 ? "Curated For You" : "Trending Masterclasses"}
                    </h2>
                    <p className="text-zinc-400 text-lg">
                        {searchTerm ? "Explore the results below based on your search." : purchasedCategories.size > 0 ? "Based on your recent enrollments and interests." : "Join thousands of students learning new skills."}
                    </p>
                </div>
                {searchTerm && <button onClick={()=>setSearchTerm("")} className="text-sm font-bold text-zinc-400 hover:text-white transition-colors border border-white/10 px-4 py-2 rounded-full">Clear Search</button>}
            </div>

            {recommendedCourses.length === 0 ? (
                <div className="text-center py-32 bg-zinc-900/20 rounded-3xl border border-white/5 backdrop-blur-sm">
                    <Search size={64} className="mx-auto text-zinc-700 mb-6"/>
                    <h3 className="text-2xl font-bold text-white mb-3">No matching courses found</h3>
                    <p className="text-zinc-500 text-lg">Try adjusting your search terminology.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {recommendedCourses.map((course, idx) => (
                        <motion.div key={course.id} initial={{opacity:0, scale:0.95}} whileInView={{opacity:1, scale:1}} transition={{delay: (idx % 4) * 0.1}} viewport={{once:true}}>
                            <StandardCourseCard course={course} onAction={handleCourseAction} />
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
      </section>

      {/* --- 4. THE PREMIUM TIER (>25 HOURS) --- */}
      {premiumCourses.length > 0 && !searchTerm && (
          <section className="relative py-32 px-6 border-y border-white/5 bg-[#020202] overflow-hidden">
            {/* Luxury Background Effects */}
            <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-900/20 blur-[150px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-yellow-600/10 blur-[150px] rounded-full pointer-events-none" />

            <div className="max-w-[1600px] mx-auto relative z-10">
                <div className="text-center mb-20">
                    <motion.span initial={{opacity:0, y:10}} whileInView={{opacity:1, y:0}} viewport={{once:true}} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 text-yellow-400 text-xs font-black uppercase tracking-widest mb-6 shadow-[0_0_30px_rgba(234,179,8,0.2)]">
                        <Award size={16} fill="currentColor" /> Premium Curriculums
                    </motion.span>
                    <motion.h2 initial={{opacity:0, y:10}} whileInView={{opacity:1, y:0}} transition={{delay:0.1}} viewport={{once:true}} className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 tracking-tight">The Ultimate Deep Dives</motion.h2>
                    <motion.p initial={{opacity:0, y:10}} whileInView={{opacity:1, y:0}} transition={{delay:0.2}} viewport={{once:true}} className="text-zinc-400 text-lg max-w-2xl mx-auto leading-relaxed">
                        Intensive, comprehensive career paths with over <span className="text-white font-bold">25+ hours</span> of highly-produced content. Designed to take you from absolute zero to hired professional.
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {premiumCourses.slice(0, 3).map((course, idx) => (
                        <motion.div key={course.id} initial={{opacity:0, y:30}} whileInView={{opacity:1, y:0}} transition={{delay: idx * 0.15}} viewport={{once:true}}>
                            <PremiumCard course={course} onAction={handleCourseAction} />
                        </motion.div>
                    ))}
                </div>
            </div>
          </section>
      )}

      {/* --- 5. CTA SECTION --- */}
      <CTASection />
      
      <Footer />
    </main>
  )
}

// ============================================================================
// SUB-COMPONENTS & CARDS
// ============================================================================

const FloatingBadge = ({ text, top, left, right, delay }: any) => (
    <motion.div 
        drag dragConstraints={{ left: -50, right: 50, top: -50, bottom: 50 }} dragElastic={0.1}
        initial={{ y: 0 }} animate={{ y: [0, -15, 0] }} transition={{ duration: 4, repeat: Infinity, delay, ease: "easeInOut" }}
        className="absolute px-6 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl text-sm font-bold text-white shadow-2xl pointer-events-auto cursor-grab active:cursor-grabbing hover:bg-white/10 transition-colors"
        style={{ top, left, right }}
    >
        {text}
    </motion.div>
)

const ProgressCard = ({ course, onAction }: { course: Course, onAction: any }) => (
    <div onClick={(e) => onAction(e, course.id)} className="group cursor-pointer bg-zinc-900/40 border border-white/10 rounded-3xl overflow-hidden hover:border-emerald-500/50 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-10px_rgba(16,185,129,0.2)] flex flex-col h-[380px] backdrop-blur-sm">
        <div className="relative h-48 overflow-hidden shrink-0">
            <Image src={course.thumbnail_url} alt={course.title} fill className="object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
            
            {/* Big Play Overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-16 h-16 bg-emerald-500/20 backdrop-blur-md rounded-full flex items-center justify-center border border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.4)] transform scale-90 group-hover:scale-100 transition-all duration-500">
                    <PlayCircle size={32} className="text-emerald-400 fill-emerald-400/20 ml-1" />
                </div>
            </div>
        </div>

        <div className="p-6 flex flex-col flex-grow bg-zinc-950 relative">
            {/* Progress Bar straddling the image border */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-white/5">
                <motion.div initial={{width: 0}} whileInView={{width: `${course.progress}%`}} transition={{duration: 1, ease: "easeOut"}} className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
            </div>

            <h3 className="text-xl font-bold text-white mb-2 line-clamp-2 leading-tight group-hover:text-emerald-400 transition-colors mt-2">{course.title}</h3>
            <p className="text-sm text-zinc-400 mb-auto">{course.instructor_name}</p>
            
            <div className="flex items-center justify-between mt-6">
                <span className="text-sm font-bold text-emerald-500">{course.progress}% Complete</span>
                <span className="text-xs font-bold text-white uppercase tracking-wider px-4 py-2 bg-white/5 rounded-full group-hover:bg-emerald-500 group-hover:text-black transition-colors">Resume</span>
            </div>
        </div>
    </div>
)

const StandardCourseCard = ({ course, onAction }: { course: Course, onAction: any }) => (
    <div onClick={(e) => onAction(e, course.id)} className="group cursor-pointer bg-[#0a0a0a] border border-white/5 rounded-3xl overflow-hidden hover:border-blue-500/40 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] flex flex-col h-[420px]">
        <div className="relative h-52 overflow-hidden bg-black shrink-0">
            <Image src={course.thumbnail_url} alt={course.title} fill className="object-cover transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-100" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-90" />
            
            <div className="absolute top-4 left-4">
                <span className="px-3 py-1.5 bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-wider text-white shadow-lg">
                    {course.category}
                </span>
            </div>
        </div>

        <div className="p-6 flex flex-col flex-grow">
            <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-zinc-400 font-medium flex items-center gap-2"><div className="w-5 h-5 rounded-full bg-zinc-800 overflow-hidden relative"><Image src={course.instructor_avatar || '/placeholder.jpg'} fill alt="" className="object-cover"/></div> {course.instructor_name}</span>
                <div className="flex items-center gap-1 text-yellow-500 text-xs font-bold bg-yellow-500/10 px-2 py-1 rounded border border-yellow-500/20">
                    <Star size={12} fill="currentColor"/> {course.rating}
                </div>
            </div>

            <h3 className="text-lg font-bold text-white mb-4 line-clamp-2 leading-tight group-hover:text-blue-400 transition-colors">
                {course.title}
            </h3>

            <div className="flex items-center gap-4 mt-auto mb-6 text-xs text-zinc-400 font-medium">
                <span className="flex items-center gap-1.5"><Clock size={14} className="text-zinc-500" /> {course.total_hours_string}</span>
                <span className="flex items-center gap-1.5"><BookOpen size={14} className="text-zinc-500" /> {course.total_lessons} Lessons</span>
            </div>

            <div className="pt-5 border-t border-white/5 flex items-center justify-between mt-auto">
                <span className="text-xl font-black text-white">${course.price}</span>
                <span className="text-xs font-bold text-black bg-white px-4 py-2.5 rounded-full group-hover:bg-blue-500 group-hover:text-white transition-colors">Enroll Now</span>
            </div>
        </div>
    </div>
)

const PremiumCard = ({ course, onAction }: { course: Course, onAction: any }) => (
    <div onClick={(e) => onAction(e, course.id)} className="group relative h-[500px] rounded-3xl overflow-hidden cursor-pointer block bg-black shadow-2xl">
        {/* Animated Gradient Border Effect via pseudo-element simulation */}
        <div className="absolute inset-[-2px] bg-gradient-to-r from-yellow-500 via-amber-500 to-purple-600 opacity-20 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />
        
        <div className="absolute inset-[1px] bg-black rounded-[23px] overflow-hidden z-10">
            <Image src={course.thumbnail_url} alt={course.title} fill className="object-cover transition-transform duration-1000 group-hover:scale-110 opacity-60 mix-blend-luminosity" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/20" />
            
            <div className="absolute inset-0 p-8 flex flex-col justify-end h-full">
                <div className="mb-auto flex justify-between items-start">
                    <span className="bg-gradient-to-r from-yellow-600 to-amber-500 text-black text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-[0_0_20px_rgba(217,119,6,0.4)] flex items-center gap-1">
                        <Shield size={12} fill="currentColor"/> Masterclass
                    </span>
                    <div className="w-12 h-12 rounded-full bg-white/5 backdrop-blur-md flex items-center justify-center border border-white/10 group-hover:bg-yellow-500 group-hover:text-black transition-all group-hover:scale-110 shadow-xl">
                        <Lock size={18} className="group-hover:hidden" />
                        <PlayCircle size={20} className="hidden group-hover:block" fill="currentColor"/>
                    </div>
                </div>

                <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                    <h3 className="text-3xl font-black text-white mb-4 leading-tight group-hover:text-yellow-400 transition-colors line-clamp-3 drop-shadow-lg">{course.title}</h3>
                    
                    <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-zinc-300 uppercase tracking-wider mb-8 opacity-80 group-hover:opacity-100 transition-opacity">
                        <span className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-lg backdrop-blur-sm border border-white/5"><BookOpen size={14} className="text-yellow-500"/> {course.total_lessons} Lessons</span>
                        <span className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-lg backdrop-blur-sm border border-white/5"><Clock size={14} className="text-yellow-500"/> {course.total_hours_string} Intensive</span>
                    </div>

                    <button className="w-full py-4 bg-white text-black font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] group-hover:shadow-[0_0_30px_rgba(234,179,8,0.4)] group-hover:bg-gradient-to-r group-hover:from-yellow-500 group-hover:to-amber-500 flex items-center justify-center gap-2">
                        View Full Curriculum <ArrowRight size={18}/>
                    </button>
                </div>
            </div>
        </div>
    </div>
)
