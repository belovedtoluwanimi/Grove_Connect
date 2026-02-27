'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Search, Star, Clock, BarChart, BookOpen, 
  CheckCircle2, Loader2, ArrowRight, Zap, Crown, Lock, PlayCircle,
  ChevronLeft, ChevronRight
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import CTASection from '../components/CTASection' 
import { useAuth } from '@/app/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { createClient } from '@/app/utils/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'

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
}

export default function CoursesPage() {
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClient()
  
  // State
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  
  // Master Data State
  const [allCourses, setAllCourses] = useState<Course[]>([])
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set())
  
  // Derived UI State
  const [activeCategory, setActiveCategory] = useState("All")
  const [currentSlide, setCurrentSlide] = useState(0)

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true)
      try {
        // 1. Fetch User Enrollments FIRST to know what they own
        let userEnrolledIds = new Set<string>()
        if (user) {
            const { data: userEnrollments } = await supabase.from('course_progress').select('course_id').eq('user_id', user.id)
            // Also check standard 'enrollments' table if you use both
            const { data: standardEnrollments } = await supabase.from('enrollments').select('course_id').eq('user_id', user.id)
            
            const combinedIds = [...(userEnrollments?.map(e => e.course_id) || []), ...(standardEnrollments?.map(e => e.course_id) || [])]
            userEnrolledIds = new Set(combinedIds)
            setEnrolledIds(userEnrolledIds)
        }

        // 2. Fetch Active Courses
        const { data, error } = await supabase
          .from('courses')
          .select(`*, profiles:instructor_id(full_name, avatar_url), reviews(rating), enrollments(count)`)
          .in('status', ['published', 'active', 'Active']) // Match active statuses

        if (error) throw error

        const formatted: Course[] = data?.map((c: any) => {
            // Calc Rating
            const ratings = c.reviews?.map((r: any) => r.rating) || []
            const avgRating = ratings.length ? (ratings.reduce((a:number,b:number)=>a+b,0)/ratings.length).toFixed(1) : "New"
            
            // Safe Curriculum parsing (handling both 'items' and 'lectures' structures)
            const curriculum = typeof c.curriculum_data === 'string' ? JSON.parse(c.curriculum_data || '[]') : c.curriculum_data || []
            const lessonCount = curriculum.reduce((acc: number, sec: any) => acc + (sec.items?.length || sec.lectures?.length || 0), 0) || 12
            
            // Extract numeric hours to determine if > 25 hours (Premium)
            let numHours = 0;
            if (c.duration) {
                const match = c.duration.match(/(\d+)\s*h/i);
                numHours = match ? parseInt(match[1]) : parseInt(c.duration);
            }
            if (!numHours || isNaN(numHours)) numHours = Math.floor(lessonCount * 0.75); // Fallback estimate
            
            return {
                id: c.id,
                title: c.title,
                instructor_name: c.profiles?.full_name || "Grove Instructor",
                instructor_avatar: c.profiles?.avatar_url,
                rating: Number(avgRating) || 5.0,
                review_count: ratings.length,
                students: c.enrollments?.[0]?.count || Math.floor(Math.random() * 500) + 50, // Fallback student count
                price: c.price,
                thumbnail_url: c.thumbnail_url || "/placeholder.jpg",
                category: c.category || "General",
                level: c.level || "All Levels",
                total_hours_numeric: numHours,
                total_hours_string: c.duration || `${numHours}h 30m`,
                total_lessons: lessonCount,
                is_premium: numHours > 25 // DYNAMIC PREMIUM CHECK
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

  // --- DATA PROCESSING LOGIC ---
  
  // 1. Enrolled Courses
  const myLearning = allCourses.filter(c => enrolledIds.has(c.id))

  // 2. Dynamic Categories based on Purchases
  const purchasedCategories = new Set(myLearning.map(c => c.category))
  const defaultCategories = ["Web Development", "UI/UX Design", "Business", "Marketing", "Video Editing"]
  // Merge purchased categories with defaults, keeping purchased ones first
  const mergedCategories = Array.from(new Set([...Array.from(purchasedCategories), ...defaultCategories]))
  const filterCategories = ["All", ...mergedCategories].slice(0, 8) // Limit to 8 tabs

  // 3. Related Courses (Filtered by Active Tab & Search, Excluding already owned)
  let relatedCourses = allCourses.filter(c => !enrolledIds.has(c.id))
  
  // If user hasn't selected a specific tab but HAS bought courses, strongly recommend courses from bought categories
  if (activeCategory === "All" && purchasedCategories.size > 0 && !searchTerm) {
      relatedCourses = relatedCourses.sort((a, b) => {
          const aMatch = purchasedCategories.has(a.category) ? 1 : 0
          const bMatch = purchasedCategories.has(b.category) ? 1 : 0
          return bMatch - aMatch
      })
  } else if (activeCategory !== "All") {
      relatedCourses = relatedCourses.filter(c => c.category === activeCategory)
  }
  
  if (searchTerm) {
      relatedCourses = relatedCourses.filter(c => c.title.toLowerCase().includes(searchTerm.toLowerCase()))
  }

  // 4. Bestsellers for Hero Carousel (Top 5 by students/ratings)
  const bestsellers = [...allCourses]
      .sort((a, b) => b.students - a.students || b.rating - a.rating)
      .slice(0, 5)

  // 5. Premium Courses (> 25 Hours)
  const premiumCourses = allCourses.filter(c => c.is_premium)

  // --- CAROUSEL LOGIC ---
  useEffect(() => {
      if (bestsellers.length <= 1) return;
      const interval = setInterval(() => {
          setCurrentSlide(prev => (prev + 1) % bestsellers.length)
      }, 6000) // Auto-slide every 6 seconds
      return () => clearInterval(interval)
  }, [bestsellers.length])

  // --- HANDLER ---
  const handleCourseAction = (e: React.MouseEvent, courseId: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) router.push('/auth')
    else if (enrolledIds.has(courseId)) router.push(`/courses/${courseId}/learn`)
    else router.push(`/courses/${courseId}/checkout`)
  }

  if (loading) return (
      <div className="bg-[#050505] min-h-screen flex items-center justify-center">
          <Loader2 className="animate-spin text-emerald-500" size={48} />
      </div>
  )

  return (
    <main className="bg-[#050505] min-h-screen text-white font-sans selection:bg-emerald-500/30">
      <Navbar />

      {/* --- 1. HERO CAROUSEL (BESTSELLERS) --- */}
      <section className="relative pt-20 h-[80vh] min-h-[600px] overflow-hidden group">
          <AnimatePresence mode="wait">
              {bestsellers.length > 0 && (
                  <motion.div 
                      key={currentSlide}
                      initial={{ opacity: 0, scale: 1.05 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.8, ease: "easeInOut" }}
                      className="absolute inset-0"
                  >
                      <Image 
                          src={bestsellers[currentSlide].thumbnail_url}
                          alt={bestsellers[currentSlide].title}
                          fill
                          className="object-cover opacity-50"
                          priority
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/80 to-black/30" />
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_right,transparent_0%,#050505_100%)]" />

                      <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-12 max-w-7xl mx-auto w-full">
                          <div className="max-w-3xl">
                              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-6 backdrop-blur-md">
                                  <Zap size={14} fill="currentColor" /> #1 Bestseller in {bestsellers[currentSlide].category}
                              </span>
                              <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-6 leading-[1.1] tracking-tight text-white drop-shadow-2xl">
                                  {bestsellers[currentSlide].title}
                              </h1>
                              
                              <div className="flex flex-wrap items-center gap-6 mb-8 text-sm md:text-base font-medium">
                                  <div className="flex items-center gap-2 text-yellow-500 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                                      <Star size={18} fill="currentColor"/> 
                                      <span className="text-white font-bold">{bestsellers[currentSlide].rating}</span> 
                                      <span className="text-zinc-400">({bestsellers[currentSlide].review_count} reviews)</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-zinc-300">
                                      <Clock size={18}/> {bestsellers[currentSlide].total_hours_string}
                                  </div>
                                  <div className="flex items-center gap-2 text-zinc-300">
                                      <BookOpen size={18}/> {bestsellers[currentSlide].total_lessons} Lessons
                                  </div>
                              </div>

                              <button 
                                onClick={(e) => handleCourseAction(e, bestsellers[currentSlide].id)} 
                                className="px-8 py-4 bg-white text-black font-black text-lg rounded-full hover:scale-105 transition-transform shadow-[0_0_40px_rgba(255,255,255,0.3)] flex items-center gap-3"
                              >
                                  {enrolledIds.has(bestsellers[currentSlide].id) ? "Resume Learning" : "Explore Course"} <ArrowRight size={20}/>
                              </button>
                          </div>
                      </div>
                  </motion.div>
              )}
          </AnimatePresence>

          {/* Carousel Controls */}
          {bestsellers.length > 1 && (
            <div className="absolute bottom-10 right-10 flex gap-4 z-20">
                <button onClick={() => setCurrentSlide(p => p === 0 ? bestsellers.length - 1 : p - 1)} className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-colors border border-white/20"><ChevronLeft size={24}/></button>
                <button onClick={() => setCurrentSlide(p => (p + 1) % bestsellers.length)} className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-colors border border-white/20"><ChevronRight size={24}/></button>
            </div>
          )}
      </section>

      {/* --- 2. MY LEARNING (Only visible if purchased) --- */}
      {myLearning.length > 0 && (
          <section className="py-12 px-6 max-w-[1600px] mx-auto border-b border-white/5">
            <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                <PlayCircle className="text-emerald-500" size={28}/> Jump Back In
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {myLearning.slice(0, 4).map(course => (
                    <CourseCard key={course.id} course={course} isEnrolled={true} onAction={handleCourseAction} />
                ))}
            </div>
            {myLearning.length > 4 && (
                <div className="mt-8 text-center">
                    <Link href="/dashboard" className="text-emerald-400 font-bold hover:text-emerald-300 text-sm">View all my courses &rarr;</Link>
                </div>
            )}
          </section>
      )}

      {/* --- 3. DYNAMIC DISCOVERY SECTION --- */}
      <section className="py-16">
        
        {/* Sticky Filters & Search */}
        <div className="sticky top-[70px] z-40 bg-[#050505]/90 backdrop-blur-xl border-y border-white/5 py-4 mb-10">
          <div className="max-w-[1600px] mx-auto px-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              
              <div className="flex gap-2 overflow-x-auto no-scrollbar w-full md:w-auto">
                  {filterCategories.map((cat) => (
                      <button
                          key={cat}
                          onClick={() => setActiveCategory(cat)}
                          className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 whitespace-nowrap border ${activeCategory === cat ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.2)]' : 'bg-transparent border-white/10 text-zinc-400 hover:border-white/30 hover:text-white'}`}
                      >
                          {cat}
                      </button>
                  ))}
              </div>

              <div className="relative w-full md:w-72 group shrink-0">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4 group-focus-within:text-emerald-500 transition-colors" />
                  <input 
                      type="text" 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search courses..." 
                      className="w-full bg-zinc-900 border border-white/10 rounded-full pl-10 pr-4 py-2.5 outline-none text-sm text-white focus:border-emerald-500 transition-colors placeholder-zinc-500"
                  />
              </div>
          </div>
        </div>

        {/* Related Grid */}
        <div className="px-6 max-w-[1600px] mx-auto min-h-[400px]">
            <h2 className="text-2xl font-bold text-white mb-8">
                {searchTerm ? `Search results for "${searchTerm}"` : activeCategory === "All" ? "Recommended For You" : `${activeCategory} Courses`}
            </h2>

            {relatedCourses.length === 0 ? (
                <div className="text-center py-20 bg-zinc-900/30 rounded-3xl border border-white/5">
                    <Search size={48} className="mx-auto text-zinc-600 mb-4"/>
                    <h3 className="text-xl font-bold text-white mb-2">No courses found</h3>
                    <p className="text-zinc-500">Try adjusting your filters or search term.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {relatedCourses.map(course => (
                        <CourseCard key={course.id} course={course} isEnrolled={false} onAction={handleCourseAction} />
                    ))}
                </div>
            )}
        </div>
      </section>

      {/* --- 4. PREMIUM COURSES (> 25 HOURS) --- */}
      {premiumCourses.length > 0 && (
          <section className="relative py-24 px-6 border-y border-white/5 bg-gradient-to-b from-[#0A0A0A] to-black overflow-hidden">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-900/20 blur-[150px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-yellow-600/10 blur-[150px] rounded-full pointer-events-none" />

            <div className="max-w-[1600px] mx-auto relative z-10">
                <div className="text-center mb-16">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-xs font-bold uppercase tracking-widest mb-4">
                        <Crown size={14} fill="currentColor" /> Premium Masterclasses
                    </span>
                    <h2 className="text-4xl md:text-5xl font-black text-white mb-4">Deep-Dive Career Paths</h2>
                    <p className="text-zinc-400 max-w-2xl mx-auto">
                        Intensive, comprehensive curriculums with over 25+ hours of content designed to take you from zero to hired.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {premiumCourses.slice(0, 3).map(course => (
                        <PremiumCard key={course.id} course={course} onAction={handleCourseAction} isEnrolled={enrolledIds.has(course.id)} />
                    ))}
                </div>
            </div>
          </section>
      )}

      <CTASection />
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
                <div className="relative h-52 overflow-hidden bg-black shrink-0">
                    <Image src={course.thumbnail_url} alt={course.title} fill className="object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100" />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent opacity-90" />
                    
                    <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-wider text-white shadow-lg">
                            {course.category}
                        </span>
                    </div>

                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                            <PlayCircle size={28} className="text-white fill-white/20" />
                        </div>
                    </div>
                </div>

                {/* 2. CONTENT */}
                <div className="p-5 flex flex-col flex-grow">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-zinc-800 overflow-hidden border border-white/10 relative">
                                {course.instructor_avatar ? (
                                    <Image src={course.instructor_avatar} alt={course.instructor_name} fill className="object-cover" />
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

                    <h3 className="text-lg font-bold text-white mb-4 line-clamp-2 leading-tight group-hover:text-emerald-400 transition-colors">
                        {course.title}
                    </h3>

                    <div className="grid grid-cols-2 gap-2 mt-auto mb-5">
                        <div className="bg-white/5 rounded-lg p-2 flex items-center gap-2 border border-white/5">
                            <BookOpen size={14} className="text-zinc-500 shrink-0" />
                            <span className="text-xs text-zinc-300 font-medium truncate">{course.total_lessons} Lessons</span>
                        </div>
                        <div className="bg-white/5 rounded-lg p-2 flex items-center gap-2 border border-white/5">
                            <Clock size={14} className="text-zinc-500 shrink-0" />
                            <span className="text-xs text-zinc-300 font-medium truncate">{course.total_hours_string}</span>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-white/10 flex items-center justify-between mt-auto">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Price</span>
                            <span className="text-xl font-black text-white tracking-tight">{isEnrolled ? "Owned" : `$${course.price}`}</span>
                        </div>
                        <button 
                            onClick={(e) => onAction(e, course.id)}
                            className={`px-5 py-2.5 text-xs font-bold rounded-xl transition-all shadow-lg flex items-center gap-2 ${isEnrolled ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-500 hover:text-black' : 'bg-white text-black hover:bg-zinc-200 hover:scale-105'}`}
                        >
                            {isEnrolled ? <><CheckCircle2 size={14} /> Resume</> : "Enroll Now"}
                        </button>
                    </div>
                </div>
            </div>
        </Link>
    )
}

const PremiumCard = ({ course, onAction, isEnrolled }: { course: Course, onAction: any, isEnrolled: boolean }) => (
    <Link href={`/courses/${course.id}`} className="group relative h-[450px] rounded-3xl overflow-hidden cursor-pointer block border border-white/10 hover:border-yellow-500/50 transition-colors shadow-2xl">
        <Image src={course.thumbnail_url} alt={course.title} fill className="object-cover transition-transform duration-700 group-hover:scale-110 opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-90" />
        
        <div className="absolute inset-0 p-8 flex flex-col justify-end">
            <div className="mb-auto flex justify-between items-start">
                <span className="bg-yellow-500 text-black text-[10px] font-black px-3 py-1 rounded uppercase tracking-widest shadow-[0_0_15px_rgba(234,179,8,0.5)]">Premium Masterclass</span>
                <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:bg-yellow-500 group-hover:text-black transition-colors group-hover:border-transparent">
                    {isEnrolled ? <PlayCircle size={18} fill="currentColor"/> : <Lock size={18} />}
                </div>
            </div>

            <h3 className="text-3xl font-black text-white mb-3 leading-tight group-hover:text-yellow-400 transition-colors line-clamp-2">{course.title}</h3>
            
            <div className="flex items-center gap-6 text-xs font-bold text-zinc-300 uppercase tracking-wider mb-6">
                <span className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm border border-white/10"><BarChart size={14} className="text-yellow-500"/> {course.total_lessons} Lessons</span>
                <span className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm border border-white/10"><Clock size={14} className="text-yellow-500"/> {course.total_hours_string}</span>
            </div>

            <button onClick={(e) => onAction(e, course.id)} className="w-full py-4 bg-white/10 hover:bg-white text-white hover:text-black font-bold rounded-xl transition-colors backdrop-blur-md border border-white/20 hover:border-transparent">
                {isEnrolled ? 'Resume Masterclass' : 'View Curriculum Details'}
            </button>
        </div>
    </Link>
)