'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Star, Clock, Users, ShoppingCart, Loader2, ArrowRight, PlayCircle, X, Trash2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useAuth } from '@/app/hooks/useAuth'
import { createClient } from '@/app/utils/supabase/client'

// --- TYPES ---
export type Course = {
  id: string
  title: string
  instructor_name: string
  rating: number
  review_count: number
  students: number
  price: number
  thumbnail_url: string
  category: string
  duration_formatted: string 
  progress?: number 
}

export default function CoursesPage() {
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  // --- STATE ---
  const [loading, setLoading] = useState(true)
  const [allCourses, setAllCourses] = useState<Course[]>([])
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set())
  const [userProgressMap, setUserProgressMap] = useState<Record<string, number>>({})
  
  // Hero Carousel State
  const [currentSlide, setCurrentSlide] = useState(0)

  // Cart State
  const [cartOpen, setCartOpen] = useState(false)
  const [cart, setCart] = useState<Course[]>([])

  // --- 1. FETCH EXACT DATA ---
  useEffect(() => {
    const fetchPlatformData = async () => {
      setLoading(true)
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
          .select(`*, profiles:instructor_id(full_name), reviews(rating), enrollments(id)`)
          .in('status', ['published', 'active', 'Active'])

        if (error) throw error

        const formattedCourses: Course[] = courseData?.map((c: any) => {
            // Exact Ratings
            const ratings = c.reviews?.map((r: any) => r.rating) || []
            const avgRating = ratings.length > 0 ? (ratings.reduce((a:number, b:number) => a + b, 0) / ratings.length).toFixed(1) : "0.0"
            
            // Exact Students
            const studentCount = c.enrollments?.length || 0

            // Exact Hours Calculation
            let parsedCurriculum = []
            try { parsedCurriculum = typeof c.curriculum_data === 'string' ? JSON.parse(c.curriculum_data) : (c.curriculum_data || []) } catch (e) {}
            const totalLessons = parsedCurriculum.reduce((acc: number, sec: any) => acc + (sec.items?.length || sec.lectures?.length || 0), 0) || 1
            
            let h = 0, m = 0;
            if (c.duration && typeof c.duration === 'string' && c.duration.includes('h')) {
                const hMatch = c.duration.match(/(\d+)\s*h/i);
                const mMatch = c.duration.match(/(\d+)\s*m/i);
                h = hMatch ? parseInt(hMatch[1]) : 0;
                m = mMatch ? parseInt(mMatch[1]) : 0;
            } else {
                const totalSeconds = totalLessons * ((12 * 60) + 30); 
                h = Math.floor(totalSeconds / 3600);
                m = Math.floor((totalSeconds % 3600) / 60);
            }
            const durationString = `${h}h ${m > 0 ? `${m}m` : ''}`;

            // Exact Percentage Progress (No Progress Bar)
            const lecturesCompleted = progressMap[c.id] || 0
            let realProgress = Math.round((lecturesCompleted / totalLessons) * 100)
            if (realProgress > 100) realProgress = 100

            return {
                id: c.id,
                title: c.title || 'Untitled Course',
                instructor_name: c.profiles?.full_name || "Grove Expert",
                rating: Number(avgRating),
                review_count: ratings.length,
                students: studentCount,
                price: c.price || 0,
                thumbnail_url: c.thumbnail_url || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80",
                category: c.category || "General",
                duration_formatted: durationString,
                progress: realProgress
            }
        }) || []

        setAllCourses(formattedCourses)
      } catch (err: any) {
        console.error("Error:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchCourses()
  }, [user, supabase])

  // --- HERO CAROUSEL LOGIC ---
  // Get top 5 courses by student count to feature in the Hero section
  const heroCourses = [...allCourses].sort((a, b) => b.students - a.students).slice(0, 5)

  useEffect(() => {
      if (heroCourses.length <= 1) return;
      const interval = setInterval(() => {
          setCurrentSlide(prev => (prev + 1) % heroCourses.length)
      }, 7000)
      return () => clearInterval(interval)
  }, [heroCourses.length])

  // --- CART LOGIC ---
  const handleAddToCart = (course: Course) => {
      if (!cart.find(c => c.id === course.id)) {
          setCart([...cart, course])
          setCartOpen(true)
      } else {
          setCartOpen(true)
      }
  }
  const removeFromCart = (id: string) => setCart(cart.filter(c => c.id !== id))
  const cartTotal = cart.reduce((sum, item) => sum + item.price, 0)

  if (loading) return <div className="h-screen bg-[#050505] flex items-center justify-center"><Loader2 className="animate-spin text-emerald-500 w-10 h-10"/></div>

  return (
    <main className="bg-[#050505] min-h-screen text-white font-sans">
      {/* Normal Navbar */}
      <Navbar />

      {/* Floating Cart Button (Visible when items are in cart) */}
      {cart.length > 0 && (
          <button 
              onClick={() => setCartOpen(true)} 
              className="fixed bottom-8 right-8 z-50 bg-emerald-600 hover:bg-emerald-500 text-white p-4 rounded-full shadow-2xl flex items-center gap-2 transition-transform hover:scale-105"
          >
              <ShoppingCart size={24} />
              <span className="font-bold">{cart.length}</span>
          </button>
      )}

      {/* --- STEP 1: HERO SECTION WITH BACKGROUND --- */}
      <section className="relative w-full h-[85vh] min-h-[600px] flex items-center justify-center bg-black overflow-hidden">
          
          <AnimatePresence mode="wait">
              {heroCourses.length > 0 && (
                  <motion.div 
                      key={currentSlide}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 1 }}
                      className="absolute inset-0"
                  >
                      {/* Background Image */}
                      <Image 
                          src={heroCourses[currentSlide].thumbnail_url}
                          alt="Hero Background"
                          fill
                          className="object-cover opacity-40 blur-sm scale-105"
                          priority
                      />
                      {/* Gradient Overlays for Readability */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/80 to-transparent" />
                      <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/60 to-transparent" />

                      <div className="relative z-10 w-full max-w-[1600px] mx-auto px-6 h-full flex items-center">
                          <div className="max-w-3xl">
                              <span className="inline-block px-4 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-emerald-400 text-xs font-bold uppercase tracking-widest mb-6">
                                  Top Bestseller in {heroCourses[currentSlide].category}
                              </span>
                              
                              <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight drop-shadow-lg">
                                  {heroCourses[currentSlide].title}
                              </h1>
                              
                              {/* Exact Data Row */}
                              <div className="flex flex-wrap items-center gap-6 mb-10 text-sm md:text-base">
                                  <div className="flex items-center gap-2 text-yellow-500">
                                      <Star size={20} fill="currentColor"/> 
                                      <span className="font-bold text-white text-lg">{heroCourses[currentSlide].rating}</span> 
                                      <span className="text-zinc-400">({heroCourses[currentSlide].review_count.toLocaleString()} ratings)</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-zinc-300">
                                      <Users size={20} className="text-blue-400"/> 
                                      <span className="font-bold text-white">{heroCourses[currentSlide].students.toLocaleString()}</span> students enrolled
                                  </div>
                                  <div className="flex items-center gap-2 text-zinc-300">
                                      <Clock size={20} className="text-emerald-400"/> 
                                      <span className="font-bold text-white">{heroCourses[currentSlide].duration_formatted}</span> of video
                                  </div>
                              </div>

                              <div className="flex items-center gap-4">
                                  <button 
                                      onClick={() => handleAddToCart(heroCourses[currentSlide])}
                                      className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-lg rounded-xl shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all hover:scale-105 flex items-center gap-2"
                                  >
                                      Add to Cart - ${heroCourses[currentSlide].price}
                                  </button>
                                  <Link href={`/courses/${heroCourses[currentSlide].id}`} className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold text-lg rounded-xl border border-white/20 backdrop-blur-md transition-all">
                                      View Details
                                  </Link>
                              </div>
                          </div>
                      </div>
                  </motion.div>
              )}
          </AnimatePresence>

          {/* Dots Indicator */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-3 z-20">
              {heroCourses.map((_, idx) => (
                  <button 
                      key={idx} 
                      onClick={() => setCurrentSlide(idx)}
                      className={`h-2 rounded-full transition-all ${currentSlide === idx ? 'w-8 bg-emerald-500' : 'w-2 bg-white/30'}`}
                  />
              ))}
          </div>
      </section>

      {/* STEP 2 GRIDS WILL GO HERE NEXT */}
      <section className="py-32 text-center text-zinc-500">
          <p>Hero Section Complete. Awaiting approval for Grid Sections...</p>
      </section>

      {/* --- CART DRAWER --- */}
      <AnimatePresence>
          {cartOpen && (
              <>
                  <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setCartOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" />
                  <motion.div initial={{x: '100%'}} animate={{x: 0}} exit={{x: '100%'}} transition={{type: 'spring', damping: 25, stiffness: 200}} className="fixed top-0 right-0 h-full w-full md:w-[450px] bg-[#0a0a0a] border-l border-white/10 z-[101] shadow-2xl flex flex-col">
                      <div className="p-6 border-b border-white/10 flex items-center justify-between">
                          <h2 className="text-xl font-black flex items-center gap-2"><ShoppingCart className="text-emerald-500"/> Cart ({cart.length})</h2>
                          <button onClick={() => setCartOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20}/></button>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto p-6 space-y-4">
                          {cart.map((item) => (
                              <div key={item.id} className="flex gap-4 bg-white/5 border border-white/10 rounded-xl p-3 relative">
                                  <div className="w-24 h-16 bg-black rounded-lg relative overflow-hidden shrink-0"><Image src={item.thumbnail_url} fill alt="" className="object-cover"/></div>
                                  <div className="flex-1">
                                      <h4 className="text-sm font-bold line-clamp-2 text-white pr-6">{item.title}</h4>
                                      <div className="text-emerald-400 font-bold text-sm mt-2">${item.price}</div>
                                  </div>
                                  <button onClick={() => removeFromCart(item.id)} className="absolute top-2 right-2 text-zinc-600 hover:text-red-500 p-1"><Trash2 size={16}/></button>
                              </div>
                          ))}
                      </div>

                      {cart.length > 0 && (
                          <div className="p-6 border-t border-white/10 bg-black">
                              <div className="flex items-center justify-between mb-4">
                                  <span className="text-zinc-400 font-bold">Total:</span>
                                  <span className="text-3xl font-black text-white">${cartTotal.toFixed(2)}</span>
                              </div>
                              <button onClick={() => router.push('/checkout')} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl transition-all">Checkout</button>
                          </div>
                      )}
                  </motion.div>
              </>
          )}
      </AnimatePresence>

      <Footer />
    </main>
  )
}