'use client'

import React, { useState, useEffect, useRef } from 'react'
import { 
  PlayCircle, CheckCircle2, ChevronLeft, ChevronRight, 
  Menu, FileText, ChevronDown, Check, Loader2, ArrowLeft 
} from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/app/utils/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'

// --- TYPES ---
type Lecture = {
  id: string
  title: string
  type: 'video' | 'article'
  videoUrl?: string
  articleContent?: string
  duration?: number // optional
}

type Section = {
  id: string
  title: string
  lectures: Lecture[]
}

type Course = {
  id: string
  title: string
  instructor_id: string
  curriculum_data: Section[]
}

export default function LearningPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const courseId = params.courseId as string

  // --- STATE ---
  const [loading, setLoading] = useState(true)
  const [course, setCourse] = useState<Course | null>(null)
  const [completedLectures, setCompletedLectures] = useState<Set<string>>(new Set())
  
  // Navigation State
  const [activeLecture, setActiveLecture] = useState<Lecture | null>(null)
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [markingComplete, setMarkingComplete] = useState(false)

  // --- 1. INITIAL DATA FETCH ---
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/auth')

      // Fetch Course Content & User Progress in parallel
      const [courseRes, progressRes] = await Promise.all([
        supabase.from('courses').select('*').eq('id', courseId).single(),
        supabase.from('course_progress').select('lecture_id').eq('user_id', user.id).eq('course_id', courseId)
      ])

      if (courseRes.error || !courseRes.data) {
        console.error("Course load failed", courseRes.error)
        return router.push('/dashboard')
      }

      const courseData = courseRes.data
      const progressSet = new Set(progressRes.data?.map(p => p.lecture_id) || [])

      setCourse(courseData)
      setCompletedLectures(progressSet)

      // Auto-select first lecture if none active
      if (courseData.curriculum_data?.length > 0) {
        const firstSection = courseData.curriculum_data[0]
        setActiveSectionId(firstSection.id)
        setActiveLecture(firstSection.lectures[0])
      }
      
      setLoading(false)
    }
    init()
  }, [courseId, router, supabase])

  // --- 2. HELPERS ---
  const isCompleted = (id: string) => completedLectures.has(id)

  const findNextLecture = () => {
    if (!course || !activeLecture) return null
    let foundCurrent = false
    
    for (const section of course.curriculum_data) {
        for (const lecture of section.lectures) {
            if (foundCurrent) return lecture
            if (lecture.id === activeLecture.id) foundCurrent = true
        }
    }
    return null
  }

  const findPrevLecture = () => {
    if (!course || !activeLecture) return null
    let prev = null
    
    for (const section of course.curriculum_data) {
        for (const lecture of section.lectures) {
            if (lecture.id === activeLecture.id) return prev
            prev = lecture
        }
    }
    return null
  }

  // --- 3. ACTIONS ---
  const handleMarkComplete = async () => {
    if (!activeLecture || isCompleted(activeLecture.id)) return
    setMarkingComplete(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Optimistic Update
    const newSet = new Set(completedLectures)
    newSet.add(activeLecture.id)
    setCompletedLectures(newSet)

    // DB Update
    await supabase.from('course_progress').insert({
        user_id: user.id,
        course_id: courseId,
        lecture_id: activeLecture.id
    })

    setMarkingComplete(false)
    
    // Auto-Advance
    const next = findNextLecture()
    if (next) {
        setActiveLecture(next)
        // Ensure parent section is open
        const nextSection = course?.curriculum_data.find(s => s.lectures.some(l => l.id === next.id))
        if (nextSection) setActiveSectionId(nextSection.id)
    }
  }

  if (loading) return <div className="h-screen bg-black flex items-center justify-center text-green-500"><Loader2 className="animate-spin w-10 h-10" /></div>

  return (
    <div className="h-screen flex flex-col bg-[#0A0A0A] text-white overflow-hidden font-sans">
      
      {/* --- TOP HEADER --- */}
      <header className="h-16 flex items-center justify-between px-4 border-b border-white/10 bg-[#0A0A0A] z-20 shrink-0">
        <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2 hover:bg-white/10 rounded-full transition-colors text-zinc-400 hover:text-white">
                <ArrowLeft size={20} />
            </Link>
            <div className="h-6 w-[1px] bg-white/10" />
            <h1 className="font-bold text-sm md:text-base truncate max-w-md">{course?.title}</h1>
        </div>
        <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-xs font-bold text-zinc-500">
                <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-green-500 transition-all duration-500" 
                        style={{ width: `${Math.round((completedLectures.size / (course?.curriculum_data.reduce((a,s)=>a+s.lectures.length,0)||1)) * 100)}%` }} 
                    />
                </div>
                <span>{Math.round((completedLectures.size / (course?.curriculum_data.reduce((a,s)=>a+s.lectures.length,0)||1)) * 100)}% Complete</span>
            </div>
            <button 
                onClick={() => setSidebarOpen(!sidebarOpen)} 
                className={`p-2 rounded-lg border border-white/10 transition-colors ${sidebarOpen ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`}
            >
                <Menu size={18} />
            </button>
        </div>
      </header>

      {/* --- MAIN WORKSPACE --- */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT: CONTENT PLAYER */}
        <div className="flex-1 flex flex-col relative overflow-y-auto">
            {activeLecture ? (
                <>
                    {/* VIDEO PLAYER AREA */}
                    <div className="bg-black w-full aspect-video max-h-[70vh] flex items-center justify-center relative shadow-2xl">
                        {activeLecture.type === 'video' && activeLecture.videoUrl ? (
                            <video 
                                key={activeLecture.id} // Force re-render on change
                                src={activeLecture.videoUrl} 
                                controls 
                                className="w-full h-full object-contain"
                                onEnded={handleMarkComplete} // Auto-complete on finish
                            />
                        ) : activeLecture.type === 'article' ? (
                            <div className="w-full h-full bg-neutral-900 flex items-center justify-center text-zinc-500">
                                <div className="text-center p-10">
                                    <FileText size={48} className="mx-auto mb-4 opacity-50" />
                                    <p>Read the article below</p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-zinc-500">Content unavailable</p>
                        )}
                    </div>

                    {/* LECTURE DETAILS & ACTIONS */}
                    <div className="p-8 max-w-4xl mx-auto w-full">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-white/10 mb-8">
                            <div>
                                <h2 className="text-2xl font-bold mb-2">{activeLecture.title}</h2>
                                <p className="text-zinc-400 text-sm">Lecture {completedLectures.size + 1} of {course?.curriculum_data.reduce((a,s)=>a+s.lectures.length,0)}</p>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={() => { const p = findPrevLecture(); if(p) setActiveLecture(p) }}
                                    disabled={!findPrevLecture()}
                                    className="p-3 rounded-full border border-white/10 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                
                                <button 
                                    onClick={handleMarkComplete}
                                    disabled={isCompleted(activeLecture.id) || markingComplete}
                                    className={`
                                        flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all
                                        ${isCompleted(activeLecture.id) 
                                            ? 'bg-green-500/20 text-green-400 border border-green-500/50 cursor-default' 
                                            : 'bg-white text-black hover:bg-zinc-200'}
                                    `}
                                >
                                    {markingComplete ? <Loader2 className="animate-spin" size={18}/> : isCompleted(activeLecture.id) ? <Check size={18} /> : <CheckCircle2 size={18} />}
                                    {isCompleted(activeLecture.id) ? 'Completed' : 'Mark Complete'}
                                </button>

                                <button 
                                    onClick={() => { const n = findNextLecture(); if(n) setActiveLecture(n) }}
                                    disabled={!findNextLecture()}
                                    className="p-3 rounded-full border border-white/10 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Article Content (If Article Type) */}
                        {activeLecture.type === 'article' && (
                            <div className="prose prose-invert max-w-none text-zinc-300">
                                <p className="whitespace-pre-wrap">{activeLecture.articleContent || "No content available."}</p>
                            </div>
                        )}

                        {/* Description / Resources Placeholder */}
                        <div className="mt-8 space-y-4">
                            <h3 className="font-bold text-lg">About this lecture</h3>
                            <p className="text-zinc-400 leading-relaxed text-sm">
                                No additional description provided for this lecture. Focus on the video content or article above to complete this module.
                            </p>
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex-1 flex items-center justify-center text-zinc-500">Select a lecture to start</div>
            )}
        </div>

        {/* RIGHT: CURRICULUM SIDEBAR */}
        <AnimatePresence initial={false}>
            {sidebarOpen && (
                <motion.div 
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 350, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="border-l border-white/10 bg-[#0F0F0F] flex flex-col shrink-0"
                >
                    <div className="p-5 border-b border-white/5">
                        <h3 className="font-bold text-sm uppercase tracking-wider text-zinc-400">Course Content</h3>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {course?.curriculum_data.map((section, idx) => (
                            <div key={section.id} className="border-b border-white/5">
                                <button 
                                    onClick={() => setActiveSectionId(activeSectionId === section.id ? null : section.id)}
                                    className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors text-left"
                                >
                                    <div>
                                        <h4 className="font-bold text-sm text-zinc-200 mb-1">Section {idx + 1}: {section.title}</h4>
                                        <p className="text-[10px] text-zinc-500">{section.lectures.filter(l => isCompleted(l.id)).length} / {section.lectures.length} Completed</p>
                                    </div>
                                    <ChevronDown size={16} className={`text-zinc-500 transition-transform ${activeSectionId === section.id ? 'rotate-180' : ''}`} />
                                </button>

                                {activeSectionId === section.id && (
                                    <div className="bg-black/20 pb-2">
                                        {section.lectures.map((lecture, lIdx) => {
                                            const isActive = activeLecture?.id === lecture.id
                                            const isDone = isCompleted(lecture.id)
                                            
                                            return (
                                                <button 
                                                    key={lecture.id}
                                                    onClick={() => setActiveLecture(lecture)}
                                                    className={`
                                                        w-full flex items-start gap-3 p-3 pl-6 text-left transition-all text-sm border-l-2
                                                        ${isActive 
                                                            ? 'bg-white/5 border-green-500 text-white' 
                                                            : 'border-transparent text-zinc-400 hover:bg-white/5 hover:text-zinc-200'}
                                                    `}
                                                >
                                                    <div className={`mt-0.5 ${isDone ? 'text-green-500' : 'text-zinc-600'}`}>
                                                        {isDone ? <CheckCircle2 size={16} fill="currentColor" className="text-black" /> : 
                                                         lecture.type === 'video' ? <PlayCircle size={16} /> : <FileText size={16} />}
                                                    </div>
                                                    <div>
                                                        <span className={isActive ? 'font-bold' : ''}>{lIdx + 1}. {lecture.title}</span>
                                                        <div className="text-[10px] text-zinc-600 mt-1 flex items-center gap-2">
                                                            {lecture.type === 'video' ? 'Video' : 'Article'}
                                                            {/* Placeholder duration if we had it */}
                                                            {/* <span>• 5 min</span> */}
                                                        </div>
                                                    </div>
                                                </button>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

      </div>
    </div>
  )
}