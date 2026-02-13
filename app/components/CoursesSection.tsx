'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Clock, BookOpen, Star, Users, ArrowRight, 
  PlayCircle, CheckCircle2 
} from 'lucide-react'
import { createClient } from '@/app/utils/supabase/client'
import { motion } from 'framer-motion'
import { useAuth } from '@/app/hooks/useAuth'
import { useRouter } from 'next/navigation'

// --- TYPES ---
type Course = {
  id: string
  title: string
  category: string
  thumbnail_url: string
  level: string
  price: number
  description: string
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
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  
  const supabase = createClient()
  const { user } = useAuth()
  const router = useRouter()

  // --- 1. FETCH DATA ---
  useEffect(() => {
    const init = async () => {
      try {
        // A. Fetch Courses
        const { data: coursesData } = await supabase
          .from('courses')
          .select(`*, profiles:instructor_id (full_name, avatar_url), reviews (rating), enrollments (count)`)
          .limit(10)

        if (coursesData) {
          const processed = coursesData.map((c: any) => {
            const ratings = c.reviews?.map((r: any) => r.rating) || []
            const avgRating = ratings.length ? (ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length).toFixed(1) : "New"
            
            // Mock Parsing for Lesson/Hours if columns don't exist
            const curriculum = typeof c.curriculum_data === 'string' ? JSON.parse(c.curriculum_data || '[]') : c.curriculum_data || []
            const lessonCount = curriculum.reduce((acc: number, sec: any) => acc + (sec.lectures?.length || 0), 0) || 12
            const hours = c.duration || "10h 30m"

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
              total_lessons: lessonCount,
              total_hours: hours,
              enrollments: c.enrollments?.[0]?.count || 0
            }
          })
          processed.sort((a: any, b: any) => b.enrollments - a.enrollments)
          setCourses(processed)
        }

        // B. Fetch User Enrollments (If Logged In)
        if (user) {
            const { data: userEnrollments } = await supabase
                .from('enrollments')
                .select('course_id')
                .eq('user_id', user.id)
            
            if (userEnrollments) {
                setEnrolledIds(new Set(userEnrollments.map((e: any) => e.course_id)))
            }
        }

      } catch (err) {
        console.error("Error:", err)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [user])

  // --- 2. SMART ACTION HANDLER ---
  const handleCourseAction = (e: React.MouseEvent, courseId: string) => {
    e.preventDefault() 
    e.stopPropagation()

    if (!user) {
        // Case 1: Not Logged In -> Login Page
        router.push('/auth')
    } else if (enrolledIds.has(courseId)) {
        // Case 2: Already Owns Course -> Learning Page
        router.push(`/courses/${courseId}/learn`)
    } else {
        // Case 3: New Course -> Checkout Page
        router.push(`/courses/${courseId}/checkout`)
    }
  }

  return (
    <section className="relative w-full py-24 bg-[#050505] overflow-hidden z-10 border-t border-white/5">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/10 via-black to-black pointer-events-none" />

      <div className="max-w-[1600px] mx-auto px-6 relative z-10">
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
            <div className="p-2 rounded-full border border-white/10 bg-white/5 group-hover:bg-white group-hover:text-black transition-all"><ArrowRight size={16} /></div>
          </Link>
        </div>

        {/* Slider */}
        <div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]">
            <motion.div 
                className="flex gap-6 w-max cursor-grab active:cursor-grabbing"
                animate={{ x: ["0%", "-50%"] }} 
                transition={{ duration: 40, ease: "linear", repeat: Infinity }}
                whileHover={{ animationPlayState: "paused" }} 
                style={{ width: "max-content" }}
            >
                {[...courses, ...courses].map((course, idx) => (
                    <CourseCard 
                        key={`${course.id}-${idx}`} 
                        course={course} 
                        isEnrolled={enrolledIds.has(course.id)} 
                        onAction={handleCourseAction} 
                    />
                ))}
            </motion.div>
        </div>
      </div>
    </section>
  )
}

// --- SUB-COMPONENT ---
const CourseCard = ({ course, isEnrolled, onAction }: { course: Course, isEnrolled: boolean, onAction: (e: any, id: string) => void }) => {
    return (
        <div className="block group h-full">
            <div className="w-[340px] md:w-[380px] bg-zinc-900/60 border border-white/10 rounded-3xl overflow-hidden hover:border-emerald-500/50 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] flex flex-col h-full relative">
                
                {/* 1. IMAGE - Linked to Details */}
                <Link href={`/courses/${course.id}`} className="relative h-52 overflow-hidden block">
                    <Image src={course.thumbnail_url} alt={course.title} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent opacity-90" />
                    
                    <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-wider text-white shadow-lg">
                            {course.category}
                        </span>
                    </div>

                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20">
                            <PlayCircle size={24} className="text-white fill-white/20" />
                        </div>
                    </div>
                </Link>

                {/* 2. CONTENT */}
                <div className="p-5 flex flex-col flex-grow">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-zinc-800 overflow-hidden border border-white/10">
                                {course.instructor_avatar ? <Image src={course.instructor_avatar} alt="" width={24} height={24} /> : <div className="w-full h-full bg-emerald-900 flex items-center justify-center text-[8px] text-emerald-400">T</div>}
                            </div>
                            <span className="text-xs text-zinc-400 font-medium truncate max-w-[120px]">{course.instructor_name}</span>
                        </div>
                        <div className="flex items-center gap-1 text-yellow-500 text-xs font-bold">
                            <Star size={12} fill="currentColor"/> {course.rating} <span className="text-zinc-600 font-normal">({course.review_count})</span>
                        </div>
                    </div>

                    {/* Title - Linked to Details */}
                    <Link href={`/courses/${course.id}`}>
                        <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 leading-tight group-hover:text-emerald-400 transition-colors">
                            {course.title}
                        </h3>
                    </Link>

                    <div className="grid grid-cols-2 gap-2 mt-auto mb-4">
                        <div className="bg-white/5 rounded-lg p-2 flex items-center gap-2 border border-white/5"><BookOpen size={14} className="text-zinc-500" /><span className="text-xs text-zinc-300 font-medium">{course.total_lessons} Lessons</span></div>
                        <div className="bg-white/5 rounded-lg p-2 flex items-center gap-2 border border-white/5"><Clock size={14} className="text-zinc-500" /><span className="text-xs text-zinc-300 font-medium">{course.total_hours}</span></div>
                    </div>

                    <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Price</span>
                            <span className="text-xl font-bold text-white">{isEnrolled ? "Owned" : `$${course.price}`}</span>
                        </div>
                        
                        {/* 3. BUTTON - Independent, triggers checkout */}
                        <button 
                            onClick={(e) => onAction(e, course.id)}
                            className={`px-4 py-2 text-xs font-bold rounded-full transition-all shadow-lg flex items-center gap-2 z-20 cursor-pointer ${isEnrolled ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-500 hover:text-black' : 'bg-white text-black hover:bg-emerald-400 hover:scale-105'}`}
                        >
                            {isEnrolled ? <><CheckCircle2 size={14} /> Resume</> : "Enroll Now"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CoursesSection