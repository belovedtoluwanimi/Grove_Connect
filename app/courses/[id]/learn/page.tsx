'use client'

import React, { useState, useEffect, useRef } from 'react'
import { 
  PlayCircle, CheckCircle2, ChevronDown, Check, Loader2, ArrowLeft, 
  Sparkles, FileText, Download, WifiOff, Star, Shield, AlertTriangle,
  Captions, Trash2, Send, Presentation, ListChecks, ArrowRight, Bot, X, FileCode, Link as LinkIcon,
  Search, MessageCircle, Megaphone, Edit3, Calendar, BookOpen, ChevronUp, FileArchive, Globe, Twitter, Linkedin, Youtube
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/app/utils/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { set, get } from 'idb-keyval' 
import Footer from '@/app/components/Footer'

// --- TYPES ---
type Review = { id: string; rating: number; comment: string; created_at: string; user_id: string; profiles?: { full_name: string, avatar_url: string } }
interface QuizQuestion { id: string; question: string; options: string[]; correctIndex: number; }
interface ResourceItem { id: string; type: 'file' | 'link' | 'code'; title: string; url: string; }
interface ContentItem {
  id: string; title: string; type: 'video' | 'video_slide' | 'article' | 'quiz' | 'practice_test';
  videoUrl?: string; slideUrl?: string; content?: string; transcript?: string; quizData?: QuizQuestion[];
  resources: ResourceItem[]; isOpen?: boolean;
}
interface Module { id: string; title: string; items: ContentItem[]; isOpen?: boolean; }
type TabType = 'overview' | 'qna' | 'notes' | 'announcements' | 'reviews' | 'tools' | 'ai' | 'resources'

// Simple Toast Helper
function addToast(message: string, type: "success" | "error" | "info" = "info") {
    if (typeof window !== "undefined") {
        if (type === "error") window.alert(`[ERROR] ${message}`)
        else console.log(`[${type.toUpperCase()}] ${message}`)
    }
}

export default function LearningPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  
  // Bulletproof param fetching whether the folder is [id] or [courseId]
  const courseId = (params?.id || params?.courseId) as string

  // --- STATE ---
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [courseError, setCourseError] = useState(false)
  const [course, setCourse] = useState<any>(null)
  const [completedLectures, setCompletedLectures] = useState<Set<string>>(new Set())
  const [activeLectureId, setActiveLectureId] = useState<string | null>(null)
  
  // Layout & UI
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [searchQuery, setSearchQuery] = useState("")

  // Offline State
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [offlineReadyIds, setOfflineReadyIds] = useState<Set<string>>(new Set())
  const [localVideoUrl, setLocalVideoUrl] = useState<string | null>(null)

  // AI & Notes
  const [aiInput, setAiInput] = useState('')
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [aiMessages, setAiMessages] = useState<{role: 'user'|'ai', text: string}[]>([{ role: 'ai', text: "Hi! I'm your Grove AI Tutor. Ask me anything about this lecture!" }])
  const [lectureNote, setLectureNote] = useState("")

  // Reviews
  const [reviews, setReviews] = useState<Review[]>([])
  const [userRating, setUserRating] = useState(0)
  const [userComment, setUserComment] = useState("")
  const [isPostingReview, setIsPostingReview] = useState(false)

  // Refs
  const chatEndRef = useRef<HTMLDivElement>(null)
  const activeLectureRef = useRef<HTMLDivElement>(null)

  // Scroll AI Chat
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }) }, [aiMessages])

  // --- 1. DATA FETCHING (BULLETPROOF) ---
  useEffect(() => {
    if (!courseId) return

    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user && !navigator.onLine) { console.log("Offline mode") } 
        else if (!user) { return router.push('/auth') }
        setUser(user)

        // 1. Fetch Course with graceful fallback
        let { data: courseData, error } = await supabase.from('courses')
            .select('*, profiles(full_name, avatar_url, bio, website, twitter, linkedin, youtube)')
            .eq('id', courseId).single()
            
        // Fallback: If joining 'profiles' fails, try fetching without it
        if (error) {
            console.warn("Profile join failed, fetching course only...", error)
            const fallback = await supabase.from('courses').select('*').eq('id', courseId).single()
            if (fallback.error) throw fallback.error
            courseData = fallback.data
        }
        
        if (!courseData) throw new Error("No course data found")
        
        // 2. Safely parse JSON properties
        let formattedCurriculum = []
        try {
            const parsedData = Array.isArray(courseData.curriculum_data) ? courseData.curriculum_data : JSON.parse(courseData.curriculum_data || '[]')
            formattedCurriculum = parsedData.map((m:any) => ({...m, isOpen: true, items: m.items || m.lectures || []}))
        } catch (e) { console.error("Curriculum parse error") }
        
        let parsedObjectives = []
        try {
            parsedObjectives = Array.isArray(courseData.objectives) ? courseData.objectives : JSON.parse(courseData.objectives || '[]')
        } catch (e) { console.error("Objectives parse error") }

        setCourse({...courseData, curriculum_data: formattedCurriculum, objectives: parsedObjectives})

        // 3. Fetch Progress safely
        let progressData: any[] = [];
        if (user) {
            const { data: progress } = await supabase.from('course_progress').select('lecture_id').eq('user_id', user.id).eq('course_id', courseId)
            progressData = progress || [];
            setCompletedLectures(new Set(progressData.map((p: any) => p.lecture_id)))
        }
        
        // 4. Fetch Reviews safely
        try {
            const { data: reviewsData } = await supabase.from('reviews').select('*, profiles(full_name, avatar_url)').eq('course_id', courseId).order('created_at', { ascending: false })
            setReviews(reviewsData || [])
        } catch (e) { console.warn("Reviews fetch failed") }

        // 5. Initialize Active Lecture
        if (formattedCurriculum.length > 0) {
            const allLectures = formattedCurriculum.flatMap((s:Module) => s.items)
            const firstIncomplete = allLectures.find((l:ContentItem) => !progressData.map((p:any)=>p.lecture_id).includes(l.id))
            setActiveLectureId(firstIncomplete?.id || allLectures[0]?.id)
            checkOfflineAvailability(allLectures)
        }

      } catch (err) { 
          console.error("Initialization Failed:", err)
          setCourseError(true)
      } finally { 
          setLoading(false) 
      }
    }
    init()
  }, [courseId, supabase, router])

  // --- 2. OFFLINE & VIDEO MANAGEMENT ---
  const checkOfflineAvailability = async (allLectures: ContentItem[]) => {
      const readyIds = new Set<string>()
      for (const lecture of allLectures) {
          if (lecture.type !== 'video' && lecture.type !== 'video_slide') continue
          const blob = await get(`video-${courseId}-${lecture.id}`) 
          if (blob) readyIds.add(lecture.id)
      }
      setOfflineReadyIds(readyIds)
  }

  useEffect(() => {
    const loadVideoAndNotes = async () => {
        setLocalVideoUrl(null)
        setAiMessages([{ role: 'ai', text: "Hi! I'm your Grove AI Tutor. Need help understanding this lesson? Ask me anything!" }])
        
        if (!activeLectureId) return

        // Load Notes
        const noteKey = `note-${user?.id}-${courseId}-${activeLectureId}`
        const savedNote = localStorage.getItem(noteKey)
        setLectureNote(savedNote || "")

        // Load Offline Video
        const activeData = getActiveLectureData()
        if (activeData?.type === 'video' || activeData?.type === 'video_slide') {
            const blob = await get(`video-${courseId}-${activeLectureId}`)
            if (blob) setLocalVideoUrl(URL.createObjectURL(blob))
        } 
    }
    loadVideoAndNotes()
  }, [activeLectureId, courseId, user?.id])

  const handleDownloadOffline = async (lecture: ContentItem) => {
      if (!lecture?.videoUrl) return
      setDownloadingId(lecture.id)
      try {
          const response = await fetch(lecture.videoUrl, { mode: 'cors' })
          if (!response.ok) throw new Error('Network error')
          const blob = await response.blob()
          await set(`video-${courseId}-${lecture.id}`, blob) 
          setOfflineReadyIds(prev => new Set(prev).add(lecture.id))
          addToast("Securely saved! You can watch this offline.", "success")
      } catch (e) {
          addToast("Download failed. Check internet connection or CORS permissions.", "error")
      } finally { setDownloadingId(null) }
  }

  const handleSaveNote = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value
      setLectureNote(val)
      localStorage.setItem(`note-${user?.id}-${courseId}-${activeLectureId}`, val)
  }

  // --- 3. OPEN AI INTEGRATION ---
  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if(!aiInput.trim()) return
    
    const userText = aiInput
    setAiMessages(prev => [...prev, {role: 'user', text: userText}])
    setAiInput('')
    setIsAiLoading(true)

    try {
        const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                message: userText, 
                courseContext: course?.title,
                lectureContext: getActiveLectureData()?.title 
            })
        })
        
        if (!res.ok) throw new Error("Failed to fetch AI response")
        
        const data = await res.json()
        setAiMessages(prev => [...prev, { role: 'ai', text: data.reply }])
    } catch (error) {
        console.error("AI Error:", error)
        setAiMessages(prev => [...prev, { role: 'ai', text: "Sorry, my AI connection is currently offline. Please try again later." }])
    } finally {
        setIsAiLoading(false)
    }
  }

  // --- 4. REVIEWS ---
  const handlePostReview = async () => {
      if (userRating === 0) return addToast("Please select a rating", "error")
      if (!userComment.trim()) return addToast("Please enter a comment", "error")
      
      setIsPostingReview(true)
      try {
          const newReview = { user_id: user.id, course_id: courseId, rating: userRating, comment: userComment }
          const { data, error } = await supabase.from('reviews').insert(newReview).select('*, profiles(full_name, avatar_url)').single()
          
          if (error) throw error
          
          setReviews([data, ...reviews]); setUserComment(""); setUserRating(0)
          addToast("Review posted successfully!", "success")
      } catch (err: any) {
          addToast(err.message || "Failed to post review.", "error")
      } finally {
          setIsPostingReview(false)
      }
  }

  // --- HELPERS ---
  const getCurriculum = () => course?.curriculum_data || []
  const getAllLectures = () => getCurriculum().flatMap((s:Module) => s.items)
  const getActiveLectureData = () => getAllLectures().find((l:ContentItem) => l.id === activeLectureId)
  const isCompleted = (id: string) => completedLectures.has(id)
  const instructor = Array.isArray(course?.profiles) ? course.profiles[0] : course?.profiles

  const handleMarkComplete = async () => {
    if (!activeLectureId) return
    setCompletedLectures(prev => new Set(prev).add(activeLectureId))
    if (user) await supabase.from('course_progress').upsert({ user_id: user.id, course_id: courseId, lecture_id: activeLectureId })
    const all = getAllLectures()
    const idx = all.findIndex((l:ContentItem) => l.id === activeLectureId)
    if (idx < all.length - 1) setTimeout(() => setActiveLectureId(all[idx + 1].id), 800)
  }

  const generateCalendarLink = () => {
      const title = encodeURIComponent(`Study Time: ${course?.title}`)
      const details = encodeURIComponent(`Time to continue learning your course on Grove Academy!`)
      return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}`
  }

  // --- ERROR & LOADING STATES ---
  if (loading) return <div className="h-screen bg-[#050505] flex items-center justify-center"><Loader2 className="animate-spin text-emerald-500 w-10 h-10"/></div>

  if (courseError || !course) return (
      <div className="h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="p-4 bg-red-500/10 rounded-full mb-6 border border-red-500/20"><AlertTriangle size={48} className="text-red-500"/></div>
          <h2 className="text-3xl font-bold mb-4">Course Not Found</h2>
          <p className="text-zinc-400 max-w-md mb-8">We couldn't load this course. Please ensure the URL is correct and you have permission to view it.</p>
          <button onClick={() => router.push('/dashboard')} className="px-8 py-3 bg-emerald-600 font-bold rounded-xl hover:bg-emerald-500 transition-colors">Return to Dashboard</button>
      </div>
  )

  const progressPercent = Math.round((completedLectures.size / (getAllLectures().length || 1)) * 100)
  const averageRating = reviews.length ? (reviews.reduce((a, b) => a + b.rating, 0) / reviews.length).toFixed(1) : "New"
  
  // Filter curriculum for search
  const filteredCurriculum = getCurriculum().map((section: Module) => ({
      ...section,
      items: section.items.filter(item => item.title.toLowerCase().includes(searchQuery.toLowerCase()))
  })).filter((section: Module) => section.items.length > 0)

  const activeItem = getActiveLectureData()

  return (
    <div className="h-screen bg-[#050505] text-white flex flex-col font-sans selection:bg-emerald-500/30 overflow-hidden relative">
      
      {/* --- HEADER --- */}
      <header className="h-16 shrink-0 border-b border-white/10 bg-[#0a0a0a] flex items-center justify-between px-4 lg:px-6 z-20">
          <div className="flex items-center gap-4">
              <Link href="/dashboard" className="p-2 hover:bg-white/10 rounded-full transition-colors text-zinc-400 hover:text-white"><ArrowLeft size={20}/></Link>
              <div className="h-6 w-px bg-white/10 hidden md:block" />
              <h1 className="font-bold text-sm md:text-base truncate max-w-sm md:max-w-xl">{course?.title}</h1>
          </div>
          <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-3 bg-black/40 px-3 py-1.5 rounded-full border border-white/5">
                  <Star size={14} className="text-yellow-500" fill="currentColor"/>
                  <span className="text-xs font-bold">{averageRating}</span>
              </div>
              <div className="flex items-center gap-3">
                 <div className="w-24 md:w-32 h-2 bg-zinc-900 rounded-full overflow-hidden border border-white/5">
                    <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                 </div>
                 <span className="text-xs font-bold text-emerald-500">{progressPercent}%</span>
              </div>
          </div>
      </header>

      {/* --- UDEMY STYLE SPLIT LAYOUT --- */}
      <div className="flex-1 flex overflow-hidden">
          
          {/* LEFT PANEL: Video & Tabs */}
          <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#050505] custom-scrollbar">
              
              {/* VIDEO / CONTENT RENDERER */}
              <div className="w-full bg-black aspect-video lg:max-h-[65vh] border-b border-white/10 shrink-0 relative flex items-center justify-center">
                  {!activeItem ? (
                      <div className="text-zinc-500 flex flex-col items-center gap-2"><PlayCircle size={48} className="opacity-20"/> Select a lesson to begin.</div>
                  ) : (
                      <ContentRenderer item={activeItem} localVideoUrl={localVideoUrl} onComplete={handleMarkComplete} />
                  )}
              </div>

              {/* CONTENT TABS */}
              <div className="w-full max-w-5xl mx-auto p-6 lg:p-10 shrink-0">
                  <div className="flex items-center gap-6 border-b border-white/10 overflow-x-auto custom-scrollbar pb-2 mb-8">
                      <TabBtn active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={BookOpen} label="Overview" />
                      <TabBtn active={activeTab === 'resources'} onClick={() => setActiveTab('resources')} icon={FileArchive} label={`Resources (${activeItem?.resources?.length || 0})`} />
                      <TabBtn active={activeTab === 'notes'} onClick={() => setActiveTab('notes')} icon={Edit3} label="Notes" />
                      <TabBtn active={activeTab === 'qna'} onClick={() => setActiveTab('qna')} icon={MessageCircle} label="Q&A" />
                      <TabBtn active={activeTab === 'announcements'} onClick={() => setActiveTab('announcements')} icon={Megaphone} label="Announcements" />
                      <TabBtn active={activeTab === 'reviews'} onClick={() => setActiveTab('reviews')} icon={Star} label="Reviews" />
                      <TabBtn active={activeTab === 'tools'} onClick={() => setActiveTab('tools')} icon={Calendar} label="Tools" />
                      <div className="ml-auto">
                        <button onClick={() => setActiveTab('ai')} className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-all ${activeTab === 'ai' ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20'}`}><Sparkles size={14}/> Ask AI Tutor</button>
                      </div>
                  </div>

                  <div className="animate-in fade-in slide-in-from-bottom-4 pb-20">
                      
                      {/* OVERVIEW TAB */}
                      {activeTab === 'overview' && (
                         <div className="space-y-12">
                             <div>
                                <h2 className="text-3xl font-bold mb-4">About this course</h2>
                                <p className="text-zinc-300 leading-relaxed font-serif text-lg whitespace-pre-wrap">{course?.description}</p>
                             </div>
                             
                             {/* Objectives Section */}
                             {course?.objectives && course.objectives.length > 0 && (
                                <div className="mt-8">
                                    <h3 className="text-xl font-bold mb-4">What you'll learn</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {course.objectives.map((obj: string, i: number) => (
                                            <div key={i} className="flex gap-3 items-start"><CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-1"/><span className="text-zinc-300 text-sm leading-relaxed">{obj}</span></div>
                                        ))}
                                    </div>
                                </div>
                             )}

                             <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                                <div><p className="text-xs text-zinc-500 uppercase">Skill Level</p><p className="font-bold">{course?.level || 'All Levels'}</p></div>
                                <div><p className="text-xs text-zinc-500 uppercase">Students</p><p className="font-bold">1,240</p></div>
                                <div><p className="text-xs text-zinc-500 uppercase">Language</p><p className="font-bold">{course?.language || 'English'}</p></div>
                                <div><p className="text-xs text-zinc-500 uppercase">Lectures</p><p className="font-bold">{getAllLectures().length}</p></div>
                             </div>

                             {/* Instructor Section */}
                             <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-start gap-8">
                                 <Image src={instructor?.avatar_url || '/placeholder.jpg'} alt="Instructor" width={100} height={100} className="rounded-full border-2 border-white/10 object-cover" />
                                 <div>
                                     <h3 className="text-xl font-bold text-white mb-1">{instructor?.full_name || 'Instructor'}</h3>
                                     <p className="text-emerald-400 text-sm font-bold mb-4">Course Educator</p>
                                     <p className="text-zinc-400 leading-relaxed text-sm">{instructor?.bio || "Passionate about building the next generation of creators on Grove Academy."}</p>
                                     
                                     {/* Social Links */}
                                     <div className="flex items-center gap-4 mt-4">
                                         {instructor?.website && <a href={instructor.website} target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-white transition-colors"><Globe size={18}/></a>}
                                         {instructor?.twitter && <a href={instructor.twitter} target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-blue-400 transition-colors"><Twitter size={18}/></a>}
                                         {instructor?.linkedin && <a href={instructor.linkedin} target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-blue-600 transition-colors"><Linkedin size={18}/></a>}
                                         {instructor?.youtube && <a href={instructor.youtube} target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-red-500 transition-colors"><Youtube size={18}/></a>}
                                     </div>
                                 </div>
                             </div>
                         </div>
                      )}

                      {/* RESOURCES TAB */}
                      {activeTab === 'resources' && (
                         <div className="space-y-6">
                            <h3 className="text-xl font-bold">Downloadable Resources</h3>
                            {(!activeItem?.resources || activeItem.resources.length === 0) ? (
                               <p className="text-zinc-500 bg-white/5 p-6 rounded-2xl text-center">No resources attached to this lecture.</p>
                            ) : (
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {activeItem.resources.map((res: ResourceItem) => (
                                     <a key={res.id} href={res.url} target="_blank" rel="noreferrer" className="flex items-center justify-between p-5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-emerald-500/50 transition-all group">
                                        <div className="flex items-center gap-4">
                                           <div className="p-3 bg-black/50 rounded-lg text-zinc-400 group-hover:text-emerald-400 transition-colors">
                                              {res.type === 'file' ? <FileText size={20}/> : res.type === 'code' ? <FileCode size={20}/> : <LinkIcon size={20}/>}
                                           </div>
                                           <div><h4 className="font-bold text-sm text-white">{res.title || 'Untitled Resource'}</h4><p className="text-xs text-zinc-500 uppercase mt-1">{res.type}</p></div>
                                        </div>
                                        <Download size={18} className="text-zinc-600 group-hover:text-white transition-colors"/>
                                     </a>
                                  ))}
                               </div>
                            )}
                         </div>
                      )}

                      {/* AI TUTOR TAB */}
                      {activeTab === 'ai' && (
                         <div className="bg-gradient-to-b from-blue-950/20 to-black border border-blue-500/20 rounded-3xl overflow-hidden shadow-2xl">
                             <div className="p-6 border-b border-blue-500/20 bg-blue-900/10 flex items-center gap-4">
                                 <div className="p-3 bg-blue-600 rounded-xl"><Bot size={24} className="text-white"/></div>
                                 <div><h3 className="font-bold text-lg text-white">Grove AI Assistant</h3><p className="text-blue-300 text-sm">Context-aware tutor linked to OpenAI.</p></div>
                             </div>
                             <div className="p-6 h-[400px] overflow-y-auto custom-scrollbar space-y-4">
                                 {aiMessages.map((msg, i) => (
                                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                       <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white/5 text-zinc-200 border border-white/10 rounded-bl-sm'}`}>
                                          {msg.text}
                                       </div>
                                    </div>
                                 ))}
                                 {isAiLoading && (
                                    <div className="flex justify-start"><div className="p-4 bg-white/5 border border-white/10 rounded-2xl rounded-bl-sm flex gap-1"><div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce"/><div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce delay-75"/><div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce delay-150"/></div></div>
                                 )}
                                 <div ref={chatEndRef} />
                             </div>
                             <div className="p-4 bg-black/40 border-t border-white/10">
                                 <form onSubmit={handleAiSubmit} className="flex gap-3">
                                    <input value={aiInput} onChange={e=>setAiInput(e.target.value)} placeholder={`Ask a question about "${activeItem?.title}"...`} className="flex-1 bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-sm outline-none focus:border-blue-500 text-white transition-colors" />
                                    <button type="submit" disabled={!aiInput.trim() || isAiLoading} className="px-6 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 transition-colors disabled:opacity-50 flex items-center gap-2"><Send size={18}/> Send</button>
                                 </form>
                             </div>
                         </div>
                      )}

                      {/* NOTES TAB */}
                      {activeTab === 'notes' && (
                         <div className="space-y-6">
                            <div className="flex items-center justify-between">
                               <h3 className="text-xl font-bold">My Notes</h3>
                               <span className="text-xs text-zinc-500 bg-white/5 px-3 py-1 rounded-full border border-white/10">Auto-saving locally</span>
                            </div>
                            <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-1 focus-within:border-yellow-500/50 transition-colors">
                               <textarea 
                                 value={lectureNote}
                                 onChange={handleSaveNote}
                                 placeholder={`Type your notes for ${activeItem?.title || 'this lecture'} here...`}
                                 className="w-full h-64 bg-transparent p-5 outline-none resize-none text-zinc-200 leading-relaxed"
                               />
                            </div>
                         </div>
                      )}

                      {/* Q&A TAB */}
                      {activeTab === 'qna' && (
                         <div className="space-y-8">
                            <div className="flex items-center justify-between"><h3 className="text-xl font-bold">Questions & Answers</h3><button className="text-sm font-bold text-emerald-400 hover:text-emerald-300">Ask a new question</button></div>
                            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl text-center">
                               <MessageCircle size={32} className="mx-auto text-zinc-600 mb-3"/>
                               <h4 className="font-bold text-white mb-1">No questions yet for this lecture.</h4>
                               <p className="text-sm text-zinc-400">Be the first to start a discussion!</p>
                            </div>
                         </div>
                      )}

                      {/* ANNOUNCEMENTS TAB */}
                      {activeTab === 'announcements' && (
                         <div className="space-y-6">
                             <h3 className="text-xl font-bold">Instructor Announcements</h3>
                             <div className="bg-black/40 border border-white/5 p-6 rounded-2xl">
                                 <div className="flex items-center gap-3 mb-4">
                                     <Image src={instructor?.avatar_url || '/placeholder.jpg'} alt="" width={40} height={40} className="rounded-full object-cover" />
                                     <div><h4 className="font-bold text-sm text-white">{instructor?.full_name || 'Instructor'}</h4><p className="text-xs text-zinc-500">Welcome to the course!</p></div>
                                 </div>
                                 <p className="text-zinc-300 text-sm leading-relaxed">
                                     {course?.welcome_message || "Welcome to the course! I'm so excited to have you here. Please make sure to utilize the Q&A section and the AI Tutor if you ever get stuck."}
                                 </p>
                             </div>
                         </div>
                      )}

                      {/* LEARNING TOOLS TAB */}
                      {activeTab === 'tools' && (
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-blue-900/10 border border-blue-500/20 p-6 rounded-2xl">
                                <Calendar className="text-blue-400 mb-4" size={32}/>
                                <h4 className="font-bold text-lg text-white mb-2">Schedule Learning Time</h4>
                                <p className="text-sm text-zinc-400 mb-6">Block out time on your Google Calendar to ensure you stay consistent with your goals.</p>
                                <a href={generateCalendarLink()} target="_blank" rel="noreferrer" className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors">Add to Google Calendar</a>
                            </div>
                            <div className="bg-emerald-900/10 border border-emerald-500/20 p-6 rounded-2xl">
                                <Download className="text-emerald-400 mb-4" size={32}/>
                                <h4 className="font-bold text-lg text-white mb-2">Offline Viewing</h4>
                                <p className="text-sm text-zinc-400 mb-6">Use the download button on lectures in the sidebar to securely cache videos to your browser for offline flights or commutes.</p>
                            </div>
                         </div>
                      )}

                      {/* REVIEWS TAB */}
                      {activeTab === 'reviews' && (
                         <div className="space-y-8">
                             {/* Review Input */}
                            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                                <h3 className="text-white font-bold mb-4">Leave a Rating</h3>
                                <div className="flex gap-2 mb-4">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button key={star} onClick={() => setUserRating(star)} className={`${userRating >= star ? 'text-yellow-500' : 'text-zinc-700 hover:text-zinc-500 transition-colors'}`}><Star size={28} fill="currentColor" /></button>
                                    ))}
                                </div>
                                <textarea value={userComment} onChange={(e) => setUserComment(e.target.value)} placeholder="Tell others what you thought about this course..." className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white text-sm focus:border-emerald-500 outline-none resize-none h-24 mb-4 transition-colors"/>
                                <button onClick={handlePostReview} disabled={isPostingReview} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-emerald-500 transition-colors flex items-center gap-2">
                                    {isPostingReview ? <Loader2 className="animate-spin" size={16}/> : <Send size={16}/>} Post Review
                                </button>
                            </div>

                            {/* Reviews List */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {reviews.map((review) => (
                                    <div key={review.id} className="bg-black/50 border border-white/5 p-6 rounded-2xl">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden relative border border-white/10 shrink-0">
                                                {review.profiles?.avatar_url ? <Image src={review.profiles.avatar_url} alt="" fill className="object-cover"/> : <div className="flex items-center justify-center h-full text-zinc-500 font-bold">U</div>}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-white text-sm">{review.profiles?.full_name || 'Student'}</h4>
                                                <div className="flex text-yellow-500 text-[10px] gap-0.5 mt-1">{[...Array(review.rating)].map((_, i) => <Star key={i} size={10} fill="currentColor"/>)}</div>
                                            </div>
                                        </div>
                                        <p className="text-zinc-400 text-sm leading-relaxed font-serif italic">"{review.comment}"</p>
                                    </div>
                                ))}
                                {reviews.length === 0 && <div className="col-span-1 md:col-span-2 text-center text-zinc-500 py-6">No reviews yet. Be the first to share your thoughts!</div>}
                            </div>
                         </div>
                      )}

                  </div>
              </div>
              <Footer />
          </main>

          {/* RIGHT PANEL: Udemy-Style Curriculum Sidebar */}
          <aside className="w-[400px] border-l border-white/10 bg-[#0a0a0a] flex flex-col shrink-0 relative z-20">
              <div className="p-4 border-b border-white/5 bg-[#050505] sticky top-0 z-10">
                  <h3 className="font-bold text-white mb-3">Course Content</h3>
                  <div className="relative">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                      <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search course content..." className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500 transition-colors" />
                  </div>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar pb-10">
                  {filteredCurriculum.length === 0 && <div className="p-6 text-center text-zinc-500 text-sm">No lectures found matching your search.</div>}
                  
                  {filteredCurriculum.map((section: Module, sIdx: number) => (
                      <div key={section.id} className="border-b border-white/5">
                          <button onClick={() => {
                              const newCourse = {...course}; 
                              const sec = newCourse.curriculum_data.find((s:Module) => s.id === section.id);
                              if (sec) sec.isOpen = !sec.isOpen; 
                              setCourse(newCourse)
                          }} className="w-full p-4 flex items-center justify-between bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                              <div className="flex flex-col items-start text-left max-w-[80%]">
                                  <h4 className="font-bold text-sm text-zinc-200">{section.title}</h4>
                                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">{section.items.length} Lectures</p>
                              </div>
                              {section.isOpen ? <ChevronUp size={16} className="text-zinc-500"/> : <ChevronDown size={16} className="text-zinc-500"/>}
                          </button>

                          <AnimatePresence>
                              {section.isOpen && (
                                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden bg-[#050505]">
                                      {section.items.map((item: ContentItem, lIdx: number) => {
                                          const isActive = activeLectureId === item.id
                                          const isDone = isCompleted(item.id)
                                          const isOffline = offlineReadyIds.has(item.id)
                                          const isDownloading = downloadingId === item.id
                                          const TypeIcon = item.type === 'video' ? PlayCircle : item.type === 'article' ? FileText : item.type === 'video_slide' ? Presentation : ListChecks

                                          return (
                                            <div key={item.id} ref={isActive ? activeLectureRef : null} onClick={() => setActiveLectureId(item.id)} className={`w-full p-4 flex items-start gap-3 cursor-pointer transition-colors border-l-2 ${isActive ? 'bg-white/5 border-emerald-500' : 'border-transparent hover:bg-white/[0.02]'}`}>
                                               <div className="mt-1 shrink-0">
                                                  <input type="checkbox" checked={isDone} onChange={(e) => { e.stopPropagation(); handleMarkComplete() }} className="w-4 h-4 accent-emerald-500 cursor-pointer" />
                                               </div>
                                               <div className="flex-1">
                                                  <span className={`text-sm leading-snug block mb-1.5 ${isActive ? 'font-bold text-emerald-400' : 'text-zinc-300'}`}>{item.title}</span>
                                                  <div className="flex items-center justify-between">
                                                     <span className="flex items-center gap-1.5 text-[10px] text-zinc-500 uppercase font-bold tracking-widest"><TypeIcon size={12}/> {item.type.replace('_', ' ')}</span>
                                                     {(item.type === 'video' || item.type === 'video_slide') && (
                                                        <button onClick={(e) => { e.stopPropagation(); handleDownloadOffline(item) }} disabled={isOffline || isDownloading} className={`p-1 rounded transition-colors ${isOffline ? 'text-emerald-500' : 'text-zinc-600 hover:text-white hover:bg-white/10'}`}>
                                                            {isDownloading ? <Loader2 size={14} className="animate-spin"/> : isOffline ? <Shield size={14} /> : <Download size={14} />}
                                                        </button>
                                                     )}
                                                  </div>
                                               </div>
                                            </div>
                                          )
                                      })}
                                  </motion.div>
                              )}
                          </AnimatePresence>
                      </div>
                  ))}
              </div>
          </aside>
      </div>
    </div>
  )
}

// --- SUB-COMPONENT: Dynamic Content Renderer ---
function ContentRenderer({ item, localVideoUrl, onComplete }: { item: ContentItem, localVideoUrl: string | null, onComplete: () => void }) {
  
  if (item.type === 'video' || item.type === 'video_slide') {
    // IMPORTANT FIX: Using `key={url}` forces the video component to fully unmount and remount when you switch lessons
    const videoSource = localVideoUrl || item.videoUrl || '';
    return (
      <div className="w-full h-full flex bg-black relative">
         <div className="flex-1 flex items-center justify-center bg-black relative">
            {videoSource ? (
               <video key={videoSource} src={videoSource} controls autoPlay className="w-full h-full object-contain" onEnded={onComplete} controlsList="nodownload" onContextMenu={e=>e.preventDefault()} />
            ) : (
               <div className="text-center text-zinc-600"><PlayCircle size={48} className="mx-auto mb-4 opacity-50"/><p>No video source attached.</p></div>
            )}
         </div>
         {item.type === 'video_slide' && (
            <div className="hidden lg:flex w-1/3 border-l border-white/10 bg-zinc-900 items-center justify-center p-4">
               {item.slideUrl ? (
                  <iframe key={item.slideUrl} src={`${item.slideUrl}#toolbar=0`} className="w-full h-full rounded-xl bg-white shadow-inner" title="Presentation Slide" />
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
      <div className="w-full h-full bg-[#0a0a0a] p-10 lg:p-16 overflow-y-auto custom-scrollbar relative">
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

  // Reset quiz state when switching to a new quiz lesson
  useEffect(() => {
    setCurrentQ(0); setSelected(null); setShowAnswer(false); setScore(0);
  }, [quizData])

  if (!quizData || quizData.length === 0) return <div className="text-zinc-500 h-full flex items-center justify-center bg-[#0a0a0a]">No questions in this quiz.</div>

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
       <div className="text-center h-full flex flex-col items-center justify-center bg-[#0a0a0a] animate-in fade-in py-20">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 border-4 ${passed ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-red-500/20 border-red-500 text-red-400'}`}>
             <ListChecks size={48}/>
          </div>
          <h2 className="text-3xl font-black mb-2">{passed ? 'Great Job!' : 'Keep Practicing'}</h2>
          <p className="text-zinc-400 text-lg mb-8">You scored {score} out of {quizData.length}</p>
          <button onClick={onComplete} className="px-8 py-4 bg-white text-black font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.2)]">Continue Course</button>
       </div>
    )
  }

  return (
    <div className="w-full h-full bg-[#0a0a0a] p-8 md:p-12 overflow-y-auto custom-scrollbar flex flex-col justify-center">
       <div className="max-w-3xl mx-auto w-full animate-in fade-in slide-in-from-bottom-8">
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

// --- HELPER COMPONENT ---
const TabBtn = ({ active, onClick, icon: Icon, label }: any) => (
    <button onClick={onClick} className={`flex items-center gap-2 pb-2 border-b-2 font-bold text-sm transition-colors whitespace-nowrap ${active ? 'border-white text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}>
        <Icon size={16}/> {label}
    </button>
)