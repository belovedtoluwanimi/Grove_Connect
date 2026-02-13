'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { 
  Search, Star, PlayCircle, Clock, BarChart, Filter, 
  ChevronDown, Check, Loader2, ArrowRight, X, SlidersHorizontal,
  BookOpen, Users, Zap
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useAuth } from '@/app/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { createClient } from '@/app/utils/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

// --- TYPES ---
type Course = {
  id: string
  title: string
  instructor: string
  instructor_avatar?: string
  rating: number
  review_count: number
  students: number
  price: number
  original_price?: number
  image: string
  category: string
  level: string
  duration: string
  lectures: number
  bestseller?: boolean
}

// --- FILTERS DATA ---
const CATEGORIES = ["All", "Development", "Design", "Business", "Marketing", "Music", "Photography"]
const LEVELS = ["All Levels", "Beginner", "Intermediate", "Expert"]
const PRICES = ["Paid", "Free"]

export default function CoursesPage() {
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClient()
  
  // State
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filter State
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [selectedLevel, setSelectedLevel] = useState("All Levels")
  const [showFilters, setShowFilters] = useState(false) // Mobile toggle

  // Cart State
  const [cartItems, setCartItems] = useState<string[]>([])
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true)
      try {
        let query = supabase
          .from('courses')
          .select(`
            *,
            profiles:instructor_id ( full_name, avatar_url ),
            reviews ( rating ),
            enrollments ( count )
          `)
          .eq('status', 'Active')

        // Apply Filters
        if (selectedCategory !== "All") query = query.eq('category', selectedCategory)
        if (selectedLevel !== "All Levels") query = query.eq('level', selectedLevel)
        if (searchTerm) query = query.ilike('title', `%${searchTerm}%`)

        const { data, error } = await query

        if (error) throw error

        const formatted: Course[] = data?.map((c: any) => {
            // Calc Rating
            const ratings = c.reviews?.map((r: any) => r.rating) || []
            const avgRating = ratings.length ? ratings.reduce((a:number,b:number)=>a+b,0)/ratings.length : 0
            
            // Mock Duration/Lectures if not in DB (Parse from curriculum if needed)
            // Ideally add 'duration' and 'total_lectures' columns to your DB
            
            return {
                id: c.id,
                title: c.title,
                instructor: c.profiles?.full_name || "Grove Instructor",
                instructor_avatar: c.profiles?.avatar_url,
                rating: Number(avgRating.toFixed(1)) || 5.0,
                review_count: ratings.length,
                students: c.enrollments?.[0]?.count || 0,
                price: c.price,
                original_price: c.price * 1.5, // Mock discount logic
                image: c.thumbnail_url || "/placeholder-course.jpg",
                category: c.category,
                level: c.level || "All Levels",
                duration: c.duration || "12h 30m",
                lectures: 24,
                bestseller: (c.enrollments?.[0]?.count || 0) > 50
            }
        }) || []

        setCourses(formatted)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    // Debounce search
    const timer = setTimeout(fetchCourses, 400)
    return () => clearTimeout(timer)
  }, [searchTerm, selectedCategory, selectedLevel])

  const handleEnroll = (id: string) => {
      if(!user) return router.push('/auth')
      router.push(`/courses/${id}`)
  }

  return (
    <main className="bg-[#050505] min-h-screen text-white font-sans selection:bg-emerald-500/30">
      <Navbar />

      {/* --- HERO HEADER --- */}
      <section className="relative pt-32 pb-20 px-6 border-b border-white/10 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-[#050505] to-[#050505]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto relative z-10 text-center flex flex-col items-center">
            <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-6"
            >
                <Zap size={12} fill="currentColor" /> Explore The Library
            </motion.div>
            
            <motion.h1 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="text-4xl md:text-6xl font-black mb-6 leading-tight"
            >
                Find the Right Course <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">For Your Future.</span>
            </motion.h1>

            {/* SEARCH BAR */}
            <motion.div 
                initial={{ opacity: 0, width: "80%" }} animate={{ opacity: 1, width: "100%" }} transition={{ delay: 0.2 }}
                className="relative max-w-2xl w-full group"
            >
                <div className="absolute inset-0 bg-emerald-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full" />
                <div className="relative flex items-center bg-[#0A0A0A] border border-white/10 rounded-full px-6 py-4 shadow-2xl focus-within:border-emerald-500/50 transition-all">
                    <Search className="text-zinc-500 w-5 h-5 mr-4" />
                    <input 
                        type="text" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="What do you want to learn today?" 
                        className="bg-transparent border-none outline-none text-white w-full placeholder-zinc-500 text-lg"
                    />
                    {searchTerm && <button onClick={() => setSearchTerm("")}><X className="text-zinc-500 hover:text-white transition-colors" size={18}/></button>}
                </div>
            </motion.div>
        </div>
      </section>

      {/* --- MAIN CONTENT --- */}
      <section className="px-6 py-12 max-w-[1600px] mx-auto">
        <div className="flex flex-col lg:flex-row gap-12">
            
            {/* SIDEBAR FILTERS (Desktop) */}
            <aside className="hidden lg:block w-64 shrink-0 space-y-8 sticky top-24 h-fit">
                <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2"><Filter size={14}/> Filters</h3>
                    
                    {/* Category Filter */}
                    <div className="mb-6">
                        <h4 className="text-xs font-bold text-zinc-500 mb-3 uppercase">Category</h4>
                        <div className="space-y-2">
                            {CATEGORIES.map(cat => (
                                <button 
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`block text-sm transition-colors text-left w-full ${selectedCategory === cat ? 'text-emerald-400 font-bold' : 'text-zinc-400 hover:text-white'}`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Level Filter */}
                    <div>
                        <h4 className="text-xs font-bold text-zinc-500 mb-3 uppercase">Level</h4>
                        <div className="space-y-2">
                            {LEVELS.map(lvl => (
                                <label key={lvl} className="flex items-center gap-3 cursor-pointer group">
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${selectedLevel === lvl ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-700 group-hover:border-zinc-500'}`}>
                                        {selectedLevel === lvl && <Check size={10} className="text-black" strokeWidth={4} />}
                                    </div>
                                    <input type="radio" className="hidden" checked={selectedLevel === lvl} onChange={() => setSelectedLevel(lvl)} />
                                    <span className={`text-sm ${selectedLevel === lvl ? 'text-white' : 'text-zinc-400 group-hover:text-white'}`}>{lvl}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            </aside>

            {/* MOBILE FILTER TOGGLE */}
            <div className="lg:hidden mb-6">
                <button onClick={() => setShowFilters(!showFilters)} className="w-full py-3 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center gap-2 font-bold text-sm">
                    <SlidersHorizontal size={16} /> {showFilters ? "Hide Filters" : "Show Filters"}
                </button>
                {showFilters && (
                    <div className="mt-4 p-4 bg-zinc-900 rounded-xl border border-white/10 space-y-4">
                        {/* Mobile Filters UI here (Simplified version of sidebar) */}
                        <div className="flex flex-wrap gap-2">
                            {CATEGORIES.map(cat => (
                                <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-3 py-1 rounded-full text-xs border ${selectedCategory === cat ? 'bg-emerald-500 text-black border-emerald-500' : 'border-white/10 text-zinc-400'}`}>
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* COURSE GRID */}
            <div className="flex-1">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white">
                        {loading ? "Loading..." : `${courses.length} Results`}
                    </h2>
                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                        <span>Sort by:</span>
                        <select className="bg-transparent text-white font-bold outline-none cursor-pointer">
                            <option>Most Popular</option>
                            <option>Newest</option>
                            <option>Highest Rated</option>
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {[1,2,3,4,5,6].map(i => (
                            <div key={i} className="bg-zinc-900/50 rounded-2xl h-[380px] animate-pulse border border-white/5" />
                        ))}
                    </div>
                ) : courses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-white/10 rounded-3xl bg-white/5">
                        <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mb-4 text-zinc-500"><Search size={32}/></div>
                        <h3 className="text-xl font-bold text-white mb-2">No courses found</h3>
                        <p className="text-zinc-400">Try adjusting your search or filters to find what you're looking for.</p>
                        <button onClick={() => {setSearchTerm(""); setSelectedCategory("All")}} className="mt-6 px-6 py-2 bg-white text-black font-bold rounded-full hover:bg-zinc-200 transition-colors">Clear Filters</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        {courses.map((course) => (
                            <CourseCard key={course.id} course={course} onEnroll={handleEnroll} />
                        ))}
                    </div>
                )}
            </div>

        </div>
      </section>

      <Footer />
    </main>
  )
}

// --- COURSE CARD COMPONENT ---
const CourseCard = ({ course, onEnroll }: { course: Course, onEnroll: (id: string) => void }) => {
    return (
        <div className="group flex flex-col bg-[#0A0A0A] border border-white/5 rounded-2xl overflow-hidden hover:border-emerald-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-900/10">
            {/* Thumbnail */}
            <div className="relative aspect-video w-full overflow-hidden bg-zinc-800 cursor-pointer" onClick={() => onEnroll(course.id)}>
                <Image 
                    src={course.image} 
                    alt={course.title} 
                    fill 
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                
                {/* Overlay Badges */}
                <div className="absolute top-3 left-3 flex gap-2">
                    {course.bestseller && (
                        <span className="bg-yellow-500 text-black text-[10px] font-bold px-2 py-1 rounded shadow-lg uppercase tracking-wide">Bestseller</span>
                    )}
                    <span className="bg-black/60 backdrop-blur-md text-white border border-white/10 text-[10px] font-bold px-2 py-1 rounded shadow-lg uppercase tracking-wide">{course.category}</span>
                </div>
            </div>

            {/* Content */}
            <div className="p-5 flex flex-col flex-grow">
                {/* Instructor */}
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-zinc-800 overflow-hidden border border-white/10 relative">
                        {course.instructor_avatar ? <Image src={course.instructor_avatar} alt="" fill className="object-cover"/> : <div className="w-full h-full bg-emerald-900 flex items-center justify-center text-[8px]">T</div>}
                    </div>
                    <span className="text-xs text-zinc-400 font-medium truncate">{course.instructor}</span>
                </div>

                <Link href={`/courses/${course.id}`}>
                    <h3 className="text-lg font-bold text-white mb-2 leading-snug line-clamp-2 group-hover:text-emerald-400 transition-colors">
                        {course.title}
                    </h3>
                </Link>

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs text-zinc-500 mb-4 mt-auto">
                    <div className="flex items-center gap-1"><span className="text-yellow-500 font-bold flex gap-0.5"><Star size={12} fill="currentColor"/> {course.rating}</span> <span className="text-zinc-600">({course.review_count})</span></div>
                    <div className="flex items-center gap-1"><Users size={12}/> {course.students.toLocaleString()} students</div>
                </div>

                <div className="h-px w-full bg-white/5 mb-4" />

                <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <span className="text-white font-bold text-lg">{course.price === 0 ? "Free" : `$${course.price}`}</span>
                            {course.original_price && course.original_price > course.price && (
                                <span className="text-zinc-600 text-xs line-through">${course.original_price}</span>
                            )}
                        </div>
                    </div>
                    <button 
                        onClick={() => onEnroll(course.id)}
                        className="p-2 rounded-full bg-white text-black hover:bg-emerald-400 transition-colors"
                    >
                        <ArrowRight size={18} />
                    </button>
                </div>
            </div>
        </div>
    )
}