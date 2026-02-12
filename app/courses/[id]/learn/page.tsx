'use client'

import React, { useState, useEffect } from 'react'
import { 
  PlayCircle, CheckCircle2, ChevronLeft, ChevronRight, 
  Menu, FileText, ChevronDown, Check, Loader2, ArrowLeft, AlertTriangle 
} from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/app/utils/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'

export default function LearningPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  
  // --- FIX: Use 'id' because your folder is named [id] ---
  const courseId = params?.id as string

  // --- STATE ---
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [course, setCourse] = useState<any>(null)
  const [completedLectures, setCompletedLectures] = useState<Set<string>>(new Set())
  
  // Navigation State
  const [activeLecture, setActiveLecture] = useState<any>(null)
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [markingComplete, setMarkingComplete] = useState(false)

  // --- 1. INITIAL DATA FETCH ---
  useEffect(() => {
    // Wait for the ID to be available
    if (!courseId) return;

    const init = async () => {
      try {
        console.log("Fetching course content for:", courseId)
        
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            console.log("No user found, redirecting...")
            window.location.href = '/auth'
            return
        }

        // 1. Fetch Course
        const { data: courseData, error: courseError } = await supabase
            .from('courses')
            .select('*')
            .eq('id', courseId)
            .single()

        if (courseError) throw new Error(`Course Load Error: ${courseError.message}`)
        if (!courseData) throw new Error("Course not found in database")

        // 2. Fetch Progress
        const { data: progressData, error: progressError } = await supabase
            .from('course_progress')
            .select('lecture_id')
            .eq('user_id', user.id)
            .eq('course_id', courseId)

        if (progressError) console.error("Progress fetch warning:", progressError)

        setCourse(courseData)
        setCompletedLectures(new Set(progressData?.map((p: any) => p.lecture_id) || []))

        // 3. Set Active Lecture (Handle both JSON string and object)
        const curriculum = Array.isArray(courseData.curriculum_data) 
            ? courseData.curriculum_data 
            : typeof courseData.curriculum_data === 'string' 
                ? JSON.parse(courseData.curriculum_data) 
                : [];

        if (curriculum && curriculum.length > 0) {
            const firstSection = curriculum[0]
            setActiveSectionId(firstSection.id)
            if (firstSection.lectures?.length > 0) {
                setActiveLecture(firstSection.lectures[0])
            }
        }

      } catch (err: any) {
        console.error("Critical Error:", err)
        setErrorMsg(err.message)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [courseId, supabase])

  // --- ACTIONS ---
  const isCompleted = (id: string) => completedLectures.has(id)

  // Helper to safely get curriculum array
  const getCurriculum = () => {
      if (!course) return []
      return Array.isArray(course.curriculum_data) 
        ? course.curriculum_data 
        : typeof course.curriculum_data === 'string'
            ? JSON.parse(course.curriculum_data) 
            : []
  }

  const findNextLecture = () => {
    if (!course || !activeLecture) return null
    let foundCurrent = false
    const sections = getCurriculum()
    
    for (const section of sections) {
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
    const sections = getCurriculum()
    
    for (const section of sections) {
        for (const lecture of section.lectures) {
            if (lecture.id === activeLecture.id) return prev
            prev = lecture
        }
    }
    return null
  }

  const handleMarkComplete = async () => {
    if (!activeLecture || isCompleted(activeLecture.id)) return
    setMarkingComplete(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
        // Optimistic UI update
        const newSet = new Set(completedLectures)
        newSet.add(activeLecture.id)
        setCompletedLectures(newSet)

        // Save to DB
        await supabase.from('course_progress').insert({
            user_id: user.id,
            course_id: courseId,
            lecture_id: activeLecture.id
        })
    }
    setMarkingComplete(false)
    
    // Auto-Advance
    const next = findNextLecture()
    if (next) {
        setActiveLecture(next)
        const sections = getCurriculum()
        const nextSection = sections.find((s: any) => s.lectures.some((l: any) => l.id === next.id))
        if (nextSection) setActiveSectionId(nextSection.id)
    }
  }

  // --- RENDER STATES ---
  if (loading) return (
    <div className="h-screen bg-[#0A0A0A] flex flex-col items-center justify-center gap-4 text-white">
        <Loader2 className="animate-spin text-green-500 w-10 h-10" />
        <p className="text-zinc-500 text-sm animate-pulse">Loading Classroom...</p>
    </div>
  )

  if (errorMsg) return (
    <div className="h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="bg-red-500/10 p-6 rounded-2xl border border-red-500/20 max-w-md">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Unable to Load Course</h2>
            <p className="text-red-200/80 text-sm mb-6 font-mono bg-black/20 p-3 rounded">{errorMsg}</p>
            <Link href="/dashboard">
                <button className="bg-white text-black px-6 py-2 rounded-full font-bold text-sm hover:bg-gray-200 transition-colors">
                    Back to Dashboard
                </button>
            </Link>
        </div>
    </div>
  )

  const curriculum = getCurriculum()

  return (
    <div className="h-screen flex flex-col bg-[#0A0A0A] text-white overflow-hidden font-sans">
      
      {/* HEADER */}
      <header className="h-16 flex items-center justify-between px-4 border-b border-white/10 bg-[#0A0A0A] z-20 shrink-0">
        <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2 hover:bg-white/10 rounded-full transition-colors text-zinc-400 hover:text-white">
                <ArrowLeft size={20} />
            </Link>
            <div className="h-6 w-[1px] bg-white/10" />
            <h1 className="font-bold text-sm md:text-base truncate max-w-md">{course?.title}</h1>
        </div>
        <div className="flex items-center gap-4">
            <button 
                onClick={() => setSidebarOpen(!sidebarOpen)} 
                className={`p-2 rounded-lg border border-white/10 transition-colors ${sidebarOpen ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`}
            >
                <Menu size={18} />
            </button>
        </div>
      </header>

      {/* WORKSPACE */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT: PLAYER */}
        <div className="flex-1 flex flex-col relative overflow-y-auto">
            {activeLecture ? (
                <>
                    <div className="bg-black w-full aspect-video max-h-[70vh] flex items-center justify-center relative shadow-2xl border-b border-white/5">
                        {activeLecture.type === 'video' && activeLecture.videoUrl ? (
                            <video 
                                key={activeLecture.id} 
                                src={activeLecture.videoUrl} 
                                controls 
                                className="w-full h-full object-contain"
                                onEnded={handleMarkComplete} 
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

                    <div className="p-8 max-w-4xl mx-auto w-full pb-20">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-white/10 mb-8">
                            <div>
                                <h2 className="text-2xl font-bold mb-2">{activeLecture.title}</h2>
                                <p className="text-zinc-400 text-sm">
                                    {isCompleted(activeLecture.id) ? <span className="text-green-500 flex items-center gap-1"><CheckCircle2 size={14}/> Completed</span> : "Not completed"}
                                </p>
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

                        {activeLecture.type === 'article' && (
                            <div className="prose prose-invert max-w-none text-zinc-300">
                                <p className="whitespace-pre-wrap">{activeLecture.articleContent || "No content available."}</p>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 gap-4">
                    <p>Select a lecture to start</p>
                </div>
            )}
        </div>

        {/* RIGHT: SIDEBAR */}
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
                        {curriculum.map((section: any, idx: number) => (
                            <div key={section.id} className="border-b border-white/5">
                                <button 
                                    onClick={() => setActiveSectionId(activeSectionId === section.id ? null : section.id)}
                                    className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors text-left"
                                >
                                    <div>
                                        <h4 className="font-bold text-sm text-zinc-200 mb-1">Section {idx + 1}: {section.title}</h4>
                                        <p className="text-[10px] text-zinc-500">
                                            {section.lectures.filter((l: any) => isCompleted(l.id)).length} / {section.lectures.length} Completed
                                        </p>
                                    </div>
                                    <ChevronDown size={16} className={`text-zinc-500 transition-transform ${activeSectionId === section.id ? 'rotate-180' : ''}`} />
                                </button>

                                {activeSectionId === section.id && (
                                    <div className="bg-black/20 pb-2">
                                        {section.lectures.map((lecture: any, lIdx: number) => {
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