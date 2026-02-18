'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { 
  Save, ChevronLeft, Plus, Trash2, Video, FileText, 
  CheckCircle2, Upload, ShieldCheck, DollarSign, 
  Layout, ChevronDown, ChevronRight, X, Loader2, 
  AlertCircle, Eye, Play, ImageIcon, User, Crown, 
  Calendar, MessageSquare, Briefcase, GraduationCap,
  Clock, Settings, Sparkles, Lock, ScanFace, ShieldAlert,
  Globe, Server, Fingerprint, Wifi, AlertTriangle, ArrowRight,
  MonitorPlay, Map, Users
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/hooks/useAuth' 
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/app/utils/supabase/client'

// ----------------------------------------------------------------------
// 1. DOMAIN TYPES (Strict & Scalable)
// ----------------------------------------------------------------------

type CourseMode = 'standard' | 'premium' | null
type Step = 'mode' | 'details' | 'curriculum' | 'mentorship' | 'pricing' | 'verification' | 'review'

// -- Curriculum / Roadmap Types --
interface ContentItem {
  id: string
  title: string
  type: 'video' | 'article' | 'quiz' | 'assignment' | 'live_session'
  duration?: number // minutes
  isFreePreview?: boolean
  videoUrl?: string
  content?: string
}

interface Module {
  id: string
  title: string
  items: ContentItem[]
  isOpen: boolean
  // Premium Specifics
  isMilestone?: boolean
  milestoneGoal?: string
}

// -- Scheduling Types --
interface TimeWindow {
  start: string // "09:00"
  end: string   // "17:00"
}

interface DayAvailability {
  day: string
  enabled: boolean
  windows: TimeWindow[]
}

interface SchedulingConfig {
  timezone: string
  platform: 'google_meet' | 'zoom' | 'jitsi' | 'custom'
  customLink?: string
  sessionDuration: number // minutes
  bufferTime: number // minutes
  availability: DayAvailability[]
  bookingRules: {
    maxPerWeek: number
    minLeadTime: number // hours
  }
}

// -- Main State --
interface CourseData {
  // Meta
  mode: CourseMode
  title: string
  subtitle: string
  description: string
  category: string
  customCategory: string
  level: string
  thumbnail: string | null
  promoVideo: string | null
  objectives: string[]
  
  // Content
  modules: Module[] // Acts as Sections (Standard) or Phases (Premium)
  
  // Premium Config
  premiumConfig?: {
    format: 'cohort' | 'self_paced'
    cohortStartDate?: string
    communityAccess: boolean
    prioritySupport: boolean
    scheduling: SchedulingConfig
  }

  // Pricing
  pricing: {
    type: 'free' | 'one_time' | 'subscription'
    amount: string
    currency: string
  }
}

// ----------------------------------------------------------------------
// 2. CONSTANTS
// ----------------------------------------------------------------------

const CATEGORIES = ["Development", "Business", "Finance", "Design", "Marketing", "Photography", "Health", "Music", "Lifestyle", "Other"]
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const DEFAULT_AVAILABILITY: DayAvailability[] = DAYS.map(d => ({ day: d, enabled: ['Mon','Wed','Fri'].includes(d), windows: [{start: '09:00', end: '17:00'}] }))

// Pricing options used in the UI
const STANDARD_PRICES: string[] = ['Free', '19', '49', '99', 'Custom']
const PREMIUM_PRICES: string[] = ['199', '499', '999', 'Custom']

const INITIAL_DATA: CourseData = {
  mode: null,
  title: '',
  subtitle: '',
  description: '',
  category: 'Development',
  customCategory: '',
  level: 'Beginner',
  thumbnail: null,
  promoVideo: null,
  objectives: ['', '', ''],
  modules: [
    { id: 'mod-1', title: 'Introduction', items: [], isOpen: true }
  ],
  pricing: { type: 'one_time', amount: '', currency: 'USD' }
}

// ----------------------------------------------------------------------
// 3. MAIN COMPONENT
// ----------------------------------------------------------------------

export default function CourseStudio() {
  const router = useRouter()
  const { user } = useAuth()
  const supabase = createClient()
  
  // State
  const [data, setData] = useState<CourseData>(INITIAL_DATA)
  const [step, setStep] = useState<Step>('mode')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  
  // Verification State
  const [verificationStatus, setVerificationStatus] = useState({
    identity: false,
    profile: false,
    payouts: false
  })
  
  // Load draft from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('grove_course_draft')
    if (saved) {
      try { setData(JSON.parse(saved)); setLastSaved(new Date()) } catch (e) {}
    }
  }, [])

  // Auto-save effect
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('grove_course_draft', JSON.stringify(data))
      setLastSaved(new Date())
    }, 3000)
    return () => clearTimeout(timer)
  }, [data])

  // --- ACTIONS ---

  const handleModeSelect = (mode: CourseMode) => {
    const newData = { ...data, mode }
    if (mode === 'premium') {
      newData.premiumConfig = {
        format: 'self_paced',
        communityAccess: true,
        prioritySupport: true,
        scheduling: {
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          platform: 'google_meet',
          sessionDuration: 45,
          bufferTime: 15,
          availability: DEFAULT_AVAILABILITY,
          bookingRules: { maxPerWeek: 2, minLeadTime: 24 }
        }
      }
      newData.pricing.amount = '499' // Default premium price
    } else {
      newData.pricing.amount = '49' // Default standard price
      delete newData.premiumConfig
    }
    setData(newData)
    setStep('details')
  }

  const handlePublish = async () => {
    setLoading(true)
    try {
      if (!user) throw new Error("Unauthorized")

      // 1. Validate
      const isVerified = Object.values(verificationStatus).every(Boolean)
      if (!isVerified) {
        setStep('verification')
        throw new Error("Please complete verification steps.")
      }

      // 2. Prepare Payload
      const payload = {
        instructor_id: user.id,
        title: data.title,
        subtitle: data.subtitle,
        description: data.description,
        category: data.category === 'Other' ? data.customCategory : data.category,
        level: data.level,
        price: parseFloat(data.pricing.amount) || 0,
        currency: data.pricing.currency,
        thumbnail_url: data.thumbnail,
        promo_video_url: data.promoVideo,
        
        // Architecture Separation
        is_premium: data.mode === 'premium',
        
        // JSON Fields for complex data
        curriculum_data: data.modules, // Stores Sections/Phases structure
        program_config: data.premiumConfig || null, // Stores Scheduling/Roadmap settings
        
        status: 'published',
        published_at: new Date().toISOString()
      }

      const { error } = await supabase.from('courses').insert([payload])
      if (error) throw error

      localStorage.removeItem('grove_course_draft')
      router.push('/dashboard/instructor')
      
    } catch (err: any) {
      alert(err.message || "Publishing failed")
    } finally {
      setLoading(false)
    }
  }

  // --- RENDERERS ---

  if (step === 'mode') return <ModeSelector onSelect={handleModeSelect} />

  return (
    <div className="min-h-screen bg-[#050505] text-white flex font-sans selection:bg-emerald-500/30">
      
      {/* 1. SIDEBAR NAVIGATION */}
      <aside className="w-72 bg-[#0a0a0a] border-r border-white/10 flex flex-col p-6 sticky top-0 h-screen shrink-0 z-20">
        <div className="mb-8">
          <button onClick={() => setStep('mode')} className="text-zinc-500 hover:text-white flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-4 transition-colors">
            <ChevronLeft size={14} /> Back to Modes
          </button>
          <h2 className="font-bold text-lg leading-tight mb-2 line-clamp-2">{data.title || "Untitled Course"}</h2>
          <span className={`text-[10px] font-black uppercase px-2 py-1 rounded border w-fit flex items-center gap-1 ${data.mode === 'premium' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
            {data.mode === 'premium' && <Crown size={10} fill="currentColor"/>} {data.mode} Course
          </span>
        </div>

        <nav className="space-y-1 flex-1">
          <NavBtn active={step === 'details'} icon={FileText} label="Basic Details" onClick={() => setStep('details')} />
          <NavBtn active={step === 'curriculum'} icon={data.mode === 'premium' ? Map : Layout} label={data.mode === 'premium' ? "Roadmap & Modules" : "Curriculum"} onClick={() => setStep('curriculum')} />
          {data.mode === 'premium' && <NavBtn active={step === 'mentorship'} icon={Calendar} label="Scheduling & Live" onClick={() => setStep('mentorship')} />}
          <NavBtn active={step === 'pricing'} icon={DollarSign} label="Pricing" onClick={() => setStep('pricing')} />
          <div className="h-px bg-white/10 my-4" />
          <NavBtn active={step === 'verification'} icon={ShieldCheck} label="Verification" onClick={() => setStep('verification')} alert={!Object.values(verificationStatus).every(Boolean)} />
          <NavBtn active={step === 'review'} icon={CheckCircle2} label="Review & Publish" onClick={() => setStep('review')} />
        </nav>
        
        <div className="mt-auto pt-6 border-t border-white/5">
            <div className="flex justify-between text-[10px] text-zinc-500 mb-2 uppercase font-bold tracking-wider">
                <span>{lastSaved ? 'Saved' : 'Unsaved'}</span>
                <span>{lastSaved?.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE */}
      <main className="flex-1 relative overflow-y-auto bg-black">
        <div className="max-w-5xl mx-auto p-12 pb-32">
          
          {/* --- STEP 1: DETAILS --- */}
          {step === 'details' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4">
              <Header 
                title="Course Essentials" 
                sub="Lay the foundation for your student's success." 
              />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <Input label="Title" value={data.title} onChange={v => setData({...data, title: v})} placeholder="e.g. Advanced System Design" />
                  <Input label="Subtitle" value={data.subtitle} onChange={v => setData({...data, subtitle: v})} placeholder="The hook that grabs attention." />
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Category</label>
                    <div className="flex gap-2 flex-wrap">
                      {CATEGORIES.map(cat => (
                        <button key={cat} onClick={() => setData({...data, category: cat})} className={`px-4 py-2 rounded-lg text-sm border transition-all ${data.category === cat ? 'bg-white text-black border-white font-bold' : 'bg-zinc-900 border-white/10 text-zinc-400 hover:border-white/30'}`}>{cat}</button>
                      ))}
                    </div>
                    {data.category === 'Other' && (
                      <input value={data.customCategory} onChange={e => setData({...data, customCategory: e.target.value})} className="w-full mt-2 bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 focus:border-emerald-500 outline-none" placeholder="Specific Niche..." />
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">What will they learn?</label>
                    {data.objectives.map((obj, i) => (
                      <div key={i} className="flex gap-2">
                        <input value={obj} onChange={e => {const n = [...data.objectives]; n[i] = e.target.value; setData({...data, objectives: n})}} className="flex-1 bg-zinc-900 border border-white/10 rounded-lg px-4 py-2 text-sm" placeholder="Outcome..." />
                        <button onClick={() => setData(p => ({...p, objectives: p.objectives.filter((_, idx) => idx !== i)}))} className="text-zinc-600 hover:text-red-500"><X size={16}/></button>
                      </div>
                    ))}
                    <button onClick={() => setData(p => ({...p, objectives: [...p.objectives, '']}))} className="text-xs font-bold text-emerald-500 flex items-center gap-1 mt-1"><Plus size={14}/> Add Outcome</button>
                  </div>
                </div>

                <div className="space-y-6">
                  <MediaUpload label="Course Thumbnail" type="image" url={data.thumbnail} onUpload={(url) => setData({...data, thumbnail: url})} />
                  <MediaUpload label="Promotional Video" type="video" url={data.promoVideo} onUpload={(url) => setData({...data, promoVideo: url})} />
                </div>
              </div>
            </div>
          )}

          {/* --- STEP 2: CURRICULUM / ROADMAP --- */}
          {step === 'curriculum' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex justify-between items-end border-b border-white/10 pb-6">
                <Header 
                  title={data.mode === 'premium' ? "Program Roadmap" : "Course Curriculum"} 
                  sub={data.mode === 'premium' ? "Structure your mentorship phases and milestones." : "Organize your lectures and sections."} 
                />
                <button onClick={() => setData(p => ({...p, modules: [...p.modules, { id: Date.now().toString(), title: data.mode === 'premium' ? 'New Phase' : 'New Section', items: [], isOpen: true }]}))} className="bg-white text-black px-4 py-2 rounded-lg font-bold hover:bg-zinc-200 flex items-center gap-2 text-sm">
                  <Plus size={16}/> {data.mode === 'premium' ? 'Add Phase' : 'Add Section'}
                </button>
              </div>

              <div className="space-y-6">
                {data.modules.map((mod, mIdx) => (
                  <div key={mod.id} className="bg-zinc-900/40 border border-white/10 rounded-xl overflow-hidden">
                    {/* Module Header */}
                    <div className="p-4 flex items-center gap-4 bg-zinc-900/80 border-b border-white/5">
                      <div className="flex flex-col gap-1 flex-1">
                        <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                          {data.mode === 'premium' ? `Phase ${mIdx + 1}` : `Section ${mIdx + 1}`}
                        </span>
                        <input 
                          value={mod.title} 
                          onChange={e => {
                            const newMods = [...data.modules]; newMods[mIdx].title = e.target.value; setData({...data, modules: newMods})
                          }}
                          className="bg-transparent font-bold text-white text-lg w-full outline-none placeholder-zinc-700" 
                          placeholder="Enter title..."
                        />
                      </div>
                      
                      {data.mode === 'premium' && (
                        <button 
                          onClick={() => {
                            const newMods = [...data.modules]; newMods[mIdx].isMilestone = !newMods[mIdx].isMilestone; setData({...data, modules: newMods})
                          }}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold uppercase transition-all ${mod.isMilestone ? 'bg-amber-500/20 text-amber-500 border-amber-500/50' : 'border-white/10 text-zinc-600 hover:border-white/30'}`}
                        >
                          <Crown size={12} /> Milestone
                        </button>
                      )}
                      
                      <button onClick={() => setData(p => ({...p, modules: p.modules.filter(m => m.id !== mod.id)}))} className="text-zinc-600 hover:text-red-500 p-2"><Trash2 size={16}/></button>
                    </div>

                    {/* Content Items */}
                    <div className="p-4 space-y-3">
                      {mod.items.map((item, iIdx) => (
                        <div key={item.id} className="flex items-center gap-3 p-3 bg-black/40 rounded-lg border border-white/5 group hover:border-white/10 transition-colors">
                          <div className={`p-2 rounded-md ${item.type === 'video' ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/10 text-purple-500'}`}>
                            {item.type === 'video' ? <Video size={14}/> : <FileText size={14}/>}
                          </div>
                          <input 
                            value={item.title}
                            onChange={e => {
                              const newMods = [...data.modules]; newMods[mIdx].items[iIdx].title = e.target.value; setData({...data, modules: newMods})
                            }}
                            className="bg-transparent text-sm text-white w-full outline-none"
                            placeholder="Lecture title..."
                          />
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             {/* Simplified Item Type Switcher */}
                             <select 
                                value={item.type}
                                onChange={e => {
                                  const newMods = [...data.modules]; newMods[mIdx].items[iIdx].type = e.target.value as any; setData({...data, modules: newMods})
                                }}
                                className="bg-zinc-800 text-xs rounded border border-white/10 text-zinc-400 outline-none"
                             >
                                <option value="video">Video</option>
                                <option value="article">Article</option>
                                <option value="assignment">Assignment</option>
                             </select>
                          </div>
                        </div>
                      ))}
                      
                      <button 
                        onClick={() => {
                          const newMods = [...data.modules]; 
                          newMods[mIdx].items.push({ id: Date.now().toString(), title: '', type: 'video', isFreePreview: false }); 
                          setData({...data, modules: newMods})
                        }} 
                        className="w-full py-3 border border-dashed border-white/10 rounded-lg text-xs font-bold uppercase text-zinc-500 hover:text-white hover:border-white/20 flex items-center justify-center gap-2 transition-all"
                      >
                        <Plus size={14}/> Add Content
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* --- STEP 3: MENTORSHIP (PREMIUM ONLY) --- */}
          {step === 'mentorship' && data.premiumConfig && (
             <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4">
                <Header title="Program Logistics" sub="Configure how you will deliver this premium experience." />
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                   {/* Availability Config */}
                   <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6 space-y-6">
                       <h3 className="text-lg font-bold flex items-center gap-2"><Calendar size={20} className="text-amber-500"/> Weekly Availability</h3>
                       <div className="space-y-3">
                          {data.premiumConfig.scheduling.availability.map((dayAvail, idx) => (
                             <div key={dayAvail.day} className={`flex items-center gap-4 p-3 rounded-xl border ${dayAvail.enabled ? 'bg-amber-500/5 border-amber-500/20' : 'bg-black/20 border-white/5 opacity-50'}`}>
                                <div className="flex items-center gap-3 w-32">
                                   <input 
                                      type="checkbox" 
                                      checked={dayAvail.enabled} 
                                      onChange={() => {
                                         const newConfig = {...data.premiumConfig!};
                                         newConfig.scheduling.availability[idx].enabled = !dayAvail.enabled;
                                         setData({...data, premiumConfig: newConfig});
                                      }}
                                      className="accent-amber-500 w-4 h-4"
                                   />
                                   <span className="font-bold text-sm">{dayAvail.day}</span>
                                </div>
                                {dayAvail.enabled && (
                                   <div className="flex items-center gap-2 text-sm">
                                      <input type="time" defaultValue={dayAvail.windows[0].start} className="bg-black border border-white/10 rounded px-2 py-1 outline-none" />
                                      <span className="text-zinc-500">-</span>
                                      <input type="time" defaultValue={dayAvail.windows[0].end} className="bg-black border border-white/10 rounded px-2 py-1 outline-none" />
                                   </div>
                                )}
                             </div>
                          ))}
                       </div>
                   </div>

                   {/* Platform Config */}
                   <div className="space-y-6">
                       <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6">
                           <h3 className="text-lg font-bold flex items-center gap-2 mb-4"><Video size={20} className="text-amber-500"/> Meeting Platform</h3>
                           <div className="space-y-4">
                               <select 
                                  value={data.premiumConfig.scheduling.platform}
                                  onChange={(e) => {
                                     const newConfig = {...data.premiumConfig!};
                                     newConfig.scheduling.platform = e.target.value as any;
                                     setData({...data, premiumConfig: newConfig});
                                  }}
                                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none"
                               >
                                  <option value="google_meet">Google Meet</option>
                                  <option value="zoom">Zoom</option>
                                  <option value="jitsi">Jitsi (Integrated)</option>
                                  <option value="custom">Custom Link</option>
                               </select>
                               
                               <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                     <label className="text-xs text-zinc-500 uppercase font-bold">Duration (Min)</label>
                                     <input 
                                        type="number" 
                                        value={data.premiumConfig.scheduling.sessionDuration}
                                        onChange={(e) => {
                                           const newConfig = {...data.premiumConfig!};
                                           newConfig.scheduling.sessionDuration = parseInt(e.target.value);
                                           setData({...data, premiumConfig: newConfig});
                                        }}
                                        className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none" 
                                     />
                                  </div>
                                  <div className="space-y-1">
                                     <label className="text-xs text-zinc-500 uppercase font-bold">Buffer (Min)</label>
                                     <input 
                                        type="number" 
                                        value={data.premiumConfig.scheduling.bufferTime}
                                        onChange={(e) => {
                                           const newConfig = {...data.premiumConfig!};
                                           newConfig.scheduling.bufferTime = parseInt(e.target.value);
                                           setData({...data, premiumConfig: newConfig});
                                        }}
                                        className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none" 
                                     />
                                  </div>
                               </div>
                           </div>
                       </div>
                   </div>
                </div>
             </div>
          )}

          {/* --- STEP 4: PRICING --- */}
          {step === 'pricing' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
               <Header title="Pricing Strategy" sub="Set the value of your content." />
               <div className="flex flex-wrap gap-4 justify-center">
                  {(data.mode === 'premium' ? PREMIUM_PRICES : STANDARD_PRICES).map(p => (
                      <button 
                        key={p} 
                        onClick={() => setData({...data, pricing: { ...data.pricing, amount: p === 'Custom' ? '' : p }})} 
                        className={`w-40 h-40 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all duration-300 ${data.pricing.amount === p ? 'bg-white text-black border-white scale-110 shadow-2xl' : 'bg-zinc-900/50 border-white/10 text-zinc-400 hover:bg-zinc-800 hover:border-white/20'}`}
                      >
                          <span className="font-black text-2xl">{p === 'Custom' ? 'Custom' : p === 'Free' ? 'Free' : `$${p}`}</span>
                          <span className="text-[10px] uppercase font-bold tracking-widest opacity-50">USD / One-time</span>
                      </button>
                  ))}
               </div>
               
               {/* Custom Input */}
               {(![...STANDARD_PRICES, ...PREMIUM_PRICES].includes(data.pricing.amount) || data.pricing.amount === '') && (
                   <div className="max-w-xs mx-auto animate-in fade-in">
                        <label className="text-xs font-bold text-zinc-500 uppercase mb-2 block text-center">Custom Amount</label>
                        <div className="relative">
                            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-bold text-zinc-500">$</span>
                            <input 
                                type="number" 
                                value={data.pricing.amount} 
                                onChange={e => setData({...data, pricing: { ...data.pricing, amount: e.target.value }})} 
                                className="bg-zinc-900 border border-white/10 rounded-xl pl-12 pr-6 py-4 text-3xl font-black w-full text-center outline-none focus:border-white" 
                                placeholder="0.00" 
                            />
                        </div>
                   </div>
               )}
            </div>
          )}

          {/* --- STEP 5: PROFESSIONAL VERIFICATION --- */}
          {step === 'verification' && (
             <div className="max-w-2xl mx-auto py-8 animate-in fade-in slide-in-from-bottom-4">
                <Header title="Instructor Verification" sub="We verify every instructor to maintain platform integrity." />
                
                <div className="space-y-4">
                    <VerificationCard 
                        icon={ScanFace} 
                        title="Identity Verification" 
                        desc="Verify your government issued ID via Stripe Identity."
                        status={verificationStatus.identity}
                        onVerify={() => {
                            // Simulating API Call
                            setLoading(true);
                            setTimeout(() => { setVerificationStatus(p => ({...p, identity: true})); setLoading(false) }, 2000)
                        }}
                        loading={loading}
                    />
                    <VerificationCard 
                        icon={User} 
                        title="Profile Completeness" 
                        desc="Ensure your bio, photo, and expertise are populated."
                        status={verificationStatus.profile}
                        onVerify={() => setVerificationStatus(p => ({...p, profile: true}))}
                    />
                    <VerificationCard 
                        icon={Briefcase} 
                        title="Payout Onboarding" 
                        desc="Connect a bank account to receive earnings."
                        status={verificationStatus.payouts}
                        onVerify={() => setVerificationStatus(p => ({...p, payouts: true}))}
                    />
                </div>

                <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-start gap-3">
                    <ShieldCheck className="text-blue-400 shrink-0 mt-1" size={20} />
                    <p className="text-xs text-blue-200 leading-relaxed">
                        By proceeding, you agree to our Instructor Terms. Your course will be reviewed for quality assurance within 24 hours of publishing.
                    </p>
                </div>
             </div>
          )}

          {/* --- STEP 6: REVIEW --- */}
          {step === 'review' && (
             <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
                <Header title="Final Review" sub="Double check everything before going live." />
                
                <div className="bg-zinc-900/50 border border-white/10 rounded-2xl overflow-hidden">
                    <div className="p-6 border-b border-white/5 flex items-center gap-6">
                        <div className="w-24 h-24 bg-zinc-800 rounded-xl overflow-hidden relative shrink-0">
                            {data.thumbnail ? <img src={data.thumbnail} className="object-cover w-full h-full" /> : <div className="flex items-center justify-center h-full"><ImageIcon className="text-zinc-600"/></div>}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold mb-1">{data.title || "Untitled Course"}</h3>
                            <p className="text-sm text-zinc-400 mb-2">{data.subtitle}</p>
                            <span className="text-xs font-bold uppercase bg-white/10 px-2 py-1 rounded text-zinc-300">{data.category}</span>
                        </div>
                        <div className="ml-auto text-right">
                            <div className="text-2xl font-black">${data.pricing.amount}</div>
                            <div className="text-xs text-zinc-500 uppercase font-bold">{data.mode}</div>
                        </div>
                    </div>
                    <div className="p-6 grid grid-cols-2 gap-4 text-sm">
                        <ReviewRow label="Curriculum" value={`${data.modules.length} Modules`} />
                        <ReviewRow label="Instructor" value={user?.email || "Unknown"} />
                        <ReviewRow label="Verification" value="Verified" active />
                        <ReviewRow label="Payouts" value="Connected" active />
                    </div>
                </div>

                <button 
                    onClick={handlePublish} 
                    disabled={loading}
                    className="w-full py-4 bg-white text-black font-black uppercase tracking-widest rounded-xl hover:bg-emerald-400 transition-all shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_-10px_rgba(52,211,153,0.5)] flex items-center justify-center gap-3"
                >
                    {loading ? <Loader2 className="animate-spin" /> : <MonitorPlay size={20} />} 
                    Publish Course
                </button>
             </div>
          )}

        </div>
      </main>
      
      {/* 3. LIVE PREVIEW PANEL (Desktop Only) */}
      <aside className="hidden 2xl:block w-96 border-l border-white/10 bg-[#0a0a0a] p-8 shrink-0 sticky top-0 h-screen overflow-y-auto">
         <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-6 flex items-center gap-2"><Eye size={14}/> Student Preview</h3>
         
         <div className="bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
             <div className="aspect-video bg-zinc-900 relative">
                 {data.thumbnail && <img src={data.thumbnail} className="w-full h-full object-cover" />}
                 <div className="absolute inset-0 flex items-center justify-center bg-black/20"><div className="w-12 h-12 bg-white/20 backdrop-blur rounded-full flex items-center justify-center border border-white/30"><Play size={20} fill="currentColor" /></div></div>
             </div>
             <div className="p-5">
                 <h2 className="font-bold text-lg leading-tight mb-2">{data.title || "Your Course Title"}</h2>
                 <p className="text-xs text-zinc-400 line-clamp-2 mb-4">{data.subtitle || "Your catchy subtitle goes here..."}</p>
                 
                 <div className="flex items-center justify-between mb-4">
                     <div className="flex items-center gap-1 text-amber-400 text-xs font-bold"><Crown size={12}/> <span>4.9</span></div>
                     <span className="text-xs font-bold text-zinc-500">{data.level}</span>
                 </div>
                 
                 <div className="py-3 border-t border-white/10 flex items-center justify-between">
                     <span className="text-xl font-black">${data.pricing.amount || '0.00'}</span>
                     <button className="px-4 py-1.5 bg-white text-black text-xs font-bold rounded-full">Enroll</button>
                 </div>
             </div>
         </div>

         {/* Stats Preview */}
         <div className="mt-8 space-y-4">
             <div className="p-4 rounded-xl bg-zinc-900/50 border border-white/5">
                 <h4 className="text-xs text-zinc-500 font-bold uppercase mb-2">Estimated Earnings</h4>
                 <div className="flex items-end gap-2">
                     <span className="text-2xl font-bold text-emerald-500">$0.00</span>
                     <span className="text-xs text-zinc-600 mb-1">/ month</span>
                 </div>
             </div>
         </div>
      </aside>

    </div>
  )
}

// ----------------------------------------------------------------------
// 4. SUB-COMPONENTS
// ----------------------------------------------------------------------

const Header = ({title, sub}: {title:string, sub:string}) => (
  <div><h1 className="text-3xl font-bold mb-2 tracking-tight">{title}</h1><p className="text-zinc-400 text-lg">{sub}</p></div>
)

type InputProps = {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}

const Input = ({label, value, onChange, placeholder}: InputProps) => (
  <div className="space-y-2">
    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{label}</label>
    <input value={value} onChange={e => onChange(e.target.value)} className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-all text-white placeholder-zinc-700" placeholder={placeholder} />
  </div>
)

const NavBtn = ({ active, icon: Icon, label, onClick, alert }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium ${active ? 'bg-white text-black shadow-lg shadow-white/5' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}>
    <Icon size={18} /> <span className="flex-1 text-left">{label}</span> {alert && <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
  </button>
)

type MediaUploadProps = {
  label: string
  type: 'image' | 'video'
  url: string | null
  onUpload: (url: string) => void
}

const MediaUpload = ({ label, type, url, onUpload }: MediaUploadProps) => {
  const [uploading, setUploading] = useState(false)
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return
    setUploading(true)
    await new Promise(r => setTimeout(r, 1500))
    onUpload(URL.createObjectURL(e.target.files[0]))
    setUploading(false)
  }
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{label}</label>
      <label className="aspect-video bg-zinc-900 border border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-white/40 transition-all relative overflow-hidden group">
        {url ? (
          type === 'video' ? <video src={url} className="w-full h-full object-cover" /> : <img src={url} className="w-full h-full object-cover" />
        ) : (
          <div className="text-center group-hover:scale-105 transition-transform">
            <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
              {uploading ? <Loader2 className="animate-spin text-zinc-500"/> : <Upload size={18} className="text-zinc-500"/>}
            </div>
            <span className="text-xs text-zinc-500 font-bold uppercase">{uploading ? 'Uploading...' : `Click to Upload ${type}`}</span>
          </div>
        )}
        <input type="file" className="hidden" accept={type === 'video' ? "video/*" : "image/*"} onChange={handleFile} />
      </label>
    </div>
  )
}

const VerificationCard = ({ icon: Icon, title, desc, status, onVerify, loading }: any) => (
    <div className="bg-zinc-900 border border-white/10 p-5 rounded-xl flex items-center gap-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${status ? 'bg-emerald-500/20 text-emerald-500' : 'bg-white/5 text-zinc-500'}`}>
            {status ? <CheckCircle2 size={24}/> : <Icon size={24}/>}
        </div>
        <div className="flex-1">
            <h4 className="font-bold text-sm text-white">{title}</h4>
            <p className="text-xs text-zinc-400">{desc}</p>
        </div>
        {!status && (
            <button onClick={onVerify} disabled={loading} className="px-4 py-2 bg-white text-black text-xs font-bold rounded-lg hover:bg-zinc-200 disabled:opacity-50">
                {loading ? <Loader2 size={14} className="animate-spin"/> : "Verify"}
            </button>
        )}
    </div>
)

const ReviewRow = ({ label, value, active }: any) => (
    <div className="flex justify-between py-1">
        <span className="text-zinc-500">{label}</span>
        <span className={`font-medium ${active ? 'text-emerald-500' : 'text-white'}`}>{value}</span>
    </div>
)

const ModeSelector = ({ onSelect }: { onSelect: (m: CourseMode) => void }) => (
  <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black pointer-events-none" />
    
    <div className="text-center mb-16 relative z-10 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-widest text-zinc-400">
            <Sparkles size={12}/> Creator Studio
        </div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tight">Create your Legacy</h1>
        <p className="text-zinc-400 text-lg max-w-xl mx-auto">Choose a format that suits your teaching style. You can manage multiple courses of different types.</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl w-full relative z-10 px-4">
      {/* Standard Card */}
      <div onClick={() => onSelect('standard')} className="group relative p-8 rounded-3xl bg-[#0a0a0a] border border-white/10 hover:border-emerald-500/50 cursor-pointer transition-all hover:-translate-y-2 overflow-hidden">
          <div className="absolute top-0 right-0 p-32 bg-emerald-500/5 blur-3xl rounded-full group-hover:bg-emerald-500/10 transition-colors pointer-events-none" />
          <div className="relative z-10">
              <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 mb-6 border border-emerald-500/20">
                  <MonitorPlay size={28} />
              </div>
              <h3 className="text-2xl font-bold mb-2">Standard Course</h3>
              <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                  Pre-recorded video lessons, quizzes, and articles. Students learn at their own pace. Ideal for passive income.
              </p>
              <ul className="space-y-2 mb-8">
                  {['Self-Paced Learning', 'Unlimited Students', 'Video & Text Content'].map(i => (
                      <li key={i} className="flex items-center gap-2 text-xs font-bold text-zinc-300"><CheckCircle2 size={14} className="text-emerald-500"/> {i}</li>
                  ))}
              </ul>
              <span className="text-emerald-500 text-sm font-bold flex items-center gap-2 group-hover:gap-4 transition-all">Select Standard <ArrowRight size={16}/></span>
          </div>
      </div>

      {/* Premium Card */}
      <div onClick={() => onSelect('premium')} className="group relative p-8 rounded-3xl bg-gradient-to-b from-[#110e05] to-[#0a0a0a] border border-amber-500/20 hover:border-amber-500 cursor-pointer transition-all hover:-translate-y-2 overflow-hidden">
          <div className="absolute top-0 right-0 p-32 bg-amber-500/5 blur-3xl rounded-full group-hover:bg-amber-500/10 transition-colors pointer-events-none" />
          <div className="absolute top-4 right-4 bg-amber-500 text-black text-[10px] font-black px-3 py-1 rounded uppercase tracking-widest">Exclusive</div>
          
          <div className="relative z-10">
              <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 mb-6 border border-amber-500/20">
                  <Crown size={28} />
              </div>
              <h3 className="text-2xl font-bold mb-2 text-white">Premium Program</h3>
              <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                  High-ticket mentorship or cohort. Includes 1-on-1 video calls, structured roadmaps, and assignments.
              </p>
              <ul className="space-y-2 mb-8">
                  {['Live 1:1 Mentorship', 'High-Ticket Pricing', 'Milestone Roadmap'].map(i => (
                      <li key={i} className="flex items-center gap-2 text-xs font-bold text-zinc-300"><CheckCircle2 size={14} className="text-amber-500"/> {i}</li>
                  ))}
              </ul>
              <span className="text-amber-500 text-sm font-bold flex items-center gap-2 group-hover:gap-4 transition-all">Select Premium <ArrowRight size={16}/></span>
          </div>
      </div>
    </div>
  </div>
)