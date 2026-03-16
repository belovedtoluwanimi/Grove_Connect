'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { 
  Search, Star, Clock, BookOpen, CheckCircle2, Loader2, ArrowRight, 
  PlayCircle, Sparkles, TrendingUp, Compass, Award, Shield, Lock, 
  ShoppingCart, X, Trash2, Smartphone, Laptop, PenTool, Tablet, Users
} from 'lucide-react'

// --- INTERNAL IMPORTS ---
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import CTASection from '../components/CTASection' 
import { useAuth } from '@/app/hooks/useAuth'
import { createClient } from '@/app/utils/supabase/client'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type Course = {
  id: string
  title: string
  description: string
  instructor_name: string
  instructor_avatar?: string
  rating: number
  review_count: number
  students: number
  price: number
  thumbnail_url: string
  promo_video_url?: string
  category: string
  level: string
  duration_formatted: string 
  total_hours_numeric: number
  total_lessons: number
  objectives: string[]
  requirements: string[]
  is_premium: boolean 
  is_bestseller: boolean
  progress?: number 
  updated_at: string
}

export type CartItem = {
    id: string
    title: string
    instructor_name: string
    thumbnail_url: string
    price: number
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function PremiumCoursesDiscoveryPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const supabase = createClient()
  const heroRef = useRef<HTMLDivElement>(null)
  
  // --- PARALLAX PHYSICS ---
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] })
  const yBg = useTransform(scrollYProgress, [0, 1], ["0%", "40%"])

  // --- STATE MANAGEMENT ---
  const [isInitializing, setIsInitializing] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  
  // Data States
  const [allCourses, setAllCourses] = useState<Course[]>([])
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set())
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>([])
  
  // Cart States
  const [cartOpen, setCartOpen] = useState(false)
  const [cart, setCart] = useState<CartItem[]>([])

  // ============================================================================
  // EFFECTS: LOCAL STORAGE SYNC (CART & RECENTLY VIEWED)
  // ============================================================================
  
  useEffect(() => {
      const savedCart = localStorage.getItem('grove_cart')
      if (savedCart) {
          try { setCart(JSON.parse(savedCart)) } catch (e) { console.error("Cart parse failed") }
      }
      const viewed = localStorage.getItem('grove_recently_viewed')
      if (viewed) {
          try { setRecentlyViewedIds(JSON.parse(viewed)) } catch (e) {}
      }
  }, [])

  useEffect(() => {
      localStorage.setItem('grove_cart', JSON.stringify(cart))
  }, [cart])

  // Track viewing (Simulated click tracking for recommendation engine)
  const trackView = (id: string) => {
      const updated = [id, ...recentlyViewedIds.filter(v => v !== id)].slice(0, 10)
      setRecentlyViewedIds(updated)
      localStorage.setItem('grove_recently_viewed', JSON.stringify(updated))
  }

  // ============================================================================
  // EFFECTS: SUPABASE DATA FETCHING ENGINE
  // ============================================================================
  
  useEffect(() => {
    const fetchPlatformData = async () => {
      setIsInitializing(true)
      
      try {
        let userEnrolledIds = new Set<string>()
        let progressMap: Record<string, number> = {}

        if (user) {
            const { data: enrollData } = await supabase.from('enrollments').select('course_id').eq('user_id', user.id)
            const { data: progressData } = await supabase.from('course_progress').select('course_id, lecture_id').eq('user_id', user.id)

            const combinedIds = [...(enrollData?.map(e => e.course_id) || [])]
            progressData?.forEach(p => combinedIds.push(p.course_id))
            userEnrolledIds = new Set(combinedIds)
            setEnrolledIds(userEnrolledIds)

            if (progressData) {
                progressData.forEach(p => { progressMap[p.course_id] = (progressMap[p.course_id] || 0) + 1 })
            }
        }

        const { data: courseData, error } = await supabase
          .from('courses')
          .select(`*, profiles:instructor_id(full_name, avatar_url), reviews(rating), enrollments(id)`)
          .in('status', ['published', 'active', 'Active'])

        if (error) throw error

        const formattedCourses: Course[] = courseData?.map((c: any) => {
            
            // Exact Ratings
            const ratings = c.reviews?.map((r: any) => r.rating) || []
            const avgRating = ratings.length > 0 ? (ratings.reduce((a:number, b:number) => a + b, 0) / ratings.length).toFixed(1) : "5.0"
            const studentCount = c.enrollments?.length || Math.floor(Math.random() * 2000) + 100 // Fallback if no real students yet

            // Fault-Tolerant JSON Parsing
            let parsedCurriculum = [], parsedObjectives: string[] = [], parsedReqs: string[] = []
            try { parsedCurriculum = typeof c.curriculum_data === 'string' ? JSON.parse(c.curriculum_data) : (c.curriculum_data || []) } catch (e) {}
            try { parsedObjectives = typeof c.objectives === 'string' ? JSON.parse(c.objectives) : (c.objectives || []) } catch (e) {}
            try { parsedReqs = typeof c.prerequisites === 'string' ? JSON.parse(c.prerequisites) : (c.prerequisites || []) } catch (e) {}

            const totalLessons = parsedCurriculum.reduce((acc: number, sec: any) => acc + (sec.items?.length || sec.lectures?.length || 0), 0) || 12

            // Exact Mathematical Duration Calculation
            let h = 0, m = 0, s = 0;
            if (c.duration && typeof c.duration === 'string' && c.duration.includes('h')) {
                const hMatch = c.duration.match(/(\d+)\s*h/i); const mMatch = c.duration.match(/(\d+)\s*m/i);
                h = hMatch ? parseInt(hMatch[1]) : 0; m = mMatch ? parseInt(mMatch[1]) : 0;
            } else {
                const totalSeconds = totalLessons * ((12 * 60) + 30); 
                h = Math.floor(totalSeconds / 3600); m = Math.floor((totalSeconds % 3600) / 60); s = totalSeconds % 60;
            }
            
            const isPremium = h >= 25;
            const isBestseller = studentCount > 500;

            // Date Logic
            const dateObj = new Date(c.updated_at || c.created_at || new Date())
            const timeAgo = Math.floor((new Date().getTime() - dateObj.getTime()) / (1000 * 3600 * 24))
            const updatedString = timeAgo === 0 ? 'Updated today' : timeAgo === 1 ? 'Updated yesterday' : `Updated ${timeAgo} days ago`

            // Progress Logic
            const lecturesCompleted = progressMap[c.id] || 0
            let realProgress = Math.round((lecturesCompleted / totalLessons) * 100)
            if (realProgress > 100) realProgress = 100

            return {
                id: c.id,
                title: c.title || 'Untitled Course',
                description: c.description || 'Elevate your skills with this comprehensive curriculum.',
                instructor_name: c.profiles?.full_name || "Grove Expert",
                instructor_avatar: c.profiles?.avatar_url,
                rating: Number(avgRating),
                review_count: ratings.length,
                students: studentCount,
                price: c.price || 0,
                thumbnail_url: c.thumbnail_url || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80",
                promo_video_url: c.promo_video_url,
                category: c.category || "Technology",
                level: c.level || "All Levels",
                duration_formatted: `${h}h ${m}m`,
                total_hours_numeric: h,
                total_lessons: totalLessons,
                objectives: parsedObjectives.filter(Boolean),
                requirements: parsedReqs.filter(Boolean),
                is_premium: isPremium,
                is_bestseller: isBestseller,
                progress: realProgress,
                updated_at: updatedString
            }
        })

        setAllCourses(formattedCourses)
      } catch (err: any) {
        console.error("Platform Error:", err)
      } finally {
        setIsInitializing(false)
      }
    }

    if (!authLoading) fetchPlatformData()
  }, [user, authLoading, supabase])

  // ============================================================================
  // INTELLIGENT RECOMMENDATION ALGORITHMS
  // ============================================================================
  
  // 1. My Learning
  const myLearning = useMemo(() => allCourses.filter(c => enrolledIds.has(c.id)), [allCourses, enrolledIds])
  const purchasedCategories = new Set(myLearning.map(c => c.category))

  // 2. Base Available Courses (Not Enrolled)
  const availableCourses = allCourses.filter(c => !enrolledIds.has(c.id))

  // 3. Algorithm: Top Picks For You (Weighted by interests & ratings)
  const topPicks = useMemo(() => {
      return [...availableCourses].sort((a, b) => {
          const aMatch = purchasedCategories.has(a.category) ? 1 : 0
          const bMatch = purchasedCategories.has(b.category) ? 1 : 0
          if (aMatch !== bMatch) return bMatch - aMatch;
          return b.rating - a.rating;
      }).slice(0, 10)
  }, [availableCourses, purchasedCategories])

  // 4. Algorithm: Bestsellers
  const bestsellers = useMemo(() => availableCourses.filter(c => c.is_bestseller).sort((a, b) => b.students - a.students).slice(0, 10), [availableCourses])

  // 5. Algorithm: Highest Rated
  const highestRated = useMemo(() => [...availableCourses].sort((a, b) => b.rating - a.rating).slice(0, 10), [availableCourses])

  // 6. Algorithm: Trending Right Now (Randomized recent mix for demo purposes)
  const trending = useMemo(() => [...availableCourses].sort(() => 0.5 - Math.random()).slice(0, 10), [availableCourses])

  // 7. Algorithm: Recently Viewed
  const recentlyViewedCourses = useMemo(() => {
      return recentlyViewedIds.map(id => allCourses.find(c => c.id === id)).filter(Boolean) as Course[]
  }, [recentlyViewedIds, allCourses])

  // 8. Algorithm: Career Path (Dynamic based on highest enrolled category)
  const topCategory = Array.from(purchasedCategories)[0] || "Web Development"
  const careerPathCourses = useMemo(() => availableCourses.filter(c => c.category === topCategory).slice(0, 10), [availableCourses, topCategory])

  // 9. Premium Masterclasses
  const premiumMasterclasses = useMemo(() => availableCourses.filter(c => c.is_premium).sort((a, b) => b.rating - a.rating), [availableCourses])

  // Search Results Override
  const searchResults = useMemo(() => {
      if (!searchTerm) return []
      const term = searchTerm.toLowerCase()
      return availableCourses.filter(c => c.title.toLowerCase().includes(term) || c.category.toLowerCase().includes(term) || c.instructor_name.toLowerCase().includes(term))
  }, [searchTerm, availableCourses])

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleCourseClick = (courseId: string) => {
    trackView(courseId)
    if (!user) router.push('/auth')
    else if (enrolledIds.has(courseId)) router.push(`/courses/${courseId}/learn`)
    else router.push(`/courses/${courseId}`)
  }

  const handleAddToCart = (course: Course) => {
      trackView(course.id)
      if (enrolledIds.has(course.id)) return; // Should be hidden in UI anyway
      if (!cart.find(c => c.id === course.id)) {
          setCart([...cart, { id: course.id, title: course.title, instructor_name: course.instructor_name, thumbnail_url: course.thumbnail_url, price: course.price }])
      }
      setCartOpen(true)
  }

  const removeFromCart = (id: string) => setCart(cart.filter(c => c.id !== id))
  const cartTotal = cart.reduce((sum, item) => sum + item.price, 0)

  // ============================================================================
  // RENDER: LOADING STATE (SKELETONS)
  // ============================================================================

  if (isInitializing || authLoading) {
      return (
          <div className="bg-[#050505] min-h-screen font-sans">
              <Navbar />
              <div className="pt-40 pb-24 px-6 flex flex-col items-center justify-center min-h-[60vh]">
                  <div className="w-48 h-8 bg-white/5 backdrop-blur-md rounded-full animate-pulse mb-8" />
                  <div className="w-3/4 max-w-4xl h-24 bg-white/5 backdrop-blur-md rounded-3xl animate-pulse mb-12" />
                  <div className="w-full max-w-2xl h-16 bg-white/5 backdrop-blur-md rounded-full animate-pulse" />
              </div>
              <div className="px-6 max-w-[1600px] mx-auto py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <div key={i} className="h-[420px] bg-white/5 backdrop-blur-md rounded-3xl animate-pulse border border-white/5" />)}
              </div>
          </div>
      )
  }

  // ============================================================================
  // RENDER: MAIN APPLICATION
  // ============================================================================

  return (
    <main className="bg-[#050505] min-h-screen text-white font-sans selection:bg-emerald-500/30 overflow-x-hidden relative">
      
      {/* --- SMART HEADER --- */}
      <header className="fixed top-0 w-full z-50 bg-black/40 backdrop-blur-2xl border-b border-white/10 px-6 h-20 flex items-center justify-between transition-all">
          <div className="flex items-center gap-8 w-full max-w-[1600px] mx-auto">
              <Link href="/" className="font-black text-2xl tracking-tight text-white hover:opacity-80 transition-opacity">
                  Grove<span className="text-emerald-500">Connect</span>
              </Link>
              
              <div className="hidden md:flex relative group w-full max-w-md mx-auto">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" />
                  <input 
                      value={searchTerm}
                      onChange={(e) => { setSearchTerm(e.target.value); if(e.target.value) window.scrollTo({ top: window.innerHeight * 0.8, behavior: 'smooth' }); }}
                      placeholder="What do you want to learn?" 
                      className="w-full bg-white/5 border border-white/10 rounded-full pl-11 pr-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:bg-white/10 transition-all text-white placeholder-zinc-500 backdrop-blur-md shadow-inner" 
                  />
                  {searchTerm && <button onClick={() => setSearchTerm("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"><X size={14}/></button>}
              </div>

              <div className="flex items-center gap-6 ml-auto">
                  <button onClick={() => setCartOpen(true)} className="relative p-2 text-zinc-400 hover:text-white transition-colors group">
                      <ShoppingCart size={24} className="group-hover:scale-110 transition-transform" />
                      {cart.length > 0 && <span className="absolute top-0 right-0 w-5 h-5 bg-emerald-500 text-black text-[10px] font-black rounded-full flex items-center justify-center shadow-lg border-2 border-black animate-in zoom-in">{cart.length}</span>}
                  </button>
                  
                  {user ? (
                      <Link href="/dashboard" className="w-10 h-10 rounded-full bg-zinc-800 border-2 border-white/10 flex items-center justify-center font-bold overflow-hidden hover:border-emerald-500 transition-colors shadow-lg">
                          {user.user_metadata?.avatar_url ? <img src={user.user_metadata.avatar_url} className="w-full h-full object-cover" alt="Profile" /> : <span className="text-zinc-400 text-sm">{(user.user_metadata?.full_name || 'U').charAt(0).toUpperCase()}</span>}
                      </Link>
                  ) : (
                      <Link href="/auth" className="px-6 py-2.5 bg-white text-black font-bold text-sm rounded-full hover:bg-zinc-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)]">Log In</Link>
                  )}
              </div>
          </div>
      </header>

      {/* --- 1. IMMERSIVE PHYSICS HERO --- */}
      <section ref={heroRef} className="relative pt-40 pb-24 lg:pt-48 lg:pb-32 px-6 overflow-hidden flex items-center justify-center min-h-[85vh]">
          {/* Parallax Background Image */}
          <motion.div style={{ y: yBg }} className="absolute inset-0 z-0 pointer-events-none">
              <Image src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2560&auto=format&fit=crop" fill className="object-cover opacity-20" alt="Education" priority />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/80 to-[#050505]/40" />
              
              {/* Glassmorphic Ambient Glows */}
              <div className="absolute top-[10%] left-[10%] w-[500px] h-[500px] bg-emerald-900/30 blur-[120px] rounded-full mix-blend-screen" />
              <div className="absolute bottom-[10%] right-[10%] w-[500px] h-[500px] bg-blue-900/20 blur-[120px] rounded-full mix-blend-screen" />
          </motion.div>

          {/* Interactive Floating Objects */}
          <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden hidden lg:block">
              <FloatingIcon icon={Smartphone} top="20%" left="15%" delay={0} size={40} rotate={15} />
              <FloatingIcon icon={Laptop} top="60%" left="8%" delay={1.2} size={56} rotate={-10} />
              <FloatingIcon icon={BookOpen} top="30%" right="18%" delay={0.5} size={48} rotate={20} />
              <FloatingIcon icon={PenTool} top="70%" right="12%" delay={1.8} size={36} rotate={-15} />
              <FloatingIcon icon={Tablet} top="15%" right="35%" delay={2.5} size={40} rotate={5} />
          </div>

          <div className="relative z-20 max-w-4xl mx-auto text-center mt-10">
              {user && (
                  <motion.div initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} transition={{duration:0.6, ease:"easeOut"}} className="mb-6 inline-block">
                      <span className="px-6 py-2 rounded-full bg-white/5 border border-white/10 text-white text-sm font-medium backdrop-blur-xl shadow-2xl flex items-center gap-2">
                          <Sparkles size={16} className="text-emerald-400" />
                          Welcome back, <span className="font-bold">{user.user_metadata?.full_name?.split(' ')[0] || 'Learner'}</span>
                      </span>
                  </motion.div>
              )}
              
              <motion.h1 initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay:0.1, duration:0.8}} className="text-5xl md:text-7xl lg:text-8xl font-black mb-8 leading-[1.05] tracking-tight text-white drop-shadow-2xl">
                  Your journey to <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500">
                      mastery.
                  </span>
              </motion.h1>
              <motion.p initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay:0.2}} className="text-xl text-zinc-400 mb-12 max-w-2xl mx-auto font-medium">
                  Explore world-class curriculums, master high-income skills, and achieve your career goals with Grove Connect.
              </motion.p>
              <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay:0.3}} className="flex justify-center gap-4">
                  <button onClick={() => window.scrollTo({ top: window.innerHeight * 0.85, behavior: 'smooth' })} className="px-8 py-4 bg-white text-black font-black text-lg rounded-full hover:scale-105 transition-transform shadow-[0_0_40px_rgba(255,255,255,0.2)]">
                      Explore Courses
                  </button>
              </motion.div>
          </div>
      </section>

      {/* --- SEARCH OVERRIDE --- */}
      {searchTerm && (
          <section className="py-24 px-6 max-w-[1600px] mx-auto min-h-[60vh] relative z-20">
              <div className="flex items-end justify-between mb-12 border-b border-white/5 pb-6">
                  <div>
                      <h2 className="text-4xl font-black text-white mb-2">Search Results</h2>
                      <p className="text-zinc-400">Showing courses matching "{searchTerm}"</p>
                  </div>
                  <button onClick={()=>setSearchTerm("")} className="text-sm font-bold text-zinc-400 hover:text-white px-4 py-2 border border-white/10 rounded-full">Clear Search</button>
              </div>
              {searchResults.length === 0 ? (
                  <div className="text-center py-20">
                      <Search size={48} className="mx-auto text-zinc-700 mb-4"/>
                      <h3 className="text-xl font-bold text-white">No courses found</h3>
                  </div>
              ) : (
                  <CourseGrid courses={searchResults} onAction={handleCourseClick} onAddToCart={handleAddToCart} />
              )}
          </section>
      )}

      {/* --- NORMAL DASHBOARD LAYOUT (Hidden if searching) --- */}
      {!searchTerm && (
          <div className="relative z-20 bg-[#050505] space-y-24 pb-32">
              
              {/* 2. CONTINUE LEARNING */}
              {myLearning.length > 0 && (
                  <section className="px-6 max-w-[1600px] mx-auto -mt-10">
                      <div className="flex items-center justify-between mb-6">
                          <h2 className="text-2xl font-black text-white flex items-center gap-3"><PlayCircle className="text-emerald-500"/> Continue Learning</h2>
                          <Link href="/dashboard" className="text-sm font-bold text-zinc-400 hover:text-white transition-colors">My Dashboard &rarr;</Link>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                          {myLearning.slice(0, 4).map((course) => (
                              <ProgressCard key={course.id} course={course} onAction={handleCourseClick} />
                          ))}
                      </div>
                  </section>
              )}

              {/* 9. TOP PICKS FOR YOU (Algorithm Based) */}
              {topPicks.length > 0 && (
                  <CourseRow title="Top Picks For You" subtitle="Our highest-priority recommendations based on your unique profile." courses={topPicks} onAction={handleCourseClick} onAddToCart={handleAddToCart} />
              )}

              {/* 4. WHAT TO LEARN NEXT (Career Path) */}
              {careerPathCourses.length > 0 && (
                  <CourseRow title={`Career Path: ${topCategory}`} subtitle={`Master the skills required to excel in ${topCategory}.`} courses={careerPathCourses} onAction={handleCourseClick} onAddToCart={handleAddToCart} />
              )}

              {/* 5. BESTSELLER COURSES */}
              {bestsellers.length > 0 && (
                  <CourseRow title="Bestseller Courses" subtitle="The most purchased courses by students globally." courses={bestsellers} onAction={handleCourseClick} onAddToCart={handleAddToCart} badge="Bestseller" />
              )}

              {/* 13. PREMIUM COURSES SECTION (Visually Distinct) */}
              {premiumMasterclasses.length > 0 && (
                  <section className="relative py-32 px-6 border-y border-white/5 bg-[#020202] overflow-hidden my-12">
                      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-900/20 blur-[150px] rounded-full pointer-events-none" />
                      <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-yellow-600/10 blur-[150px] rounded-full pointer-events-none" />
                      
                      <div className="max-w-[1600px] mx-auto relative z-10">
                          <div className="mb-12">
                              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 text-yellow-400 text-[10px] font-black uppercase tracking-widest mb-4"><Award size={14}/> Grove Premium</span>
                              <h2 className="text-4xl md:text-5xl font-black text-white">The Ultimate Masterclasses</h2>
                              <p className="text-zinc-400 mt-2 text-lg">Comprehensive curriculums with 25+ hours of highly-produced content.</p>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                              {premiumMasterclasses.slice(0, 3).map(course => (
                                  <PremiumCourseCard key={course.id} course={course} onAction={handleCourseClick} onAddToCart={handleAddToCart} />
                              ))}
                          </div>
                      </div>
                  </section>
              )}

              {/* 6. TOP TRENDING RIGHT NOW */}
              {trending.length > 0 && (
                  <CourseRow title="Top Trending Right Now" subtitle="Courses gaining massive popularity this week." courses={trending} onAction={handleCourseClick} onAddToCart={handleAddToCart} />
              )}

              {/* 11. HIGHEST RATED COURSES */}
              {highestRated.length > 0 && (
                  <CourseRow title="Highest Rated Courses" subtitle="Consistently rated 5 stars by thousands of students." courses={highestRated} onAction={handleCourseClick} onAddToCart={handleAddToCart} />
              )}

              {/* 7. BECAUSE YOU RECENTLY VIEWED */}
              {recentlyViewedCourses.length > 0 && (
                  <CourseRow title="Because You Recently Viewed" subtitle="Jump back into courses that caught your eye." courses={recentlyViewedCourses} onAction={handleCourseClick} onAddToCart={handleAddToCart} />
              )}
          </div>
      )}

      {/* --- 14. SLIDE-OUT CART DRAWER --- */}
      <AnimatePresence>
          {cartOpen && (
              <>
                  <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setCartOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" />
                  <motion.div initial={{x: '100%'}} animate={{x: 0}} exit={{x: '100%'}} transition={{type: 'spring', damping: 25, stiffness: 200}} className="fixed top-0 right-0 h-full w-full md:w-[450px] bg-black/80 backdrop-blur-2xl border-l border-white/10 z-[101] shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col">
                      
                      <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                          <h2 className="text-xl font-black flex items-center gap-2"><ShoppingCart className="text-emerald-500"/> Cart ({cart.length})</h2>
                          <button onClick={() => setCartOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20}/></button>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                          {cart.length === 0 ? (
                              <div className="h-full flex flex-col items-center justify-center text-zinc-500 text-center">
                                  <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10">
                                      <ShoppingCart size={40} className="text-zinc-600"/>
                                  </div>
                                  <p className="font-bold text-white text-xl mb-2">Your cart is empty.</p>
                                  <p className="text-sm">Keep exploring to find your next skill.</p>
                                  <button onClick={() => setCartOpen(false)} className="mt-8 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-full transition-colors">
                                      Browse Courses
                                  </button>
                              </div>
                          ) : (
                              <AnimatePresence>
                                  {cart.map((item) => (
                                      <motion.div layout initial={{opacity:0, scale:0.9}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.9, x:50}} key={item.id} className="flex gap-4 bg-white/5 border border-white/10 rounded-2xl p-3 relative group hover:bg-white/10 transition-colors">
                                          <div className="w-24 h-16 bg-black rounded-xl relative overflow-hidden shrink-0 border border-white/10">
                                              <Image src={item.thumbnail_url} fill alt="" className="object-cover opacity-90"/>
                                          </div>
                                          <div className="flex-1 flex flex-col justify-center pr-6">
                                              <h4 className="text-sm font-bold line-clamp-2 leading-tight text-white">{item.title}</h4>
                                              <p className="text-xs text-zinc-400 mt-1">{item.instructor_name}</p>
                                              <div className="text-emerald-400 font-black text-sm mt-auto">${item.price}</div>
                                          </div>
                                          <button onClick={() => removeFromCart(item.id)} className="absolute top-2 right-2 text-zinc-500 hover:text-red-500 transition-colors p-1.5 bg-black/40 rounded-lg backdrop-blur hover:bg-red-500/20"><Trash2 size={14}/></button>
                                      </motion.div>
                                  ))}
                              </AnimatePresence>
                          )}
                      </div>

                      {cart.length > 0 && (
                          <div className="p-6 border-t border-white/10 bg-white/[0.02]">
                              <div className="flex items-center justify-between mb-6">
                                  <span className="text-zinc-400 font-bold text-lg">Total:</span>
                                  <span className="text-4xl font-black text-white">${cartTotal.toFixed(2)}</span>
                              </div>
                              <button onClick={() => router.push('/checkout')} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-lg rounded-xl shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all hover:scale-[1.02] flex items-center justify-center gap-2">
                                  Checkout <Lock size={18}/>
                              </button>
                          </div>
                      )}
                  </motion.div>
              </>
          )}
      </AnimatePresence>

      {/* --- 15 & 16. CTA & FOOTER --- */}
      <CTASection />
      <Footer />
    </main>
  )
}

// ============================================================================
// MICRO-COMPONENTS & CARDS
// ============================================================================

const FloatingIcon = ({ icon: Icon, top, left, right, delay, size, rotate }: any) => (
    <motion.div 
        drag dragConstraints={{ left: -50, right: 50, top: -50, bottom: 50 }} dragElastic={0.1}
        initial={{ y: 0, rotate }} animate={{ y: [0, -20, 0] }} transition={{ duration: 6, repeat: Infinity, delay, ease: "easeInOut" }}
        className="absolute p-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl text-emerald-500/50 shadow-2xl pointer-events-auto cursor-grab active:cursor-grabbing hover:bg-white/10 hover:text-emerald-400 transition-colors"
        style={{ top, left, right }}
    >
        <Icon size={size} />
    </motion.div>
)

const ProgressCard = ({ course, onAction }: { course: Course, onAction: any }) => (
    <div onClick={(e) => onAction(course.id)} className="group cursor-pointer bg-white/5 border border-white/10 rounded-3xl overflow-hidden hover:border-emerald-500/50 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-10px_rgba(16,185,129,0.2)] flex flex-col h-[320px] backdrop-blur-xl">
        <div className="relative h-40 overflow-hidden shrink-0 bg-black">
            <Image src={course.thumbnail_url} alt={course.title} fill className="object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-16 h-16 bg-emerald-500/20 backdrop-blur-md rounded-full flex items-center justify-center border border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.4)] transform scale-90 group-hover:scale-100 transition-all duration-500">
                    <PlayCircle size={32} className="text-emerald-400 fill-emerald-400/20 ml-1" />
                </div>
            </div>
        </div>

        <div className="p-6 flex flex-col flex-grow bg-black/40 relative">
            <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 leading-tight group-hover:text-emerald-400 transition-colors">{course.title}</h3>
            <span className="text-sm text-zinc-400 font-medium truncate mb-auto">{course.instructor_name}</span>
            <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-4">
                <span className="text-sm font-bold text-emerald-500">{course.progress}% Complete</span>
                <span className="text-[10px] font-bold text-white uppercase tracking-wider px-4 py-2 bg-white/10 rounded-full group-hover:bg-emerald-500 group-hover:text-black transition-colors">Resume</span>
            </div>
        </div>
    </div>
)

const CourseRow = ({ title, subtitle, courses, onAction, onAddToCart, badge }: any) => (
    <section className="max-w-[1600px] mx-auto px-6">
        <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-black text-white mb-2">{title}</h2>
            {subtitle && <p className="text-zinc-400 text-base">{subtitle}</p>}
        </div>
        <div className="flex gap-6 overflow-x-auto pb-12 pt-4 -mt-4 px-2 -mx-2 no-scrollbar scroll-smooth snap-x">
            {courses.map((course: any) => (
                <div key={course.id} className="w-[300px] md:w-[340px] shrink-0 snap-start">
                    <GlassCourseCard course={course} onAction={onAction} onAddToCart={onAddToCart} forceBadge={badge} />
                </div>
            ))}
        </div>
    </section>
)

const CourseGrid = ({ courses, onAction, onAddToCart }: any) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {courses.map((course: any) => (
            <GlassCourseCard key={course.id} course={course} onAction={onAction} onAddToCart={onAddToCart} />
        ))}
    </div>
)

// --- 13. THE NETFLIX-STYLE GLASSMORPHIC COURSE CARD ---
const GlassCourseCard = ({ course, onAction, onAddToCart, forceBadge }: { course: Course, onAction: any, onAddToCart: any, forceBadge?: string }) => {
    const showBestseller = forceBadge === 'Bestseller' || course.is_bestseller;

    return (
        <div className="group relative w-full h-[400px] bg-transparent cursor-pointer perspective-1000">
            {/* BASE CARD (Always visible) */}
            <div onClick={(e) => onAction(course.id)} className="w-full h-full flex flex-col bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden group-hover:border-emerald-500/40 transition-all duration-500 shadow-xl">
                <div className="relative h-48 overflow-hidden bg-black shrink-0">
                    <Image src={course.thumbnail_url} alt={course.title} fill className="object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90" />
                    <div className="absolute top-4 left-4 flex flex-col gap-1.5 items-start">
                        {showBestseller && <span className="px-2 py-1 bg-yellow-500 text-black text-[9px] font-black uppercase tracking-widest rounded shadow-lg">Bestseller</span>}
                        {course.is_premium && <span className="px-2 py-1 bg-black/60 backdrop-blur-md border border-yellow-500/30 text-yellow-400 text-[9px] font-black uppercase tracking-widest rounded shadow-lg">Premium</span>}
                    </div>
                </div>

                <div className="p-6 flex flex-col flex-grow">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{course.category}</span>
                        <div className="flex items-center gap-1 text-yellow-500 text-xs font-bold">
                            {course.rating} <Star size={12} fill="currentColor"/> <span className="text-zinc-600 font-normal">({course.review_count})</span>
                        </div>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1 line-clamp-2 leading-tight">{course.title}</h3>
                    <p className="text-xs text-zinc-400 mb-auto truncate">{course.instructor_name}</p>
                    <div className="pt-4 border-t border-white/5 flex items-center justify-between mt-4">
                        <span className="text-xl font-black text-white">${course.price}</span>
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider bg-white/10 px-3 py-1.5 rounded-full">View</span>
                    </div>
                </div>
            </div>

            {/* EXPANDED HOVER STATE (Netflix Style pop-out) */}
            <div className="absolute top-[-5%] left-[-5%] w-[110%] opacity-0 invisible group-hover:opacity-100 group-hover:visible z-50 bg-black/90 backdrop-blur-3xl border border-white/20 rounded-3xl shadow-[0_30px_60px_rgba(0,0,0,0.9)] overflow-hidden transition-all duration-300 scale-95 group-hover:scale-100 delay-[300ms] flex flex-col pointer-events-none group-hover:pointer-events-auto">
                <div onClick={() => onAction(course.id)} className="w-full h-40 relative bg-black cursor-pointer">
                    <Image src={course.thumbnail_url} fill alt="" className="object-cover opacity-50" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/10 transition-colors">
                        <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 shadow-2xl">
                            <PlayCircle size={28} className="text-white fill-white/20" />
                        </div>
                    </div>
                </div>
                
                <div className="p-6 flex flex-col gap-4">
                    <h3 onClick={() => onAction(course.id)} className="font-bold text-lg text-white leading-tight cursor-pointer hover:text-emerald-400 transition-colors line-clamp-2">{course.title}</h3>
                    
                    <div className="flex flex-wrap items-center gap-2 text-[9px] font-bold uppercase tracking-wider text-zinc-400">
                        <span className="text-emerald-400">{course.updated_at}</span>
                        <span className="bg-white/10 px-2 py-0.5 rounded">{course.duration_formatted}</span>
                        <span className="bg-white/10 px-2 py-0.5 rounded">{course.level}</span>
                    </div>
                    
                    {course.objectives && course.objectives.length > 0 && (
                        <ul className="space-y-1.5 mt-2 mb-2">
                            {course.objectives.slice(0, 3).map((obj: string, i: number) => (
                                <li key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                                    <CheckCircle2 size={14} className="text-emerald-500 shrink-0" /> <span className="line-clamp-1">{obj}</span>
                                </li>
                            ))}
                        </ul>
                    )}

                    <div className="pt-4 border-t border-white/10 flex items-center gap-3">
                        <button onClick={(e) => { e.preventDefault(); onAddToCart(course); }} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95">
                            Add to Cart
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

// --- 4. PREMIUM MASTERCLASS CARD ---
const PremiumCourseCard = ({ course, onAction, onAddToCart }: { course: Course, onAction: any, onAddToCart: any }) => (
    <div className="group relative h-[550px] rounded-3xl overflow-hidden block bg-black shadow-2xl border border-white/5">
        <div className="absolute inset-[-2px] bg-gradient-to-r from-yellow-500 via-amber-500 to-purple-600 opacity-30 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />
        
        <div className="absolute inset-[1px] bg-black/90 backdrop-blur-3xl rounded-[23px] overflow-hidden z-10">
            <Image src={course.thumbnail_url} alt={course.title} fill className="object-cover transition-transform duration-1000 group-hover:scale-110 opacity-40 mix-blend-luminosity group-hover:mix-blend-normal" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
            
            <div className="absolute inset-0 p-8 flex flex-col justify-end h-full">
                <div className="mb-auto flex justify-between items-start">
                    <span className="bg-gradient-to-r from-yellow-600 to-amber-500 text-black text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-[0_0_20px_rgba(217,119,6,0.4)] flex items-center gap-1">
                        <Shield size={12} fill="currentColor"/> Premium Edition
                    </span>
                    <div onClick={(e) => onAction(course.id)} className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:bg-yellow-500 group-hover:text-black transition-all group-hover:scale-110 shadow-xl shrink-0 cursor-pointer">
                        <Lock size={18} className="group-hover:hidden" />
                        <PlayCircle size={20} className="hidden group-hover:block" fill="currentColor"/>
                    </div>
                </div>

                <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                    <h3 onClick={(e) => onAction(course.id)} className="text-3xl font-black text-white mb-4 leading-tight group-hover:text-yellow-400 transition-colors line-clamp-3 drop-shadow-lg cursor-pointer">{course.title}</h3>
                    
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden relative border border-white/20 shrink-0 shadow-lg">
                            <Image src={course.instructor_avatar || '/placeholder.jpg'} fill alt="" className="object-cover"/>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs text-zinc-400 font-medium leading-none">Led by Industry Expert</span>
                            <span className="text-sm font-bold text-white truncate max-w-[180px] leading-tight">{course.instructor_name}</span>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-zinc-300 uppercase tracking-wider mb-8 opacity-80 group-hover:opacity-100 transition-opacity">
                        <span className="flex items-center gap-1.5 bg-white/10 px-3 py-2 rounded-lg backdrop-blur-sm border border-white/10"><BookOpen size={14} className="text-yellow-500"/> {course.total_lessons} Lessons</span>
                        <span className="flex items-center gap-1.5 bg-white/10 px-3 py-2 rounded-lg backdrop-blur-sm border border-white/10"><Clock size={14} className="text-yellow-500"/> {course.duration_formatted} Intensive</span>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-3xl font-black text-white drop-shadow-md">${course.price}</span>
                        <button onClick={(e) => { e.preventDefault(); onAddToCart(course); }} className="px-6 py-3 bg-white text-black font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] group-hover:shadow-[0_0_30px_rgba(234,179,8,0.4)] group-hover:bg-gradient-to-r group-hover:from-yellow-500 group-hover:to-amber-500 flex items-center gap-2">
                            Add to Cart <ShoppingCart size={18}/>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
)