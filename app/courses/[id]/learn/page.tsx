'use client'

import React, { useState, useEffect, useRef } from 'react'
import { 
  PlayCircle, CheckCircle2, ChevronDown, Check, Loader2, ArrowLeft, 
  Sparkles, FileText, Download, WifiOff, Star, ThumbsUp, 
  Twitter, Linkedin, Globe, Shield, MessageSquare, Play, Lock 
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/app/utils/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import Footer from '../../../components/Footer' 

export default function LearningPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const courseId = params?.id as string

  // --- STATE ---
  const [loading, setLoading] = useState(true)
  const [course, setCourse] = useState<any>(null)
  const [completedLectures, setCompletedLectures] = useState<Set<string>>(new Set())
  
  // Navigation
  const [activeLectureId, setActiveLectureId] = useState<string | null>(null)
  
  // AI State
  const [aiSummary, setAiSummary] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  
  // Offline State
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [offlineReadyIds, setOfflineReadyIds] = useState<Set<string>>(new Set())
  const [localVideoUrl, setLocalVideoUrl] = useState<string | null>(null)

  // Refs
  const activeLectureRef = useRef<HTMLDivElement>(null)
  const curriculumRef = useRef<HTMLDivElement>(null)

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
            .select('*, profiles(full_name, avatar_url, bio)') 
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
        
        // Check Offline Cache for all lectures
        checkOfflineAvailability(curriculum)

      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [courseId, supabase, router])

  // --- 2. OFFLINE MANAGER (Fixed) ---
  const checkOfflineAvailability = async (curriculum: any) => {
      if (!('caches' in window)) return
      const cache = await caches.open('grove-courses-v1')
      const keys = await cache.keys()
      const cachedUrls = new Set(keys.map(k => k.url))
      
      const readyIds = new Set<string>()
      curriculum.flatMap((s:any) => s.lectures).forEach((lec:any) => {
          if (lec.videoUrl && cachedUrls.has(lec.videoUrl)) {
              readyIds.add(lec.id)
          }
      })
      setOfflineReadyIds(readyIds)
  }

  // Load active video from cache if available
  useEffect(() => {
    const loadVideo = async () => {
        setLocalVideoUrl(null)
        const lecture = getActiveLectureData()
        if (!lecture?.videoUrl) return

        if ('caches' in window) {
            const cache = await caches.open('grove-courses-v1')
            const response = await cache.match(lecture.videoUrl)
            if (response) {
                const blob = await response.blob()
                setLocalVideoUrl(URL.createObjectURL(blob))
            }
        }
    }
    loadVideo()
  }, [activeLectureId, course])

  // ... inside LearningPage component

  const handleDownloadOffline = async (lecture: any) => {
      if (!lecture?.videoUrl) return
      
      setDownloadingId(lecture.id)
      try {
          console.log("Starting secure download for:", lecture.title)
          
          // 1. ADD CACHE BUSTER
          // We append ?t=timestamp to the URL. This forces the browser to treat it 
          // as a brand new request, bypassing the corrupted cache entry.
          const cacheBusterUrl = `${lecture.videoUrl}?t=${new Date().getTime()}`

          // 2. FETCH WITH 'no-store'
          // We use standard fetch (not SDK) because we need strict control over headers
          const response = await fetch(cacheBusterUrl, { 
              mode: 'cors',
              cache: 'no-store', // CRITICAL: Tells browser "Do not read/write to HTTP cache"
              headers: {
                  'Pragma': 'no-cache',
                  'Cache-Control': 'no-cache'
              }
          })

          if (!response.ok) throw new Error(`Network error: ${response.statusText}`)
          
          // 3. GET BLOB
          const blob = await response.blob() 
          
          // 4. CREATE CLEAN RESPONSE
          // We wrap the blob in a fresh Response to store in the Cache API
          const cleanResponse = new Response(blob, {
              status: 200,
              headers: {
                  'Content-Type': blob.type || 'video/mp4',
                  'Content-Length': blob.size.toString()
              }
          })

          // 5. STORE IN APP CACHE
          // Note: We store it under the ORIGINAL url (without cache buster) 
          // so the video player can find it later easily.
          const cache = await caches.open('grove-courses-v1')
          await cache.put(lecture.videoUrl, cleanResponse)
          
          setOfflineReadyIds(prev => new Set(prev).add(lecture.id))
          alert("Lesson saved! You can now watch this offline.")
          
      } catch (e: any) {
          console.error("Download failed:", e)
          alert(`Download failed: ${e.message}. Try clearing your browser cache if this persists.`)
      } finally {
          setDownloadingId(null)
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
  
  // Get Instructor (Handle Array/Object)
  const instructor = Array.isArray(course?.profiles) ? course.profiles[0] : course?.profiles

  // --- UI ACTIONS ---
  const scrollToCurriculum = () => {
      curriculumRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const generateAiSummary = () => {
    if (isTyping || aiSummary) return
    setIsTyping(true)
    const summaryText = `🤖 AI Analysis for "${getActiveLectureData()?.title}":\n\n1. **Core Concept**: This lecture breaks down the fundamental mechanics.\n2. **Critical Insight**: The instructor emphasizes the importance of structure at 04:20.\n3. **Next Steps**: Apply this pattern to your current project to see immediate results.\n\nSummary generated by Grove Intelligence.`
    
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

  // Reset AI on change
  useEffect(() => { setAiSummary(""); setIsTyping(false) }, [activeLectureId])

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

    const allLectures = getAllLectures()
    const currentIndex = allLectures.findIndex((l:any) => l.id === activeLectureId)
    if (currentIndex < allLectures.length - 1) {
        setTimeout(() => setActiveLectureId(allLectures[currentIndex + 1].id), 800)
    }
  }

  if (loading) return <div className="h-screen bg-[#050505] flex items-center justify-center"><Loader2 className="animate-spin text-emerald-500 w-10 h-10"/></div>

  const progressPercent = Math.round((completedLectures.size / (getAllLectures().length || 1)) * 100)

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-emerald-500/30">
      
      {/* --- 1. FULL SCREEN HERO --- */}
      <section className="relative h-[85vh] w-full flex items-end pb-20">
         {/* Background Image */}
         <div className="absolute inset-0 z-0">
             <Image 
                src={course?.thumbnail_url || "/placeholder.jpg"} 
                alt={course?.title} 
                fill 
                className="object-cover opacity-50"
                priority
             />
             {/* Gradient Overlay */}
             <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/80 to-black/30" />
         </div>

         {/* Navbar Overlay */}
         <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-50">
            <Link href="/dashboard" className="p-3 bg-black/20 backdrop-blur-md rounded-full border border-white/10 hover:bg-white/10 transition-all text-white">
                <ArrowLeft size={20} />
            </Link>
            <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                <span className="text-xs font-bold text-emerald-400">{progressPercent}% Complete</span>
                <div className="w-20 h-1 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${progressPercent}%` }} />
                </div>
            </div>
         </div>

         {/* Hero Content */}
         <div className="relative z-10 px-6 md:px-12 max-w-7xl mx-auto w-full">
             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
                 <span className="inline-block px-3 py-1 mb-4 bg-emerald-500 text-black text-xs font-bold uppercase tracking-wider rounded-md">
                    {course?.category || 'Masterclass'}
                 </span>
                 <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight max-w-4xl">
                    {course?.title}
                 </h1>
                 <p className="text-zinc-300 text-lg md:text-xl max-w-2xl mb-8 leading-relaxed line-clamp-3">
                    {course?.description || "Master this skill with our comprehensive curriculum designed for modern creators and developers."}
                 </p>
                 
                 <button 
                    onClick={scrollToCurriculum}
                    className="group bg-white text-black px-8 py-4 rounded-full font-bold text-lg flex items-center gap-3 hover:bg-emerald-400 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                 >
                    <PlayCircle size={24} fill="black" /> Resume Learning
                 </button>
             </motion.div>
         </div>
      </section>


      {/* --- 2. CURRICULUM & LECTURE FEED --- */}
      <section ref={curriculumRef} className="max-w-5xl mx-auto px-4 md:px-6 py-20 relative z-20">
        <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
            <FileText className="text-emerald-500" /> Course Curriculum
        </h2>

        <div className="space-y-8">
            {getCurriculum().map((section: any, sIdx: number) => (
                <div key={section.id} className="space-y-4">
                    
                    {/* Section Divider */}
                    <div className="flex items-center gap-4 py-2 sticky top-0 bg-[#050505]/95 backdrop-blur-md z-30 border-b border-white/5">
                        <span className="text-4xl font-black text-white/5">0{sIdx + 1}</span>
                        <div>
                            <h3 className="font-bold text-lg text-zinc-200">{section.title}</h3>
                            <p className="text-xs text-zinc-500 uppercase tracking-widest">{section.lectures.length} Lessons</p>
                        </div>
                    </div>

                    {/* Lesson Cards */}
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
                                    animate={{ 
                                        backgroundColor: isActive ? "#0F0F0F" : "transparent",
                                        borderColor: isActive ? "rgba(16, 185, 129, 0.3)" : "rgba(255,255,255,0.05)",
                                    }}
                                    className={`rounded-2xl border overflow-hidden transition-all duration-500 ${isActive ? 'shadow-2xl' : 'hover:bg-white/5'}`}
                                >
                                    {/* Header */}
                                    <div 
                                        onClick={() => setActiveLectureId(isActive ? null : lecture.id)}
                                        className="w-full flex items-center justify-between p-6 cursor-pointer"
                                    >
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
                                            <motion.div 
                                                initial={{ height: 0, opacity: 0 }} 
                                                animate={{ height: 'auto', opacity: 1 }} 
                                                exit={{ height: 0, opacity: 0 }}
                                            >
                                                <div className="px-6 pb-8">
                                                    
                                                    {/* Video Player */}
                                                    <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-white/10 shadow-2xl mb-6 group">
                                                        {lecture.type === 'video' ? (
                                                            <video 
                                                                src={localVideoUrl || lecture.videoUrl} 
                                                                controls 
                                                                controlsList="nodownload" 
                                                                onContextMenu={(e) => e.preventDefault()}
                                                                className="w-full h-full object-contain"
                                                                onEnded={handleMarkComplete}
                                                            />
                                                        ) : (
                                                            <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 bg-zinc-900">
                                                                <FileText size={48} className="mb-4 opacity-50"/>
                                                                <p>Reading Material</p>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Actions & AI */}
                                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                                        {/* AI Summary Box */}
                                                        <div className="lg:col-span-2 bg-white/5 rounded-xl p-5 border border-white/5">
                                                            <div className="flex justify-between items-center mb-3">
                                                                <h4 className="text-xs font-bold text-emerald-400 uppercase flex items-center gap-2"><Sparkles size={14}/> AI Tutor</h4>
                                                                <button onClick={generateAiSummary} className="text-[10px] bg-white/10 hover:bg-white/20 px-2 py-1 rounded transition-colors">
                                                                    {aiSummary ? 'Refresh' : 'Generate Summary'}
                                                                </button>
                                                            </div>
                                                            <div className="text-sm text-zinc-300 leading-relaxed min-h-[60px] whitespace-pre-wrap">
                                                                {aiSummary || "Click generate to get an instant summary of this lesson..."}
                                                                {isTyping && <span className="inline-block w-1.5 h-3 ml-1 bg-emerald-500 animate-pulse"/>}
                                                            </div>
                                                        </div>

                                                        {/* Controls */}
                                                        <div className="flex flex-col justify-between gap-3">
                                                            <button 
                                                                onClick={handleMarkComplete}
                                                                disabled={isDone}
                                                                className={`w-full py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${isDone ? 'bg-emerald-500/20 text-emerald-500' : 'bg-white text-black hover:bg-zinc-200'}`}
                                                            >
                                                                {isDone ? 'Completed' : 'Mark Complete'}
                                                            </button>
                                                            
                                                            <button 
                                                                onClick={() => handleDownloadOffline(lecture)}
                                                                disabled={isOffline || isDownloading}
                                                                className={`w-full py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 border transition-all ${isOffline ? 'bg-zinc-800 border-transparent text-zinc-500' : 'border-white/10 hover:bg-white/5'}`}
                                                            >
                                                                {isDownloading ? <Loader2 size={16} className="animate-spin"/> : isOffline ? <CheckCircle2 size={16}/> : <Download size={16}/>}
                                                                {isOffline ? 'Available Offline' : 'Download for Offline'}
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


      {/* --- 3. REVIEWS SECTION --- */}
      <section className="py-20 bg-neutral-900 border-y border-white/5">
          <div className="max-w-5xl mx-auto px-6">
              <div className="flex items-center gap-4 mb-10">
                  <div className="p-3 bg-yellow-500/10 rounded-xl text-yellow-500">
                      <Star size={24} fill="currentColor" />
                  </div>
                  <div>
                      <h2 className="text-2xl font-bold text-white">Student Reviews</h2>
                      <p className="text-zinc-400 text-sm">What others are saying</p>
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="bg-black border border-white/10 p-6 rounded-2xl">
                          <div className="flex items-center gap-3 mb-4">
                              <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-zinc-500">U</div>
                              <div>
                                  <h4 className="font-bold text-white text-sm">Student Name</h4>
                                  <div className="flex text-yellow-500"><Star size={12} fill="currentColor"/><Star size={12} fill="currentColor"/><Star size={12} fill="currentColor"/><Star size={12} fill="currentColor"/><Star size={12} fill="currentColor"/></div>
                              </div>
                          </div>
                          <p className="text-zinc-400 text-sm leading-relaxed">
                              "This course completely changed my perspective on the topic. The instructor explains complex concepts in such a simple way. Highly recommended!"
                          </p>
                      </div>
                  ))}
              </div>
          </div>
      </section>


      {/* --- 4. INSTRUCTOR SECTION --- */}
      <section className="py-20 max-w-5xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center gap-10 bg-gradient-to-br from-neutral-900 to-black border border-white/10 p-8 rounded-3xl">
              <div className="relative w-40 h-40 shrink-0">
                  {instructor?.avatar_url ? (
                      <Image src={instructor.avatar_url} alt="Instructor" fill className="object-cover rounded-full border-4 border-emerald-500/20" />
                  ) : (
                      <div className="w-full h-full bg-zinc-800 rounded-full flex items-center justify-center border-4 border-white/5">
                          <span className="text-4xl">👨‍🏫</span>
                      </div>
                  )}
                  <div className="absolute bottom-2 right-2 bg-emerald-500 text-black p-1.5 rounded-full border-2 border-black">
                      <CheckCircle2 size={16} />
                  </div>
              </div>
              
              <div className="text-center md:text-left">
                  <h2 className="text-3xl font-bold text-white mb-2">{instructor?.full_name || "Grove Instructor"}</h2>
                  <p className="text-emerald-400 font-medium text-sm uppercase tracking-wider mb-4">Senior Instructor & Developer</p>
                  <p className="text-zinc-400 leading-relaxed mb-6 max-w-xl">
                      {instructor?.bio || "Passionate about empowering the next generation of creators through accessible, high-quality education. With over 10 years of experience in the industry."}
                  </p>
                  
                  <div className="flex items-center justify-center md:justify-start gap-4">
                      <button className="p-3 bg-white/5 rounded-full hover:bg-[#1DA1F2]/20 hover:text-[#1DA1F2] transition-colors"><Twitter size={20}/></button>
                      <button className="p-3 bg-white/5 rounded-full hover:bg-[#0077b5]/20 hover:text-[#0077b5] transition-colors"><Linkedin size={20}/></button>
                      <button className="p-3 bg-white/5 rounded-full hover:bg-emerald-500/20 hover:text-emerald-500 transition-colors"><Globe size={20}/></button>
                  </div>
              </div>
          </div>
      </section>

      <Footer />
    </div>
  )
}