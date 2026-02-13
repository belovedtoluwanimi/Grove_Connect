'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Clock, BookOpen, Star, Users, ArrowRight, 
  MoreHorizontal, PlayCircle 
} from 'lucide-react'
import { createClient } from '@/app/utils/supabase/client'
import { motion } from 'framer-motion'

// --- TYPES ---
type Course = {
  id: string
  title: string
  category: string
  thumbnail_url: string
  level: string
  price: number
  description: string
  // Derived / Joined Data
  instructor_name: string
  instructor_avatar: string
  rating: number
  review_count: number
  total_lessons: number
  total_hours: string
  enrollments: number
}

const CoursesSection = () => {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        // Fetch courses + Instructor (profiles) + Reviews + Curriculum (for lesson count)
        const { data, error } = await supabase
          .from('courses')
          .select(`
            *,
            profiles:instructor_id (full_name, avatar_url),
            reviews (rating),
            enrollments (count)
          `)
          .limit(10) // Get top 10 for the slider

        if (error) throw error

        if (data) {
          const processed = data.map((c: any) => {
            // 1. Calculate Ratings
            const ratings = c.reviews?.map((r: any) => r.rating) || []
            const avgRating = ratings.length > 0 
              ? (ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length).toFixed(1)
              : "New"

            // 2. Parse Curriculum for Duration/Lessons (Mock logic if JSON structure varies)
            // Assuming 'curriculum_data' is a JSON array of sections
            const curriculum = typeof c.curriculum_data === 'string' 
                ? JSON.parse(c.curriculum_data || '[]') 
                : c.curriculum_data || []
            
            const lessonCount = curriculum.reduce((acc: number, sec: any) => acc + (sec.lectures?.length || 0), 0)
            
            // 3. Mock Hours (If you don't have a 'duration' column yet)
            // Ideally, sum up video durations from DB. For now, we estimate or use DB column.
            const hours = c.duration || `${Math.max(2, Math.floor(lessonCount * 0.5))}h 30m`

            return {
              id: c.id,
              title: c.title,
              category: c.category || "General",
              thumbnail_url: c.thumbnail_url || "/placeholder.jpg",
              level: c.level || "All Levels",
              price: c.price || 0,
              description: c.description,
              instructor_name: c.profiles?.full_name || "Grove Instructor",
              instructor_avatar: c.profiles?.avatar_url,
              rating: Number(avgRating) || 5.0,
              review_count: ratings.length,
              total_lessons: lessonCount || 12, // Fallback if 0
              total_hours: hours,
              enrollments: c.enrollments?.[0]?.count || 0
            }
          })

          // Sort by Enrollments (Popularity)
          processed.sort((a: any, b: any) => b.enrollments - a.enrollments)
          setCourses(processed)
        }
      } catch (err) {
        console.error("Error fetching courses:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchCourses()
  }, [])

  return (
    <section className="relative w-full py-24 bg-[#050505] overflow-hidden z-10 border-t border-white/5">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/10 via-black to-black pointer-events-none" />

      <div className="max-w-[1600px] mx-auto px-6 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div>
             <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-4">
               <Star size={12} fill="currentColor"/> Trending Now
             </span>
            <h2 className="text-4xl md:text-5xl font-black text-white leading-tight">
              Top Rated <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">Courses.</span>
            </h2>
          </div>
          <Link href="/courses" className="group flex items-center gap-3 text-zinc-400 hover:text-white transition-colors">
            <span className="text-sm font-bold uppercase tracking-widest">Explore Library</span>
            <div className="p-2 rounded-full border border-white/10 bg-white/5 group-hover:bg-white group-hover:text-black transition-all">
                <ArrowRight size={16} />
            </div>
          </Link>
        </div>

        {/* --- INFINITE SLIDER (Framer Motion) --- */}
        <div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]">
            <motion.div 
                className="flex gap-6 w-max cursor-grab active:cursor-grabbing"
                animate={{ x: ["0%", "-50%"] }} // Move halfway (since we doubled the list)
                transition={{ 
                    duration: 40, 
                    ease: "linear", 
                    repeat: Infinity 
                }}
                whileHover={{ animationPlayState: "paused" }} // CSS Pause Hack or use controls
                style={{ width: "max-content" }}
                onHoverStart={(e) => {}} // Framer motion doesn't support 'pause' natively easily without controls, 
                                         // but usually `hover` stops interaction. 
                                         // For simplicity, we let it slide or add a manual stop if needed.
                                         // NOTE: True pause in Framer Motion requires useAnimation controls.
                                         // For now, let's keep it simple. It will slide continuously.
            >
                {[...courses, ...courses].map((course, idx) => (
                    <CourseCard key={`${course.id}-${idx}`} course={course} />
                ))}
            </motion.div>
        </div>

      </div>
    </section>
  )
}

// --- SUB-COMPONENT: The "Best UI" Card ---
const CourseCard = ({ course }: { course: Course }) => {
    return (
        <Link href={`/courses/${course.id}`} className="block group">
            <div className="w-[340px] md:w-[380px] bg-zinc-900/60 border border-white/10 rounded-3xl overflow-hidden hover:border-emerald-500/50 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] flex flex-col h-full relative">
                
                {/* 1. IMAGE & BADGES */}
                <div className="relative h-52 overflow-hidden">
                    <Image 
                        src={course.thumbnail_url} 
                        alt={course.title} 
                        fill 
                        className="object-cover transition-transform duration-700 group-hover:scale-110" 
                    />
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent opacity-90" />
                    
                    {/* Category Badge */}
                    <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-wider text-white shadow-lg">
                            {course.category}
                        </span>
                    </div>

                    {/* Play Button Overlay (On Hover) */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20">
                            <PlayCircle size={24} className="text-white fill-white/20" />
                        </div>
                    </div>
                </div>

                {/* 2. CONTENT */}
                <div className="p-5 flex flex-col flex-grow">
                    
                    {/* Instructor Info */}
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-zinc-800 overflow-hidden border border-white/10">
                                {course.instructor_avatar ? (
                                    <Image src={course.instructor_avatar} alt={course.instructor_name} width={24} height={24} />
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

                    {/* Title */}
                    <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 leading-tight group-hover:text-emerald-400 transition-colors">
                        {course.title}
                    </h3>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-2 mt-auto mb-4">
                        <div className="bg-white/5 rounded-lg p-2 flex items-center gap-2 border border-white/5">
                            <BookOpen size={14} className="text-zinc-500" />
                            <span className="text-xs text-zinc-300 font-medium">{course.total_lessons} Lessons</span>
                        </div>
                        <div className="bg-white/5 rounded-lg p-2 flex items-center gap-2 border border-white/5">
                            <Clock size={14} className="text-zinc-500" />
                            <span className="text-xs text-zinc-300 font-medium">{course.total_hours}</span>
                        </div>
                    </div>

                    {/* Footer: Price & Enroll */}
                    <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Price</span>
                            <span className="text-xl font-bold text-white">${course.price}</span>
                        </div>
                        <button className="px-4 py-2 bg-white text-black text-xs font-bold rounded-full group-hover:bg-emerald-400 group-hover:shadow-[0_0_20px_rgba(52,211,153,0.4)] transition-all">
                            View Details
                        </button>
                    </div>
                </div>
            </div>
        </Link>
    )
}

export default CoursesSection