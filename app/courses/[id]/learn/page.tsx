'use client'

import React, { useState, useEffect, useRef } from 'react'
import { 
  PlayCircle, CheckCircle2, ChevronDown, Check, Loader2, ArrowLeft, 
  Sparkles, FileText, Download, WifiOff, Star, Shield, 
  Captions, Lock, Trash2, Send, Presentation, ListChecks, ArrowRight, Bot, X, FileCode, Link as LinkIcon
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/app/utils/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { set, get } from 'idb-keyval' 
import Footer from '../../../components/Footer' 

// --- TYPES ---
type Review = {
    id: string
    rating: number
    comment: string
    created_at: string
    user_id: string
    profiles: { full_name: string, avatar_url: string }
}

interface QuizQuestion { id: string; question: string; options: string[]; correctIndex: number; }
interface ResourceItem { id: string; type: 'file' | 'link' | 'code'; title: string; url: string; }
interface ContentItem {
  id: string; title: string; type: 'video' | 'video_slide' | 'article' | 'quiz' | 'practice_test';
  videoUrl?: string; slideUrl?: string; content?: string; transcript?: string; quizData?: QuizQuestion[];
  resources: ResourceItem[]; isOpen?: boolean;
}
interface Module { id: string; title: string; items: ContentItem[]; isOpen?: boolean; }

export default function LearningPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const courseId = params?.id as string

  // --- STATE ---
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [course, setCourse] = useState<any>(null)
  const [completedLectures, setCompletedLectures] = useState<Set<string>>(new Set())
  const [activeLectureId, setActiveLectureId] = useState<string | null>(null)
  
  // Tabs State (AI / Transcript / Resources)
  const [activeTab, setActiveTab] = useState<'ai' | 'transcript' | 'resources'>('ai')

  // Offline State
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [offlineReadyIds, setOfflineReadyIds] = useState<Set<string>>(new Set())
  const [localVideoUrl, setLocalVideoUrl] = useState<string | null>(null)

  // AI State
  const [aiSummary, setAiSummary] = useState("")
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [aiInput, setAiInput] = useState('')
  const [aiMessages, setAiMessages] = useState<{role: 'user'|'ai', text: string}[]>([
    { role: 'ai', text: "Hi! I'm your Grove AI Tutor. Need help understanding this lesson? Ask me anything!" }
  ])

  // Reviews State
  const [reviews, setReviews] = useState<Review[]>([])
  const [userRating, setUserRating] = useState(0)
  const [userComment, setUserComment] = useState("")
  const [isPostingReview, setIsPostingReview] = useState(false)

  // Refs
  const activeLectureRef = useRef<HTMLDivElement>(null)
  const curriculumRef = useRef<HTMLDivElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Scroll AI Chat to bottom
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }) }, [aiMessages])

  // --- 1. DATA FETCHING ---
  useEffect(() => {
    if (!courseId) return

    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user && !navigator.onLine) {
             console.log("Offline mode detected")
        } else if (!user) {
             return router.push('/auth')
        }
        setUser(user)

        // A. Fetch Course Details
        const { data: courseData, error } = await supabase
            .from('courses')
            .select('*, profiles(full_name, avatar_url, bio)') 
            .eq('id', courseId)
            .single()

        if (error || !courseData) throw new Error("Course load failed")
        setCourse(courseData)

        // B. Fetch Progress
        if (user) {
            const { data: progressData } = await supabase
                .from('course_progress')
                .select('lecture_id')
                .eq('user_id', user.id)
                .eq('course_id', courseId)
            setCompletedLectures(new Set(progressData?.map((p: any) => p.lecture_id) || []))
        }

        // C. Fetch Reviews
        const { data: reviewsData } = await supabase
            .from('reviews')
            .select('*, profiles(full_name, avatar_url)')
            .eq('course_id', courseId)
            .order('created_at', { ascending: false })
        
        setReviews(reviewsData || [])

        // D. Initialize Active Lecture
        const curriculum = getCurriculum(courseData)
        if (curriculum.length > 0) {
            const allLectures = curriculum.flatMap((s:Module) => s.items)
            const firstIncomplete = allLectures.find((l:ContentItem) => !completedLectures.has(l.id))
            setActiveLectureId(firstIncomplete?.id || allLectures[0]?.id)
            checkOfflineAvailability(allLectures)
        }

      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [courseId, supabase, router])

  // --- 2. OFFLINE MANAGER (IndexedDB) ---
  const checkOfflineAvailability = async (allLectures: ContentItem[]) => {
      const readyIds = new Set<string>()
      for (const lecture of allLectures) {
          if (lecture.type !== 'video' && lecture.type !== 'video_slide') continue // Only videos cache
          const blob = await get(`video-${lecture.id}`)
          if (blob) readyIds.add(lecture.id)
      }
      setOfflineReadyIds(readyIds)
  }

  // Load video from DB or Network
  useEffect(() => {
    const loadVideo = async () => {
        setLocalVideoUrl(null)
        setAiSummary("") // Reset AI on change
        setAiMessages([{ role: 'ai', text: "Hi! I'm your Grove AI Tutor. Need help understanding this lesson? Ask me anything!" }])
        if (!activeLectureId) return

        const activeData = getActiveLectureData()
        if (activeData?.type !== 'video' && activeData?.type !== 'video_slide') return

        const blob = await get(`video-${activeLectureId}`)
        if (blob) {
            console.log("Playing from secure offline storage")
            setLocalVideoUrl(URL.createObjectURL(blob))
        } 
    }
    loadVideo()
  }, [activeLectureId])

  const handleDownloadOffline = async (lecture: ContentItem) => {
      if (!lecture?.videoUrl) return
      setDownloadingId(lecture.id)
      
      try {
          const response = await fetch(lecture.videoUrl, { mode: 'cors' })
          if (!response.ok) throw new Error('Network error')
          const blob = await response.blob()
          await set(`video-${lecture.id}`, blob)
          setOfflineReadyIds(prev => new Set(prev).add(lecture.id))
          alert("Securely saved! You can watch this offline.")
      } catch (e: any) {
          console.error("Download failed:", e)
          alert("Download failed. Check internet connection.")
      } finally {
          setDownloadingId(null)
      }
  }

  // --- 3. AI SUMMARY (MOCK API) ---
  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if(!aiInput.trim()) return
    
    const userText = aiInput
    setAiMessages(prev => [...prev, {role: 'user', text: userText}])
    setAiInput('')
    setIsAiLoading(true)

    // Simulate AI response delay
    setTimeout(() => {
      const lec = getActiveLectureData()
      setAiMessages(prev => [...prev, {
        role: 'ai', 
        text: `Based on "${lec?.title}", here is a detailed answer to your question. You can review the transcript tab or the resources tab for more context!` 
      }])
      setIsAiLoading(false)
    }, 1500)
  }

  // --- 4. REVIEWS LOGIC ---
  const handlePostReview = async () => {
      if (userRating === 0) return alert("Please select a rating")
      setIsPostingReview(true)

      const newReview = { user_id: user.id, course_id: courseId, rating: userRating, comment: userComment }
      const { data, error } = await supabase.from('reviews').insert(newReview).select('*, profiles(full_name, avatar_url)').single()

      if (!error && data) {
          setReviews([data, ...reviews])
          setUserComment("")
          setUserRating(0)
      } else {
          alert("Failed to post review.")
      }
      setIsPostingReview(false)
  }

  // --- HELPERS ---
  const getCurriculum = (c = course) => {
      if(!c) return []
      const data = Array.isArray(c.curriculum_data) ? c.curriculum_data : JSON.parse(c.curriculum_data || '[]')
      // Map old 'lectures' to new 'items' structure gracefully just in case
      return data.map((mod:any) => ({...mod, items: mod.items || mod.lectures || []}))
  }
  const getAllLectures = () => getCurriculum().flatMap((s:Module) => s.items)
  const getActiveLectureData = () => getAllLectures().find((l:ContentItem) => l.id === activeLectureId)
  const isCompleted = (id: string) => completedLectures.has(id)
  const instructor = Array.isArray(course?.profiles) ? course.profiles[0] : course?.profiles

  const handleMarkComplete = async () => {
    if (!activeLectureId) return
    setCompletedLectures(prev => new Set(prev).add(activeLectureId))
    if (user) {
        await supabase.from('course_progress').upsert({ user_id: user.id, course_id: courseId, lecture_id: activeLectureId })
    }
    // Auto-advance
    const all = getAllLectures()
    const idx = all.findIndex((l:ContentItem) => l.id === activeLectureId)
    if (idx < all.length - 1) setTimeout(() => setActiveLectureId(all[idx + 1].id), 800)
  }

  if (loading) return <div className="h-screen bg-[#050505] flex items-center justify-center"><Loader2 className="animate-spin text-emerald-500 w-10 h-10"/></div>

  const progressPercent = Math.round((completedLectures.size / (getAllLectures().length || 1)) * 100)
  const averageRating = reviews.length ? (reviews.reduce((a, b) => a + b.rating, 0) / reviews.length).toFixed(1) : "New"

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-emerald-500/30">
      
      {/* 1. HERO SECTION */}
      <section className="relative h-[85vh] w-full flex items-end pb-20">
         <div className="absolute inset-0 z-0">
             <Image src={course?.thumbnail_url || "/placeholder.jpg"} alt={course?.title} fill className="object-cover opacity-50" priority />
             <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/80 to-black/30" />
         </div>
         <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-50">
            <Link href="/dashboard" className="p-3 bg-black/20 backdrop-blur-md rounded-full border border-white/10 hover:bg-white/10 transition-all text-white"><ArrowLeft size={20} /></Link>
            <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                <span className="text-xs font-bold text-emerald-400">{progressPercent}% Complete</span>
                <div className="w-20 h-1 bg-white/20 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${progressPercent}%` }} /></div>
            </div>
         </div>
         <div className="relative z-10 px-6 md:px-12 max-w-7xl mx-auto w-full">
             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
                 <div className="flex gap-2 mb-4">
                    <span className="px-3 py-1 bg-emerald-500 text-black text-xs font-bold uppercase tracking-wider rounded-md">{course?.category || 'Masterclass'}</span>
                    <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-bold uppercase tracking-wider rounded-md flex items-center gap-1"><Star size={12} fill="currentColor"/> {averageRating}</span>
                 </div>
                 <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight max-w-4xl">{course?.title}</h1>
                 <button onClick={() => curriculumRef.current?.scrollIntoView({ behavior: 'smooth' })} className="group bg-white text-black px-8 py-4 rounded-full font-bold text-lg flex items-center gap-3 hover:bg-emerald-400 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                    <PlayCircle size={24} fill="black" /> Resume Learning
                 </button>
             </motion.div>
         </div>
      </section>

      {/* 2. REVAMPED CURRICULUM FEED */}
      <section ref={curriculumRef} className="max-w-5xl mx-auto px-4 md:px-6 py-20 relative z-20">
        <h2 className="text-2xl font-bold mb-8 flex items-center gap-3"><FileText className="text-emerald-500" /> Course Curriculum</h2>
        
        <div className="space-y-8">
            {getCurriculum().map((section: Module, sIdx: number) => (
                <div key={section.id} className="space-y-4">
                    <div className="flex items-center gap-4 py-2 sticky top-0 bg-[#050505]/95 backdrop-blur-md z-30 border-b border-white/5">
                        <span className="text-4xl font-black text-white/5">0{sIdx + 1}</span>
                        <div><h3 className="font-bold text-lg text-zinc-200">{section.title}</h3><p className="text-xs text-zinc-500 uppercase tracking-widest">{section.items.length} Lessons</p></div>
                    </div>
                    
                    <div className="space-y-4 pl-0 md:pl-12">
                        {section.items.map((item: ContentItem, lIdx: number) => {
                            const isActive = activeLectureId === item.id
                            const isDone = isCompleted(item.id)
                            const isOffline = offlineReadyIds.has(item.id)
                            const isDownloading = downloadingId === item.id
                            const TypeIcon = item.type === 'video' ? PlayCircle : item.type === 'article' ? FileText : item.type === 'video_slide' ? Presentation : ListChecks

                            return (
                                <motion.div
                                    key={item.id}
                                    ref={isActive ? activeLectureRef : null}
                                    initial={false}
                                    animate={{ backgroundColor: isActive ? "rgba(255,255,255,0.02)" : "transparent", borderColor: isActive ? "rgba(16, 185, 129, 0.3)" : "rgba(255,255,255,0.05)" }}
                                    className={`rounded-3xl border overflow-hidden transition-all duration-500 ${isActive ? 'shadow-2xl backdrop-blur-xl' : 'hover:bg-white/5'}`}
                                >
                                    {/* Item Header */}
                                    <div onClick={() => setActiveLectureId(isActive ? null : item.id)} className="w-full flex items-center justify-between p-6 cursor-pointer">
                                        <div className="flex items-center gap-5">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${isDone ? 'bg-emerald-600 border-emerald-600 text-white' : isActive ? 'border-emerald-500 text-emerald-500 bg-emerald-500/10' : 'border-white/10 text-zinc-500 bg-black/50'}`}>
                                                {isDone ? <Check size={20} strokeWidth={3} /> : <span className="font-bold">{lIdx + 1}</span>}
                                            </div>
                                            <div>
                                                <h4 className={`font-bold text-lg ${isActive ? 'text-white' : 'text-zinc-400'}`}>{item.title}</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                   <span className="flex items-center gap-1 text-[10px] text-zinc-500 uppercase font-bold tracking-widest"><TypeIcon size={12}/> {item.type.replace('_', ' ')}</span>
                                                   {isActive && <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold animate-pulse">Active</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {isOffline && <div title="Available Offline"><WifiOff size={16} className="text-emerald-500" /></div>}
                                            <ChevronDown size={20} className={`text-zinc-600 transition-transform ${isActive ? 'rotate-180 text-emerald-500' : ''}`} />
                                        </div>
                                    </div>

                                    {/* Expanded Glassmorphism Classroom Content */}
                                    <AnimatePresence>
                                        {isActive && (
                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                                                <div className="px-6 pb-8">
                                                    
                                                    {/* Dynamic Content Renderer */}
                                                    <div className="relative bg-black border border-white/10 rounded-2xl overflow-hidden shadow-2xl mb-6">
                                                        <ContentRenderer item={item} localVideoUrl={localVideoUrl} onComplete={handleMarkComplete} />
                                                    </div>

                                                    {/* Tools & AI Grid */}
                                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                                        
                                                        {/* Left: Tools Tabs */}
                                                        <div className="lg:col-span-2 bg-black/40 backdrop-blur-md rounded-2xl p-5 border border-white/5">
                                                            <div className="flex gap-6 border-b border-white/10 pb-2 mb-4 overflow-x-auto custom-scrollbar">
                                                                <button onClick={() => setActiveTab('ai')} className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 pb-1 transition-colors whitespace-nowrap ${activeTab === 'ai' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-zinc-500 hover:text-zinc-300'}`}><Sparkles size={14}/> AI Tutor</button>
                                                                <button onClick={() => setActiveTab('transcript')} className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 pb-1 transition-colors whitespace-nowrap ${activeTab === 'transcript' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-zinc-500 hover:text-zinc-300'}`}><Captions size={14}/> Transcript</button>
                                                                <button onClick={() => setActiveTab('resources')} className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 pb-1 transition-colors whitespace-nowrap ${activeTab === 'resources' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-zinc-500 hover:text-zinc-300'}`}><FileText size={14}/> Resources <span className="bg-white/10 px-1.5 py-0.5 rounded-full text-[10px]">{item.resources?.length || 0}</span></button>
                                                            </div>
                                                            
                                                            <div className="h-[200px] overflow-y-auto custom-scrollbar pr-2">
                                                              {activeTab === 'ai' && (
                                                                  <div className="flex flex-col h-full">
                                                                     <div className="flex-1 space-y-3 overflow-y-auto mb-3">
                                                                         {aiMessages.map((msg, i) => (
                                                                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                                               <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white/10 text-zinc-200 border border-white/5 rounded-bl-sm'}`}>
                                                                                  {msg.text}
                                                                               </div>
                                                                            </div>
                                                                         ))}
                                                                         {isAiLoading && (
                                                                            <div className="flex justify-start"><div className="p-3 bg-white/10 border border-white/5 rounded-2xl rounded-bl-sm flex gap-1"><div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce"/><div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce delay-75"/><div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce delay-150"/></div></div>
                                                                         )}
                                                                         <div ref={chatEndRef}/>
                                                                     </div>
                                                                     <form onSubmit={handleAiSubmit} className="flex gap-2 relative mt-auto">
                                                                        <input value={aiInput} onChange={e=>setAiInput(e.target.value)} placeholder="Ask a question about this lesson..." className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 transition-colors text-white" />
                                                                        <button type="submit" disabled={!aiInput.trim() || isAiLoading} className="px-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 transition-colors disabled:opacity-50"><Send size={18}/></button>
                                                                     </form>
                                                                  </div>
                                                              )}

                                                              {activeTab === 'transcript' && (
                                                                  <div className="text-sm text-zinc-400 leading-relaxed font-serif">
                                                                      {item.transcript || "No transcript is available for this lesson yet."}
                                                                  </div>
                                                              )}

                                                              {activeTab === 'resources' && (
                                                                  <div className="space-y-3">
                                                                    {(!item.resources || item.resources.length === 0) && <p className="text-zinc-500 italic text-sm">No downloadable resources attached to this lesson.</p>}
                                                                    {item.resources?.map(res => (
                                                                       <a key={res.id} href={res.url} target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-purple-500/50 transition-colors group">
                                                                          <div className="flex items-center gap-4">
                                                                             <div className="p-3 bg-black/50 rounded-lg text-zinc-400 group-hover:text-purple-400 transition-colors">
                                                                                {res.type === 'file' ? <FileText size={20}/> : res.type === 'code' ? <FileCode size={20}/> : <LinkIcon size={20}/>}
                                                                             </div>
                                                                             <div><h4 className="font-bold text-sm">{res.title || 'Untitled Resource'}</h4><p className="text-xs text-zinc-500 uppercase">{res.type}</p></div>
                                                                          </div>
                                                                          <Download size={18} className="text-zinc-600 group-hover:text-white transition-colors"/>
                                                                       </a>
                                                                    ))}
                                                                  </div>
                                                              )}
                                                            </div>
                                                        </div>

                                                        {/* Right: Actions */}
                                                        <div className="flex flex-col gap-3">
                                                            <button onClick={handleMarkComplete} disabled={isDone} className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${isDone ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30' : 'bg-white text-black hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.2)]'}`}>
                                                                {isDone ? <><CheckCircle2 size={18}/> Completed</> : 'Mark Complete'}
                                                            </button>
                                                            {(item.type === 'video' || item.type === 'video_slide') && (
                                                              <button onClick={() => handleDownloadOffline(item)} disabled={isOffline || isDownloading} className={`w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border transition-all ${isOffline ? 'bg-black/50 border-transparent text-zinc-500' : 'border-white/10 hover:bg-white/5 backdrop-blur-sm'}`}>
                                                                  {isDownloading ? <Loader2 size={16} className="animate-spin"/> : isOffline ? <Shield size={16}/> : <Download size={16}/>} 
                                                                  {isOffline ? 'Saved Securely' : 'Save Offline'}
                                                              </button>
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
      </section>

      {/* --- 3. REVIEWS SECTION (Real Data) --- */}
      <section className="py-20 bg-neutral-900 border-y border-white/5 relative z-10">
          <div className="max-w-5xl mx-auto px-6">
              <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center gap-4">
                      <div className="p-3 bg-yellow-500/10 rounded-xl text-yellow-500"><Star size={24} fill="currentColor" /></div>
                      <div><h2 className="text-2xl font-bold text-white">Student Reviews</h2><p className="text-zinc-400 text-sm">Real feedback from students</p></div>
                  </div>
              </div>

              {/* Review Input */}
              <div className="bg-black border border-white/10 p-6 rounded-2xl mb-10 shadow-xl">
                  <h3 className="text-white font-bold mb-4">Write a Review</h3>
                  <div className="flex gap-2 mb-4">
                      {[1, 2, 3, 4, 5].map((star) => (
                          <button key={star} onClick={() => setUserRating(star)} className={`${userRating >= star ? 'text-yellow-500' : 'text-zinc-700 hover:text-zinc-500 transition-colors'}`}>
                              <Star size={24} fill="currentColor" />
                          </button>
                      ))}
                  </div>
                  <textarea 
                      value={userComment} 
                      onChange={(e) => setUserComment(e.target.value)} 
                      placeholder="Share your experience..." 
                      className="w-full bg-zinc-900/50 border border-white/10 rounded-xl p-4 text-white text-sm focus:border-emerald-500 outline-none resize-none h-24 mb-4 transition-colors"
                  />
                  <button onClick={handlePostReview} disabled={isPostingReview} className="bg-white text-black px-6 py-3 rounded-full font-bold text-sm hover:bg-zinc-200 transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                      {isPostingReview ? <Loader2 className="animate-spin" size={16}/> : <Send size={16}/>} Post Review
                  </button>
              </div>

              {/* Reviews List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {reviews.map((review) => (
                      <div key={review.id} className="bg-black/50 border border-white/5 p-6 rounded-2xl backdrop-blur-sm">
                          <div className="flex items-center gap-3 mb-4">
                              <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden relative border border-white/10 shrink-0">
                                  {review.profiles?.avatar_url ? <Image src={review.profiles.avatar_url} alt="" fill className="object-cover"/> : <div className="flex items-center justify-center h-full text-zinc-500 font-bold">U</div>}
                              </div>
                              <div>
                                  <h4 className="font-bold text-white text-sm">{review.profiles?.full_name || 'Student'}</h4>
                                  <div className="flex text-yellow-500 text-[10px] gap-0.5 mt-1">
                                      {[...Array(review.rating)].map((_, i) => <Star key={i} size={10} fill="currentColor"/>)}
                                  </div>
                              </div>
                          </div>
                          <p className="text-zinc-400 text-sm leading-relaxed font-serif italic">"{review.comment}"</p>
                      </div>
                  ))}
                  {reviews.length === 0 && <p className="text-zinc-500 italic col-span-2 text-center py-8">No reviews yet. Be the first!</p>}
              </div>
          </div>
      </section>

      {/* --- 4. INSTRUCTOR SECTION --- */}
      <section className="py-20 max-w-5xl mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-10 bg-gradient-to-br from-neutral-900/80 to-black/80 backdrop-blur-xl border border-white/10 p-8 md:p-12 rounded-3xl shadow-2xl">
              <div className="relative w-40 h-40 shrink-0">
                  {instructor?.avatar_url ? (
                      <Image src={instructor.avatar_url} alt="Instructor" fill className="object-cover rounded-full border-4 border-emerald-500/20" />
                  ) : (
                      <div className="w-full h-full bg-zinc-800 rounded-full flex items-center justify-center border-4 border-white/5 shadow-[0_0_30px_rgba(255,255,255,0.1)]"><span className="text-4xl">👨‍🏫</span></div>
                  )}
              </div>
              <div className="text-center md:text-left">
                  <h2 className="text-3xl font-bold text-white mb-2">{instructor?.full_name || "Grove Instructor"}</h2>
                  <p className="text-emerald-400 font-bold text-xs uppercase tracking-widest mb-4 bg-emerald-500/10 inline-block px-3 py-1 rounded-md">Course Creator</p>
                  <p className="text-zinc-400 leading-relaxed mb-6 max-w-xl">{instructor?.bio || "Passionate about empowering the next generation of creators through accessible, high-quality education on Grove Academy."}</p>
              </div>
          </div>
      </section>

      <Footer />
    </div>
  )
}

// --- SUB-COMPONENT: Dynamic Content Renderer ---
function ContentRenderer({ item, localVideoUrl, onComplete }: { item: ContentItem, localVideoUrl: string | null, onComplete: () => void }) {
  
  if (item.type === 'video' || item.type === 'video_slide') {
    return (
      <div className="w-full aspect-video flex bg-black relative group">
         {/* Video Area */}
         <div className="flex-1 flex items-center justify-center bg-black relative">
            {item.videoUrl || localVideoUrl ? (
               <video src={localVideoUrl || item.videoUrl} controls autoPlay className="w-full h-full object-contain" onEnded={onComplete} controlsList="nodownload" onContextMenu={e=>e.preventDefault()} />
            ) : (
               <div className="text-center text-zinc-600"><PlayCircle size={48} className="mx-auto mb-4 opacity-50"/><p>No video source attached.</p></div>
            )}
         </div>
         
         {/* Split Slide Area (if applicable) */}
         {item.type === 'video_slide' && (
            <div className="w-1/2 border-l border-white/10 bg-zinc-900 flex items-center justify-center p-4 relative">
               {item.slideUrl ? (
                  <iframe src={`${item.slideUrl}#toolbar=0`} className="w-full h-full rounded-xl bg-white shadow-inner" title="Presentation Slide" />
               ) : (
                  <div className="text-center text-zinc-600"><Presentation size={48} className="mx-auto mb-4 opacity-50"/><p>No slide attached.</p></div>
               )}
            </div>
         )}
      </div>
    )
  }

  if (item.type === 'article') {
    return (
      <div className="w-full min-h-[500px] bg-zinc-950 p-10 lg:p-16 relative overflow-hidden">
         {/* Decorative Article Background */}
         <div className="absolute top-0 right-0 p-32 bg-blue-500/5 blur-3xl rounded-full pointer-events-none" />
         <div className="max-w-3xl mx-auto space-y-6 relative z-10">
            <h1 className="text-3xl md:text-5xl font-black mb-8 leading-tight">{item.title}</h1>
            <div className="w-20 h-1 bg-emerald-500 rounded-full mb-8" />
            <div className="text-zinc-300 leading-relaxed text-lg whitespace-pre-wrap font-serif">
               {item.content || <span className="italic text-zinc-600">No article content written yet.</span>}
            </div>
            <div className="pt-12 mt-12 flex justify-end">
               <button onClick={onComplete} className="px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-500 transition-colors flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)]">Mark as Read <CheckCircle2 size={18}/></button>
            </div>
         </div>
      </div>
    )
  }

  if (item.type === 'quiz' || item.type === 'practice_test') {
    return <QuizRenderer quizData={item.quizData || []} onComplete={onComplete} />
  }

  return <div className="text-zinc-500 aspect-video flex items-center justify-center w-full bg-black">Unsupported content type.</div>
}

// --- SUB-COMPONENT: Interactive Quiz Engine ---
function QuizRenderer({ quizData, onComplete }: { quizData: QuizQuestion[], onComplete: () => void }) {
  const [currentQ, setCurrentQ] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [showAnswer, setShowAnswer] = useState(false)
  const [score, setScore] = useState(0)

  if (!quizData || quizData.length === 0) return <div className="text-zinc-500 aspect-video flex items-center justify-center bg-zinc-950">No questions in this quiz.</div>

  const q = quizData[currentQ]
  const isFinished = currentQ >= quizData.length

  const handleCheck = () => {
    if (selected === null) return
    if (selected === q.correctIndex) setScore(s => s + 1)
    setShowAnswer(true)
  }

  const handleNext = () => {
    setSelected(null)
    setShowAnswer(false)
    setCurrentQ(c => c + 1)
  }

  if (isFinished) {
    const passed = score / quizData.length >= 0.7
    return (
       <div className="text-center animate-in zoom-in fade-in duration-500 py-20 bg-zinc-950">
          <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6 border-4 ${passed ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-red-500/20 border-red-500 text-red-400'}`}>
             <ListChecks size={48}/>
          </div>
          <h2 className="text-3xl font-black mb-2">{passed ? 'Great Job!' : 'Keep Practicing'}</h2>
          <p className="text-zinc-400 text-lg mb-8">You scored {score} out of {quizData.length}</p>
          <button onClick={onComplete} className="px-8 py-4 bg-white text-black font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.2)]">Continue Course</button>
       </div>
    )
  }

  return (
    <div className="w-full bg-zinc-950 p-8 md:p-12 relative overflow-hidden">
       <div className="absolute top-0 right-0 p-32 bg-emerald-500/5 blur-3xl rounded-full pointer-events-none" />
       <div className="max-w-3xl mx-auto relative z-10 animate-in fade-in slide-in-from-bottom-8">
           <div className="mb-8 flex items-center justify-between text-sm font-bold text-zinc-500 uppercase tracking-wider">
              <span>Question {currentQ + 1} of {quizData.length}</span>
              <span>Score: {score}</span>
           </div>
           
           <h2 className="text-2xl md:text-3xl font-bold text-white mb-8 leading-snug">{q.question}</h2>
           
           <div className="space-y-3 mb-10">
              {q.options.map((opt, idx) => {
                 const isCorrect = showAnswer && idx === q.correctIndex
                 const isWrong = showAnswer && selected === idx && idx !== q.correctIndex
                 let borderClass = 'border-white/10 hover:border-white/30 hover:bg-white/5'
                 if (selected === idx && !showAnswer) borderClass = 'border-blue-500 bg-blue-500/10 text-blue-100 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                 if (isCorrect) borderClass = 'border-emerald-500 bg-emerald-500/20 text-emerald-100 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                 if (isWrong) borderClass = 'border-red-500 bg-red-500/20 text-red-100 shadow-[0_0_15px_rgba(239,68,68,0.2)]'

                 return (
                   <button 
                     key={idx} 
                     disabled={showAnswer}
                     onClick={() => setSelected(idx)} 
                     className={`w-full text-left p-5 rounded-2xl border-2 transition-all flex items-center justify-between ${borderClass}`}
                   >
                      <span className="font-medium text-lg">{opt}</span>
                      {isCorrect && <CheckCircle2 size={24} className="text-emerald-500 shrink-0"/>}
                      {isWrong && <X size={24} className="text-red-500 shrink-0"/>}
                   </button>
                 )
              })}
           </div>

           {!showAnswer ? (
              <button onClick={handleCheck} disabled={selected === null} className="w-full py-5 bg-blue-600 text-white font-black text-lg rounded-xl hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(59,130,246,0.3)]">Check Answer</button>
           ) : (
              <button onClick={handleNext} className="w-full py-5 bg-white text-black font-black text-lg rounded-xl hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.2)]">Next Question <ArrowRight size={20}/></button>
           )}
       </div>
    </div>
  )
}