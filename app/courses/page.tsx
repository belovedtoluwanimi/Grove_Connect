'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { Search, Star, PlayCircle, Clock, BarChart, Filter, ChevronDown, Check, Loader2, ArrowRight } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useAuth } from '@/app/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { createClient } from '@/app/utils/supabase/client'

// --- 1. FIXED TYPE DEFINITION ---
type Course = {
  id: string
  title: string
  instructor: string 
  rating: number
  students: number
  price: string
  original_price?: number 
  image: string // <--- ADDED THIS (Fixes the Build Error)
  category: string
  badge?: string
  duration: string 
  lectures: number
}

const categories = ["All", "Development", "Design", "Marketing", "Business", "Music"]

const CoursesPage = () => {
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClient()
  
  const [activeCategory, setActiveCategory] = useState("All")
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  
  // Cart Logic
  const [cartItems, setCartItems] = useState<string[]>([])
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // --- FETCH COURSES ---
  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true)
      try {
        let query = supabase
          .from('courses')
          .select(`
            *,
            instructor:profiles!instructor_id(full_name) 
          `)
          .eq('status', 'Active') // Only show published courses

        if (activeCategory !== "All") {
          query = query.eq('category', activeCategory)
        }

        if (searchTerm) {
          query = query.ilike('title', `%${searchTerm}%`)
        }

        const { data, error } = await query

        if (error) throw error
        
        // Transform data to match the 'Course' Type
        const formattedCourses: Course[] = data?.map((course: any) => ({
            id: course.id,
            title: course.title,
            instructor: course.instructor?.full_name || "Unknown Instructor",
            rating: 4.8, // Placeholder
            students: course.students_count || 0,
            original_price: course.original_price,
            category: course.category,
            // Map 'thumbnail_url' to 'image' to satisfy the UI and Type
            image: course.thumbnail_url || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=3291&auto=format&fit=crop", 
            duration: "10h 30m", // Placeholder
            lectures: 24, // Placeholder
            price: course.price === 0 ? "Free" : `$${course.price}`
        })) || []

        setCourses(formattedCourses)
      } catch (error) {
        console.error("Error fetching courses:", error)
      } finally {
        setLoading(false)
      }
    }

    // Debounce search slightly
    const timer = setTimeout(() => {
        fetchCourses()
    }, 300)

    return () => clearTimeout(timer)
  }, [activeCategory, searchTerm])


  // --- HANDLERS ---
  const handleEnroll = (courseId: string) => {
    if (!user) {
      router.push('/auth')
      return
    }
    router.push(`/courses/${courseId}/checkout`)
  }

  const handleCartAction = (courseId: string) => {
    if (!user) return router.push('/auth')

    if (cartItems.includes(courseId)) {
      router.push(`/courses/${courseId}/checkout`)
      return
    }

    setActionLoading(courseId)
    setTimeout(() => {
      setCartItems(prev => [...prev, courseId])
      setActionLoading(null)
    }, 600)
  }

  return (
    <main className="bg-black min-h-screen w-full relative overflow-x-hidden">
      <Navbar />

      {/* --- HERO SECTION --- */}
      <section className="relative pt-32 pb-24 px-6 md:px-12 border-b border-white/10 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image 
            src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=3291&auto=format&fit=crop"
            alt="Learning Background" 
            fill 
            className="object-cover opacity-60"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/90 to-black/40" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="w-full md:w-2/3">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              What do you want to <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">
                Master Today?
              </span>
            </h1>
            <p className="text-gray-300 text-lg mb-8 max-w-2xl font-light">
              Join thousands of learners acquiring the skills that matter. From coding the future to directing your own cinematic universe.
            </p>

            {/* SEARCH BAR */}
            <div className="relative max-w-2xl group">
              <div className="absolute inset-0 bg-green-500/30 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative flex items-center bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-6 py-4 focus-within:border-green-500/50 focus-within:bg-black/80 transition-all shadow-xl">
                <Search className="text-gray-300 w-6 h-6 mr-4" />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search for Python, Video Editing, Marketing..." 
                  className="bg-transparent border-none outline-none text-white w-full placeholder-gray-400 text-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- CATEGORY PILLS --- */}
      <section className="sticky top-20 z-40 bg-black/80 backdrop-blur-md border-b border-white/10 py-4 px-6 md:px-12">
        <div className="max-w-7xl mx-auto flex items-center gap-4 overflow-x-auto no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`
                whitespace-nowrap px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 border
                ${activeCategory === cat 
                  ? 'bg-green-600 border-green-600 text-white shadow-[0_0_20px_rgba(22,163,74,0.4)]' 
                  : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/30'}
              `}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* --- MAIN COURSE GRID --- */}
      <section className="py-16 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-white">
              {searchTerm ? `Results for "${searchTerm}"` : 
               activeCategory === "All" ? "Top Picks for You" : `${activeCategory} Courses`}
            </h2>
          </div>

          {loading ? (
             <div className="flex justify-center py-20">
                <Loader2 size={40} className="animate-spin text-green-500" />
             </div>
          ) : courses.length === 0 ? (
             <div className="text-center py-20 text-gray-500">
                <p>No courses found. Try a different category or search term.</p>
             </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {courses.map((course) => {
                const isInCart = cartItems.includes(course.id)
                const isLoading = actionLoading === course.id

                return (
                  <div 
                    key={course.id} 
                    className="group relative bg-neutral-900 border border-white/10 rounded-xl overflow-hidden hover:border-green-500/50 hover:-translate-y-1 transition-all duration-300 flex flex-col h-full"
                  >
                    {/* Image Section */}
                    <div className="relative aspect-video w-full overflow-hidden bg-neutral-800">
                      <Image 
                        src={course.image} 
                        alt={course.title} 
                        fill 
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      
                      <div 
                        onClick={() => handleEnroll(course.id)}
                        className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
                      >
                        <PlayCircle className="w-12 h-12 text-white fill-green-500/50" />
                      </div>

                      {course.badge && (
                        <div className="absolute top-2 left-2 bg-yellow-500/90 text-black text-[10px] font-bold px-2 py-1 uppercase tracking-wide rounded shadow-md">
                          {course.badge}
                        </div>
                      )}
                    </div>

                    {/* Content Section */}
                    <div className="p-5 flex flex-col flex-grow">
                      <h3 className="text-white font-bold text-lg leading-snug line-clamp-2 mb-2 group-hover:text-green-400 transition-colors">
                        {course.title}
                      </h3>
                      <p className="text-gray-400 text-sm mb-3">{course.instructor}</p>
                      
                      {/* Rating */}
                      <div className="flex items-center gap-1 mb-3">
                        <span className="text-yellow-500 font-bold text-sm">{course.rating}</span>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-3 h-3 ${i < Math.floor(course.rating) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-600'}`} 
                            />
                          ))}
                        </div>
                        <span className="text-gray-500 text-xs">({course.students})</span>
                      </div>

                      {/* Metadata */}
                      <div className="flex items-center gap-4 text-xs text-gray-500 mb-4 mt-auto">
                        <div className="flex items-center gap-1"><Clock className="w-3 h-3" /> {course.duration}</div>
                        <div className="flex items-center gap-1"><BarChart className="w-3 h-3" /> {course.lectures} lectures</div>
                      </div>

                      {/* Price Row & SMART Button */}
                      <div className="flex items-center justify-between border-t border-white/10 pt-4 mt-auto">
                        <div className="flex flex-col">
                            <span className="text-white font-bold text-lg">{course.price}</span>
                        </div>
                        
                        <button 
                          onClick={() => handleCartAction(course.id)}
                          disabled={isLoading}
                          className={`
                            px-4 py-2 rounded text-xs font-medium transition-all flex items-center gap-2
                            ${isInCart 
                              ? 'bg-green-600 text-white hover:bg-green-500 shadow-[0_0_15px_rgba(22,163,74,0.4)]' 
                              : 'bg-white text-black hover:bg-gray-200'}
                          `}
                        >
                          {isLoading ? (
                             <Loader2 size={14} className="animate-spin" />
                          ) : isInCart ? (
                             <>Checkout <ArrowRight size={14} /></>
                          ) : (
                             "Add to Cart"
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

        </div>
      </section>

      <Footer />
    </main>
  )
}

export default CoursesPage