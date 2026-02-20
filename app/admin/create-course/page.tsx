'use client'

import React, { useState, useEffect, createContext, useContext } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, LayoutTemplate, FileVideo, BookOpen, Target, AlertCircle, 
  CheckCircle2, X, Plus, Trash2, Info, Lightbulb, PlayCircle, ShieldCheck,
  Camera, Mic, Sun, HeartHandshake, UploadCloud, Send, Loader2, ArrowRight,
  ListChecks, FileText, Presentation, FileCode, Link as LinkIcon, Settings,
  ChevronDown, HelpCircle, FileArchive, Crown, MonitorPlay, Map, Rocket, DollarSign,
  Sparkles,
  Calendar,
  ScanFace,
  User,
  Briefcase,
  Eye,
  Cloud,
  Layout,
  ChevronLeft,
  Upload,
  Video
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/hooks/useAuth' 
import { createClient } from '@/app/utils/supabase/client'

// ============================================================================
// 1. STRICT TYPES & INTERFACES
// ============================================================================

export type CourseMode = 'standard' | 'premium' | null
export type Phase = 'plan' | 'create' | 'publish'
export type PlanStep = 'intended-learners' | 'course-structure'
export type CreateStep = 'film-edit' | 'curriculum'
export type PublishStep = 'landing-page' | 'pricing-mentorship' | 'verification'

export interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctIndex: number
}

export interface ResourceItem {
  id: string
  type: 'file' | 'link' | 'code'
  title: string
  url: string
}

export interface ContentItem {
  id: string
  title: string
  type: 'video' | 'video_slide' | 'article' | 'quiz' | 'practice_test' | 'assignment'
  videoUrl?: string
  slideUrl?: string
  content?: string
  quizData?: QuizQuestion[]
  resources: ResourceItem[]
  isOpen: boolean
  isFreePreview: boolean
}

export interface Module {
  id: string
  title: string
  items: ContentItem[]
  isOpen: boolean
  isMilestone: boolean
}

export interface TimeWindow { start: string; end: string }
export interface DaySchedule { day: string; enabled: boolean; windows: TimeWindow[] }

export interface PremiumConfig {
  format: 'cohort' | 'self_paced'
  features: { oneOnOne: boolean; prioritySupport: boolean; assignments: boolean; community: boolean }
  scheduling: {
    timezone: string
    platform: 'google_meet' | 'zoom' | 'jitsi' | 'custom'
    customLink?: string
    sessionDuration: number
    bufferTime: number
    availability: DaySchedule[]
    bookingRules: { maxPerWeek: number; minLeadTime: number }
  }
}

export interface CourseData {
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
  prerequisites: string[]
  audienceLevel: string
  modules: Module[]
  premiumConfig?: PremiumConfig
  pricing: { type: 'free' | 'one_time' | 'subscription'; amount: string; currency: string }
}

const CATEGORIES = ["Development", "Business", "Finance", "Design", "Marketing", "Photography", "Health", "Music", "Other"]
const STANDARD_PRICES = ['Free', '19', '49', '99', 'Custom']
const PREMIUM_PRICES = ['199', '499', '999', 'Custom']

const INITIAL_AVAILABILITY: DaySchedule[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => ({
  day, enabled: ['Mon', 'Wed', 'Fri'].includes(day), windows: [{ start: '09:00', end: '17:00' }]
}))

const INITIAL_DATA: CourseData = {
  mode: null, title: '', subtitle: '', description: '', category: 'Development', customCategory: '', level: 'Beginner',
  thumbnail: null, promoVideo: null, objectives: ['', '', '', ''], prerequisites: [''], audienceLevel: 'Beginner',
  modules: [{ id: 'mod-1', title: 'Section 1: Introduction', items: [], isOpen: true, isMilestone: false }],
  pricing: { type: 'one_time', amount: '', currency: 'USD' }
}

// ============================================================================
// 2. TOAST SYSTEM
// ============================================================================

type ToastType = 'success' | 'error' | 'info'
const ToastContext = createContext<{ addToast: (m: string, t?: ToastType) => void }>({ addToast: () => {} })

const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<{id: string, msg: string, type: ToastType}[]>([])
  const addToast = (msg: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts(prev => [...prev, { id, msg, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000)
  }
  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className={`px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 backdrop-blur-md border ${t.type === 'success' ? 'bg-emerald-900/90 border-emerald-500/50 text-emerald-100' : t.type === 'error' ? 'bg-red-900/90 border-red-500/50 text-red-100' : 'bg-blue-900/90 border-blue-500/50 text-blue-100'}`}>
              {t.type === 'success' ? <CheckCircle2 size={18} className="text-emerald-400"/> : t.type === 'error' ? <AlertCircle size={18} className="text-red-400"/> : <Info size={18} className="text-blue-400"/>}
              <span className="text-sm font-medium">{t.msg}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
export const useToast = () => useContext(ToastContext)

// ============================================================================
// 3. MAIN CONTROLLER
// ============================================================================

export default function CreateCoursePage() {
  return <ToastProvider><CourseBuilder /></ToastProvider>
}

function CourseBuilder() {
  const { addToast } = useToast()
  const router = useRouter()
  const supabase = createClient()
  const { user } = useAuth()
  
  // Navigation State
  const [phase, setPhase] = useState<Phase>('plan')
  const [planStep, setPlanStep] = useState<PlanStep>('intended-learners')
  const [createStep, setCreateStep] = useState<CreateStep>('film-edit')
  const [publishStep, setPublishStep] = useState<PublishStep>('landing-page')
  
  // Global Data State
  const [data, setData] = useState<CourseData>(INITIAL_DATA)
  const [isPublishing, setIsPublishing] = useState(false)
  
  // Background Dynamics
  const bgImage = phase === 'plan' ? "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop" 
                : phase === 'create' ? "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop"
                : "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2064&auto=format&fit=crop"

  // Persistence
  useEffect(() => {
    const saved = localStorage.getItem('grove_draft_v3')
    if (saved) try { setData(JSON.parse(saved)) } catch(e) {}
  }, [])

  useEffect(() => {
    if (data.mode) localStorage.setItem('grove_draft_v3', JSON.stringify(data))
  }, [data])

  const handleModeSelect = (mode: CourseMode) => {
    const newData = { ...data, mode }
    if (mode === 'premium' && !newData.premiumConfig) {
      newData.premiumConfig = {
        format: 'self_paced', features: { oneOnOne: true, prioritySupport: true, assignments: true, community: true },
        scheduling: { timezone: 'UTC', platform: 'google_meet', sessionDuration: 45, bufferTime: 15, availability: INITIAL_AVAILABILITY, bookingRules: { maxPerWeek: 2, minLeadTime: 24 } }
      }
      newData.pricing.amount = '499'
    } else if (mode === 'standard') {
      newData.pricing.amount = '49'
    }
    setData(newData)
  }

  const handlePublish = async () => {
    // 1. Validation
    if (!data.title || !data.description || !data.thumbnail) {
      setPhase('publish'); setPublishStep('landing-page')
      return addToast("Please complete the Landing Page details.", "error")
    }
    if (data.modules.length === 0) {
      setPhase('create'); setCreateStep('curriculum')
      return addToast("Please add at least one module/section.", "error")
    }

    // 2. Submission
    setIsPublishing(true)
    try {
      if(!user) throw new Error("Unauthorized")
      const payload = {
        instructor_id: user.id,
        title: data.title,
        subtitle: data.subtitle,
        description: data.description,
        category: data.category === 'Other' ? data.customCategory : data.category,
        level: data.level,
        thumbnail_url: data.thumbnail,
        promo_video_url: data.promoVideo,
        price: parseFloat(data.pricing.amount) || 0,
        currency: data.pricing.currency,
        is_premium: data.mode === 'premium',
        curriculum_data: data.modules, // Stores JSON
        program_config: data.premiumConfig || null, // Stores JSON
        status: 'published',
        published_at: new Date().toISOString()
      }

      const { error } = await supabase.from('courses').insert([payload])
      if (error) throw error

      localStorage.removeItem('grove_draft_v3')
      addToast("Course published successfully!", "success")
      router.push('/dashboard/instructor')
    } catch (e: any) {
      addToast(e.message || "Publishing failed", "error")
    } finally {
      setIsPublishing(false)
    }
  }

  if (!data.mode) return <ModeSelector onSelect={handleModeSelect} />

  return (
    <div className="min-h-screen bg-[#050505] text-white flex font-sans selection:bg-emerald-500/30 relative overflow-hidden">
      
      {/* Background Image Layer */}
      <div className="absolute inset-0 z-0">
         <img src={bgImage} alt="bg" className="w-full h-full object-cover opacity-20 transition-opacity duration-1000" />
         <div className="absolute inset-0 bg-gradient-to-r from-black via-black/95 to-black/80" />
         <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
      </div>

      {/* --- SIDEBAR --- */}
      <aside className="w-72 border-r border-white/10 flex flex-col h-screen sticky top-0 shrink-0 z-20 bg-black/40 backdrop-blur-xl">
        <div className="p-6 border-b border-white/5">
          <button onClick={()=>setData(INITIAL_DATA)} className="text-zinc-500 hover:text-white flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-6 transition-colors">
            <ChevronLeft size={14}/> Change Mode
          </button>
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-[10px] font-black uppercase px-2 py-1 rounded border ${data.mode === 'premium' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
              {data.mode === 'premium' && <Crown size={10} className="inline mr-1"/>} {data.mode} Mode
            </span>
          </div>
          <h2 className="font-bold text-xl leading-tight truncate">{data.title || "Untitled Course"}</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Phase 1 */}
          <div>
            <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-3 px-2">Phase 1: Plan</h3>
            <nav className="space-y-1">
              <SidebarItem active={phase === 'plan' && planStep === 'intended-learners'} icon={Users} label="Intended Learners" onClick={() => {setPhase('plan'); setPlanStep('intended-learners')}} />
              <SidebarItem active={phase === 'plan' && planStep === 'course-structure'} icon={LayoutTemplate} label="Course Structure" onClick={() => {setPhase('plan'); setPlanStep('course-structure')}} />
            </nav>
          </div>
          {/* Phase 2 */}
          <div>
            <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-3 px-2">Phase 2: Create</h3>
            <nav className="space-y-1">
              <SidebarItem active={phase === 'create' && createStep === 'film-edit'} icon={Camera} label="Film & Edit" onClick={() => {setPhase('create'); setCreateStep('film-edit')}} />
              <SidebarItem active={phase === 'create' && createStep === 'curriculum'} icon={Layout} label="Curriculum" onClick={() => {setPhase('create'); setCreateStep('curriculum')}} />
            </nav>
          </div>
          {/* Phase 3 */}
          <div>
            <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-3 px-2">Phase 3: Publish</h3>
            <nav className="space-y-1">
              <SidebarItem active={phase === 'publish' && publishStep === 'landing-page'} icon={BookOpen} label="Landing Page" onClick={() => {setPhase('publish'); setPublishStep('landing-page')}} />
              <SidebarItem active={phase === 'publish' && publishStep === 'pricing-mentorship'} icon={DollarSign} label="Pricing & Delivery" onClick={() => {setPhase('publish'); setPublishStep('pricing-mentorship')}} />
              <SidebarItem active={phase === 'publish' && publishStep === 'verification'} icon={ShieldCheck} label="Verification & Submit" onClick={() => {setPhase('publish'); setPublishStep('verification')}} />
            </nav>
          </div>
        </div>

        <div className="p-6 border-t border-white/5 space-y-3">
          <p className="text-xs text-zinc-500 text-center flex items-center justify-center gap-1"><Cloud size={12}/> Auto-saving enabled</p>
        </div>
      </aside>

      {/* --- MAIN WORKSPACE --- */}
      <main className="flex-1 overflow-y-auto relative z-10">
        <div className="max-w-4xl mx-auto p-12 pb-32">
          <AnimatePresence mode="wait">
            {phase === 'plan' && planStep === 'intended-learners' && <IntendedLearnersStep key="p1" data={data} setData={setData} onContinue={() => setPlanStep('course-structure')} />}
            {phase === 'plan' && planStep === 'course-structure' && <CourseStructureStep key="p2" onContinue={() => {setPhase('create'); setCreateStep('film-edit')}} />}
            
            {phase === 'create' && createStep === 'film-edit' && <FilmAndEditStep key="c1" onContinue={() => setCreateStep('curriculum')} />}
            {phase === 'create' && createStep === 'curriculum' && <CurriculumStep key="c2" data={data} setData={setData} onContinue={() => {setPhase('publish'); setPublishStep('landing-page')}} />}

            {phase === 'publish' && publishStep === 'landing-page' && <LandingPageStep key="pub1" data={data} setData={setData} onContinue={() => setPublishStep('pricing-mentorship')} />}
            {phase === 'publish' && publishStep === 'pricing-mentorship' && <PricingMentorshipStep key="pub2" data={data} setData={setData} onContinue={() => setPublishStep('verification')} />}
            {phase === 'publish' && publishStep === 'verification' && <VerificationStep key="pub3" onPublish={handlePublish} isPublishing={isPublishing} />}
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}

// ============================================================================
// 4. PHASE COMPONENTS
// ============================================================================

function IntendedLearnersStep({ data, setData, onContinue }: { data: CourseData, setData: React.Dispatch<React.SetStateAction<CourseData>>, onContinue: () => void }) {
  const { addToast } = useToast()
  
  const updateObj = (idx: number, val: string) => setData(p => { const n = [...p.objectives]; n[idx] = val; return {...p, objectives: n} })
  const removeObj = (idx: number) => { if (data.objectives.length <= 4) return addToast('Keep at least 4 objectives.', 'error'); setData(p => ({...p, objectives: p.objectives.filter((_, i) => i !== idx)})) }
  const addObj = () => setData(p => ({...p, objectives: [...p.objectives, '']}))

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-12">
      <div><h1 className="text-4xl font-black mb-3">Intended Learners</h1><p className="text-zinc-400 text-lg">Define your audience to help students decide if this course is right for them.</p></div>
      <div className="space-y-6 bg-black/40 p-8 rounded-3xl border border-white/10 backdrop-blur-md shadow-2xl">
        <div><h3 className="text-xl font-bold flex items-center gap-2 mb-1"><Target className="text-purple-500"/> What will students learn?</h3><p className="text-sm text-zinc-500">Enter at least 4 learning outcomes.</p></div>
        <div className="space-y-3">
          {data.objectives.map((obj, idx) => (
            <div key={idx} className="flex gap-3 group">
              <input value={obj} onChange={e => updateObj(idx, e.target.value)} placeholder="e.g. Build a full-stack Next.js application" className="flex-1 bg-zinc-900/80 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500 transition-all text-white placeholder-zinc-600" />
              <button onClick={() => removeObj(idx)} className="w-12 flex items-center justify-center text-zinc-600 hover:text-red-500 bg-zinc-900/50 hover:bg-red-500/10 rounded-xl transition-all"><Trash2 size={18}/></button>
            </div>
          ))}
          <button onClick={addObj} className="text-purple-400 hover:text-purple-300 font-bold text-sm flex items-center gap-2 px-2 py-2 transition-colors"><Plus size={16}/> Add Outcome</button>
        </div>
      </div>
      <div className="flex justify-end"><button onClick={onContinue} className="px-8 py-3 bg-white text-black font-bold rounded-xl flex items-center gap-2 hover:scale-105 transition-all">Next Step <ArrowRight size={18}/></button></div>
    </motion.div>
  )
}

function CourseStructureStep({ onContinue }: { onContinue: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-12">
      <div><h1 className="text-4xl font-black mb-3">Course Structure</h1><p className="text-zinc-400 text-lg">Planning your course carefully creates a clear learning path.</p></div>
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-gradient-to-br from-purple-900/20 to-black border border-white/10 p-8 rounded-3xl relative overflow-hidden group">
          <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-500 mb-6"><Lightbulb size={24}/></div>
          <h3 className="text-xl font-bold mb-3">Tips for a Great Structure</h3>
          <ul className="space-y-3 text-sm text-zinc-400">
            <li className="flex gap-3"><CheckCircle2 size={16} className="text-purple-500 shrink-0 mt-0.5"/> <span>Create an outline. Decide what skills you’ll teach.</span></li>
            <li className="flex gap-3"><CheckCircle2 size={16} className="text-purple-500 shrink-0 mt-0.5"/> <span>Sections should have a clear learning objective (3-7 lectures).</span></li>
          </ul>
        </div>
      </div>
      <div className="flex justify-end"><button onClick={onContinue} className="px-8 py-4 bg-purple-600 text-white font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-transform flex items-center gap-3 shadow-[0_0_40px_rgba(168,85,247,0.4)]">Start Creation Phase <ArrowRight size={20}/></button></div>
    </motion.div>
  )
}

function FilmAndEditStep({ onContinue }: { onContinue: () => void }) {
  const { addToast } = useToast()
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if(!e.target.files?.[0]) return
    addToast('Uploading test video...', 'info')
    await new Promise(r=>setTimeout(r, 1500))
    setFileUrl(URL.createObjectURL(e.target.files[0]))
    addToast('Uploaded successfully! Ready for review.', 'success')
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-12">
      <div><h1 className="text-4xl font-black mb-3">Film & Edit</h1><p className="text-zinc-400 text-lg">Set up your recording environment and test your gear.</p></div>
      <div className="bg-gradient-to-r from-emerald-900/30 to-teal-900/10 border border-emerald-500/20 p-6 rounded-2xl flex items-start gap-4">
        <HeartHandshake className="text-emerald-400 shrink-0 mt-1" size={28} />
        <div><h3 className="font-bold text-emerald-100 text-lg mb-1">You don't need to be a pro!</h3><p className="text-sm text-emerald-200/80">Many successful instructors record on smartphones. We are here to guide you.</p></div>
      </div>
      <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-6 flex flex-col h-full backdrop-blur-md">
        <h3 className="font-bold text-lg mb-2">Submit a 2-minute test</h3>
        <p className="text-xs text-zinc-400 mb-6">Record yourself speaking to test your mic and camera. We will review it within 48 hours.</p>
        {!fileUrl ? (
          <label className="flex-1 min-h-[250px] border-2 border-dashed border-white/20 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 bg-black/40 hover:bg-black/60 transition-all group">
            <UploadCloud size={32} className="mb-3 text-zinc-500 group-hover:text-emerald-400" />
            <span className="text-sm font-bold text-zinc-400">Select Video File</span>
            <input type="file" accept="video/*" className="hidden" onChange={handleUpload} />
          </label>
        ) : (
          <div className="flex-1 flex flex-col gap-4">
            <video src={fileUrl} className="w-full aspect-video rounded-xl bg-black" controls />
            <button onClick={() => { addToast('Sent to expert team!', 'success'); onContinue() }} className="w-full py-4 bg-emerald-500 text-black font-bold rounded-xl hover:bg-emerald-400 flex items-center justify-center gap-2"><Send size={18} /> Send for Expert Review & Continue</button>
          </div>
        )}
      </div>
      <div className="flex justify-end"><button onClick={onContinue} className="text-zinc-500 hover:text-white text-sm font-bold">Skip for now &rarr;</button></div>
    </motion.div>
  )
}

function CurriculumStep({ data, setData, onContinue }: { data: CourseData, setData: React.Dispatch<React.SetStateAction<CourseData>>, onContinue: () => void }) {
  const addModule = () => setData(p => ({...p, modules: [...p.modules, { id: Date.now().toString(), title: data.mode === 'premium' ? 'New Phase' : 'New Section', items: [], isOpen: true, isMilestone: false }]}))
  const updateMod = (mIdx: number, f: keyof Module, v: any) => setData(p => { const n=[...p.modules]; n[mIdx]={...n[mIdx],[f]:v}; return {...p, modules: n}})
  const addItem = (mIdx: number) => setData(p => { const n=[...p.modules]; n[mIdx].items.push({ id: Date.now().toString(), title: 'New Lecture', type: 'video', isFreePreview: false, isOpen: true, resources: [] }); return {...p, modules: n}})
  
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
      <div className="flex justify-between items-end border-b border-white/10 pb-6">
        <div><h1 className="text-4xl font-black mb-2">{data.mode === 'premium' ? "Program Roadmap" : "Curriculum"}</h1><p className="text-zinc-400">Build your content structure.</p></div>
        <button onClick={addModule} className="bg-white text-black px-5 py-3 rounded-xl font-bold hover:bg-zinc-200 flex items-center gap-2"><Plus size={18}/> Add {data.mode === 'premium' ? 'Phase' : 'Section'}</button>
      </div>
      <div className="space-y-6">
        {data.modules.map((mod, mIdx) => (
          <div key={mod.id} className="bg-zinc-900/60 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md">
            <div className="p-5 flex items-center gap-4 bg-black/40 border-b border-white/5">
              <button onClick={() => updateMod(mIdx, 'isOpen', !mod.isOpen)} className="text-zinc-400 hover:text-white"><ChevronDown size={20} className={mod.isOpen?'':'-rotate-90'}/></button>
              <input value={mod.title} onChange={e => updateMod(mIdx, 'title', e.target.value)} className="bg-transparent font-bold text-white text-lg w-full outline-none" placeholder="Section Title" />
              <button onClick={() => setData(p => ({...p, modules: p.modules.filter((_, i) => i !== mIdx)}))} className="text-zinc-600 hover:text-red-500"><Trash2 size={18}/></button>
            </div>
            {mod.isOpen && (
              <div className="p-5 space-y-4">
                {mod.items.map((item, iIdx) => <ContentItemBuilder key={item.id} item={item} mIdx={mIdx} iIdx={iIdx} data={data} setData={setData} />)}
                <button onClick={() => addItem(mIdx)} className="w-full py-4 border-2 border-dashed border-white/10 rounded-xl text-sm font-bold uppercase text-emerald-500 hover:bg-emerald-500/10 transition-all flex justify-center gap-2"><Plus size={16}/> Add Curriculum Item</button>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-end pt-8"><button onClick={onContinue} className="px-8 py-4 bg-white text-black font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-transform flex items-center gap-3 shadow-[0_0_40px_rgba(255,255,255,0.2)]">Publish Phase <ArrowRight size={20}/></button></div>
    </motion.div>
  )
}

function LandingPageStep({ data, setData, onContinue }: { data: CourseData, setData: React.Dispatch<React.SetStateAction<CourseData>>, onContinue: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-12">
      <div><h1 className="text-4xl font-black mb-3">Course Landing Page</h1><p className="text-zinc-400 text-lg">This is the face of your course.</p></div>
      <div className="space-y-6">
        <Input label="Course Title" value={data.title} onChange={(v: string) => setData(p => ({...p, title: v}))} placeholder="e.g. Advanced AI Patterns" />
        <Input label="Subtitle" value={data.subtitle} onChange={(v: string) => setData(p => ({...p, subtitle: v}))} placeholder="A catchy hook" />
        <div className="space-y-2">
           <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Category</label>
           <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map(c => <button key={c} onClick={() => setData(p => ({...p, category: c}))} className={`px-4 py-2 rounded-lg text-sm border ${data.category === c ? 'bg-white text-black font-bold' : 'border-white/10 text-zinc-400 hover:border-white/30'}`}>{c}</button>)}
           </div>
           {data.category === 'Other' && <Input label='' value={data.customCategory} onChange={(v: string) => setData(p => ({...p, customCategory: v}))} placeholder="Type category..." />}
        </div>
        <div className="space-y-2">
           <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Description</label>
           <textarea value={data.description} onChange={e => setData(p => ({...p, description: e.target.value}))} className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 h-32 resize-none" />
        </div>
        <div className="grid grid-cols-2 gap-6">
           <MediaUpload label="Course Thumbnail" type="image" url={data.thumbnail} onUpload={(url: string) => setData(p => ({...p, thumbnail: url}))} />
           <MediaUpload label="Promo Video" type="video" url={data.promoVideo} onUpload={(url: string) => setData(p => ({...p, promoVideo: url}))} />
        </div>
      </div>
      <div className="flex justify-end"><button onClick={onContinue} className="px-8 py-3 bg-white text-black font-bold rounded-xl flex items-center gap-2 hover:scale-105 transition-all">Next Step <ArrowRight size={18}/></button></div>
    </motion.div>
  )
}

function PricingMentorshipStep({ data, setData, onContinue }: { data: CourseData, setData: React.Dispatch<React.SetStateAction<CourseData>>, onContinue: () => void }) {
  const updateConfig = (k: string, v: any) => setData(p => ({...p, premiumConfig: {...p.premiumConfig!, scheduling: {...p.premiumConfig!.scheduling, [k]:v}}}))
  
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-12">
      <div><h1 className="text-4xl font-black mb-3">Pricing & Delivery</h1><p className="text-zinc-400 text-lg">Set your value.</p></div>
      
      {/* Pricing */}
      <div className="space-y-4">
        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Price Tier (USD)</label>
        <div className="flex flex-wrap gap-4">
            {(data.mode === 'premium' ? PREMIUM_PRICES : STANDARD_PRICES).map(p => (
                <button key={p} onClick={() => setData(prev => ({...prev, pricing: { ...prev.pricing, amount: p === 'Custom' ? '' : p === 'Free' ? '0' : p }}))} 
                    className={`w-32 h-24 flex items-center justify-center rounded-xl border transition-all text-xl font-bold ${data.pricing.amount === (p==='Free'?'0':p) ? 'bg-emerald-500 text-black border-emerald-500 shadow-lg' : 'bg-zinc-900 border-white/10 text-zinc-400 hover:border-white/30'}`}>
                    {p === 'Custom' ? 'Custom' : p === 'Free' ? 'Free' : `$${p}`}
                </button>
            ))}
        </div>
        {(![...STANDARD_PRICES, ...PREMIUM_PRICES].includes(data.pricing.amount) || data.pricing.amount === '') && (
            <Input label="Custom Amount ($)" type="number" value={data.pricing.amount} onChange={(v: string) => setData(prev => ({...prev, pricing: {...prev.pricing, amount: v}}))} placeholder="0.00" />
        )}
      </div>

      {/* Scheduling (Premium) */}
      {data.mode === 'premium' && data.premiumConfig && (
        <div className="pt-8 border-t border-white/10 space-y-6">
           <h3 className="text-xl font-bold flex items-center gap-2"><Calendar className="text-amber-500"/> Mentorship Availability</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-zinc-900/50 p-6 rounded-2xl border border-white/10 space-y-4">
                 {data.premiumConfig.scheduling.availability.map((day, idx) => (
                    <div key={day.day} className={`flex items-center gap-4 p-3 rounded-lg border ${day.enabled ? 'bg-amber-500/10 border-amber-500/30' : 'border-white/5 bg-black/20'}`}>
                        <input type="checkbox" checked={day.enabled} onChange={(e) => { const n = [...data.premiumConfig!.scheduling.availability]; n[idx].enabled = e.target.checked; updateConfig('availability', n); }} className="w-4 h-4 accent-amber-500" />
                        <span className="w-12 font-bold text-sm">{day.day}</span>
                        {day.enabled && (
                            <div className="flex gap-2 items-center">
                                <input type="time" value={day.windows[0].start} onChange={(e) => { const n = [...data.premiumConfig!.scheduling.availability]; n[idx].windows[0].start = e.target.value; updateConfig('availability', n); }} className="bg-black border border-white/20 rounded px-2 py-1 text-xs outline-none" />
                                <span className="text-zinc-500">-</span>
                                <input type="time" value={day.windows[0].end} onChange={(e) => { const n = [...data.premiumConfig!.scheduling.availability]; n[idx].windows[0].end = e.target.value; updateConfig('availability', n); }} className="bg-black border border-white/20 rounded px-2 py-1 text-xs outline-none" />
                            </div>
                        )}
                    </div>
                 ))}
              </div>
              <div className="bg-zinc-900/50 p-6 rounded-2xl border border-white/10 space-y-4">
                  <Input label="Session Duration (Min)" type="number" value={data.premiumConfig.scheduling.sessionDuration.toString()} onChange={(v: string) => updateConfig('sessionDuration', parseInt(v))} />
                  <Input label="Buffer Time (Min)" type="number" value={data.premiumConfig.scheduling.bufferTime.toString()} onChange={(v: string) => updateConfig('bufferTime', parseInt(v))} />
              </div>
           </div>
        </div>
      )}
      <div className="flex justify-end"><button onClick={onContinue} className="px-8 py-3 bg-white text-black font-bold rounded-xl flex items-center gap-2 hover:scale-105 transition-all">Next Step <ArrowRight size={18}/></button></div>
    </motion.div>
  )
}

function VerificationStep({ onPublish, isPublishing }: { onPublish: () => void, isPublishing: boolean }) {
  const [status, setStatus] = useState({ identity: false, profile: false, payout: false })
  const verify = (k: keyof typeof status) => setStatus(p => ({...p, [k]: true}))
  const isVerified = Object.values(status).every(Boolean)

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-12 max-w-2xl mx-auto text-center">
      <div><h1 className="text-4xl font-black mb-3">Verification & Publish</h1><p className="text-zinc-400 text-lg">We verify instructors to maintain a high-quality platform.</p></div>
      
      <div className="space-y-4 text-left">
          <div className="bg-zinc-900 border border-white/10 p-6 rounded-xl flex items-center gap-6">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${status.identity ? 'bg-emerald-500/20 text-emerald-500' : 'bg-white/5 text-zinc-500'}`}>{status.identity ? <CheckCircle2 size={24}/> : <ScanFace size={24}/>}</div>
              <div className="flex-1"><h4 className="font-bold">Identity Verification</h4><p className="text-xs text-zinc-400">Government ID via Stripe Identity.</p></div>
              <button onClick={() => verify('identity')} disabled={status.identity} className={`px-4 py-2 rounded-lg text-xs font-bold ${status.identity ? 'bg-emerald-500/10 text-emerald-500' : 'bg-white text-black'}`}>{status.identity ? 'Verified' : 'Verify'}</button>
          </div>
          <div className="bg-zinc-900 border border-white/10 p-6 rounded-xl flex items-center gap-6">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${status.profile ? 'bg-emerald-500/20 text-emerald-500' : 'bg-white/5 text-zinc-500'}`}>{status.profile ? <CheckCircle2 size={24}/> : <User size={24}/>}</div>
              <div className="flex-1"><h4 className="font-bold">Profile Completeness</h4><p className="text-xs text-zinc-400">Bio and photo populated.</p></div>
              <button onClick={() => verify('profile')} disabled={status.profile} className={`px-4 py-2 rounded-lg text-xs font-bold ${status.profile ? 'bg-emerald-500/10 text-emerald-500' : 'bg-white text-black'}`}>{status.profile ? 'Verified' : 'Verify'}</button>
          </div>
          <div className="bg-zinc-900 border border-white/10 p-6 rounded-xl flex items-center gap-6">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${status.payout ? 'bg-emerald-500/20 text-emerald-500' : 'bg-white/5 text-zinc-500'}`}>{status.payout ? <CheckCircle2 size={24}/> : <Briefcase size={24}/>}</div>
              <div className="flex-1"><h4 className="font-bold">Payout Onboarding</h4><p className="text-xs text-zinc-400">Connect bank account.</p></div>
              <button onClick={() => verify('payout')} disabled={status.payout} className={`px-4 py-2 rounded-lg text-xs font-bold ${status.payout ? 'bg-emerald-500/10 text-emerald-500' : 'bg-white text-black'}`}>{status.payout ? 'Verified' : 'Verify'}</button>
          </div>
      </div>

      <button onClick={onPublish} disabled={!isVerified || isPublishing} className="w-full py-5 bg-emerald-500 text-black font-black text-lg uppercase tracking-widest rounded-xl hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100 flex justify-center gap-3 mt-12 shadow-[0_0_50px_rgba(52,211,153,0.3)]">
          {isPublishing ? <Loader2 className="animate-spin" size={24}/> : <Rocket size={24}/>} Publish Course to Global
      </button>
    </motion.div>
  )
}

// --- CURRICULUM ITEM BUILDER HELPER ---
function ContentItemBuilder({ item, mIdx, iIdx, data, setData }: { item: ContentItem, mIdx: number, iIdx: number, data: CourseData, setData: React.Dispatch<React.SetStateAction<CourseData>> }) {
  const { addToast } = useToast()
  const [activeTab, setActiveTab] = useState<'content' | 'resources'>('content')

  const updateItem = (field: keyof ContentItem, val: any) => setData(p => { const n=[...p.modules]; n[mIdx].items[iIdx]={...n[mIdx].items[iIdx], [field]:val}; return {...p, modules:n} })

  const TypeIcon = item.type === 'video' ? Video : item.type === 'video_slide' ? Presentation : item.type === 'article' ? FileText : item.type === 'quiz' ? ListChecks : BookOpen

  return (
    <div className="bg-black/60 border border-white/10 rounded-xl overflow-hidden transition-all">
      <div className="p-4 flex items-center gap-4 hover:bg-white/5 cursor-pointer" onClick={() => updateItem('isOpen', !item.isOpen)}>
        <div className="p-2 bg-zinc-800 rounded-lg text-zinc-400"><TypeIcon size={16}/></div>
        <div className="flex-1 flex items-center"><input value={item.title} onChange={e => updateItem('title', e.target.value)} onClick={e=>e.stopPropagation()} className="bg-transparent text-sm font-bold text-white w-full outline-none" placeholder="Lecture Title" /></div>
        <div className="flex items-center gap-3" onClick={e=>e.stopPropagation()}>
            <select value={item.type} onChange={e => {updateItem('type', e.target.value); addToast('Type changed', 'info')}} className="bg-zinc-900 border border-white/10 text-xs text-zinc-300 rounded px-2 py-1 outline-none">
                <option value="video">Video</option><option value="video_slide">Video & Slide</option><option value="article">Article</option><option value="quiz">Quiz</option><option value="assignment">Assignment</option>
            </select>
            <button onClick={() => updateItem('isFreePreview', !item.isFreePreview)} className={`p-1.5 rounded-md ${item.isFreePreview ? 'bg-emerald-500/20 text-emerald-400' : 'text-zinc-600 hover:text-white'}`}><Eye size={16}/></button>
            <button onClick={() => setData(p => { const n=[...p.modules]; n[mIdx].items.splice(iIdx,1); return {...p, modules:n} })} className="text-zinc-600 hover:text-red-500"><Trash2 size={16}/></button>
        </div>
      </div>
      {item.isOpen && (
        <div className="border-t border-white/5 bg-zinc-900/30">
            <div className="flex gap-6 px-6 pt-4 border-b border-white/5 text-sm font-bold">
                <button onClick={()=>setActiveTab('content')} className={`pb-3 border-b-2 transition-colors ${activeTab === 'content' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-zinc-500'}`}>Content</button>
                <button onClick={()=>setActiveTab('resources')} className={`pb-3 border-b-2 transition-colors ${activeTab === 'resources' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-zinc-500'}`}>Resources ({item.resources?.length || 0})</button>
            </div>
            <div className="p-6">
                {activeTab === 'content' && (
                    <div className="animate-in fade-in space-y-4">
                        {item.type === 'video' && <MediaUpload label="Upload Video" type="video" url={item.videoUrl || null} onUpload={(url:string) => updateItem('videoUrl', url)} />}
                        {item.type === 'article' && <textarea value={item.content || ''} onChange={e=>updateItem('content', e.target.value)} placeholder="Write article..." className="w-full h-48 bg-black border border-white/10 rounded-xl p-4 text-sm outline-none focus:border-emerald-500 resize-none text-zinc-300" />}
                        {item.type === 'assignment' && <textarea value={item.content || ''} onChange={e=>updateItem('content', e.target.value)} placeholder="Assignment instructions..." className="w-full h-32 bg-black border border-white/10 rounded-xl p-4 text-sm outline-none focus:border-purple-500 resize-none text-zinc-300" />}
                        {item.type === 'quiz' && <div className="text-sm text-zinc-500 italic p-4 border border-dashed border-white/10 rounded-xl text-center">Quiz Builder logic initializes here.</div>}
                    </div>
                )}
                {activeTab === 'resources' && (
                    <div className="text-sm text-zinc-500 italic p-4 border border-dashed border-white/10 rounded-xl text-center">Attach PDFs, Source Code, or Links here.</div>
                )}
            </div>
        </div>
      )}
    </div>
  )
}

// --- REUSABLE UI PRIMITIVES ---
const SidebarItem = ({ active, icon: Icon, label, onClick }: { active: boolean, icon: any, label: string, onClick: () => void }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold ${active ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}><Icon size={18} /> {label}</button>
)
const Input = ({ label, value, onChange, placeholder, type = 'text' }: { label: string, value: string, onChange: (v: string) => void, placeholder?: string, type?: string }) => (
  <div className="space-y-2 w-full"><label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{label}</label><input type={type} value={value} onChange={e => onChange(e.target.value)} className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-all text-white placeholder-zinc-700" placeholder={placeholder} /></div>
)
const MediaUpload = ({ label, type, url, onUpload }: { label: string, type: 'image'|'video', url: string|null, onUpload: (url: string) => void }) => {
  const [uploading, setUploading] = useState(false)
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => { if (!e.target.files?.[0]) return; setUploading(true); await new Promise(r => setTimeout(r, 1500)); onUpload(URL.createObjectURL(e.target.files[0])); setUploading(false) }
  return (
    <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{label}</label><label className="aspect-video bg-zinc-900 border border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-white/40 transition-all relative overflow-hidden group">{url ? (type === 'video' ? <video src={url} className="w-full h-full object-cover" controls /> : <img src={url} className="w-full h-full object-cover" />) : (<div className="text-center group-hover:scale-105 transition-transform"><div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">{uploading ? <Loader2 className="animate-spin text-zinc-500"/> : <Upload size={18} className="text-zinc-500"/>}</div><span className="text-xs text-zinc-500 font-bold uppercase">{uploading ? 'Uploading...' : `Upload ${type}`}</span></div>)}<input type="file" className="hidden" accept={type === 'video' ? "video/*" : "image/*"} onChange={handleFile} disabled={uploading} /></label></div>
  )
}
const ModeSelector = ({ onSelect }: { onSelect: (m: CourseMode) => void }) => (
  <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black pointer-events-none" />
    <div className="text-center mb-16 relative z-10 space-y-4"><div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-widest text-zinc-400"><Sparkles size={12}/> Creator Studio</div><h1 className="text-5xl md:text-7xl font-black tracking-tight">Create your Legacy</h1><p className="text-zinc-400 text-lg max-w-xl mx-auto">Choose a format that suits your teaching style.</p></div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl w-full relative z-10 px-4">
      <div onClick={() => onSelect('standard')} className="group p-8 rounded-3xl bg-[#0a0a0a] border border-white/10 hover:border-emerald-500/50 cursor-pointer transition-all hover:-translate-y-2 text-left relative overflow-hidden"><div className="absolute top-0 right-0 p-20 bg-emerald-500/5 blur-3xl rounded-full" /><div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 mb-6 border border-emerald-500/20"><MonitorPlay size={28} /></div><h3 className="text-2xl font-bold mb-2">Standard Course</h3><p className="text-zinc-400 text-sm mb-6">Pre-recorded video lessons.</p><span className="text-emerald-500 text-sm font-bold flex items-center gap-2">Select Standard <ArrowRight size={16}/></span></div>
      <div onClick={() => onSelect('premium')} className="group p-8 rounded-3xl bg-gradient-to-b from-[#110e05] to-[#0a0a0a] border border-amber-500/20 hover:border-amber-500 cursor-pointer transition-all hover:-translate-y-2 text-left relative overflow-hidden"><div className="absolute top-0 right-0 p-20 bg-amber-500/5 blur-3xl rounded-full" /><div className="absolute top-4 right-4 bg-amber-500 text-black text-[10px] font-black px-3 py-1 rounded uppercase tracking-widest">Exclusive</div><div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 mb-6 border border-amber-500/20"><Crown size={28} /></div><h3 className="text-2xl font-bold mb-2 text-white">Premium Program</h3><p className="text-zinc-400 text-sm mb-6">High-ticket mentorship.</p><span className="text-amber-500 text-sm font-bold flex items-center gap-2">Select Premium <ArrowRight size={16}/></span></div>
    </div>
  </div>
)