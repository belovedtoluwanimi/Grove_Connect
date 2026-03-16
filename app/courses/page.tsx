'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Search, Star, Clock, BookOpen, CheckCircle2, Loader2, ArrowRight, 
  PlayCircle, Sparkles, TrendingUp, Compass, Award, Shield, Lock, 
  ShoppingCart, X, Trash2, ChevronRight, Play
} from 'lucide-react'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

// --- MOCK DATA GENERATOR (For UI Demonstration) ---
// In production, this comes from your Supabase hooks
const MOCK_COURSES = Array.from({ length: 20 }).map((_, i) => ({
    id: `course-${i}`,
    title: i % 3 === 0 ? "Complete Next.js 15 Fullstack Masterclass" : i % 2 === 0 ? "Advanced UI/UX Design Psychology" : "Python for AI & Data Science",
    instructor_name: "Sarah Jenkins",
    instructor_avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    rating: 4.8 + (Math.random() * 0.2),
    review_count: Math.floor(Math.random() * 5000) + 100,
    students: Math.floor(Math.random() * 50000) + 1000,
    price: i % 4 === 0 ? 199.99 : 89.99,
    thumbnail_url: `https://images.unsplash.com/photo-${1500000000000 + i}?w=600&q=80`, // Random nice images
    category: i % 3 === 0 ? "Web Development" : "Design",
    level: "All Levels",
    total_hours: i % 4 === 0 ? 30 : 12, // triggers premium if >= 25
    total_lessons: 142,
    objectives: ["Build scalable apps", "Master server components", "Deploy to Vercel", "Authentication"],
    updated_at: "Updated 2 days ago"
}))

export default function GroveConnectLearningHub() {
  const [loading, setLoading] = useState(true)
  const [cartOpen, setCartOpen] = useState(false)
  const [cart, setCart] = useState<any[]>([])
  const heroRef = useRef(null)
  
  // Parallax
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] })
  const yBg = useTransform(scrollYProgress, [0, 1], ["0%", "40%"])

  useEffect(() => {
    // Simulate DB load
    const timer = setTimeout(() => setLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  const addToCart = (course: any) => {
      if (!cart.find(c => c.id === course.id)) {
          setCart([...cart, course])
          setCartOpen(true)
      }
  }

  const removeFromCart = (id: string) => setCart(cart.filter(c => c.id !== id))
  const cartTotal = cart.reduce((sum, item) => sum + item.price, 0)

  if (loading) return <div className="h-screen bg-[#050505] flex items-center justify-center"><Loader2 className="animate-spin text-emerald-500 w-12 h-12"/></div>

  return (
    <main className="bg-[#050505] min-h-screen text-white font-sans selection:bg-emerald-500/30 overflow-x-hidden relative">
      
      {/* 1. SMART HEADER */}
      <header className="fixed top-0 w-full z-50 bg-black/60 backdrop-blur-xl border-b border-white/10 px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
              <h1 className="font-black text-xl tracking-tight text-white">Grove<span className="text-emerald-500">Connect</span></h1>
              <div className="hidden md:flex relative group w-96">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" />
                  <input placeholder="Search for anything..." className="w-full bg-white/5 border border-white/10 rounded-full pl-11 pr-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:bg-black transition-all text-white placeholder-zinc-500" />
              </div>
          </div>
          <div className="flex items-center gap-6">
              <button onClick={() => setCartOpen(true)} className="relative p-2 text-zinc-400 hover:text-white transition-colors">
                  <ShoppingCart size={24} />
                  {cart.length > 0 && <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-in zoom-in">{cart.length}</span>}
              </button>
              <div className="w-10 h-10 rounded-full bg-emerald-900 border-2 border-emerald-500/30 flex items-center justify-center font-bold">JD</div>
          </div>
      </header>

      {/* 2. PHYSICS HERO SECTION */}
      <section ref={heroRef} className="relative pt-40 pb-20 px-6 min-h-[75vh] flex items-center justify-center overflow-hidden">
          <motion.div style={{ y: yBg }} className="absolute inset-0 z-0">
              <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-900/30 blur-[150px] rounded-full mix-blend-screen" />
              <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-blue-900/20 blur-[150px] rounded-full mix-blend-screen" />
          </motion.div>

          {/* Interactive Floating Elements */}
          <div className="absolute inset-0 z-10 pointer-events-none hidden lg:block">
              <FloatingElement icon={BookOpen} top="25%" left="15%" delay={0} color="emerald" />
              <FloatingElement icon={PlayCircle} top="65%" left="10%" delay={1.5} color="blue" />
              <FloatingElement icon={Award} top="30%" right="18%" delay={0.5} color="yellow" />
              <FloatingElement icon={Sparkles} top="70%" right="12%" delay={2} color="purple" />
          </div>

          <div className="relative z-20 text-center max-w-4xl mx-auto">
              <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="mb-6 inline-block">
                  <span className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-zinc-300 text-sm font-medium backdrop-blur-md">
                      Welcome back, <span className="text-white font-bold">John Doe</span> 👋
                  </span>
              </motion.div>
              <motion.h1 initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay:0.1}} className="text-6xl md:text-8xl font-black mb-8 leading-[1.05] tracking-tight">
                  Master the skills of <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500">tomorrow.</span>
              </motion.h1>
              <motion.p initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay:0.2}} className="text-xl text-zinc-400 mb-10 max-w-2xl mx-auto">
                  Pick up where you left off or discover new, highly-rated courses curated specifically for your career goals.
              </motion.p>
          </div>
      </section>

      {/* 3. CONTINUE LEARNING */}
      <section className="px-6 max-w-[1600px] mx-auto relative z-20 -mt-10 mb-24">
          <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black flex items-center gap-2"><PlayCircle className="text-emerald-500"/> Continue Learning</h2>
              <Link href="/dashboard" className="text-sm font-bold text-zinc-400 hover:text-white transition-colors">My Dashboard &rarr;</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Active Course Card */}
              <div className="group bg-zinc-900/60 border border-white/10 rounded-2xl p-4 flex gap-4 hover:bg-zinc-900 transition-all cursor-pointer hover:border-emerald-500/50 relative overflow-hidden backdrop-blur-xl">
                  <div className="w-32 h-24 rounded-xl bg-black overflow-hidden relative shrink-0">
                      <Image src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&q=80" fill alt="" className="object-cover opacity-70 group-hover:scale-105 transition-transform duration-500"/>
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40"><Play size={24} fill="white"/></div>
                  </div>
                  <div className="flex flex-col flex-1 py-1">
                      <h3 className="font-bold text-sm line-clamp-2 mb-1 group-hover:text-emerald-400 transition-colors">Advanced React Patterns & Performance</h3>
                      <p className="text-[10px] text-zinc-500 mb-auto">Lesson 14: Server Components</p>
                      <div>
                          <div className="flex justify-between text-[10px] font-bold mb-1"><span>42% Complete</span><span className="text-zinc-500">Last watched 2h ago</span></div>
                          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 w-[42%] shadow-[0_0_10px_rgba(16,185,129,0.5)]"/></div>
                      </div>
                  </div>
              </div>
          </div>
      </section>

      {/* 4. DYNAMIC RECOMMENDATION ROWS */}
      <div className="space-y-20 pb-32">
          <CourseRow title="Top Picks for You" subtitle="Curated based on your interests and recent searches" courses={MOCK_COURSES.slice(0, 6)} onAddToCart={addToCart} />
          
          <CourseRow title="Bestselling Masterclasses" subtitle="The highest-rated courses on Grove Connect right now" courses={MOCK_COURSES.slice(6, 12)} onAddToCart={addToCart} />
          
          {/* 5. PREMIUM LUXURY SECTION */}
          <section className="relative py-24 px-6 border-y border-white/5 bg-[#020202] overflow-hidden my-24">
              <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-yellow-600/10 blur-[200px] rounded-full pointer-events-none" />
              <div className="max-w-[1600px] mx-auto relative z-10">
                  <div className="mb-12">
                      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 text-yellow-400 text-[10px] font-black uppercase tracking-widest mb-4"><Award size={14}/> Grove Premium</span>
                      <h2 className="text-4xl font-black text-white">The Ultimate Career Paths</h2>
                      <p className="text-zinc-400 mt-2">Comprehensive curriculums with 25+ hours of content designed to get you hired.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {MOCK_COURSES.filter(c => c.total_hours >= 25).slice(0,3).map(course => (
                          <PremiumCourseCard key={course.id} course={course} onAddToCart={addToCart} />
                      ))}
                  </div>
              </div>
          </section>

          <CourseRow title="Because you viewed 'UI/UX Design'" subtitle="Expand your design skillset" courses={MOCK_COURSES.slice(12, 18)} onAddToCart={addToCart} />
      </div>

      {/* 6. SLIDE-OUT CART DRAWER */}
      <AnimatePresence>
          {cartOpen && (
              <>
                  <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setCartOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" />
                  <motion.div initial={{x: '100%'}} animate={{x: 0}} exit={{x: '100%'}} transition={{type: 'spring', damping: 25, stiffness: 200}} className="fixed top-0 right-0 h-full w-full md:w-[450px] bg-zinc-950 border-l border-white/10 z-[101] shadow-2xl flex flex-col">
                      <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black">
                          <h2 className="text-xl font-black flex items-center gap-2"><ShoppingCart className="text-emerald-500"/> Your Cart ({cart.length})</h2>
                          <button onClick={() => setCartOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20}/></button>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                          {cart.length === 0 ? (
                              <div className="h-full flex flex-col items-center justify-center text-zinc-500">
                                  <ShoppingCart size={64} className="mb-4 opacity-20"/>
                                  <p className="font-bold text-white">Your cart is empty.</p>
                                  <p className="text-sm">Keep exploring to find your next skill.</p>
                              </div>
                          ) : (
                              cart.map((item, i) => (
                                  <div key={i} className="flex gap-4 bg-white/5 border border-white/10 rounded-xl p-3 relative group">
                                      <div className="w-24 h-16 bg-black rounded-lg relative overflow-hidden shrink-0"><Image src={item.thumbnail_url} fill alt="" className="object-cover opacity-80"/></div>
                                      <div className="flex-1 flex flex-col justify-center">
                                          <h4 className="text-sm font-bold line-clamp-2 leading-tight text-white pr-6">{item.title}</h4>
                                          <p className="text-xs text-zinc-400 mt-1">{item.instructor_name}</p>
                                          <div className="text-emerald-400 font-bold text-sm mt-auto">${item.price}</div>
                                      </div>
                                      <button onClick={() => removeFromCart(item.id)} className="absolute top-2 right-2 text-zinc-600 hover:text-red-500 transition-colors p-1"><Trash2 size={16}/></button>
                                  </div>
                              ))
                          )}
                      </div>

                      {cart.length > 0 && (
                          <div className="p-6 bg-black border-t border-white/10 shadow-[0_-20px_40px_rgba(0,0,0,0.5)]">
                              <div className="flex items-center justify-between mb-6">
                                  <span className="text-zinc-400 font-bold">Total:</span>
                                  <span className="text-3xl font-black text-white">${cartTotal.toFixed(2)}</span>
                              </div>
                              <button onClick={() => router.push('/checkout')} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-lg rounded-xl shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all hover:scale-[1.02]">
                                  Proceed to Checkout
                              </button>
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

// ============================================================================
// THE SMART COURSE CARD (Netflix-Style Delay Hover)
// ============================================================================

const CourseRow = ({ title, subtitle, courses, onAddToCart }: any) => (
    <section className="max-w-[1600px] mx-auto px-6">
        <div className="mb-6">
            <h2 className="text-2xl font-black text-white mb-1">{title}</h2>
            {subtitle && <p className="text-zinc-400 text-sm">{subtitle}</p>}
        </div>
        {/* Horizontal scroll container hiding the scrollbar */}
        <div className="flex gap-6 overflow-x-auto pb-8 pt-4 -mt-4 px-2 -mx-2 no-scrollbar scroll-smooth snap-x">
            {courses.map((course: any) => (
                <div key={course.id} className="w-[300px] md:w-[320px] shrink-0 snap-start">
                    <SmartCourseCard course={course} onAddToCart={onAddToCart} />
                </div>
            ))}
        </div>
    </section>
)

const SmartCourseCard = ({ course, onAddToCart }: any) => {
    const isPremium = course.total_hours >= 25;
    const isBestseller = course.students > 10000;

    return (
        <div className="group relative w-full h-[340px] bg-transparent cursor-pointer">
            {/* BASE CARD (Always visible) */}
            <div className="w-full h-full flex flex-col gap-3">
                <div className="w-full aspect-video rounded-xl bg-zinc-900 relative overflow-hidden border border-white/10 group-hover:border-emerald-500/50 transition-colors">
                    <Image src={course.thumbnail_url} fill alt="" className="object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                    {/* Tags */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                        {isBestseller && <span className="px-2 py-1 bg-yellow-500 text-black text-[9px] font-black uppercase tracking-widest rounded shadow-lg">Bestseller</span>}
                        {isPremium && <span className="px-2 py-1 bg-black/60 backdrop-blur-md border border-yellow-500/30 text-yellow-400 text-[9px] font-black uppercase tracking-widest rounded shadow-lg">Premium</span>}
                    </div>
                </div>
                <div>
                    <h3 className="font-bold text-white leading-tight line-clamp-2 mb-1">{course.title}</h3>
                    <p className="text-xs text-zinc-500 truncate mb-1">{course.instructor_name}</p>
                    <div className="flex items-center gap-2 text-xs font-bold mb-1">
                        <span className="text-yellow-500">{course.rating}</span>
                        <div className="flex text-yellow-500"><Star size={12} fill="currentColor"/></div>
                        <span className="text-zinc-600 font-normal">({course.review_count.toLocaleString()})</span>
                    </div>
                    <div className="font-black text-white text-lg">${course.price}</div>
                </div>
            </div>

            {/* EXPANDED HOVER STATE (Netflix Style pop-out) */}
            {/* Note: In a fully productionized React app, you'd use a portal or complex absolute positioning logic to handle edge detection. This relies on z-index and group-hover scaling. */}
            <div className="absolute top-[-5%] left-[-5%] w-[110%] opacity-0 invisible group-hover:opacity-100 group-hover:visible group-hover:z-50 bg-zinc-950 border border-white/10 rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.8)] overflow-hidden transition-all duration-300 scale-95 group-hover:scale-100 delay-300 flex flex-col pointer-events-none group-hover:pointer-events-auto">
                <div className="w-full aspect-video relative bg-black">
                    <Image src={course.thumbnail_url} fill alt="" className="object-cover opacity-50" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20"><PlayCircle size={48} className="text-white" /></div>
                </div>
                <div className="p-5 flex flex-col gap-3">
                    <h3 className="font-bold text-lg text-white leading-tight">{course.title}</h3>
                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                        <span className="text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">{course.updated_at}</span>
                        <span>{course.total_hours} Total Hours</span>
                        <span>{course.level}</span>
                    </div>
                    <p className="text-xs text-zinc-400 line-clamp-2">Learn by building real-world projects. Master the theory and the practice.</p>
                    
                    <ul className="space-y-1.5 mb-2 mt-2">
                        {course.objectives.slice(0, 3).map((obj: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                                <CheckCircle2 size={14} className="text-emerald-500 shrink-0" /> <span className="line-clamp-1">{obj}</span>
                            </li>
                        ))}
                    </ul>

                    <div className="pt-3 border-t border-white/10 flex items-center gap-3">
                        <button onClick={(e) => { e.preventDefault(); onAddToCart(course); }} className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-lg transition-colors">
                            Add to Cart
                        </button>
                        <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors"><Star size={16}/></div>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ============================================================================
// PREMIUM LUXURY CARD
// ============================================================================

const PremiumCard = ({ course, onAddToCart }: any) => (
    <div className="group relative h-[480px] rounded-3xl overflow-hidden cursor-pointer block bg-black border border-white/5 hover:border-yellow-500/50 transition-colors shadow-2xl">
        <div className="absolute inset-[-1px] bg-gradient-to-br from-yellow-500/30 via-transparent to-purple-600/30 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        <Image src={course.thumbnail_url} alt="" fill className="object-cover transition-transform duration-1000 group-hover:scale-110 opacity-50 mix-blend-luminosity group-hover:mix-blend-normal" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#020202] via-[#020202]/80 to-transparent" />
        
        <div className="absolute inset-0 p-8 flex flex-col justify-end">
            <h3 className="text-3xl font-black text-white mb-3 leading-tight group-hover:text-yellow-400 transition-colors drop-shadow-xl">{course.title}</h3>
            
            <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full overflow-hidden relative border border-white/20 shadow-lg shrink-0"><Image src={course.instructor_avatar} fill alt="" className="object-cover"/></div>
                <span className="text-sm font-bold text-zinc-300 truncate">Expert led by {course.instructor_name}</span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-zinc-300 uppercase tracking-widest mb-8">
                <span className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/5 flex items-center gap-1.5"><Clock size={14} className="text-yellow-500"/> {course.total_hours} Hours</span>
                <span className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/5 flex items-center gap-1.5"><BookOpen size={14} className="text-yellow-500"/> {course.total_lessons} Lessons</span>
            </div>

            <div className="flex items-center justify-between">
                <span className="text-3xl font-black text-white drop-shadow-md">${course.price}</span>
                <button onClick={(e) => { e.preventDefault(); onAddToCart(course); }} className="px-6 py-3 bg-white text-black font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] group-hover:shadow-[0_0_30px_rgba(234,179,8,0.4)] group-hover:bg-gradient-to-r group-hover:from-yellow-500 group-hover:to-amber-500">
                    Add to Cart
                </button>
            </div>
        </div>
    </div>
)

const FloatingElement = ({ icon: Icon, top, left, right, delay, color }: any) => {
    const colorMap: Record<string, string> = {
        emerald: "from-emerald-500/20 to-cyan-500/5 border-emerald-500/20 text-emerald-500/50",
        blue: "from-blue-500/20 to-purple-500/5 border-blue-500/20 text-blue-500/50",
        yellow: "from-yellow-500/20 to-orange-500/5 border-yellow-500/20 text-yellow-500/50",
        purple: "from-purple-500/20 to-pink-500/5 border-purple-500/20 text-purple-500/50",
    }
    
    return (
        <motion.div 
            drag dragConstraints={{ left: -50, right: 50, top: -50, bottom: 50 }} dragElastic={0.2}
            initial={{ y: 0 }} animate={{ y: [0, -20, 0] }} transition={{ duration: 5, repeat: Infinity, delay, ease: "easeInOut" }}
            className={`absolute w-20 h-20 rounded-2xl bg-gradient-to-br backdrop-blur-md border pointer-events-auto cursor-grab active:cursor-grabbing hover:scale-110 transition-transform flex items-center justify-center ${colorMap[color]}`}
            style={{ top, left, right }}
        >
            <Icon size={32} />
        </motion.div>
    )
}
