'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Clock, BarChart, ArrowRight, Users, Star } from 'lucide-react'
import { createClient } from '@/app/utils/supabase/client'
import { motion } from 'framer-motion'

// --- TYPES ---
type Course = {
  id: string
  title: string
  description: string
  thumbnail_url: string
  level: string
  duration: string // e.g. "12 Hours"
  price: number
  enrollments_count: number // We will calculate this
  average_rating: number
}

const CoursesSection = () => {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchTopCourses = async () => {
      try {
        // Fetch courses with enrollment count (using a subquery count if possible, or joining)
        // For simplicity/performance in this example, we fetch and sort locally or use a view.
        // Ideally: Create a Supabase View 'courses_with_stats' that pre-calculates this.
        
        // Here we simulate fetching 'popular' courses by just grabbing the first 10
        // In production: .order('enrollments_count', { ascending: false })
        const { data, error } = await supabase
          .from('courses')
          .select(`
            *,
            enrollments(count), 
            reviews(rating)
          `)
          .limit(10)

        if (error) throw error

        if (data) {
          const processed = data.map((c: any) => ({
            ...c,
            enrollments_count: c.enrollments?.[0]?.count || 0, // Ensure your query returns count properly
            average_rating: c.reviews?.length 
                ? (c.reviews.reduce((a:number,b:any)=>a+b.rating,0) / c.reviews.length).toFixed(1) 
                : "New"
          }))
          // Sort by enrollment manually if DB sort isn't set up
          processed.sort((a:any, b:any) => b.enrollments_count - a.enrollments_count)
          
          setCourses(processed)
        }
      } catch (err) {
        console.error("Failed to fetch courses:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchTopCourses()
  }, [])

  return (
    <section id="courses" className="relative w-full py-24 bg-[#050505] overflow-hidden z-10 border-t border-white/5">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/10 via-black to-black pointer-events-none" />

      <div className="max-w-[1400px] mx-auto px-6 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div>
             <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-4">
               <Star size={12} fill="currentColor"/> Most Popular
             </span>
            <h2 className="text-4xl md:text-5xl font-black text-white leading-tight">
              Start Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">Mastery.</span>
            </h2>
          </div>
          <Link href="/courses" className="group flex items-center gap-3 text-zinc-400 hover:text-white transition-colors">
            <span className="text-sm font-bold uppercase tracking-widest">View All Courses</span>
            <div className="p-2 rounded-full border border-white/10 bg-white/5 group-hover:bg-white group-hover:text-black transition-all">
                <ArrowRight size={16} />
            </div>
          </Link>
        </div>

        {/* --- INFINITE SLIDER CONTAINER --- */}
        {/* We duplicate the list to ensure seamless looping */}
        <div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
            <div className="flex gap-8 w-max animate-marquee hover:[animation-play-state:paused]">
                {[...courses, ...courses].map((course, idx) => ( // Duplicate list for loop
                    <Link href={`/courses/${course.id}`} key={`${course.id}-${idx}`} className="w-[350px] md:w-[400px] flex-shrink-0 group relative">
                        
                        {/* CARD */}
                        <div className="h-full bg-zinc-900/40 border border-white/10 backdrop-blur-md rounded-3xl overflow-hidden hover:border-emerald-500/50 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_10px_40px_-10px_rgba(16,185,129,0.2)]">
                            
                            {/* Image Area */}
                            <div className="relative h-56 overflow-hidden">
                                <Image 
                                    src={course.thumbnail_url || "/placeholder-course.jpg"} // Fallback image
                                    alt={course.title} 
                                    fill 
                                    className="object-cover transition-transform duration-700 group-hover:scale-110" 
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80" />
                                
                                {/* Badge */}
                                <div className="absolute top-4 left-4">
                                    <span className="px-3 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-wider text-white">
                                        {course.level || 'All Levels'}
                                    </span>
                                </div>
                            </div>

                            {/* Content Area */}
                            <div className="p-6 flex flex-col h-[220px]">
                                <h3 className="text-xl font-bold text-white mb-2 line-clamp-2 group-hover:text-emerald-400 transition-colors">
                                    {course.title}
                                </h3>
                                <p className="text-zinc-400 text-sm line-clamp-2 mb-auto leading-relaxed">
                                    {course.description}
                                </p>

                                {/* Meta Footer */}
                                <div className="pt-6 mt-4 border-t border-white/5 flex items-center justify-between">
                                    <div className="flex gap-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                                        <div className="flex items-center gap-1.5"><Clock size={14}/> {course.duration || 'N/A'}</div>
                                        <div className="flex items-center gap-1.5"><Users size={14}/> {course.enrollments_count}</div>
                                    </div>
                                    <div className="flex items-center gap-1 text-yellow-500 text-xs font-bold">
                                        <Star size={12} fill="currentColor"/> {course.average_rating}
                                    </div>
                                </div>
                            </div>

                        </div>
                    </Link>
                ))}
            </div>
        </div>

      </div>
    </section>
  )
}

export default CoursesSection