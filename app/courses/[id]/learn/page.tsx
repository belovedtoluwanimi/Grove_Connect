'use client'

import React, { useState, useEffect, useRef } from 'react'
import { 
  PlayCircle, CheckCircle2, ChevronDown, Check, Loader2, ArrowLeft, 
  Sparkles, FileText, Download, WifiOff, Star, Shield, 
  Captions, Lock, Trash2, Send
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/app/utils/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { set, get } from 'idb-keyval' // npm install idb-keyval
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
  
  // Tabs State (AI / Transcript)
  const [activeTab, setActiveTab] = useState<'ai' | 'transcript'>('ai')

  // Offline State
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [offlineReadyIds, setOfflineReadyIds] = useState<Set<string>>(new Set())
  const [localVideoUrl, setLocalVideoUrl] = useState<string | null>(null)

  // AI State
  const [aiSummary, setAiSummary] = useState("")
  const [isAiLoading, setIsAiLoading] = useState(false)

  // Reviews State
  const [reviews, setReviews] = useState<Review[]>([])
  const [userRating, setUserRating] = useState(0)
  const [userComment, setUserComment] = useState("")
  const [isPostingReview, setIsPostingReview] = useState(false)

  // Refs
  const activeLectureRef = useRef<HTMLDivElement>(null)
  const curriculumRef = useRef<HTMLDivElement>(null)

  // --- 1. DATA FETCHING ---
  useEffect(() => {
    if (!courseId) return

    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        // Allow offline access if previously cached, else redirect
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
            const allLectures = curriculum.flatMap((s:any) => s.lectures)
            const firstIncomplete = allLectures.find((l:any) => !completedLectures.has(l.id))
            setActiveLectureId(firstIncomplete?.id || allLectures[0]?.id)
            
            // Check Offline Status
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
  const checkOfflineAvailability = async (allLectures: any[]) => {
      const readyIds = new Set<string>()
      for (const lecture of allLectures) {
          // Check if file exists in IndexedDB
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
        if (!activeLectureId) return

        // 1. Try Secure Storage
        const blob = await get(`video-${activeLectureId}`)
        if (blob) {
            console.log("Playing from secure offline storage")
            setLocalVideoUrl(URL.createObjectURL(blob))
        } 
    }
    loadVideo()
  }, [activeLectureId])

  const handleDownloadOffline = async (lecture: any) => {
      if (!lecture?.videoUrl) return
      setDownloadingId(lecture.id)
      
      try {
          // Fetch blob (bypassing CORS if possible/configured correctly)
          const response = await fetch(lecture.videoUrl, { mode: 'cors' })
          if (!response.ok) throw new Error('Network error')
          
          const blob = await response.blob()
          
          // Save to IndexedDB (Secure, App-Only)
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

  // --- 3. AI SUMMARY (Real API Connection) ---
  const generateAiSummary = async () => {
      if (isAiLoading || aiSummary) return
      setIsAiLoading(true)

      try {
          // Call your backend API route (You need to create app/api/ai-summary/route.ts)
          // For now, we simulate the 'connect' delay if the API isn't ready
          /*
          const res = await fetch('/api/ai-summary', {
              method: 'POST',
              body: JSON.stringify({ 
                  lectureId: activeLectureId, 
                  transcript: getActiveLectureData()?.transcript // assuming transcript exists
              })
          })
          const data = await res.json()
          setAiSummary(data.summary)
          */

          // SIMULATION (Remove this block when API is ready)
          setTimeout(() => {
              const lec = getActiveLectureData()
              setAiSummary(`**Key Takeaways for ${lec?.title}:**\n\n1. The core concept involves understanding state management.\n2. Use the 'useEffect' hook to handle side effects cleanly.\n3. Optimizing for offline use requires robust caching strategies.\n\n*Generated by Grove AI*`)
              setIsAiLoading(false)
          }, 1500)

      } catch (error) {
          console.error("AI Error:", error)
          setIsAiLoading(false)
      }
  }

  // --- 4. REVIEWS LOGIC ---
  const handlePostReview = async () => {
      if (userRating === 0) return alert("Please select a rating")
      setIsPostingReview(true)

      const newReview = {
          user_id: user.id,
          course_id: courseId,
          rating: userRating,
          comment: userComment,
      }

      const { data, error } = await supabase
          .from('reviews')
          .insert(newReview)
          .select('*, profiles(full_name, avatar_url)')
          .single()

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
  const getCurriculum = (c = course) => c ? (Array.isArray(c.curriculum_data) ? c.curriculum_data : JSON.parse(c.curriculum_data || '[]')) : []
  const getAllLectures = () => getCurriculum().flatMap((s:any) => s.lectures)
  const getActiveLectureData = () => getAllLectures().find((l:any) => l.id === activeLectureId)
  const isCompleted = (id: string) => completedLectures.has(id)
  const instructor = Array.isArray(course?.profiles) ? course.profiles[0] : course?.profiles

  const handleMarkComplete = async () => {
    if (!activeLectureId) return
    setCompletedLectures(prev => new Set(prev).add(activeLectureId))
    if (user) {
        await supabase.from('course_progress').insert({ user_id: user.id, course_id: courseId, lecture_id: activeLectureId })
    }
    // Auto-advance
    const all = getAllLectures()
    const idx = all.findIndex((l:any) => l.id === activeLectureId)
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

      {/* 2. CURRICULUM FEED */}
      <section ref={curriculumRef} className="max-w-5xl mx-auto px-4 md:px-6 py-20 relative z-20">
        <h2 className="text-2xl font-bold mb-8 flex items-center gap-3"><FileText className="text-emerald-500" /> Course Curriculum</h2>
        
        <div className="space-y-8">
            {getCurriculum().map((section: any, sIdx: number) => (
                <div key={section.id} className="space-y-4">
                    <div className="flex items-center gap-4 py-2 sticky top-0 bg-[#050505]/95 backdrop-blur-md z-30 border-b border-white/5">
                        <span className="text-4xl font-black text-white/5">0{sIdx + 1}</span>
                        <div><h3 className="font-bold text-lg text-zinc-200">{section.title}</h3><p className="text-xs text-zinc-500 uppercase tracking-widest">{section.lectures.length} Lessons</p></div>
                    </div>
                    <div className="space-y-4 pl-0 md:pl-12">
                        {section.lectures.map((lecture: any, lIdx: number) => {
                            const isActive = activeLectureId === lecture.id
                            const isDone = isCompleted(lecture.id)
                            const isOffline = offlineReadyIds.has(lecture.id)
                            const isDownloading = downloadingId === lecture.id

                            return (
                                <motion.div
                                    key={lecture.id}
                                    ref={isActive ? activeLectureRef : null}
                                    initial={false}
                                    animate={{ backgroundColor: isActive ? "#0F0F0F" : "transparent", borderColor: isActive ? "rgba(16, 185, 129, 0.3)" : "rgba(255,255,255,0.05)" }}
                                    className={`rounded-2xl border overflow-hidden transition-all duration-500 ${isActive ? 'shadow-2xl' : 'hover:bg-white/5'}`}
                                >
                                    {/* Header */}
                                    <div onClick={() => setActiveLectureId(isActive ? null : lecture.id)} className="w-full flex items-center justify-between p-6 cursor-pointer">
                                        <div className="flex items-center gap-5">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${isDone ? 'bg-emerald-600 border-emerald-600 text-white' : isActive ? 'border-emerald-500 text-emerald-500' : 'border-white/10 text-zinc-500'}`}>
                                                {isDone ? <Check size={20} strokeWidth={3} /> : <span className="font-bold">{lIdx + 1}</span>}
                                            </div>
                                            <div>
                                                <h4 className={`font-bold text-lg ${isActive ? 'text-white' : 'text-zinc-400'}`}>{lecture.title}</h4>
                                                {isActive && <span className="text-xs text-emerald-500 font-bold animate-pulse">Now Playing</span>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {isOffline && <WifiOff size={16} className="text-emerald-500" />}
                                            <ChevronDown size={20} className={`text-zinc-600 transition-transform ${isActive ? 'rotate-180' : ''}`} />
                                        </div>
                                    </div>

                                    {/* Expanded Content */}
                                    <AnimatePresence>
                                        {isActive && (
                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                                                <div className="px-6 pb-8">
                                                    
                                                    {/* Video Player */}
                                                    <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-white/10 shadow-2xl mb-6">
                                                        {lecture.type === 'video' ? (
                                                            <video 
                                                                src={localVideoUrl || lecture.videoUrl} 
                                                                controls 
                                                                controlsList="nodownload" 
                                                                onContextMenu={(e) => e.preventDefault()}
                                                                className="w-full h-full object-contain"
                                                                onEnded={handleMarkComplete}
                                                            />
                                                        ) : <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 bg-zinc-900"><FileText size={48}/><p>Reading Material</p></div>}
                                                    </div>

                                                    {/* Actions & Tools */}
                                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                                        
                                                        {/* Tools (AI & Transcript) */}
                                                        <div className="lg:col-span-2 bg-white/5 rounded-xl p-5 border border-white/5">
                                                            <div className="flex gap-4 border-b border-white/10 pb-2 mb-3">
                                                                <button onClick={() => setActiveTab('ai')} className={`text-xs font-bold uppercase flex items-center gap-2 pb-1 ${activeTab === 'ai' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-zinc-500'}`}><Sparkles size={14}/> AI Tutor</button>
                                                                <button onClick={() => setActiveTab('transcript')} className={`text-xs font-bold uppercase flex items-center gap-2 pb-1 ${activeTab === 'transcript' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-zinc-500'}`}><Captions size={14}/> Transcript</button>
                                                            </div>
                                                            
                                                            {activeTab === 'ai' && (
                                                                <>
                                                                    <div className="text-sm text-zinc-300 leading-relaxed min-h-[60px] whitespace-pre-wrap max-h-40 overflow-y-auto custom-scrollbar">
                                                                        {isAiLoading ? <span className="flex items-center gap-2 text-emerald-500"><Loader2 className="animate-spin" size={14}/> Analyzing lecture...</span> : aiSummary || "Click generate to get an AI summary of this lesson."}
                                                                    </div>
                                                                    <button onClick={generateAiSummary} disabled={isAiLoading} className="mt-3 text-[10px] bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded transition-colors w-full text-center">
                                                                        {aiSummary ? 'Regenerate Summary' : 'Generate AI Summary'}
                                                                    </button>
                                                                </>
                                                            )}

                                                            {activeTab === 'transcript' && (
                                                                <div className="text-sm text-zinc-400 leading-relaxed h-40 overflow-y-auto custom-scrollbar">
                                                                    {lecture.transcript ? lecture.transcript : "No transcript available for this lesson."}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Controls */}
                                                        <div className="flex flex-col justify-between gap-3">
                                                            <button onClick={handleMarkComplete} disabled={isDone} className={`w-full py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${isDone ? 'bg-emerald-500/20 text-emerald-500' : 'bg-white text-black hover:bg-zinc-200'}`}>
                                                                {isDone ? 'Completed' : 'Mark Complete'}
                                                            </button>
                                                            <button onClick={() => handleDownloadOffline(lecture)} disabled={isOffline || isDownloading} className={`w-full py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 border transition-all ${isOffline ? 'bg-zinc-800 border-transparent text-zinc-500' : 'border-white/10 hover:bg-white/5'}`}>
                                                                {isDownloading ? <Loader2 size={16} className="animate-spin"/> : isOffline ? <CheckCircle2 size={16}/> : <Download size={16}/>} 
                                                                {isOffline ? 'Saved Securely' : 'Save Offline'}
                                                            </button>
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
      <section className="py-20 bg-neutral-900 border-y border-white/5">
          <div className="max-w-5xl mx-auto px-6">
              <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center gap-4">
                      <div className="p-3 bg-yellow-500/10 rounded-xl text-yellow-500"><Star size={24} fill="currentColor" /></div>
                      <div><h2 className="text-2xl font-bold text-white">Student Reviews</h2><p className="text-zinc-400 text-sm">Real feedback from students</p></div>
                  </div>
              </div>

              {/* Review Input */}
              <div className="bg-black border border-white/10 p-6 rounded-2xl mb-10">
                  <h3 className="text-white font-bold mb-4">Write a Review</h3>
                  <div className="flex gap-2 mb-4">
                      {[1, 2, 3, 4, 5].map((star) => (
                          <button key={star} onClick={() => setUserRating(star)} className={`${userRating >= star ? 'text-yellow-500' : 'text-zinc-700'}`}>
                              <Star size={24} fill="currentColor" />
                          </button>
                      ))}
                  </div>
                  <textarea 
                      value={userComment} 
                      onChange={(e) => setUserComment(e.target.value)} 
                      placeholder="Share your experience..." 
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl p-4 text-white text-sm focus:border-emerald-500 outline-none resize-none h-24 mb-4"
                  />
                  <button onClick={handlePostReview} disabled={isPostingReview} className="bg-white text-black px-6 py-2 rounded-full font-bold text-sm hover:bg-zinc-200 transition-colors flex items-center gap-2">
                      {isPostingReview ? <Loader2 className="animate-spin" size={16}/> : <Send size={16}/>} Post Review
                  </button>
              </div>

              {/* Reviews List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {reviews.map((review) => (
                      <div key={review.id} className="bg-black border border-white/10 p-6 rounded-2xl">
                          <div className="flex items-center gap-3 mb-4">
                              <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden relative border border-white/10">
                                  {review.profiles?.avatar_url ? <Image src={review.profiles.avatar_url} alt="" fill className="object-cover"/> : <div className="flex items-center justify-center h-full text-zinc-500 font-bold">U</div>}
                              </div>
                              <div>
                                  <h4 className="font-bold text-white text-sm">{review.profiles?.full_name || 'Student'}</h4>
                                  <div className="flex text-yellow-500 text-[10px] gap-0.5">
                                      {[...Array(review.rating)].map((_, i) => <Star key={i} size={10} fill="currentColor"/>)}
                                  </div>
                              </div>
                          </div>
                          <p className="text-zinc-400 text-sm leading-relaxed">{review.comment}</p>
                      </div>
                  ))}
                  {reviews.length === 0 && <p className="text-zinc-500 italic col-span-2 text-center">No reviews yet. Be the first!</p>}
              </div>
          </div>
      </section>

      {/* --- 4. INSTRUCTOR SECTION (No Socials) --- */}
      <section className="py-20 max-w-5xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center gap-10 bg-gradient-to-br from-neutral-900 to-black border border-white/10 p-8 rounded-3xl">
              <div className="relative w-40 h-40 shrink-0">
                  {instructor?.avatar_url ? (
                      <Image src={instructor.avatar_url} alt="Instructor" fill className="object-cover rounded-full border-4 border-emerald-500/20" />
                  ) : (
                      <div className="w-full h-full bg-zinc-800 rounded-full flex items-center justify-center border-4 border-white/5"><span className="text-4xl">👨‍🏫</span></div>
                  )}
              </div>
              <div className="text-center md:text-left">
                  <h2 className="text-3xl font-bold text-white mb-2">{instructor?.full_name || "Grove Instructor"}</h2>
                  <p className="text-emerald-400 font-medium text-sm uppercase tracking-wider mb-4">Senior Instructor</p>
                  <p className="text-zinc-400 leading-relaxed mb-6 max-w-xl">{instructor?.bio || "Passionate about empowering the next generation of creators through accessible, high-quality education."}</p>
              </div>
          </div>
      </section>

      <Footer />
    </div>
  )
}