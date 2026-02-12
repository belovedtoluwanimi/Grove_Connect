'use client'

import React, { useState, useEffect } from 'react'
import { 
  PlayCircle, CheckCircle2, ChevronLeft, ChevronRight, 
  Menu, FileText, ChevronDown, Check, Loader2, ArrowLeft, 
  AlertTriangle, Sparkles, BookOpen, MonitorPlay, X
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
  const [activeLecture, setActiveLecture] = useState<any>(null)
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null)
  
  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'ai-summary' | 'resources'>('overview')
  
  // AI State
  const [aiLoading, setAiLoading] = useState(false)
  const [aiSummary, setAiSummary] = useState<string | null>(null)

  // --- 1. INITIAL DATA FETCH ---
  useEffect(() => {
    if (!courseId) return;

    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return router.push('/auth')

        // Fetch Course
        const { data: courseData, error } = await supabase
            .from('courses')
            .select('*, profiles(full_name, avatar_url)')
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

        // Set Initial Active Lecture
        const curriculum = Array.isArray(courseData.curriculum_data) 
            ? courseData.curriculum_data 
            : JSON.parse(courseData.curriculum_data || '[]')

        if (curriculum.length > 0) {
            const firstSection = curriculum[0]
            setActiveSectionId(firstSection.id)
            if (firstSection.lectures?.length > 0) setActiveLecture(firstSection.lectures[0])
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [courseId, supabase, router])

  // --- AI GENERATOR LOGIC ---
  const generateAiSummary = () => {
    if (!activeLecture) return
    setAiLoading(true)
    setAiSummary("")

    // SIMULATED AI STREAMING (Replace this with real OpenAI call later)
    const mockSummary = `
      Based on the lecture "${activeLecture.title}", here are the key takeaways:
      
      1. **Core Concept**: ${activeLecture.title} focuses on the fundamental principles of the topic.
      2. **Key Technique**: The instructor demonstrates how to implement this efficiently.
      3. **Practical Application**: You can apply this immediately to your project by following the steps shown in the video.
      
      **Summary**: This module bridges the gap between theory and practice, ensuring you understand not just the "how", but the "why".
    `
    
    // Typewriter effect simulation
    let i = 0;
    const interval = setInterval(() => {
        setAiSummary(mockSummary.slice(0, i))
        i++
        if (i > mockSummary.length) {
            clearInterval(interval)
            setAiLoading(false)
        }
    }, 10) // Speed of typing
  }

  // Reset AI when lecture changes
  useEffect(() => {
      setAiSummary(null) 
      setActiveTab('overview')
  }, [activeLecture])


  // --- NAVIGATION HELPERS ---
  const getCurriculum = () => {
      if (!course) return []
      return Array.isArray(course.curriculum_data) ? course.curriculum_data : JSON.parse(course.curriculum_data || '[]')
  }

  const findNextLecture = () => {
    let found = false
    for (const section of getCurriculum()) {
        for (const lecture of section.lectures) {
            if (found) return lecture
            if (lecture.id === activeLecture?.id) found = true
        }
    }
    return null
  }

  const handleMarkComplete = async () => {
    if (!activeLecture) return
    
    // Optimistic Update
    const newSet = new Set(completedLectures)
    newSet.add(activeLecture.id)
    setCompletedLectures(newSet)

    // DB Update
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
        await supabase.from('course_progress').insert({
            user_id: user.id, course_id: courseId, lecture_id: activeLecture.id
        })
    }

    // Auto Advance
    const next = findNextLecture()
    if (next) {
        setActiveLecture(next)
        // Auto-open section if needed
        const sections = getCurriculum()
        const nextSection = sections.find((s:any) => s.lectures.some((l:any) => l.id === next.id))
        if (nextSection) setActiveSectionId(nextSection.id)
    }
  }

  if (loading) return <div className="h-screen bg-[#050505] flex items-center justify-center"><Loader2 className="animate-spin text-emerald-500 w-10 h-10"/></div>

  const isCompleted = (id: string) => completedLectures.has(id)
  const curriculum = getCurriculum()
  const totalLectures = curriculum.reduce((acc:any, sec:any) => acc + sec.lectures.length, 0)
  const progressPercent = Math.round((completedLectures.size / (totalLectures || 1)) * 100)

  return (
    <div className="h-screen flex flex-col bg-[#050505] text-white font-sans overflow-hidden">
      
      {/* --- TOP HEADER --- */}
      <header className="h-16 border-b border-white/5 bg-[#0A0A0A]/50 backdrop-blur-md flex items-center justify-between px-4 z-20 shrink-0">
        <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2 hover:bg-white/10 rounded-full transition-colors text-zinc-400 hover:text-white">
                <ArrowLeft size={18} />
            </Link>
            <div className="h-6 w-px bg-white/10" />
            <div>
                <h1 className="font-bold text-sm text-zinc-100 max-w-md truncate">{course?.title}</h1>
                <p className="text-[10px] text-zinc-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"/> Live Session
                </p>
            </div>
        </div>

        <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col items-end">
                <div className="flex items-center gap-2 text-xs font-medium text-emerald-400">
                    <Sparkles size={12} /> {progressPercent}% Progress
                </div>
                <div className="w-32 h-1.5 bg-white/10 rounded-full mt-1 overflow-hidden">
                    <div className="h-full bg-emerald-500 transition-all duration-700" style={{ width: `${progressPercent}%` }} />
                </div>
            </div>
            <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={`p-2.5 rounded-lg border transition-all ${sidebarOpen ? 'bg-emerald-500 text-black border-emerald-500' : 'border-white/10 text-zinc-400 hover:text-white'}`}
            >
                <Menu size={18} />
            </button>
        </div>
      </header>

      {/* --- MAIN LAYOUT --- */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* LEFT: CONTENT AREA */}
        <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar relative">
            
            {/* VIDEO PLAYER */}
            <div className="w-full bg-black aspect-video relative flex items-center justify-center border-b border-white/5 shadow-2xl">
                {activeLecture?.type === 'video' ? (
                    <video 
                        key={activeLecture.id}
                        src={activeLecture.videoUrl} 
                        controls 
                        className="w-full h-full object-contain"
                        onEnded={handleMarkComplete}
                    />
                ) : (
                    <div className="flex flex-col items-center gap-4 text-zinc-500">
                        <FileText size={48} className="opacity-20" />
                        <p>Reading Material</p>
                    </div>
                )}
            </div>

            {/* TABBED INTERFACE */}
            <div className="flex-1 max-w-5xl mx-auto w-full p-6 lg:p-10">
                
                {/* Tabs */}
                <div className="flex items-center gap-8 border-b border-white/5 mb-8">
                    {[
                        { id: 'overview', label: 'Overview', icon: MonitorPlay },
                        { id: 'ai-summary', label: 'AI Tutor', icon: Sparkles },
                        { id: 'resources', label: 'Resources', icon: BookOpen },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`pb-4 text-sm font-bold flex items-center gap-2 transition-colors relative ${activeTab === tab.id ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            <tab.icon size={16} /> {tab.label}
                            {activeTab === tab.id && <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="min-h-[200px]">
                    
                    {/* 1. OVERVIEW */}
                    {activeTab === 'overview' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-white mb-2">{activeLecture?.title}</h2>
                                    <p className="text-zinc-400 text-sm">Lecture {Array.from(completedLectures).length + 1} • Video Lesson</p>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={handleMarkComplete}
                                        disabled={isCompleted(activeLecture?.id)}
                                        className={`px-6 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 transition-all ${isCompleted(activeLecture?.id) ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-white text-black hover:bg-zinc-200'}`}
                                    >
                                        {isCompleted(activeLecture?.id) ? <><Check size={16} /> Completed</> : "Mark Complete"}
                                    </button>
                                </div>
                            </div>
                            <div className="p-6 rounded-2xl bg-white/5 border border-white/5 text-zinc-300 text-sm leading-relaxed">
                                {activeLecture?.articleContent || "No description available for this lecture. Watch the video to learn more."}
                            </div>
                        </motion.div>
                    )}

                    {/* 2. AI TUTOR (The New Feature) */}
                    {activeTab === 'ai-summary' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-lg flex items-center gap-2">
                                    <Sparkles className="text-emerald-400" size={18} /> 
                                    <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Grove AI Summary</span>
                                </h3>
                                <button 
                                    onClick={generateAiSummary}
                                    disabled={aiLoading || aiSummary !== null}
                                    className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-4 py-2 rounded-full hover:bg-emerald-500/20 transition-colors"
                                >
                                    {aiSummary ? "Regenerate" : "Generate Summary"}
                                </button>
                            </div>

                            <div className="min-h-[150px] p-6 rounded-2xl bg-black/40 border border-emerald-500/20 relative overflow-hidden">
                                {aiLoading ? (
                                    <div className="flex flex-col items-center justify-center h-32 gap-3">
                                        <Loader2 className="animate-spin text-emerald-500" />
                                        <p className="text-xs text-emerald-500/60 animate-pulse">Analyzing audio transcript...</p>
                                    </div>
                                ) : aiSummary ? (
                                    <div className="prose prose-invert prose-sm max-w-none text-zinc-300">
                                        <p className="whitespace-pre-wrap leading-7">{aiSummary}</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-32 gap-2 opacity-50">
                                        <Sparkles size={32} />
                                        <p className="text-sm">Click "Generate" to get an AI breakdown of this lesson.</p>
                                    </div>
                                )}
                                {/* Decorative Glow */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[50px] pointer-events-none" />
                            </div>
                        </motion.div>
                    )}

                    {/* 3. RESOURCES */}
                    {activeTab === 'resources' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-10 text-zinc-500">
                            <BookOpen size={40} className="mx-auto mb-4 opacity-20" />
                            <p>No downloadable resources attached to this lesson.</p>
                        </motion.div>
                    )}

                </div>
            </div>
        </div>

        {/* RIGHT: CURRICULUM SIDEBAR */}
        <AnimatePresence initial={false}>
            {sidebarOpen && (
                <motion.div 
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 320, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="border-l border-white/5 bg-[#080808] flex flex-col shrink-0 z-30"
                >
                    <div className="p-5 border-b border-white/5 flex items-center justify-between">
                        <h3 className="font-bold text-xs uppercase tracking-widest text-zinc-400">Curriculum</h3>
                        <button onClick={() => setSidebarOpen(false)} className="md:hidden text-zinc-500"><X size={18}/></button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar pb-10">
                        {curriculum.map((section: any, idx: number) => (
                            <div key={section.id} className="border-b border-white/5">
                                <button 
                                    onClick={() => setActiveSectionId(activeSectionId === section.id ? null : section.id)}
                                    className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors text-left group"
                                >
                                    <div>
                                        <h4 className="font-bold text-sm text-zinc-200 mb-1 group-hover:text-white transition-colors">Section {idx + 1}</h4>
                                        <p className="text-[10px] text-zinc-500 truncate max-w-[200px]">{section.title}</p>
                                    </div>
                                    <ChevronDown size={14} className={`text-zinc-600 transition-transform duration-300 ${activeSectionId === section.id ? 'rotate-180' : ''}`} />
                                </button>

                                <AnimatePresence>
                                    {activeSectionId === section.id && (
                                        <motion.div 
                                            initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                                            className="overflow-hidden bg-[#050505]"
                                        >
                                            {section.lectures.map((lecture: any, lIdx: number) => {
                                                const isActive = activeLecture?.id === lecture.id
                                                const isDone = isCompleted(lecture.id)
                                                
                                                return (
                                                    <button 
                                                        key={lecture.id}
                                                        onClick={() => setActiveLecture(lecture)}
                                                        className={`
                                                            w-full flex items-start gap-3 p-3 pl-6 text-left transition-all text-xs border-l-2 relative
                                                            ${isActive ? 'bg-white/5 border-emerald-500 text-white' : 'border-transparent text-zinc-400 hover:bg-white/5'}
                                                        `}
                                                    >
                                                        <div className={`mt-0.5 shrink-0 ${isDone ? 'text-emerald-500' : isActive ? 'text-emerald-400' : 'text-zinc-600'}`}>
                                                            {isDone ? <CheckCircle2 size={14} fill="currentColor" className="text-black" /> : 
                                                             lecture.type === 'video' ? <PlayCircle size={14} /> : <FileText size={14} />}
                                                        </div>
                                                        <div className="flex-1">
                                                            <span className={isActive ? 'font-bold' : 'font-medium'}>{lIdx + 1}. {lecture.title}</span>
                                                            {isActive && <span className="block text-[9px] text-emerald-500/80 mt-1 animate-pulse">Now Playing</span>}
                                                        </div>
                                                    </button>
                                                )
                                            })}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
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