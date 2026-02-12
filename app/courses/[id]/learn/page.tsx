'use client'

import React, { useState, useEffect, useRef } from 'react'
import { 
  PlayCircle, CheckCircle2, ChevronDown, Check, Loader2, ArrowLeft, 
  Sparkles, FileText, Captions, Lock, Play
} from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/app/utils/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'

export default function LearningPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const courseId = params?.id as string

  // --- STATE ---
  const [loading, setLoading] = useState(true)
  const [course, setCourse] = useState<any>(null)
  const [completedLectures, setCompletedLectures] = useState<Set<string>>(new Set())
  
  // Navigation & UI State
  const [activeLectureId, setActiveLectureId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'ai' | 'transcript'>('ai')
  
  // AI Simulation State
  const [aiSummary, setAiSummary] = useState("")
  const [isTyping, setIsTyping] = useState(false)

  // Scroll Ref
  const activeLectureRef = useRef<HTMLDivElement>(null)

  // --- 1. INITIAL DATA FETCH ---
  useEffect(() => {
    if (!courseId) return

    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return router.push('/auth')

        // Fetch Course
        const { data: courseData, error } = await supabase
            .from('courses')
            .select('*')
            .eq('id', courseId)
            .single()

        if (error || !courseData) throw new Error("Course load failed")

        // Fetch Progress
        const { data: progressData } = await supabase
            .from('course_progress')
            .select('lecture_id')
            .eq('user_id', user.id)
            .eq('course_id', courseId)

        setCourse(courseData)
        setCompletedLectures(new Set(progressData?.map((p: any) => p.lecture_id) || []))

        // Set Initial Active Lecture (First incomplete, or just first)
        const curriculum = getCurriculum(courseData)
        if (curriculum.length > 0) {
            const allLectures = curriculum.flatMap((s:any) => s.lectures)
            const firstIncomplete = allLectures.find((l:any) => !progressData?.some((p:any) => p.lecture_id === l.id))
            setActiveLectureId(firstIncomplete?.id || allLectures[0]?.id)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [courseId, supabase, router])

  // --- SCROLL TO ACTIVE ---
  useEffect(() => {
    if (activeLectureId && activeLectureRef.current) {
        setTimeout(() => {
            activeLectureRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 300)
    }
    // Reset AI when changing lectures
    setAiSummary("") 
    setIsTyping(false)
  }, [activeLectureId])

  // --- HELPERS ---
  const getCurriculum = (c = course) => {
      if (!c) return []
      return Array.isArray(c.curriculum_data) ? c.curriculum_data : JSON.parse(c.curriculum_data || '[]')
  }

  const getAllLectures = () => getCurriculum().flatMap((s:any) => s.lectures)
  
  const getActiveLectureData = () => getAllLectures().find((l:any) => l.id === activeLectureId)

  const isCompleted = (id: string) => completedLectures.has(id)

  // --- ACTIONS ---
  const generateAiSummary = () => {
    if (isTyping || aiSummary) return
    setIsTyping(true)
    const summaryText = `Based on this lesson, here are the key takeaways:\n\n• Core Concept: Understanding the fundamentals of ${getActiveLectureData()?.title || 'this topic'}.\n• Practical Application: Implementing these steps will improve your workflow efficiency by 30%.\n• Pro Tip: Don't forget to test your code after every major change.`
    
    let i = 0
    const interval = setInterval(() => {
        setAiSummary(summaryText.slice(0, i))
        i++
        if (i > summaryText.length) {
            clearInterval(interval)
            setIsTyping(false)
        }
    }, 15)
  }

  const handleMarkComplete = async () => {
    if (!activeLectureId) return
    
    // 1. Optimistic Update
    const newSet = new Set(completedLectures)
    newSet.add(activeLectureId)
    setCompletedLectures(newSet)

    // 2. DB Update
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
        await supabase.from('course_progress').insert({
            user_id: user.id, course_id: courseId, lecture_id: activeLectureId
        })
    }

    // 3. Find Next & Auto-Expand
    const allLectures = getAllLectures()
    const currentIndex = allLectures.findIndex((l:any) => l.id === activeLectureId)
    if (currentIndex < allLectures.length - 1) {
        setTimeout(() => {
            setActiveLectureId(allLectures[currentIndex + 1].id)
        }, 800) // Delay to let the user see the "Completed" checkmark
    }
  }

  if (loading) return <div className="h-screen bg-[#050505] flex items-center justify-center"><Loader2 className="animate-spin text-emerald-500 w-10 h-10"/></div>

  const curriculum = getCurriculum()
  const activeLectureData = getActiveLectureData()

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-emerald-500/30">
      
      {/* --- CUSTOM SCROLLBAR CSS --- */}
      <style jsx global>{`
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #10b981; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #059669; }
      `}</style>

      {/* --- HEADER --- */}
      <header className="fixed top-0 inset-x-0 h-16 bg-[#050505]/80 backdrop-blur-xl border-b border-white/5 z-50 flex items-center justify-between px-6">
         <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2 hover:bg-white/10 rounded-full transition-colors text-zinc-400 hover:text-white">
                <ArrowLeft size={20} />
            </Link>
            <h1 className="font-bold text-sm md:text-base text-zinc-200">{course?.title}</h1>
         </div>
         <div className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            {completedLectures.size} / {getAllLectures().length} Completed
         </div>
      </header>

      {/* --- MAIN CONTENT (Accordion Feed) --- */}
      <main className="pt-24 pb-20 px-4 md:px-6 max-w-4xl mx-auto">
        
        <div className="space-y-8">
            {curriculum.map((section: any, sIdx: number) => (
                <div key={section.id} className="space-y-4">
                    
                    {/* Section Header */}
                    <div className="flex items-center gap-3 px-2">
                        <div className="h-px flex-1 bg-white/10" />
                        <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Section {sIdx + 1}: {section.title}</span>
                        <div className="h-px flex-1 bg-white/10" />
                    </div>

                    {/* Lessons List */}
                    <div className="space-y-3">
                        {section.lectures.map((lecture: any, lIdx: number) => {
                            const isActive = activeLectureId === lecture.id
                            const isDone = isCompleted(lecture.id)

                            return (
                                <motion.div
                                    key={lecture.id}
                                    ref={isActive ? activeLectureRef : null}
                                    initial={false}
                                    animate={{ 
                                        backgroundColor: isActive ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0)",
                                        borderColor: isActive ? "rgba(16, 185, 129, 0.3)" : "rgba(255,255,255,0.05)"
                                    }}
                                    className={`
                                        rounded-2xl border overflow-hidden transition-all duration-500
                                        ${isActive ? 'shadow-[0_0_40px_-10px_rgba(16,185,129,0.1)] ring-1 ring-emerald-500/20' : 'hover:bg-white/5'}
                                    `}
                                >
                                    {/* --- LESSON HEADER (Click to Expand) --- */}
                                    <button 
                                        onClick={() => setActiveLectureId(isActive ? null : lecture.id)}
                                        className="w-full flex items-center justify-between p-5 text-left"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`
                                                w-8 h-8 rounded-full flex items-center justify-center border transition-colors
                                                ${isDone 
                                                    ? 'bg-emerald-500 border-emerald-500 text-black' 
                                                    : isActive 
                                                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' 
                                                        : 'border-white/10 text-zinc-500'}
                                            `}>
                                                {isDone ? <Check size={16} strokeWidth={3} /> : isActive ? <Play size={14} fill="currentColor" /> : <span className="text-xs font-bold">{lIdx + 1}</span>}
                                            </div>
                                            <div>
                                                <h3 className={`font-bold text-base transition-colors ${isActive ? 'text-white' : 'text-zinc-400'}`}>
                                                    {lecture.title}
                                                </h3>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-[10px] text-zinc-600 uppercase tracking-wider font-bold">12 Mins</span>
                                                    {isActive && <span className="text-[10px] text-emerald-500 font-bold animate-pulse">• Watching Now</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <ChevronDown size={20} className={`text-zinc-600 transition-transform duration-300 ${isActive ? 'rotate-180' : ''}`} />
                                    </button>

                                    {/* --- EXPANDABLE CONTENT (Video + AI) --- */}
                                    <AnimatePresence>
                                        {isActive && (
                                            <motion.div 
                                                initial={{ height: 0, opacity: 0 }} 
                                                animate={{ height: 'auto', opacity: 1 }} 
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
                                            >
                                                <div className="px-5 pb-6">
                                                    
                                                    {/* VIDEO PLAYER */}
                                                    <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-white/10 shadow-2xl mb-6 group">
                                                        {lecture.type === 'video' ? (
                                                            <video 
                                                                src={lecture.videoUrl} 
                                                                controls 
                                                                className="w-full h-full object-contain"
                                                                onEnded={handleMarkComplete}
                                                            />
                                                        ) : (
                                                            <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500">
                                                                <FileText size={40} className="mb-2 opacity-50"/>
                                                                <p className="text-sm">Reading Material</p>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* CONTROLS & TABS */}
                                                    <div className="flex flex-col gap-6">
                                                        
                                                        {/* Complete Button */}
                                                        <div className="flex justify-between items-center">
                                                            <div className="flex gap-4">
                                                                <button 
                                                                    onClick={() => setActiveTab('ai')}
                                                                    className={`flex items-center gap-2 text-sm font-bold transition-colors ${activeTab === 'ai' ? 'text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                                                                >
                                                                    <Sparkles size={16} /> AI Tutor
                                                                </button>
                                                                <button 
                                                                    onClick={() => setActiveTab('transcript')}
                                                                    className={`flex items-center gap-2 text-sm font-bold transition-colors ${activeTab === 'transcript' ? 'text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                                                                >
                                                                    <Captions size={16} /> Transcript
                                                                </button>
                                                            </div>

                                                            <button 
                                                                onClick={handleMarkComplete}
                                                                disabled={isDone}
                                                                className={`
                                                                    px-5 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-all
                                                                    ${isDone 
                                                                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 cursor-default' 
                                                                        : 'bg-white text-black hover:bg-zinc-200 hover:scale-105 shadow-lg shadow-white/10'}
                                                                `}
                                                            >
                                                                {isDone ? <><CheckCircle2 size={14}/> Completed</> : <><Check size={14}/> Mark Complete</>}
                                                            </button>
                                                        </div>

                                                        {/* TAB CONTENT PANEL */}
                                                        <div className="bg-white/5 border border-white/5 rounded-xl p-5 min-h-[120px] relative overflow-hidden">
                                                            {activeTab === 'ai' && (
                                                                <div className="space-y-3">
                                                                    <div className="flex justify-between items-center">
                                                                        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">AI Summary</h4>
                                                                        <button onClick={generateAiSummary} className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded hover:bg-emerald-500/20 transition-colors">
                                                                            {aiSummary ? 'Regenerate' : 'Generate'}
                                                                        </button>
                                                                    </div>
                                                                    <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                                                                        {aiSummary || <span className="text-zinc-600 italic">Click generate to analyze this video...</span>}
                                                                        {isTyping && <span className="inline-block w-1.5 h-3 ml-1 bg-emerald-500 animate-pulse"/>}
                                                                    </p>
                                                                </div>
                                                            )}

                                                            {activeTab === 'transcript' && (
                                                                <div className="text-sm text-zinc-400 leading-relaxed h-32 overflow-y-auto custom-scrollbar pr-2">
                                                                    <p>00:00 - Introduction to the concepts...</p>
                                                                    <p>00:45 - Setting up your environment...</p>
                                                                    <p className="italic text-zinc-600 mt-4">(Transcript functionality requires backend integration)</p>
                                                                </div>
                                                            )}
                                                        </div>

                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            )
                        })}
                    </div>
                </div>
            ))}
        </div>

      </main>
    </div>
  )
}