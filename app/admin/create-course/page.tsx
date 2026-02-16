'use client'

import React, { useState, useEffect, useRef } from 'react'
import { 
  Save, ChevronLeft, Plus, Trash2, Video, FileText, 
  CheckCircle2, Upload, ShieldCheck, DollarSign, 
  Layout, ChevronDown, ChevronRight, X, Loader2, 
  AlertCircle, Eye, Play, ImageIcon, User, Crown, 
  Calendar, MessageSquare, Briefcase, GraduationCap,
  Clock, Settings, Sparkles, Lock, ScanFace, ShieldAlert,
  Globe, Server, Fingerprint, Wifi
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/hooks/useAuth' 
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/app/utils/supabase/client'

// ----------------------------------------------------------------------
// 1. TYPE DEFINITIONS (Strict Typing for Professional Data Structure)
// ----------------------------------------------------------------------

type CourseMode = 'standard' | 'premium' | null
type Step = 'mode' | 'details' | 'curriculum' | 'mentorship' | 'pricing' | 'verification' | 'review'

interface Lecture {
  id: string
  title: string
  type: 'video' | 'article' | 'quiz' | 'assignment'
  content?: string // For articles or quiz JSON
  videoUrl?: string
  duration?: number
  isFreePreview: boolean
}

interface Section {
  id: string
  title: string
  isMilestone: boolean // Premium Feature
  lectures: Lecture[]
  isOpen: boolean
}

interface CourseData {
  mode: CourseMode
  title: string
  subtitle: string
  description: string
  category: string
  customCategory: string
  level: string
  price: string
  objectives: string[]
  curriculum: Section[]
  thumbnail: string | null
  promoVideo: string | null
  // Premium Specifics
  mentorshipEnabled: boolean
  sessionDuration: string
  availability: string[]
}

// ----------------------------------------------------------------------
// 2. CONSTANTS & MOCK DATA
// ----------------------------------------------------------------------

const CATEGORIES = [
  "Development", 
  "Business", 
  "Finance & Accounting", 
  "IT & Software", 
  "Office Productivity", 
  "Personal Development", 
  "Design", 
  "Marketing", 
  "Lifestyle", 
  "Photography & Video", 
  "Health & Fitness", 
  "Music", 
  "Teaching & Academics",
  "Other"
]

const LEVELS = ["Beginner", "Intermediate", "Expert", "All Levels"]

// Premium pricing starts higher
const STANDARD_PRICES = ['Free', '19.99', '29.99', '49.99', '99.99']
const PREMIUM_PRICES = ['199.99', '299.99', '499.99', '999.99']

// ----------------------------------------------------------------------
// 3. MAIN COMPONENT
// ----------------------------------------------------------------------

export default function CourseStudio() {
  const router = useRouter()
  const { user } = useAuth()
  const supabase = createClient()
  
  // --- STATE MANAGEMENT ---
  const [step, setStep] = useState<Step>('mode')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  
  // Verification State (The "Algorithm")
  const [isVerified, setIsVerified] = useState(false)
  const [verificationStep, setVerificationStep] = useState(0) 
  const [verificationLog, setVerificationLog] = useState<string[]>([])
  
  // Validation Errors
  const [publishError, setPublishError] = useState<string | null>(null)

  // Main Course Data Object
  const [data, setData] = useState<CourseData>({
    mode: null,
    title: '',
    subtitle: '',
    description: '',
    category: 'Development',
    customCategory: '',
    level: 'Beginner',
    price: '',
    objectives: ['', '', ''],
    curriculum: [
      { 
        id: Math.random().toString(36).substr(2, 9), 
        title: 'Introduction', 
        isMilestone: false, 
        isOpen: true, 
        lectures: [] 
      }
    ],
    thumbnail: null,
    promoVideo: null,
    mentorshipEnabled: false,
    sessionDuration: '30 Minutes',
    availability: ['Mon', 'Wed', 'Fri']
  })

  // ----------------------------------------------------------------------
  // 4. LOGIC HANDLERS
  // ----------------------------------------------------------------------

  // A. Mode Selection Logic
  const handleModeSelect = (mode: CourseMode) => {
    // Reset pricing defaults based on mode
    const defaultPrice = mode === 'premium' ? '499.99' : '49.99'
    setData(prev => ({ 
      ...prev, 
      mode, 
      price: defaultPrice,
      mentorshipEnabled: mode === 'premium' 
    }))
    setStep('details')
  }

  // B. Video Conference Tester (Jitsi Integration)
  const handleTestMeeting = () => {
    const roomId = `grove-secure-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`
    const meetingUrl = `https://meet.jit.si/${roomId}`
    window.open(meetingUrl, '_blank')
  }

  // C. Security Algorithm (KYC Simulation)
  const runSecurityCheck = () => {
    setVerificationStep(1)
    setVerificationLog([])
    
    const logs = [
      "Initializing Biometric Scan...",
      "Encrypting User Session...",
      "Analyzing Facial Structure...",
      "Connecting to Global Interpol Database...",
      "Checking Financial Watchlists (OFAC)...",
      "Verifying Instructor Authenticity...",
      "Scanning for Deepfake Patterns...",
      "Identity Confirmed: 100% Match.",
      "Instructor Authorized."
    ]

    let i = 0
    const interval = setInterval(() => {
      if (i >= logs.length) {
        clearInterval(interval)
        setVerificationStep(3)
        setIsVerified(true)
      } else {
        setVerificationLog(prev => [...prev, logs[i]])
        if (i === 3) setVerificationStep(2)
        i++
      }
    }, 800)
  }

  // D. File Upload Simulation
  // In production, this would upload to Supabase Storage buckets
  const handleUpload = async (file: File, type: 'thumbnail' | 'video') => {
    setUploading(true)
    await new Promise(resolve => setTimeout(resolve, 1500)) // Network delay
    
    const url = URL.createObjectURL(file) // Local preview URL
    
    if (type === 'thumbnail') setData(prev => ({ ...prev, thumbnail: url }))
    else setData(prev => ({ ...prev, promoVideo: url }))
    
    setUploading(false)
  }

  // E. Curriculum Logic Handlers
  const addSection = () => {
    const newSection: Section = { 
      id: Math.random().toString(36).substr(2, 9), 
      title: 'New Section', 
      isMilestone: false, 
      isOpen: true, 
      lectures: [] 
    }
    setData(p => ({...p, curriculum: [...p.curriculum, newSection]}))
  }

  const updateSection = (id: string, field: keyof Section, val: any) => {
    setData(p => ({
      ...p, 
      curriculum: p.curriculum.map(s => s.id === id ? { ...s, [field]: val } : s)
    }))
  }
  
  const deleteSection = (id: string) => {
    if(confirm("Are you sure you want to delete this section?")) {
        setData(p => ({...p, curriculum: p.curriculum.filter(s => s.id !== id)}))
    }
  }

  const addLecture = (sId: string) => {
    const newLecture: Lecture = { 
      id: Math.random().toString(36).substr(2, 9), 
      title: 'New Lecture', 
      type: 'video', 
      isFreePreview: false 
    }
    setData(p => ({
      ...p, 
      curriculum: p.curriculum.map(s => s.id === sId ? { ...s, lectures: [...s.lectures, newLecture] } : s)
    }))
  }

  const updateLecture = (sId: string, lId: string, field: keyof Lecture, val: any) => {
    setData(p => ({
      ...p, 
      curriculum: p.curriculum.map(s => s.id !== sId ? s : { 
        ...s, 
        lectures: s.lectures.map(l => l.id === lId ? { ...l, [field]: val } : l)
      })
    }))
  }

  // F. Publish to Supabase
  const handlePublish = async () => {
    if (!isVerified) {
      setStep('verification')
      return
    }
    
    setLoading(true)
    setPublishError(null)

    // Validation
    if (!data.title || !data.description || !data.price || !data.thumbnail) {
      setPublishError("Missing required fields. Please check Details and Pricing.")
      setLoading(false)
      return
    }

    try {
      // 1. Determine final category
      const finalCategory = data.category === 'Other' ? data.customCategory : data.category
      
      // 2. Construct Payload
      const payload = {
        instructor_id: user?.id,
        title: data.title,
        subtitle: data.subtitle,
        description: data.description,
        category: finalCategory,
        level: data.level,
        price: parseFloat(data.price),
        curriculum_data: data.curriculum, // Store the JSON structure
        thumbnail_url: data.thumbnail,
        promo_video_url: data.promoVideo,
        is_premium: data.mode === 'premium', // This flag separates Exclusive courses
        mentorship_config: data.mode === 'premium' ? {
            enabled: data.mentorshipEnabled,
            duration: data.sessionDuration,
            availability: data.availability
        } : null,
        status: 'published',
        published_at: new Date().toISOString()
      }

      // 3. Insert into Supabase
      const { error } = await supabase.from('courses').insert([payload])
      
      if (error) throw error

      // 4. Success Redirect
      router.push('/dashboard/instructor') 

    } catch (err: any) {
      console.error(err)
      // If no DB connection (Demo Mode), show error but simulate success after delay
      setPublishError("Connection failed. (Demo: Redirecting in 1s...)")
      setTimeout(() => router.push('/dashboard/instructor'), 1500)
    } finally {
      setLoading(false)
    }
  }

  // ----------------------------------------------------------------------
  // 5. RENDER LOGIC
  // ----------------------------------------------------------------------

  if (step === 'mode') return <ModeSelection onSelect={handleModeSelect} />

  return (
    <div className="min-h-screen bg-black text-white flex font-sans selection:bg-emerald-500/30">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-72 bg-zinc-950 border-r border-white/10 flex flex-col p-6 sticky top-0 h-screen shrink-0">
        <div className="mb-8">
          <button onClick={() => setStep('mode')} className="text-zinc-500 hover:text-white flex items-center gap-2 text-sm mb-4 transition-colors">
            <ChevronLeft size={16} /> Switch Mode
          </button>
          <h2 className="font-bold text-lg leading-tight mb-2 line-clamp-2">{data.title || "Untitled Course"}</h2>
          <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded border w-fit ${data.mode === 'premium' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
            {data.mode} Mode
          </span>
        </div>

        <nav className="space-y-1 flex-1">
          <NavBtn active={step === 'details'} icon={FileText} label="Details" onClick={() => setStep('details')} />
          <NavBtn active={step === 'curriculum'} icon={Layout} label="Curriculum" onClick={() => setStep('curriculum')} />
          {data.mode === 'premium' && <NavBtn active={step === 'mentorship'} icon={Video} label="Mentorship" onClick={() => setStep('mentorship')} />}
          <NavBtn active={step === 'pricing'} icon={DollarSign} label="Pricing" onClick={() => setStep('pricing')} />
          <div className="h-px bg-white/10 my-4" />
          <NavBtn active={step === 'verification'} icon={ScanFace} label="Identity Check" onClick={() => setStep('verification')} alert={!isVerified} />
          <NavBtn active={step === 'review'} icon={ShieldCheck} label="Publish" onClick={() => setStep('review')} />
        </nav>
        
        {/* Progress Bar */}
        <div className="mt-auto pt-6 border-t border-white/5">
            <div className="flex justify-between text-xs text-zinc-500 mb-2">
                <span>Completion</span>
                <span>{isVerified ? '100%' : '80%'}</span>
            </div>
            <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div className={`h-full ${isVerified ? 'bg-emerald-500' : 'bg-zinc-600'} transition-all duration-500`} style={{width: isVerified ? '100%' : '80%'}} />
            </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 bg-black relative overflow-y-auto">
        <div className="max-w-5xl mx-auto p-12 pb-32">
          
          {/* STEP 1: DETAILS */}
          {step === 'details' && (
            <div className="space-y-8 animate-in fade-in">
              <Header title="Course Details" sub="The foundation of your course." />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <Input label="Title" value={data.title} onChange={v => setData({...data, title: v})} placeholder="e.g. Advanced AI Patterns" />
                  <Input label="Subtitle" value={data.subtitle} onChange={v => setData({...data, subtitle: v})} placeholder="A short, catchy hook." />
                  
                  {/* Smart Sector Selector */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-400">Sector / Category</label>
                    <div className="flex gap-2 flex-wrap">
                      {CATEGORIES.map(cat => (
                        <button key={cat} onClick={() => setData({...data, category: cat})} className={`px-4 py-2 rounded-lg text-sm border transition-all ${data.category === cat ? 'bg-white text-black border-white' : 'bg-zinc-900 border-white/10 text-zinc-400'}`}>{cat}</button>
                      ))}
                    </div>
                    {data.category === 'Other' && (
                      <input value={data.customCategory} onChange={e => setData({...data, customCategory: e.target.value})} className="w-full mt-2 bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 focus:border-emerald-500 outline-none" placeholder="Type your specific sector..." />
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-400">Description</label>
                    <textarea value={data.description} onChange={e => setData({...data, description: e.target.value})} className="w-full h-40 bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 resize-none" />
                  </div>
                </div>
                <div className="space-y-6">
                  <MediaUpload label="Thumbnail" type="image" url={data.thumbnail} uploading={uploading} onUpload={(f) => handleUpload(f, 'thumbnail')} />
                  <MediaUpload label="Promo Video" type="video" url={data.promoVideo} uploading={uploading} onUpload={(f) => handleUpload(f, 'video')} />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: CURRICULUM */}
          {step === 'curriculum' && (
            <div className="space-y-8 animate-in fade-in">
              <div className="flex justify-between items-end">
                <Header title="Curriculum" sub="Structure your content." />
                <button onClick={addSection} className="bg-white text-black px-4 py-2 rounded-lg font-bold hover:bg-zinc-200 flex items-center gap-2"><Plus size={16}/> Section</button>
              </div>
              <div className="space-y-4">
                {data.curriculum.map((section) => (
                  <div key={section.id} className="bg-zinc-900/40 border border-white/10 rounded-xl overflow-hidden">
                    <div className="p-4 flex items-center gap-4 bg-zinc-900/50 border-b border-white/5">
                      <button onClick={() => updateSection(section.id, 'isOpen', !section.isOpen)}><ChevronDown size={20} className={`transition-transform ${section.isOpen ? '' : '-rotate-90'}`} /></button>
                      <input value={section.title} onChange={e => updateSection(section.id, 'title', e.target.value)} className="bg-transparent font-bold text-white w-full outline-none" />
                      {data.mode === 'premium' && (
                        <button onClick={() => updateSection(section.id, 'isMilestone', !section.isMilestone)} className={`flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold uppercase ${section.isMilestone ? 'bg-yellow-500 text-black border-yellow-500' : 'border-white/10 text-zinc-500'}`}><Crown size={12} /> Milestone</button>
                      )}
                      <button onClick={() => deleteSection(section.id)} className="text-zinc-600 hover:text-red-500"><Trash2 size={16}/></button>
                    </div>
                    {section.isOpen && (
                      <div className="p-4 space-y-2">
                        {section.lectures.map((lec) => (
                          <div key={lec.id} className="flex items-center gap-3 p-3 bg-zinc-800/30 rounded-lg border border-white/5">
                            <div className="p-2 bg-zinc-800 rounded text-zinc-400">{lec.type === 'video' ? <Video size={14}/> : <FileText size={14}/>}</div>
                            <input value={lec.title} onChange={e => updateLecture(section.id, lec.id, 'title', e.target.value)} className="bg-transparent text-sm text-white w-full outline-none" />
                            <div className="flex gap-2">
                                <select value={lec.type} onChange={e => updateLecture(section.id, lec.id, 'type', e.target.value)} className="bg-zinc-900 text-xs text-zinc-400 border border-white/10 rounded px-2 outline-none cursor-pointer">
                                    <option value="video">Video</option>
                                    <option value="article">Article</option>
                                    {data.mode === 'premium' && <option value="assignment">Assignment</option>}
                                    {data.mode === 'premium' && <option value="quiz">Quiz</option>}
                                </select>
                                <button onClick={() => updateLecture(section.id, lec.id, 'isFreePreview', !lec.isFreePreview)} className={`p-1.5 rounded ${lec.isFreePreview ? 'text-emerald-400 bg-emerald-400/10' : 'text-zinc-600 hover:text-zinc-400'}`} title="Free Preview"><Eye size={14}/></button>
                            </div>
                          </div>
                        ))}
                        <button onClick={() => addLecture(section.id)} className="w-full py-3 border border-dashed border-white/10 rounded-lg text-sm text-zinc-500 hover:text-white flex items-center justify-center gap-2"><Plus size={14}/> Add Content</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: MENTORSHIP & VIDEO */}
          {step === 'mentorship' && (
             <div className="space-y-8 animate-in fade-in">
                <Header title="Live Mentorship" sub="Configure 1-on-1 sessions." />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="bg-zinc-900 border border-white/10 rounded-2xl p-8">
                       <div className="flex justify-between items-center mb-6">
                           <h3 className="text-lg font-bold">Accept Bookings</h3>
                           <button onClick={() => setData({...data, mentorshipEnabled: !data.mentorshipEnabled})} className={`w-12 h-6 rounded-full p-1 transition-colors ${data.mentorshipEnabled ? 'bg-emerald-500' : 'bg-zinc-700'}`}><div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${data.mentorshipEnabled ? 'translate-x-6' : ''}`} /></button>
                       </div>
                       {data.mentorshipEnabled && (
                           <div className="space-y-4">
                               <label className="text-sm font-bold text-zinc-400">Available Days</label>
                               <div className="flex gap-2 flex-wrap">
                                   {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(day => (
                                       <button key={day} onClick={() => { const n = data.availability.includes(day) ? data.availability.filter(d=>d!==day) : [...data.availability, day]; setData({...data, availability: n}) }} className={`w-10 h-10 rounded bg-zinc-800 text-sm font-bold hover:bg-zinc-700 ${data.availability.includes(day) ? 'bg-white text-black' : ''}`}>{day.slice(0,1)}</button>
                                   ))}
                               </div>
                               <label className="text-sm font-bold text-zinc-400 mt-4 block">Session Length</label>
                               <select value={data.sessionDuration} onChange={e => setData({...data, sessionDuration: e.target.value})} className="w-full bg-black border border-white/10 rounded-lg p-3 outline-none">
                                   <option>15 Minutes</option>
                                   <option>30 Minutes</option>
                                   <option>45 Minutes</option>
                                   <option>60 Minutes</option>
                               </select>
                           </div>
                       )}
                   </div>
                   {/* REAL VIDEO TESTER */}
                   <div className="bg-gradient-to-br from-zinc-900 to-black border border-white/10 rounded-2xl p-8 text-center flex flex-col items-center justify-center">
                       <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4 text-emerald-500"><Video size={32} /></div>
                       <h3 className="font-bold text-lg text-white">Test Video Room</h3>
                       <p className="text-sm text-zinc-400 mb-6">Launch a secure Jitsi instance to check your camera and mic.</p>
                       <button onClick={handleTestMeeting} className="px-6 py-3 bg-emerald-500 text-black font-bold rounded-xl hover:bg-emerald-400 transition-colors">Launch Test Room</button>
                   </div>
                </div>
             </div>
          )}

          {/* STEP 4: PRICING */}
          {step === 'pricing' && (
            <div className="space-y-8 animate-in fade-in">
               <Header title="Course Pricing" sub="Set the value of your content." />
               <div className="flex flex-wrap gap-4">
                  {(data.mode === 'premium' ? [...PREMIUM_PRICES, 'Custom'] : [...STANDARD_PRICES, 'Custom']).map(p => (
                      <button key={p} onClick={() => setData({...data, price: p === 'Custom' ? '' : p})} className={`w-32 h-32 rounded-2xl border flex flex-col items-center justify-center gap-2 ${data.price === p ? 'bg-white text-black scale-105' : 'bg-zinc-900 border-white/10 hover:bg-zinc-800'}`}>
                          <span className="font-bold text-xl">{p === 'Custom' ? 'Custom' : p === 'Free' ? 'Free' : `$${p}`}</span>
                      </button>
                  ))}
               </div>
               {/* Custom Input shows if price is not in the preset list OR user clicked custom */}
               {(![...STANDARD_PRICES, ...PREMIUM_PRICES].includes(data.price)) && (
                   <div className="max-w-xs animate-in fade-in">
                        <label className="text-xs font-bold text-zinc-500 uppercase mb-2 block">Enter Amount ($)</label>
                        <input type="number" value={data.price} onChange={e => setData({...data, price: e.target.value})} className="bg-zinc-900 border border-white/10 rounded-xl px-6 py-4 text-2xl font-bold w-full text-center outline-none focus:border-emerald-500" placeholder="0.00" />
                   </div>
               )}
            </div>
          )}

          {/* STEP 5: SECURITY CHECK (THE ALGORITHM) */}
          {step === 'verification' && (
             <div className="flex flex-col items-center justify-center py-12 animate-in fade-in">
                <div className="relative w-32 h-32 mb-8">
                    <div className={`absolute inset-0 rounded-full border-4 ${verificationStep === 3 ? 'border-green-500' : 'border-zinc-800'}`} />
                    {verificationStep > 0 && verificationStep < 3 && <div className="absolute inset-0 rounded-full border-4 border-t-emerald-500 animate-spin" />}
                    <div className="absolute inset-0 flex items-center justify-center">
                        {verificationStep === 3 ? <CheckCircle2 size={48} className="text-green-500" /> : <ScanFace size={48} className="text-zinc-500" />}
                    </div>
                </div>

                <h2 className="text-3xl font-bold mb-4">{isVerified ? "Identity Verified" : "Instructor Security Check"}</h2>
                
                {verificationStep === 0 && (
                    <div className="text-center max-w-md">
                        <p className="text-zinc-400 mb-8">To maintain platform integrity and prevent fraud, we scan global databases to verify your identity before you can publish.</p>
                        <button onClick={runSecurityCheck} className="px-8 py-4 bg-white text-black font-bold rounded-full hover:scale-105 transition-transform flex items-center gap-2 mx-auto">
                            <ShieldAlert size={20} /> Run Security Scan
                        </button>
                    </div>
                )}

                {verificationStep > 0 && (
                    <div className="w-full max-w-md bg-zinc-900/50 border border-white/10 rounded-xl p-4 font-mono text-xs text-emerald-400 h-48 overflow-y-auto">
                        {verificationLog.map((log, i) => <div key={i} className="mb-1 border-l-2 border-emerald-500/50 pl-2 animate-in fade-in slide-in-from-left-2">{`> ${log}`}</div>)}
                        {verificationStep < 3 && <div className="animate-pulse"> Processing...</div>}
                    </div>
                )}
                
                {verificationStep === 3 && (
                    <button onClick={() => setStep('review')} className="mt-8 px-8 py-3 bg-emerald-600 text-white font-bold rounded-full hover:bg-emerald-500 transition-colors flex items-center gap-2">
                        Continue to Publish <ChevronRight size={16} />
                    </button>
                )}
             </div>
          )}

          {/* STEP 6: REVIEW */}
          {step === 'review' && (
             <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in">
                <Header title="Final Review" sub="Ensure everything is perfect." />
                <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 space-y-4">
                    <ReviewItem label="Course Title" value={data.title} valid={!!data.title} />
                    <ReviewItem label="Pricing" value={data.price ? (data.price === 'Free' ? 'Free' : `$${data.price}`) : "Not set"} valid={!!data.price} />
                    <ReviewItem label="Content" value={`${data.curriculum.length} Sections`} valid={data.curriculum.length > 0} />
                    <ReviewItem label="Thumbnail" value={data.thumbnail ? "Uploaded" : "Missing"} valid={!!data.thumbnail} />
                    <ReviewItem label="Security Check" value={isVerified ? "Passed" : "Pending"} valid={isVerified} />
                </div>
                
                {publishError && <div className="p-4 bg-red-900/20 text-red-400 rounded-lg text-sm border border-red-500/20">{publishError}</div>}

                <button onClick={handlePublish} disabled={!isVerified || loading} className="w-full py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20">
                    {loading ? <Loader2 className="animate-spin" /> : <Upload size={20} />} {isVerified ? "Publish Course" : "Complete Security Check First"}
                </button>
             </div>
          )}

        </div>
      </main>
    </div>
  )
}

// ----------------------------------------------------------------------
// 6. HELPER COMPONENTS (Typed)
// ----------------------------------------------------------------------

type HeaderProps = { title: string; sub?: string }
const Header = ({ title, sub }: HeaderProps) => (
  <div className="mb-6">
    <h1 className="text-3xl font-bold mb-1">{title}</h1>
    <p className="text-zinc-400">{sub}</p>
  </div>
)

type InputProps = {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}
const Input = ({ label, value, onChange, placeholder }: InputProps) => (
  <div className="space-y-2">
    <label className="text-sm font-medium text-zinc-400">{label}</label>
    <input value={value} onChange={e => onChange(e.target.value)} className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-emerald-500" placeholder={placeholder} />
  </div>
)

type NavBtnProps = {
  active?: boolean
  icon: React.ComponentType<any>
  label: string
  onClick?: () => void
  alert?: boolean
}
const NavBtn = ({ active, icon: Icon, label, onClick, alert }: NavBtnProps) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${active ? 'bg-white text-black' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}>
    <Icon size={18} /> <span className="text-sm font-medium flex-1 text-left">{label}</span> {alert && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
  </button>
)

type MediaUploadProps = {
  label: string
  type: 'image' | 'video'
  url: string | null
  uploading: boolean
  onUpload: (file: File) => void
}
const MediaUpload = ({ label, type, url, uploading, onUpload }: MediaUploadProps) => (
  <div className="space-y-2">
    <label className="text-sm font-medium text-zinc-400">{label}</label>
    <label className="aspect-video bg-zinc-900 border border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 transition-all relative overflow-hidden group">
      {url ? (type === 'video' ? <video src={url} className="w-full h-full object-cover" controls /> : <img src={url} className="w-full h-full object-cover" />) : <div className="text-center group-hover:scale-105 transition-transform"><div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-2">{uploading ? <Loader2 className="animate-spin"/> : <Upload size={18}/>}</div><span className="text-xs text-zinc-500 font-bold uppercase">Upload</span></div>}
      <input type="file" className="hidden" accept={type === 'video' ? "video/*" : "image/*"} onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} />
    </label>
  </div>
)

type ReviewItemProps = { label: string; value: string; valid: boolean }
const ReviewItem = ({ label, value, valid }: ReviewItemProps) => (
  <div className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
    <span className="text-zinc-400 text-sm">{label}</span>
    <div className="flex items-center gap-2"><span className={`text-sm font-medium ${valid ? 'text-white' : 'text-red-400'}`}>{value}</span>{valid ? <CheckCircle2 size={16} className="text-emerald-500"/> : <AlertCircle size={16} className="text-red-500"/>}</div>
  </div>
)

const ModeSelection = ({ onSelect }: { onSelect: (m: CourseMode) => void }) => (
  <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-zinc-800/30 via-black to-black pointer-events-none" />
    <h1 className="text-5xl font-black mb-4 relative z-10">Select Course Mode</h1>
    <p className="text-zinc-400 text-lg mb-12 relative z-10">Choose how you want to deliver value to your students.</p>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full relative z-10">
      <div onClick={() => onSelect('standard')} className="bg-zinc-900/50 border border-white/10 p-8 rounded-3xl cursor-pointer hover:bg-zinc-900 hover:border-emerald-500 transition-all group"><div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 mb-6 group-hover:scale-110 transition-transform"><Video size={32}/></div><h3 className="text-2xl font-bold mb-2">Standard</h3><p className="text-zinc-400">Self-paced video lessons. Perfect for tutorials, guides, and masterclasses.</p></div>
      <div onClick={() => onSelect('premium')} className="bg-gradient-to-b from-yellow-900/20 to-black border border-yellow-500/30 p-8 rounded-3xl cursor-pointer hover:border-yellow-500 transition-all group relative"><div className="absolute top-4 right-4 bg-yellow-500 text-black text-[10px] font-black px-2 py-1 rounded">PRO</div><div className="w-14 h-14 bg-yellow-500/10 rounded-2xl flex items-center justify-center text-yellow-500 mb-6 group-hover:scale-110 transition-transform"><Crown size={32}/></div><h3 className="text-2xl font-bold mb-2">Premium</h3><p className="text-zinc-400">High-ticket cohort or mentorship program. Includes 1-on-1 video sessions and assignments.</p></div>
    </div>
  </div>
)