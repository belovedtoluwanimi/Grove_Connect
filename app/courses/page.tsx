'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { Search, Star, PlayCircle, Clock, BarChart, Loader2, ArrowRight, Sparkles } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Link from 'next/link' // Import Link
import { createClient } from '@/app/utils/supabase/client'
import { motion } from 'framer-motion'

// --- TYPES ---
type Course = {
  id: string
  title: string
  instructor: string
  rating: number
  students: number
  price: string
  image: string
  category: string
  badge?: string
  duration: string
  lectures: number
}

const categories = ["All", "Development", "Design", "Marketing", "Business", "Music"]

const CoursesPage = () => {
  const supabase = createClient()
  
  const [activeCategory, setActiveCategory] = useState("All")
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  // --- FETCH COURSES ---
  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true)
      try {
        let query = supabase
          .from('courses')
          .select(`*, profiles ( full_name )`)
          .eq('status', 'Active')

        if (activeCategory !== "All") query = query.eq('category', activeCategory)
        if (searchTerm) query = query.ilike('title', `%${searchTerm}%`)

        const { data, error } = await query
        if (error) throw error
        
        const formattedCourses: Course[] = data?.map((course: any) => ({
            id: course.id,
            title: course.title,
            instructor: Array.isArray(course.profiles) 
                ? course.profiles[0]?.full_name 
                : course.profiles?.full_name || "Grove Instructor",
            rating: 4.8, 
            students: course.students_count || 0,
            category: course.category,
            image: course.thumbnail_url || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3", 
            duration: "Self-Paced",
            lectures: course.curriculum_data ? course.curriculum_data.reduce((acc:any, sec:any) => acc + (sec.lectures?.length || 0), 0) : 0,
            price: course.price === 0 ? "Free" : `$${course.price}`
        })) || []

        setCourses(formattedCourses)
      } catch (error) {
        console.error("Error fetching courses:", error)
      } finally {
        setLoading(false)
      }
    }

    const timer = setTimeout(() => { fetchCourses() }, 300)
    return () => clearTimeout(timer)
  }, [activeCategory, searchTerm])

  return (
    <main className="bg-[#020202] min-h-screen w-full relative overflow-x-hidden text-white font-sans selection:bg-emerald-500/30">
      <Navbar />

      {/* --- BACKGROUND ACCENTS --- */}
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none z-0" />
      <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-emerald-900/10 rounded-full blur-[128px] pointer-events-none z-0" />

      {/* --- HERO SECTION --- */}
      <section className="relative pt-32 pb-24 px-6 md:px-12 border-b border-white/5 overflow-hidden z-10">
        <div className="relative z-10 max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="w-full md:w-2/3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-emerald-400 text-xs font-bold mb-6 backdrop-blur-md">
                <Sparkles size={12} /> Explore the Catalog
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              What do you want to <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">Master Today?</span>
            </h1>
            
            {/* SEARCH BAR */}
            <div className="relative max-w-2xl group">
              <div className="absolute inset-0 bg-emerald-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative flex items-center bg-white/5 backdrop-blur-md border border-white/10 rounded-full px-6 py-4 focus-within:border-emerald-500/50 transition-all shadow-xl">
                <Search className="text-zinc-400 w-5 h-5 mr-4 group-focus-within:text-white" />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search courses..." 
                  className="bg-transparent border-none outline-none text-white w-full placeholder-zinc-500 text-base"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- CATEGORY PILLS --- */}
      <section className="sticky top-20 z-40 bg-[#020202]/80 backdrop-blur-xl border-b border-white/5 py-4 px-6 md:px-12">
        <div className="max-w-7xl mx-auto flex items-center gap-3 overflow-x-auto no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`
                whitespace-nowrap px-5 py-2 rounded-full text-xs font-bold transition-all duration-300 border
                ${activeCategory === cat 
                  ? 'bg-emerald-600 border-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                  : 'bg-white/5 border-white/5 text-zinc-400 hover:text-white hover:bg-white/10'}
              `}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* --- MAIN COURSE GRID --- */}
      <section className="relative z-10 py-16 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          {loading ? (
             <div className="flex justify-center py-40"><Loader2 size={40} className="animate-spin text-emerald-500" /></div>
          ) : courses.length === 0 ? (
             <div className="text-center py-40 text-zinc-500">No courses found matching your criteria.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {courses.map((course, i) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={course.id} 
                    className="group relative bg-neutral-900/50 backdrop-blur-sm border border-white/5 rounded-2xl overflow-hidden hover:border-emerald-500/30 hover:shadow-2xl transition-all duration-300 flex flex-col h-full"
                  >
                    {/* LINK WRAPS THE WHOLE CARD - Ensures click always works */}
                    <Link href={`/courses/${course.id}`} className="flex flex-col h-full">
                        
                        {/* Image */}
                        <div className="relative aspect-video w-full overflow-hidden bg-neutral-800">
                            <Image src={course.image} alt={course.title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg transform scale-50 group-hover:scale-100 transition-transform">
                                    <PlayCircle className="w-6 h-6 text-black fill-black" />
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-5 flex flex-col flex-grow">
                            <h3 className="text-white font-bold text-lg leading-snug line-clamp-2 mb-2 group-hover:text-emerald-400 transition-colors">
                                {course.title}
                            </h3>
                            <p className="text-zinc-500 text-xs mb-4 flex items-center gap-2">
                                {course.instructor}
                            </p>
                            
                            {/* Metadata */}
                            <div className="flex items-center gap-4 text-xs text-zinc-500 mb-6 mt-auto">
                                <div className="flex items-center gap-1.5"><Clock size={12} /> {course.duration}</div>
                                <div className="flex items-center gap-1.5"><BarChart size={12} /> {course.lectures} lectures</div>
                            </div>

                            {/* Price & Fake Button */}
                            <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-auto">
                                <span className="text-white font-bold text-lg">{course.price}</span>
                                <span className="px-4 py-2 rounded-lg text-xs font-bold bg-white text-black hover:bg-zinc-200 transition-colors flex items-center gap-2">
                                    Enroll Now <ArrowRight size={14} />
                                </span>
                            </div>
                        </div>
                    </Link>
                  </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
      <Footer />
    </main>
  )
}

export default CoursesPage