'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { 
  Search, Star, Clock, BookOpen, CheckCircle2, Loader2, ArrowRight, 
  PlayCircle, Sparkles, TrendingUp, Compass, Award, Shield, Lock, Zap,
  BarChart, ShoppingCart, X, Trash2, ChevronRight, Play, Fingerprint
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
  is_premium: boolean 
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

export default function CoursesDiscoveryPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const supabase = createClient()
  const heroRef = useRef<HTMLDivElement>(null)
  
  // --- PARALLAX PHYSICS ---
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] })
  const yBg = useTransform(scrollYProgress, [0, 1], ["0%", "50%"])
  const opacityBg = useTransform(scrollYProgress, [0, 1], [1, 0])

  // --- STATE MANAGEMENT ---
  const [isInitializing, setIsInitializing] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeCategory, setActiveCategory] = useState("All")
  
  // Data States
  const [allCourses, setAllCourses] = useState<Course[]>([])
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set())
  const [userProgressMap, setUserProgressMap] = useState<Record<string, number>>({})
  
  // Cart States
  const [cartOpen, setCartOpen] = useState(false)
  const [cart, setCart] = useState<CartItem[]>([])
  const [toast, setToast] = useState<{message: string, type: 'success'|'error'} | null>(null)

  // ============================================================================
  // EFFECTS: LOCAL STORAGE CART SYNC
  // ============================================================================
  
  useEffect(() => {
      // Load cart from local storage on mount
      const savedCart = localStorage.getItem('grove_cart')
      if (savedCart) {
          try { setCart(JSON.parse(savedCart)) } catch (e) { console.error("Cart parse failed") }
      }
  }, [])

  useEffect(() => {
      // Sync cart to local storage whenever it changes
      localStorage.setItem('grove_cart', JSON.stringify(cart))
  }, [cart])

  // ============================================================================
  // EFFECTS: SUPABASE DATA FETCHING ENGINE
  // ============================================================================
  
  useEffect(() => {
    const fetchPlatformData = async () => {
      setIsInitializing(true)
      
      try {
        let userEnrolledIds = new Set<string>()
        let progressMap: Record<string, number> = {}

        // 1. Fetch User Specific Data (If logged in)
        if (user) {
            // Fetch Enrollments
            const { data: enrollData } = await supabase
                .from('enrollments')
                .select('course_id')
                .eq('user_id', user.id)
            
            // Fetch Course Progress (to calculate actual completion percentages)
            const { data: progressData } = await supabase
                .from('course_progress')
                .select('course_id, lecture_id')
                .eq('user_id', user.id)

            // Map enrollments
            const combinedIds = [...(enrollData?.map(e => e.course_id) || [])]
            progressData?.forEach(p => combinedIds.push(p.course_id))
            userEnrolledIds = new Set(combinedIds)
            setEnrolledIds(userEnrolledIds)

            // Calculate progress count per course
            if (progressData) {
                progressData.forEach(p => {
                    progressMap[p.course_id] = (progressMap[p.course_id] || 0) + 1
                })
            }
        }

        // 2. Fetch All Active Platform Courses
        const { data: courseData, error } = await supabase
          .from('courses')
          .select(`
              *, 
              profiles:instructor_id(full_name, avatar_url), 
              reviews(rating), 
              enrollments(count)
          `)
          .in('status', ['published', 'active', 'Active'])

        if (error) throw error

        // 3. Robust Data Processing & Fault Tolerance
        const formattedCourses: Course[] = courseData?.map((c: any) => {
            
            // A. Calculate Ratings Safely
            const ratings = c.reviews?.map((r: any) => r.rating) || []
            const avgRating = ratings.length > 0 
                ? (ratings.reduce((a:number, b:number) => a + b, 0) / ratings.length).toFixed(1) 
                : "0.0"
            
            // B. Fault-Tolerant JSON Parsing for Curriculum
            let parsedCurriculum = []
            try {
                parsedCurriculum = typeof c.curriculum_data === 'string' 
                    ? JSON.parse(c.curriculum_data) 
                    : (c.curriculum_data || [])
            } catch (e) {
                console.warn(`Failed to parse curriculum for course ${c.id}`)
            }

            const totalLessons = parsedCurriculum.reduce((acc: number, sec: any) => {
                return acc + (sec.items?.length || sec.lectures?.length || 0)
            }, 0) || 1 // Avoid division by zero

            // C. Fault-Tolerant JSON Parsing for Objectives
            let parsedObjectives: string[] = []
            try {
                parsedObjectives = typeof c.objectives === 'string' 
                    ? JSON.parse(c.objectives) 
                    : (Array.isArray(c.objectives) ? c.objectives : [])
            } catch (e) {
                console.warn(`Failed to parse objectives for course ${c.id}`)
            }

            // D. Mathematical Precise Duration Calculation
            let h = 0, m = 0, s = 0;
            if (c.duration && typeof c.duration === 'string' && c.duration.includes('h')) {
                const hMatch = c.duration.match(/(\d+)\s*h/i);
                const mMatch = c.duration.match(/(\d+)\s*m/i);
                h = hMatch ? parseInt(hMatch[1]) : 0;
                m = mMatch ? parseInt(mMatch[1]) : 0;
            } else {
                // Algorithmic estimation based on total lessons (Avg 12m 30s per lesson)
                const totalSeconds = totalLessons * ((12 * 60) + 30); 
                h = Math.floor(totalSeconds / 3600);
                m = Math.floor((totalSeconds % 3600) / 60);
                s = totalSeconds % 60;
            }
            
            const durationString = `${h}h ${m > 0 ? `${m}m` : ''}`;
            
            // E. Premium Determination Engine
            const isPremium = h >= 25;

            // F. Actual User Progress Percentage
            const lecturesCompleted = progressMap[c.id] || 0
            let realProgress = Math.round((lecturesCompleted / totalLessons) * 100)
            if (realProgress > 100) realProgress = 100

            // G. Date Formatting
            const dateObj = new Date(c.updated_at || c.created_at)
            const timeAgo = Math.floor((new Date().getTime() - dateObj.getTime()) / (1000 * 3600 * 24))
            const updatedString = timeAgo === 0 ? 'Updated today' : timeAgo === 1 ? 'Updated yesterday' : `Updated ${timeAgo} days ago`

            return {
                id: c.id,
                title: c.title || 'Untitled Course',
                description: c.description || 'No description provided.',
                instructor_name: c.profiles?.full_name || "Grove Expert",
                instructor_avatar: c.profiles?.avatar_url,
                rating: Number(avgRating),
                review_count: ratings.length,
                students: c.enrollments?.[0]?.count || 0,
                price: c.price || 0,
                thumbnail_url: c.thumbnail_url || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80",
                promo_video_url: c.promo_video_url,
                category: c.category || "General",
                level: c.level || "All Levels",
                duration_formatted: durationString,
                total_hours_numeric: h,
                total_lessons: totalLessons,
                objectives: parsedObjectives.filter(Boolean),
                is_premium: isPremium,
                progress: realProgress,
                updated_at: updatedString
            }
        })

        setAllCourses(formattedCourses)

      } catch (err: any) {
        console.error("Platform Initialization Error:", err)
        setToast({ message: "Failed to load courses. Please refresh.", type: 'error' })
      } finally {
        setIsInitializing(false)
      }
    }

    if (!authLoading) {
        fetchPlatformData()
    }
  }, [user, authLoading, supabase])

  // ============================================================================
  // INTELLIGENT RECOMMENDATION ALGORITHMS
  // ============================================================================
  
  // 1. User's Enrolled Courses
  const myLearning = useMemo(() => {
      return allCourses.filter(c => enrolledIds.has(c.id)).sort((a, b) => (b.progress || 0) - (a.progress || 0))
  }, [allCourses, enrolledIds])

  // 2. Dynamic Categories
  const filterCategories = useMemo(() => {
      const purchasedCats = new Set(myLearning.map(c => c.category))
      const defaultCats = ["Web Development", "UI/UX Design", "Business", "Marketing", "Video Editing", "AI & Data"]
      const merged = Array.from(new Set([...Array.from(purchasedCats), ...defaultCats]))
      return ["All", ...merged].slice(0, 8)
  }, [myLearning])

  // 3. Recommended / Discovered Courses
  const recommendedCourses = useMemo(() => {
      let filtered = allCourses.filter(c => !enrolledIds.has(c.id))
      
      if (searchTerm) {
          const term = searchTerm.toLowerCase()
          filtered = filtered.filter(c => 
              c.title.toLowerCase().includes(term) || 
              c.category.toLowerCase().includes(term) ||
              c.instructor_name.toLowerCase().includes(term)
          )
      } else if (activeCategory !== "All") {
          filtered = filtered.filter(c => c.category === activeCategory)
      } else {
          // If no search and no category selected, run the Top Picks Algorithm
          const purchasedCats = new Set(myLearning.map(c => c.category))
          if (purchasedCats.size > 0) {
              filtered = filtered.sort((a, b) => {
                  const aMatch = purchasedCats.has(a.category) ? 1 : 0
                  const bMatch = purchasedCats.has(b.category) ? 1 : 0
                  // Weight by category match first, then by rating
                  if (aMatch !== bMatch) return bMatch - aMatch;
                  return b.rating - a.rating;
              })
          } else {
              // Default to highest rated/most students
              filtered = filtered.sort((a, b) => b.students - a.students || b.rating - a.rating)
          }
      }
      return filtered
  }, [allCourses, enrolledIds, searchTerm, activeCategory, myLearning])

  // 4. Premium Extraction
  const premiumCourses = useMemo(() => {
      return allCourses.filter(c => c.is_premium && !enrolledIds.has(c.id)).sort((a, b) => b.rating - a.rating)
  }, [allCourses, enrolledIds])

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleCourseAction = (e: React.MouseEvent, courseId: string) => {
    e.preventDefault(); 
    e.stopPropagation();
    if (!user) router.push('/auth')
    else if (enrolledIds.has(courseId)) router.push(`/courses/${courseId}/learn`)
    else router.push(`/courses/${courseId}`)
  }

  const handleAddToCart = (course: Course) => {
      if (enrolledIds.has(course.id)) {
          setToast({ message: "You already own this course!", type: 'error' })
          return;
      }
      if (!cart.find(c => c.id === course.id)) {
          const newCartItem: CartItem = {
              id: course.id,
              title: course.title,
              instructor_name: course.instructor_name,
              thumbnail_url: course.thumbnail_url,
              price: course.price
          }
          setCart([...cart, newCartItem])
          setCartOpen(true)
      } else {
          setCartOpen(true) // Just open cart if it's already there
      }
  }

  const removeFromCart = (id: string) => {
      setCart(cart.filter(c => c.id !== id))
  }

<<<<<<< HEAD
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
                      <div className="absolute inset-0 bg-gradient-to-t from-[#1f1111] via-[#290606]/80 to-black/30" />
                      {/* <div className="absolute inset-0 bg-[radial-gradient(circle_at_right,transparent_0%,#050505_100%)]" /> */}
=======
  const cartTotal = cart.reduce((sum, item) => sum + item.price, 0)
>>>>>>> fdc0008a3005ce26b8fbcb1d8d9fc0a05cffb98e

  // ============================================================================
  // RENDER: LOADING STATE (SKELETONS)
  // ============================================================================

  if (isInitializing || authLoading) {
      return (
          <div className="bg-[#050505] min-h-screen font-sans">
              <Navbar />
              {/* Skeleton Hero */}
              <div className="pt-40 pb-24 px-6 flex flex-col items-center justify-center min-h-[60vh]">
                  <div className="w-48 h-8 bg-zinc-900 rounded-full animate-pulse mb-8" />
                  <div className="w-3/4 max-w-4xl h-24 bg-zinc-900 rounded-3xl animate-pulse mb-12" />
                  <div className="w-full max-w-2xl h-16 bg-zinc-900 rounded-full animate-pulse" />
              </div>
              {/* Skeleton Grid */}
              <div className="px-6 max-w-[1600px] mx-auto py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                      <div key={i} className="h-[420px] bg-zinc-900/50 rounded-3xl animate-pulse border border-white/5" />
                  ))}
              </div>
          </div>
      )
  }

  // ============================================================================
  // RENDER: MAIN APPLICATION
  // ============================================================================

  return (
    <main className="bg-[#050505] min-h-screen text-white font-sans selection:bg-emerald-500/30 overflow-x-hidden relative">
      
      {/* --- TOAST NOTIFICATIONS --- */}
      <AnimatePresence>
          {toast && (
              <motion.div 
                  initial={{ opacity: 0, y: 50, scale: 0.9 }} 
                  animate={{ opacity: 1, y: 0, scale: 1 }} 
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`fixed bottom-10 right-10 z-[200] px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border flex items-center gap-3 ${
                      toast.type === 'success' ? 'bg-emerald-900/90 border-emerald-500/30 text-white' : 'bg-red-900/90 border-red-500/30 text-white'
                  }`}
              >
                  {toast.type === 'success' ? <CheckCircle2 className="text-emerald-400"/> : <Shield className="text-red-400"/>}
                  <span className="font-bold text-sm">{toast.message}</span>
                  <button onClick={() => setToast(null)} className="ml-4 opacity-50 hover:opacity-100"><X size={16}/></button>
              </motion.div>
          )}
      </AnimatePresence>

      {/* --- SMART HEADER (Replaces standard Navbar dynamically) --- */}
      <header className="fixed top-0 w-full z-50 bg-black/60 backdrop-blur-xl border-b border-white/10 px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8 w-full max-w-[1600px] mx-auto">
              <Link href="/" className="font-black text-2xl tracking-tight text-white hover:opacity-80 transition-opacity">
                  Grove<span className="text-emerald-500">Connect</span>
              </Link>
              
              <div className="hidden md:flex relative group w-full max-w-md mx-auto">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" />
                  <input 
                      value={searchTerm}
                      onChange={(e) => {
                          setSearchTerm(e.target.value);
                          if(e.target.value) window.scrollTo({ top: window.innerHeight * 0.8, behavior: 'smooth' });
                      }}
                      placeholder="Search for anything..." 
                      className="w-full bg-white/5 border border-white/10 rounded-full pl-11 pr-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:bg-black transition-all text-white placeholder-zinc-500" 
                  />
                  {searchTerm && (
                      <button onClick={() => setSearchTerm("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
                          <X size={14}/>
                      </button>
                  )}
              </div>

              <div className="flex items-center gap-6 ml-auto">
                  <button onClick={() => setCartOpen(true)} className="relative p-2 text-zinc-400 hover:text-white transition-colors group">
                      <ShoppingCart size={24} className="group-hover:scale-110 transition-transform" />
                      {cart.length > 0 && (
                          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg border border-black animate-in zoom-in">
                              {cart.length}
                          </span>
                      )}
                  </button>
                  
                  {user ? (
                      <Link href="/dashboard" className="w-10 h-10 rounded-full bg-zinc-800 border-2 border-emerald-500/30 flex items-center justify-center font-bold overflow-hidden hover:border-emerald-500 transition-colors">
                          {user.user_metadata?.avatar_url ? (
                              <img src={user.user_metadata.avatar_url} className="w-full h-full object-cover" alt="Profile" />
                          ) : (
                              <span className="text-emerald-400 text-sm">{(user.user_metadata?.full_name || 'U').charAt(0).toUpperCase()}</span>
                          )}
                      </Link>
                  ) : (
                      <Link href="/auth" className="px-5 py-2 bg-white text-black font-bold text-sm rounded-full hover:bg-zinc-200 transition-colors">
                          Log In
                      </Link>
                  )}
              </div>
          </div>
      </header>

      {/* --- 1. IMMERSIVE PHYSICS HERO --- */}
      <section ref={heroRef} className="relative pt-40 pb-24 lg:pt-48 lg:pb-40 px-6 overflow-hidden flex items-center justify-center min-h-[85vh]">
          {/* Photographic Background + Blurs */}
          <motion.div style={{ y: yBg, opacity: opacityBg }} className="absolute inset-0 z-0 pointer-events-none">
              <Image src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2560&auto=format&fit=crop" fill className="object-cover opacity-20" alt="Technology Background" priority />
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
              
              <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[70%] bg-emerald-900/40 blur-[120px] rounded-full mix-blend-screen" />
              <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[70%] bg-blue-900/30 blur-[120px] rounded-full mix-blend-screen" />
          </motion.div>

          {/* Expanded Interactive Floating Physics Elements */}
          <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden hidden md:block">
              <FloatingBadge text="React 19" top="15%" left="15%" delay={0} />
              <FloatingBadge text="System Design" top="25%" right="18%" delay={0.8} />
              <FloatingBadge text="Next.js 15" top="65%" left="8%" delay={1.2} />
              <FloatingBadge text="Machine Learning" top="75%" right="12%" delay={1.5} />
              <FloatingBadge text="UI/UX Pro" top="45%" right="5%" delay={0.4} />
              <FloatingBadge text="Framer Motion" top="80%" left="25%" delay={2} />
              
              <motion.div drag dragConstraints={{ left: -50, right: 50, top: -50, bottom: 50 }} dragElastic={0.2} className="absolute top-[40%] left-[5%] w-24 h-24 bg-gradient-to-br from-emerald-500/20 to-cyan-500/5 rounded-2xl border border-emerald-500/20 backdrop-blur-md rotate-12 pointer-events-auto cursor-grab active:cursor-grabbing hover:scale-110 transition-transform flex items-center justify-center shadow-2xl"><BookOpen className="text-emerald-500/50" size={32}/></motion.div>
              <motion.div drag dragConstraints={{ left: -50, right: 50, top: -50, bottom: 50 }} dragElastic={0.2} className="absolute top-[20%] right-[8%] w-32 h-32 bg-gradient-to-bl from-blue-500/20 to-purple-500/5 rounded-full border border-blue-500/20 backdrop-blur-md -rotate-12 pointer-events-auto cursor-grab active:cursor-grabbing hover:scale-110 transition-transform flex items-center justify-center shadow-2xl"><PlayCircle className="text-blue-500/50" size={40}/></motion.div>
          </div>

          <div className="relative z-20 max-w-4xl mx-auto text-center mt-10">
              {user && (
                  <motion.div initial={{opacity:0, scale:0.8}} animate={{opacity:1, scale:1}} transition={{duration:0.8, ease:"easeOut"}} className="mb-6 inline-block">
                      <span className="px-5 py-2 rounded-full bg-white/5 border border-white/10 text-zinc-300 text-sm font-bold backdrop-blur-xl shadow-2xl flex items-center gap-2">
                          <Fingerprint size={16} className="text-emerald-400" />
                          Welcome back, <span className="text-white">{user.user_metadata?.full_name?.split(' ')[0] || 'Learner'}</span>
                      </span>
                  </motion.div>
              )}
              
              <motion.h1 initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay:0.2, duration:0.8}} className="text-5xl md:text-7xl lg:text-8xl font-black mb-8 leading-[1.05] tracking-tight text-white drop-shadow-2xl">
                  Learn without <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500">
                      limits.
                  </span>
              </motion.h1>

              {/* Mobile Smart Search (Desktop is in Header) */}
              <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay:0.4, duration:0.8}} className="relative max-w-xl mx-auto group mt-12 z-30 md:hidden block">
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
                          placeholder="What do you want to learn?" 
                          className="bg-transparent border-none outline-none text-white w-full placeholder-zinc-500 text-lg font-medium"
                      />
                  </div>
              </motion.div>
          </div>
      </section>

      {/* --- 2. CONTINUE LEARNING (ENROLLED COURSES) --- */}
      {myLearning.length > 0 && !searchTerm && (
          <motion.section initial={{opacity:0}} whileInView={{opacity:1}} viewport={{once:true}} className="py-20 px-6 max-w-[1600px] mx-auto border-b border-white/5 relative z-20 bg-[#050505]">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
                <div>
                    <h2 className="text-3xl font-black text-white flex items-center gap-3 mb-2">
                        <TrendingUp className="text-emerald-500" size={32}/> Pick Up Where You Left Off
                    </h2>
                    <p className="text-zinc-400">Your most recently active courses.</p>
                </div>
                <Link href="/dashboard" className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-sm font-bold text-white transition-colors flex items-center gap-2">
                    Go to Dashboard <ArrowRight size={16}/>
                </Link>
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
            
            {/* Dynamic Section Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                <div>
                    <h2 className="text-3xl md:text-4xl font-black text-white flex items-center gap-3 mb-3">
                        <Compass className="text-blue-500" size={36}/> 
                        {searchTerm ? `Results for "${searchTerm}"` : "Curated For You"}
                    </h2>
                    <p className="text-zinc-400 text-lg max-w-2xl">
                        {searchTerm ? "Explore the results below based on your search terminology." : "Intelligent recommendations based on your recent enrollments, searches, and platform trends."}
                    </p>
                </div>
            </div>

            {/* Sticky Filter Tabs (Hidden during search) */}
            {!searchTerm && (
                <div className="flex gap-2 overflow-x-auto no-scrollbar w-full mb-10 pb-4 border-b border-white/5 sticky top-20 z-30 bg-[#050505]/90 backdrop-blur-xl pt-4">
                    {filterCategories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 whitespace-nowrap border shadow-lg ${
                                activeCategory === cat 
                                ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.2)] scale-105' 
                                : 'bg-black border-white/10 text-zinc-400 hover:border-white/30 hover:text-white'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            )}

            {/* Grid Rendering */}
            {recommendedCourses.length === 0 ? (
                <div className="text-center py-32 bg-zinc-900/20 rounded-3xl border border-dashed border-white/10 backdrop-blur-sm">
                    <Search size={64} className="mx-auto text-zinc-700 mb-6"/>
                    <h3 className="text-2xl font-bold text-white mb-3">No matching courses found</h3>
                    <p className="text-zinc-500 text-lg mb-8">We couldn't find anything matching your current filters.</p>
                    <button onClick={() => {setSearchTerm(""); setActiveCategory("All")}} className="px-6 py-3 bg-white text-black font-bold rounded-full hover:bg-zinc-200 transition-colors">
                        Clear All Filters
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    <AnimatePresence mode="popLayout">
                        {recommendedCourses.map((course, idx) => (
                            <motion.div 
                                layout
                                key={course.id} 
                                initial={{opacity:0, scale:0.9}} 
                                animate={{opacity:1, scale:1}} 
                                exit={{opacity:0, scale:0.9}}
                                transition={{delay: (idx % 4) * 0.05}} 
                            >
                                <SmartCourseCard course={course} onAction={handleCourseAction} onAddToCart={handleAddToCart} />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
      </section>

      {/* --- 4. THE PREMIUM TIER (>25 HOURS) --- */}
      {premiumCourses.length > 0 && !searchTerm && activeCategory === "All" && (
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
                            <PremiumCard course={course} onAction={handleCourseAction} onAddToCart={handleAddToCart} />
                        </motion.div>
                    ))}
                </div>
            </div>
          </section>
      )}

      {/* --- 5. SLIDE-OUT CART DRAWER --- */}
      <AnimatePresence>
          {cartOpen && (
              <>
                  <motion.div 
                      initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} 
                      onClick={() => setCartOpen(false)} 
                      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" 
                  />
                  <motion.div 
                      initial={{x: '100%'}} animate={{x: 0}} exit={{x: '100%'}} 
                      transition={{type: 'spring', damping: 25, stiffness: 200}} 
                      className="fixed top-0 right-0 h-full w-full md:w-[450px] bg-zinc-950 border-l border-white/10 z-[101] shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col"
                  >
                      {/* Cart Header */}
                      <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black">
                          <h2 className="text-xl font-black flex items-center gap-2"><ShoppingCart className="text-emerald-500"/> Your Cart ({cart.length})</h2>
                          <button onClick={() => setCartOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20}/></button>
                      </div>
                      
                      {/* Cart Items */}
                      <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                          {cart.length === 0 ? (
                              <div className="h-full flex flex-col items-center justify-center text-zinc-500 text-center">
                                  <div className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center mb-6 border border-white/5">
                                      <ShoppingCart size={40} className="opacity-20"/>
                                  </div>
                                  <p className="font-bold text-white text-xl mb-2">Your cart is empty.</p>
                                  <p className="text-sm">Keep exploring to find your next skill.</p>
                                  <button onClick={() => setCartOpen(false)} className="mt-8 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white font-bold transition-colors">
                                      Browse Courses
                                  </button>
                              </div>
                          ) : (
                              <AnimatePresence>
                                  {cart.map((item) => (
                                      <motion.div 
                                          layout
                                          initial={{opacity:0, scale:0.9}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.9, x:50}}
                                          key={item.id} 
                                          className="flex gap-4 bg-white/5 border border-white/10 rounded-xl p-3 relative group"
                                      >
                                          <div className="w-24 h-16 bg-black rounded-lg relative overflow-hidden shrink-0 border border-white/10">
                                              <Image src={item.thumbnail_url} fill alt="" className="object-cover opacity-80"/>
                                          </div>
                                          <div className="flex-1 flex flex-col justify-center">
                                              <h4 className="text-sm font-bold line-clamp-2 leading-tight text-white pr-6">{item.title}</h4>
                                              <p className="text-xs text-zinc-400 mt-1">{item.instructor_name}</p>
                                              <div className="text-emerald-400 font-black text-sm mt-auto">${item.price}</div>
                                          </div>
                                          <button onClick={() => removeFromCart(item.id)} className="absolute top-2 right-2 text-zinc-600 hover:text-red-500 transition-colors p-1 bg-black/40 rounded-md backdrop-blur">
                                              <Trash2 size={16}/>
                                          </button>
                                      </motion.div>
                                  ))}
                              </AnimatePresence>
                          )}
                      </div>

                      {/* Cart Footer */}
                      {cart.length > 0 && (
                          <div className="p-6 bg-black border-t border-white/10 shadow-[0_-20px_40px_rgba(0,0,0,0.5)]">
                              <div className="flex items-center justify-between mb-6">
                                  <span className="text-zinc-400 font-bold text-lg">Total:</span>
                                  <span className="text-4xl font-black text-white">${cartTotal.toFixed(2)}</span>
                              </div>
                              <button 
                                  onClick={() => router.push('/checkout')} 
                                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-lg rounded-xl shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
                              >
                                  Secure Checkout <Lock size={18}/>
                              </button>
                          </div>
                      )}
                  </motion.div>
              </>
          )}
      </AnimatePresence>

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
    <div onClick={(e) => onAction(e, course.id)} className="group cursor-pointer bg-zinc-900/40 border border-white/10 rounded-3xl overflow-hidden hover:border-emerald-500/50 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-10px_rgba(16,185,129,0.2)] flex flex-col h-[400px] backdrop-blur-sm">
        <div className="relative h-48 overflow-hidden shrink-0 bg-black">
            <Image src={course.thumbnail_url} alt={course.title} fill className="object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
            
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-16 h-16 bg-emerald-500/20 backdrop-blur-md rounded-full flex items-center justify-center border border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.4)] transform scale-90 group-hover:scale-100 transition-all duration-500">
                    <PlayCircle size={32} className="text-emerald-400 fill-emerald-400/20 ml-1" />
                </div>
            </div>
        </div>

        <div className="p-6 flex flex-col flex-grow bg-zinc-950 relative">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-white/5">
                <motion.div initial={{width: 0}} whileInView={{width: `${course.progress}%`}} transition={{duration: 1, ease: "easeOut"}} className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
            </div>

            <h3 className="text-xl font-bold text-white mb-2 line-clamp-2 leading-tight group-hover:text-emerald-400 transition-colors mt-2">{course.title}</h3>
            
            <div className="flex items-center gap-3 mt-auto mb-4">
                <div className="w-8 h-8 rounded-full bg-zinc-800 overflow-hidden relative border border-white/10 shrink-0">
                    <Image src={course.instructor_avatar || '/placeholder.jpg'} fill alt="" className="object-cover"/>
                </div>
                <span className="text-sm text-zinc-400 font-medium truncate">{course.instructor_name}</span>
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <span className="text-sm font-bold text-emerald-500">{course.progress}% Complete</span>
                <span className="text-xs font-bold text-black uppercase tracking-wider px-5 py-2.5 bg-white rounded-full group-hover:bg-emerald-500 transition-colors shadow-lg">Resume</span>
            </div>
        </div>
    </div>
)

// --- COMPLEX NETFLIX-STYLE HOVER CARD ---
const SmartCourseCard = ({ course, onAction, onAddToCart }: { course: Course, onAction: any, onAddToCart: any }) => {
    const isBestseller = course.students > 1000;

    return (
        <div className="group relative w-full h-[480px] bg-transparent cursor-pointer">
            {/* BASE CARD (Always visible) */}
            <div onClick={(e) => onAction(e, course.id)} className="w-full h-full flex flex-col bg-[#0a0a0a] border border-white/5 rounded-3xl overflow-hidden hover:border-blue-500/40 transition-colors shadow-xl">
                <div className="relative h-56 overflow-hidden bg-black shrink-0">
                    <Image src={course.thumbnail_url} alt={course.title} fill className="object-cover opacity-80" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-90" />
                    
                    <div className="absolute top-4 left-4 flex flex-col gap-1.5 items-start">
                        <span className="px-3 py-1.5 bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-wider text-white shadow-lg">
                            {course.category}
                        </span>
                        {isBestseller && <span className="px-3 py-1.5 bg-yellow-500 text-black text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">Bestseller</span>}
                    </div>
                </div>

                <div className="p-6 flex flex-col flex-grow">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-400/10 px-2 py-1 rounded">
                            {course.level}
                        </span>
                        <div className="flex items-center gap-1 text-yellow-500 text-xs font-bold bg-yellow-500/10 px-2 py-1 rounded border border-yellow-500/20">
                            <Star size={12} fill="currentColor"/> {course.rating}
                        </div>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-4 line-clamp-2 leading-tight">
                        {course.title}
                    </h3>

                    <div className="flex items-center gap-3 mt-auto mb-6">
                        <div className="w-8 h-8 rounded-full bg-zinc-800 overflow-hidden relative border border-white/20 shrink-0 shadow-lg">
                            <Image src={course.instructor_avatar || '/placeholder.jpg'} fill alt="" className="object-cover"/>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs text-zinc-500 font-medium leading-none">Taught by</span>
                            <span className="text-sm font-bold text-zinc-300 truncate max-w-[150px] leading-tight">{course.instructor_name}</span>
                        </div>
                    </div>

                    <div className="pt-5 border-t border-white/5 flex items-center justify-between mt-auto">
                        <span className="text-2xl font-black text-white">${course.price}</span>
                        <span className="text-xs font-bold text-zinc-500 flex items-center gap-1"><Clock size={12}/> {course.duration_formatted}</span>
                    </div>
                </div>
            </div>

            {/* EXPANDED HOVER STATE (Netflix Style pop-out) */}
            <div className="absolute top-[-2%] left-[-5%] w-[110%] opacity-0 invisible group-hover:opacity-100 group-hover:visible z-50 bg-zinc-950 border border-white/10 rounded-3xl shadow-[0_30px_60px_rgba(0,0,0,0.8)] overflow-hidden transition-all duration-300 scale-95 group-hover:scale-100 delay-[400ms] flex flex-col pointer-events-none group-hover:pointer-events-auto cursor-default">
                <div onClick={(e) => onAction(e, course.id)} className="w-full aspect-video relative bg-black cursor-pointer">
                    <Image src={course.thumbnail_url} fill alt="" className="object-cover opacity-40" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/10 transition-colors">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 shadow-2xl">
                            <PlayCircle size={32} className="text-white fill-white/20" />
                        </div>
                    </div>
                </div>
                
                <div className="p-6 flex flex-col gap-4">
                    <h3 onClick={(e) => onAction(e, course.id)} className="font-bold text-xl text-white leading-tight cursor-pointer hover:text-emerald-400 transition-colors">{course.title}</h3>
                    
                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                        <span className="text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">{course.updated_at}</span>
                        <span className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded"><Clock size={12}/>{course.duration_formatted}</span>
                        <span className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded"><BookOpen size={12}/>{course.total_lessons} Lessons</span>
                    </div>
                    
                    <div className="text-sm text-zinc-300 line-clamp-2 mt-1 leading-relaxed">
                        {course.description}
                    </div>
                    
                    {course.objectives && course.objectives.length > 0 && (
                        <ul className="space-y-2 mb-2 mt-2">
                            {course.objectives.slice(0, 3).map((obj: string, i: number) => (
                                <li key={i} className="flex items-start gap-2 text-xs text-zinc-400">
                                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" /> <span className="line-clamp-1">{obj}</span>
                                </li>
                            ))}
                        </ul>
                    )}

                    <div className="pt-4 border-t border-white/10 flex items-center gap-3">
                        <button onClick={(e) => { e.preventDefault(); onAddToCart(course); }} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95">
                            Add to Cart
                        </button>
                        <div className="w-12 h-12 rounded-xl border border-white/20 flex items-center justify-center hover:bg-white/10 hover:text-red-400 transition-colors cursor-pointer"><HeartIcon/></div>
                    </div>
                </div>
            </div>
        </div>
    )
}

const HeartIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
)

const PremiumCard = ({ course, onAction, onAddToCart }: { course: Course, onAction: any, onAddToCart: any }) => (
    <div className="group relative h-[550px] rounded-3xl overflow-hidden block bg-black shadow-2xl border border-white/5">
        <div className="absolute inset-[-2px] bg-gradient-to-r from-yellow-500 via-amber-500 to-purple-600 opacity-20 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />
        
        <div className="absolute inset-[1px] bg-black rounded-[23px] overflow-hidden z-10">
            <Image src={course.thumbnail_url} alt={course.title} fill className="object-cover transition-transform duration-1000 group-hover:scale-110 opacity-60 mix-blend-luminosity group-hover:mix-blend-normal" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/20" />
            
            <div className="absolute inset-0 p-8 flex flex-col justify-end h-full">
                <div className="mb-auto flex justify-between items-start">
                    <div className="flex flex-col items-start gap-2">
                        <span className="bg-gradient-to-r from-yellow-600 to-amber-500 text-black text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-[0_0_20px_rgba(217,119,6,0.4)] flex items-center gap-1">
                            <Shield size={12} fill="currentColor"/> Masterclass
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-white bg-white/20 backdrop-blur-md px-3 py-1 rounded-full">
                            {course.level}
                        </span>
                    </div>
                    <div onClick={(e) => onAction(e, course.id)} className="w-12 h-12 rounded-full bg-white/5 backdrop-blur-md flex items-center justify-center border border-white/10 group-hover:bg-yellow-500 group-hover:text-black transition-all group-hover:scale-110 shadow-xl shrink-0 cursor-pointer">
                        <Lock size={18} className="group-hover:hidden" />
                        <PlayCircle size={20} className="hidden group-hover:block" fill="currentColor"/>
                    </div>
                </div>

                <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                    <h3 onClick={(e) => onAction(e, course.id)} className="text-3xl font-black text-white mb-4 leading-tight group-hover:text-yellow-400 transition-colors line-clamp-3 drop-shadow-lg cursor-pointer">{course.title}</h3>
                    
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
                        <span className="flex items-center gap-1.5 bg-white/5 px-3 py-2 rounded-lg backdrop-blur-sm border border-white/5"><BookOpen size={14} className="text-yellow-500"/> {course.total_lessons} Lessons</span>
                        <span className="flex items-center gap-1.5 bg-white/5 px-3 py-2 rounded-lg backdrop-blur-sm border border-white/5"><Clock size={14} className="text-yellow-500"/> {course.duration_formatted}</span>
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
