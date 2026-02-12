'use client'

import React, { useState, useEffect, useRef } from 'react'
import { 
  PlayCircle, CheckCircle2, ChevronDown, Check, Loader2, ArrowLeft, 
  Sparkles, FileText, MessageSquare, ThumbsUp, Download, WifiOff,
  Twitter, Linkedin, Globe, Shield, Star, Send
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/app/utils/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import Footer from '../../../components/Footer' // Adjust path to your Footer

export default function LearningPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const courseId = params?.id as string

  // --- STATE ---
  const [loading, setLoading] = useState(true)
  const [course, setCourse] = useState<any>(null)
  const [completedLectures, setCompletedLectures] = useState<Set<string>>(new Set())
  const [activeLectureId, setActiveLectureId] = useState<string | null>(null)
  
  // UI Tabs (Below Video)
  const [activeTab, setActiveTab] = useState<'ai' | 'comments' | 'tutor'>('ai')
  
  // AI & Interactive State
  const [aiSummary, setAiSummary] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [commentText, setCommentText] = useState("")
  
  // Offline / Cache State
  const [downloading, setDownloading] = useState(false)
  const [isOfflineReady, setIsOfflineReady] = useState(false)
  const [localVideoUrl, setLocalVideoUrl] = useState<string | null>(null)

  // Scroll Ref
  const activeLectureRef = useRef<HTMLDivElement>(null)

  // --- 1. DATA FETCHING ---
  useEffect(() => {
    if (!courseId) return

    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return router.push('/auth')

        // Fetch Course + Instructor
        const { data: courseData, error } = await supabase
            .from('courses')
            .select('*, profiles(full_name, avatar_url, bio)') // Fetch instructor details
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

        // Initial Active Lecture
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

  // --- 2. OFFLINE CACHE MANAGER ---
  // Checks if video is already cached when lecture changes
  useEffect(() => {
    const checkCache = async () => {
        setLocalVideoUrl(null)
        setIsOfflineReady(false)
        const lecture = getActiveLectureData()
        if (!lecture?.videoUrl) return

        if ('caches' in window) {
            const cache = await caches.open('grove-courses-v1')
            const response = await cache.match(lecture.videoUrl)
            if (response) {
                const blob = await response.blob()
                setLocalVideoUrl(URL.createObjectURL(blob))
                setIsOfflineReady(true)
            }
        }
    }
    checkCache()
  }, [activeLectureId, course])

  const handleDownloadOffline = async () => {
      const lecture = getActiveLectureData()
      if (!lecture?.videoUrl) return
      
      setDownloading(true)
      try {
          const cache = await caches.open('grove-courses-v1')
          await cache.add(lecture.videoUrl) // Downloads and saves to Cache Storage
          setIsOfflineReady(true)
          alert("Video downloaded! You can now watch this lecture without internet.")
      } catch (e) {
          console.error("Download failed", e)
          alert("Could not download video. Check your connection.")
      } finally {
          setDownloading(false)
      }
  }

  // --- HELPERS ---
  const getCurriculum = (c = course) => {
      if (!c) return []
      return Array.isArray(c.curriculum_data) ? c.curriculum_data : JSON.parse(c.curriculum_data || '[]')
  }
  const getAllLectures = () => getCurriculum().flatMap((s:any) => s.lectures)
  const getActiveLectureData = () => getAllLectures().find((l:any) => l.id === activeLectureId)
  const isCompleted = (id: string) => completedLectures.has(id)
  
  // Safe Instructor Access
  const instructor = Array.isArray(course?.profiles) ? course.profiles[0] : course?.profiles

  // --- UI ACTIONS ---
  const generateAiSummary = () => {
    if (isTyping || aiSummary) return
    setIsTyping(true)
    const summaryText = `🤖 AI Analysis for "${getActiveLectureData()?.title}":\n\n1. **Key Concept**: This lecture breaks down the core mechanics of the topic.\n2. **Critical Step**: Pay attention to minute 3:45 where the instructor explains the edge case.\n3. **Action Item**: Try implementing this in your own IDE immediately after watching.\n\nSummary generated by Grove Intelligence.`
    
    let i = 0
    const interval = setInterval(() => {
        setAiSummary(summaryText.slice(0, i))
        i++
        if (i > summaryText.length) {
            clearInterval(interval)
            setIsTyping(false)
        }
    }, 10)
  }

  const handleMarkComplete = async () => {
    if (!activeLectureId) return
    const newSet = new Set(completedLectures)
    newSet.add(activeLectureId)
    setCompletedLectures(newSet)

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
        await supabase.from('course_progress').insert({
            user_id: user.id, course_id: courseId, lecture_id: activeLectureId
        })
    }

    // Auto-scroll to next
    const allLectures = getAllLectures()
    const currentIndex = allLectures.findIndex((l:any) => l.id === activeLectureId)
    if (currentIndex < allLectures.length - 1) {
        setTimeout(() => setActiveLectureId(allLectures[currentIndex + 1].id), 800)
    }
  }

  if (loading) return <div className="h-screen bg-[#050505] flex items-center justify-center"><Loader2 className="animate-spin text-emerald-500 w-10 h-10"/></div>

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-emerald-500/30">
      
      {/* --- HERO SECTION --- */}
      <div className="relative h-[40vh] w-full overflow-hidden">
         <Image 
            src={course?.thumbnail_url || "/placeholder.jpg"} 
            alt={course?.title} 
            fill 
            className="object-cover opacity-40 blur-sm"
         />
         <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-transparent" />
         
         {/* Navigation & Info */}
         <div className="absolute inset-0 flex flex-col justify-between p-6 md:p-12 max-w-7xl mx-auto z-10">
            <Link href="/dashboard" className="w-fit p-3 bg-white/10 backdrop-blur-md rounded-full hover:bg-white/20 transition-all">
                <ArrowLeft size={20} />
            </Link>
            
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider rounded-full border border-emerald-500/30">
                        {course?.category || 'Course'}
                    </span>
                    <span className="text-zinc-400 text-xs font-medium flex items-center gap-1">
                        <CheckCircle2 size={12} className="text-emerald-500"/> 
                        {completedLectures.size} of {getAllLectures().length} Completed
                    </span>
                </div>
                <h1 className="text-3xl md:text-5xl font-bold leading-tight max-w-3xl">{course?.title}</h1>
            </div>
         </div>
      </div>

      {/* --- MAIN CONTENT (Accordion Feed) --- */}
      <main className="px-4 md:px-6 max-w-5xl mx-auto -mt-10 relative z-20 pb-20">
        
        <div className="space-y-6">
            {getCurriculum().map((section: any, sIdx: number) => (
                <div key={section.id} className="space-y-4">
                    
                    {/* Section Header */}
                    <div className="flex items-center gap-4 py-4 sticky top-0 bg-[#050505]/95 backdrop-blur-xl z-30 border-b border-white/5">
                        <span className="text-3xl font-black text-white/10">0{sIdx + 1}</span>
                        <div>
                            <h3 className="font-bold text-lg text-zinc-200">{section.title}</h3>
                            <p className="text-xs text-zinc-500">{section.lectures.length} Lessons</p>
                        </div>
                    </div>

                    {/* Lessons */}
                    <div className="space-y-4">
                        {section.lectures.map((lecture: any, lIdx: number) => {
                            const isActive = activeLectureId === lecture.id
                            const isDone = isCompleted(lecture.id)

                            return (
                                <motion.div
                                    key={lecture.id}
                                    ref={isActive ? activeLectureRef : null}
                                    initial={false}
                                    animate={{ 
                                        backgroundColor: isActive ? "#0A0A0A" : "rgba(255,255,255,0.02)",
                                        borderColor: isActive ? "rgba(16, 185, 129, 0.4)" : "rgba(255,255,255,0.05)",
                                        scale: isActive ? 1.01 : 1
                                    }}
                                    className={`rounded-2xl border overflow-hidden transition-all duration-500 shadow-2xl`}
                                >
                                    {/* Collapsed Header */}
                                    <button 
                                        onClick={() => setActiveLectureId(isActive ? null : lecture.id)}
                                        className="w-full flex items-center justify-between p-6 text-left"
                                    >
                                        <div className="flex items-center gap-5">
                                            <div className={`
                                                w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all
                                                ${isDone 
                                                    ? 'bg-emerald-500 border-emerald-500 text-black' 
                                                    : isActive 
                                                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]' 
                                                        : 'border-white/10 text-zinc-500'}
                                            `}>
                                                {isDone ? <Check size={20} strokeWidth={3} /> : <span className="font-bold">{lIdx + 1}</span>}
                                            </div>
                                            <div>
                                                <h4 className={`font-bold text-lg ${isActive ? 'text-white' : 'text-zinc-400'}`}>{lecture.title}</h4>
                                                {isActive && <span className="text-xs text-emerald-500 font-bold animate-pulse">Now Playing</span>}
                                            </div>
                                        </div>
                                        <ChevronDown size={20} className={`text-zinc-600 transition-transform ${isActive ? 'rotate-180' : ''}`} />
                                    </button>

                                    {/* EXPANDED CONTENT */}
                                    <AnimatePresence>
                                        {isActive && (
                                            <motion.div 
                                                initial={{ height: 0, opacity: 0 }} 
                                                animate={{ height: 'auto', opacity: 1 }} 
                                                exit={{ height: 0, opacity: 0 }}
                                            >
                                                <div className="px-6 pb-8">
                                                    
                                                    {/* 1. VIDEO PLAYER (SECURE) */}
                                                    <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-white/10 shadow-2xl mb-6 group">
                                                        {lecture.type === 'video' ? (
                                                            <video 
                                                                // Use local Blob URL if offline, otherwise network URL
                                                                src={localVideoUrl || lecture.videoUrl} 
                                                                controls 
                                                                controlsList="nodownload" // Disable native download
                                                                onContextMenu={(e) => e.preventDefault()} // Disable Right Click
                                                                className="w-full h-full object-contain"
                                                                onEnded={handleMarkComplete}
                                                            />
                                                        ) : (
                                                            <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 bg-zinc-900">
                                                                <FileText size={48} className="mb-4 opacity-50"/>
                                                                <p>Reading Material</p>
                                                            </div>
                                                        )}
                                                        {/* Offline Badge */}
                                                        {isOfflineReady && (
                                                            <div className="absolute top-4 right-4 bg-emerald-500 text-black text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 shadow-lg">
                                                                <CheckCircle2 size={12} /> Offline Ready
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* 2. ACTION BAR */}
                                                    <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-6 border-b border-white/5">
                                                        <div className="flex gap-2">
                                                            <button 
                                                                onClick={handleDownloadOffline}
                                                                disabled={isOfflineReady || downloading}
                                                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border transition-colors ${isOfflineReady ? 'bg-zinc-800 border-zinc-700 text-zinc-500 cursor-default' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                                                            >
                                                                {downloading ? <Loader2 size={14} className="animate-spin"/> : isOfflineReady ? <Check size={14}/> : <Download size={14}/>}
                                                                {isOfflineReady ? 'Saved Offline' : 'Download Lesson'}
                                                            </button>
                                                            <div className="hidden md:flex items-center gap-2 px-3 py-2 text-xs text-zinc-500">
                                                                <Shield size={12} /> Secure Player
                                                            </div>
                                                        </div>

                                                        <button 
                                                            onClick={handleMarkComplete}
                                                            disabled={isDone}
                                                            className={`px-6 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 transition-all ${isDone ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-white text-black hover:bg-zinc-200'}`}
                                                        >
                                                            {isDone ? 'Completed' : 'Mark Complete'}
                                                        </button>
                                                    </div>

                                                    {/* 3. TABS (AI, Comments, Tutor) */}
                                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                                        
                                                        {/* LEFT: TABS NAV */}
                                                        <div className="lg:col-span-2 space-y-6">
                                                            <div className="flex gap-6 border-b border-white/5">
                                                                {[
                                                                    { id: 'ai', label: 'AI Tutor', icon: Sparkles },
                                                                    { id: 'comments', label: 'Discussion', icon: MessageSquare },
                                                                    { id: 'tutor', label: 'Instructor', icon: CheckCircle2 },
                                                                ].map((tab) => (
                                                                    <button
                                                                        key={tab.id}
                                                                        onClick={() => setActiveTab(tab.id as any)}
                                                                        className={`pb-3 text-sm font-bold flex items-center gap-2 transition-colors border-b-2 ${activeTab === tab.id ? 'border-emerald-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
                                                                    >
                                                                        <tab.icon size={16} /> {tab.label}
                                                                    </button>
                                                                ))}
                                                            </div>

                                                            {/* AI CONTENT */}
                                                            {activeTab === 'ai' && (
                                                                <div className="bg-white/5 rounded-xl p-5 border border-white/5 relative overflow-hidden">
                                                                    <div className="flex justify-between items-center mb-4">
                                                                        <h4 className="text-xs font-bold text-zinc-400 uppercase">Lesson Summary</h4>
                                                                        <button onClick={generateAiSummary} className="text-xs bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded hover:bg-emerald-500/20 transition-colors">
                                                                            {aiSummary ? 'Refresh' : 'Generate'}
                                                                        </button>
                                                                    </div>
                                                                    <div className="text-sm text-zinc-300 leading-7 whitespace-pre-wrap min-h-[100px]">
                                                                        {aiSummary || <span className="text-zinc-600 italic">Click generate to get an AI breakdown of this lesson...</span>}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* COMMENTS CONTENT (Mock) */}
                                                            {activeTab === 'comments' && (
                                                                <div className="space-y-4">
                                                                    <div className="flex gap-3">
                                                                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex-shrink-0" />
                                                                        <div className="flex-1 relative">
                                                                            <input 
                                                                                type="text" 
                                                                                placeholder="Ask a question..." 
                                                                                className="w-full bg-transparent border-b border-white/10 pb-2 text-sm focus:border-emerald-500 outline-none text-white"
                                                                                value={commentText}
                                                                                onChange={(e) => setCommentText(e.target.value)}
                                                                            />
                                                                            <Send size={14} className="absolute right-0 top-0 text-zinc-500 cursor-pointer hover:text-white" />
                                                                        </div>
                                                                    </div>
                                                                    <div className="space-y-4 pt-4">
                                                                        {/* Mock Comment */}
                                                                        <div className="flex gap-3">
                                                                            <div className="w-8 h-8 rounded-full bg-blue-900 flex items-center justify-center text-xs font-bold">J</div>
                                                                            <div>
                                                                                <p className="text-xs font-bold text-white mb-1">James O.</p>
                                                                                <p className="text-sm text-zinc-400">Does this method work for Next.js 14 as well?</p>
                                                                                <div className="flex items-center gap-3 mt-2 text-[10px] text-zinc-500">
                                                                                    <span className="hover:text-white cursor-pointer">Reply</span>
                                                                                    <span className="flex items-center gap-1 hover:text-white cursor-pointer"><ThumbsUp size={10}/> 2</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* TUTOR INFO */}
                                                            {activeTab === 'tutor' && (
                                                                <div className="flex items-start gap-4 bg-white/5 p-5 rounded-xl border border-white/5">
                                                                    <div className="w-16 h-16 rounded-full bg-zinc-800 overflow-hidden shrink-0 border-2 border-white/10">
                                                                        {instructor?.avatar_url && <Image src={instructor.avatar_url} alt="" width={64} height={64} className="object-cover" />}
                                                                    </div>
                                                                    <div>
                                                                        <h4 className="font-bold text-white text-lg">{instructor?.full_name || 'Grove Instructor'}</h4>
                                                                        <p className="text-xs text-zinc-500 mb-3">Senior Developer & Educator</p>
                                                                        <p className="text-sm text-zinc-300 leading-relaxed mb-4">{instructor?.bio || "Passionate about teaching the next generation of developers."}</p>
                                                                        <div className="flex gap-3">
                                                                            <button className="p-2 bg-white/5 rounded-full hover:bg-[#1DA1F2]/20 hover:text-[#1DA1F2] transition-colors"><Twitter size={16}/></button>
                                                                            <button className="p-2 bg-white/5 rounded-full hover:bg-[#0077b5]/20 hover:text-[#0077b5] transition-colors"><Linkedin size={16}/></button>
                                                                            <button className="p-2 bg-white/5 rounded-full hover:bg-emerald-500/20 hover:text-emerald-500 transition-colors"><Globe size={16}/></button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* RIGHT: RESOURCES SIDEBAR */}
                                                        <div className="bg-neutral-900/50 border border-white/5 rounded-xl p-5 h-fit">
                                                            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Resources</h4>
                                                            <div className="space-y-3">
                                                                <div className="flex items-center gap-3 p-3 bg-black rounded-lg border border-white/5 hover:border-emerald-500/30 transition-colors cursor-pointer group">
                                                                    <div className="p-2 bg-white/5 rounded group-hover:text-emerald-400"><FileText size={16}/></div>
                                                                    <div className="overflow-hidden">
                                                                        <p className="text-xs font-bold text-zinc-300 truncate">Source Code.zip</p>
                                                                        <p className="text-[10px] text-zinc-600">2.4 MB</p>
                                                                    </div>
                                                                    <Download size={14} className="ml-auto text-zinc-600 group-hover:text-white" />
                                                                </div>
                                                                <div className="flex items-center gap-3 p-3 bg-black rounded-lg border border-white/5 hover:border-emerald-500/30 transition-colors cursor-pointer group">
                                                                    <div className="p-2 bg-white/5 rounded group-hover:text-emerald-400"><FileText size={16}/></div>
                                                                    <div className="overflow-hidden">
                                                                        <p className="text-xs font-bold text-zinc-300 truncate">Slide Deck.pdf</p>
                                                                        <p className="text-[10px] text-zinc-600">1.2 MB</p>
                                                                    </div>
                                                                    <Download size={14} className="ml-auto text-zinc-600 group-hover:text-white" />
                                                                </div>
                                                            </div>
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

      <Footer />
    </div>
  )
}