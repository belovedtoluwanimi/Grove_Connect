'use client'

import React, { useState, createContext, useContext } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, LayoutTemplate, FileVideo, BookOpen, Target, AlertCircle, 
  CheckCircle2, X, Plus, Trash2, Info, Lightbulb, PlayCircle, ShieldCheck,
  Camera, Mic, Sun, HeartHandshake, UploadCloud, Send, Loader2,
  ArrowRight, Layout, ChevronDown, ListChecks, FileText, Presentation, 
  FileCode, Link as LinkIcon, FileArchive,
  ChevronLeft, Video, Eye, Globe, DollarSign, MessageSquare, Rocket, Bold, Italic, List, AlignLeft,
  ImageIcon
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/hooks/useAuth' 
import { createClient } from '@/app/utils/supabase/client'

// --- 1. TOAST SYSTEM (Built-in) ---
type ToastType = 'success' | 'error' | 'info'
interface Toast { id: string; message: string; type: ToastType }
const ToastContext = createContext<any>(null)

const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([])
  const addToast = (message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }
  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className={`px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 backdrop-blur-md border ${
                t.type === 'success' ? 'bg-emerald-900/90 border-emerald-500/50 text-emerald-100' :
                t.type === 'error' ? 'bg-red-900/90 border-red-500/50 text-red-100' :
                'bg-zinc-900/90 border-white/10 text-white'
              }`}
            >
              {t.type === 'success' ? <CheckCircle2 size={18} className="text-emerald-400"/> : 
               t.type === 'error' ? <AlertCircle size={18} className="text-red-400"/> : <Info size={18} className="text-blue-400"/>}
              <span className="text-sm font-medium">{t.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
export const useToast = () => useContext(ToastContext)

// --- 2. TYPES & INITIAL STATE ---
type Phase = 'plan' | 'create' | 'publish'
type Step = 'intended-learners' | 'course-structure' | 'setup-test-video' | 'film-edit' | 'curriculum' | 'landing-page' | 'pricing' | 'course-messages'

// Extended Types for Curriculum
interface QuizQuestion { id: string; question: string; options: string[]; correctIndex: number; }
interface ResourceItem { id: string; type: 'file' | 'link' | 'code'; title: string; url: string; }
interface ContentItem {
  id: string;
  title: string;
  type: 'video' | 'video_slide' | 'article' | 'quiz' | 'practice_test';
  videoUrl?: string;
  slideUrl?: string;
  content?: string;
  quizData?: QuizQuestion[];
  resources: ResourceItem[];
  isOpen: boolean;
  isFreePreview?: boolean;
}
interface Module {
  id: string;
  title: string;
  items: ContentItem[];
  isOpen: boolean;
}

interface CourseData {
  priceTier: number
  currency: string
  id?: string // NEW: Database tracking ID
  objectives: string[]
  prerequisites: string[]
  audienceLevel: string
  modules: Module[]
  // Added for Publish Phase
  title?: string
  subtitle?: string
  description?: string
  language?: string
  category?: string
  subcategory?: string
  primaryTopic?: string
  thumbnail?: string | null
  promoVideo?: string | null
  pricing?: { amount: string, currency: string }
  welcomeMessage?: string
  congratsMessage?: string
}

// --- CURRENCIES & EXCHANGE RATES (For UI scaling) ---
const CURRENCIES = [
  { code: 'USD', symbol: '$', rate: 1, name: 'US Dollar' },
  { code: 'NGN', symbol: '₦', rate: 1500, name: 'Nigerian Naira' },
  { code: 'GBP', symbol: '£', rate: 0.79, name: 'British Pound' },
  { code: 'INR', symbol: '₹', rate: 83, name: 'Indian Rupee' },
  { code: 'EUR', symbol: '€', rate: 0.92, name: 'Euro' },
]
const BASE_TIERS = [0, 9.99, 19.99, 29.99, 49.99, 79.99, 99.99, 149.99, 199.99]
const CATEGORIES = [
  'Development',
  'Business',
  'Finance & Accounting',
  'IT & Software',
  'Office Productivity',
  'Personal Development',
  'Design',
  'Marketing',
  'Lifestyle',
  'Photography',
  'Music',
  'Teaching & Academics',
]

// --- 3. MAIN COMPONENT ---
export default function CreateCoursePage() {
  return (
    <ToastProvider>
      <CourseBuilder />
    </ToastProvider>
  )
}

function CourseBuilder() {
  const { addToast } = useToast()
  const router = useRouter()
  const { user } = useAuth()
  const supabase = createClient()
  
  // State for Phases
  const [phase, setPhase] = useState<Phase>('plan')
  const [activeStep, setActiveStep] = useState<Step>('intended-learners')
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  
  // State for Entire Course
  const [data, setData] = useState<CourseData>({
    priceTier: 0,
    currency: 'USD',
    objectives: ['', '', '', ''], // Minimum 4
    prerequisites: [''],
    audienceLevel: '',
    modules: [{ id: 'mod-1', title: 'Section 1: Introduction', items: [], isOpen: true }],
    title: '', subtitle: '', description: '', language: 'English (US)', category: '', subcategory: '', primaryTopic: '',
    thumbnail: null, promoVideo: null, pricing: { amount: '', currency: 'USD' }, welcomeMessage: '', congratsMessage: ''
  })

  // --- SUPABASE DATABASE INTEGRATION ---
  const saveToSupabase = async (status: 'draft' | 'published') => {
    if (!user) throw new Error("Authentication required. Please log in.")

    const payload = {
      ...(data.id ? { id: data.id } : {}), // Upsert row if ID exists
      instructor_id: user.id,
      title: data.title || 'Untitled Draft',
      subtitle: data.subtitle,
      description: data.description,
      language: data.language,
      category: data.category,
      subcategory: data.subcategory,
      primary_topic: data.primaryTopic,
      level: data.audienceLevel,
      thumbnail_url: data.thumbnail,
      promo_video_url: data.promoVideo,
      price: data.priceTier ? Number(data.priceTier) : 0,
      currency: data.currency || 'USD',
      welcome_message: data.welcomeMessage,
      congrats_message: data.congratsMessage,
      objectives: data.objectives.filter(o => o.trim() !== ''),
      prerequisites: data.prerequisites.filter(p => p.trim() !== ''),
      curriculum_data: data.modules,
      status: status,
      updated_at: new Date().toISOString(),
      ...(status === 'published' ? { published_at: new Date().toISOString() } : {})
    }

    const { data: savedData, error } = await supabase.from('courses').upsert(payload).select().single()
    if (error) throw error
    return savedData
  }

  const handleSaveDraft = async () => {
    setIsSavingDraft(true)
    try {
      const savedRow = await saveToSupabase('draft')
      if (savedRow && !data.id) {
        setData(prev => ({ ...prev, id: savedRow.id })) // Bind to new DB row
      }
      addToast('Draft saved successfully! You can resume from your dashboard.', 'success')
    } catch (e: any) {
      addToast(e.message || 'Failed to save draft.', 'error')
    } finally {
      setIsSavingDraft(false)
    }
  }

  const handlePublish = async () => {
    // 1. STRICT VALIDATION
    const filledObjectives = data.objectives.filter(o => o.trim() !== '')
    if (filledObjectives.length < 4) return addToast("Provide at least 4 learning objectives (Plan Phase).", "error")
    
    const filledPrereqs = data.prerequisites.filter(p => p.trim() !== '')
    if (filledPrereqs.length < 1) return addToast("Provide at least 1 prerequisite (Plan Phase).", "error")
    
    if (!data.audienceLevel) return addToast("Select a target audience level (Plan Phase).", "error")
    
    if (data.modules.length === 0 || data.modules[0].items.length === 0) {
      return addToast("Curriculum must have at least 1 section and 1 lecture (Create Phase).", "error")
    }

    if (!data.title?.trim()) { setPhase('publish'); setActiveStep('landing-page'); return addToast("Course Title is required.", "error") }
    if (!data.subtitle?.trim()) { setPhase('publish'); setActiveStep('landing-page'); return addToast("Course Subtitle is required.", "error") }
    if (!data.description?.trim()) { setPhase('publish'); setActiveStep('landing-page'); return addToast("Course Description is required.", "error") }
    if (!data.category?.trim()) { setPhase('publish'); setActiveStep('landing-page'); return addToast("Category is required.", "error") }
    if (!data.primaryTopic?.trim()) { setPhase('publish'); setActiveStep('landing-page'); return addToast("Primary Topic is required.", "error") }
    if (!data.thumbnail) { setPhase('publish'); setActiveStep('landing-page'); return addToast("Course Image is required.", "error") }
   if (data.priceTier === undefined || data.priceTier === null) { setPhase('publish'); setActiveStep('pricing'); return addToast("Pricing tier is required.", "error") }

    // 2. SUBMIT TO DB
    setIsPublishing(true)
    try {
      await saveToSupabase('published')
      addToast('Course submitted for review successfully! Redirecting...', 'success')
      setTimeout(() => {
        router.push('/dashboard/instructor')
      }, 2000)
    } catch (e: any) {
      addToast(e.message || 'Failed to publish course.', 'error')
    } finally {
      setIsPublishing(false)
    }
  }

  const navigateToCreatePhase = () => {
    setPhase('create')
    setActiveStep('film-edit')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const navigateToPublishPhase = () => {
    setPhase('publish')
    setActiveStep('landing-page')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Dynamic Background Images
  const bgImage = phase === 'plan' 
    ? "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop" // Planning / Space vibe
    : phase === 'create'
    ? "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop" // Tech / Creation vibe
    : "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2015&auto=format&fit=crop" // Launch / Publish vibe

  return (
    <div className="relative min-h-screen bg-[#050505] text-white flex font-sans selection:bg-emerald-500/30 overflow-hidden">
      
      {/* --- DYNAMIC BACKGROUND --- */}
      <div className="absolute inset-0 z-0">
         <img src={bgImage} alt="bg" className="w-full h-full object-cover opacity-20 transition-opacity duration-1000" />
         <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      </div>
      
      {/* --- SIDEBAR --- */}
      <aside className="w-72 border-r border-white/10 flex flex-col h-screen sticky top-0 shrink-0 z-10 bg-black/40 backdrop-blur-xl">
        <div className="p-6 border-b border-white/5">
         <Link href="/admin/dashboard" className="text-white hover:text-emerald-400 transition-colors">
          <button className="text-zinc-500 hover:text-white flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-6 transition-colors">
            Back to Dashboard
          </button>
          </Link>
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border 
              ${phase === 'plan' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
              : phase === 'create' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-purple-500/10 text-purple-400 border-purple-500/20'}`}>
              Phase: {phase}
            </span>
          </div>
          <h2 className="font-bold text-xl leading-tight">Build Your Course</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-8">
          
          {/* Conditional Sidebar Navigation based on Phase */}
          {phase === 'plan' ? (
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-1">
              <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-3 px-2">Plan Your Course</h3>
              <SidebarItem active={activeStep === 'intended-learners'} icon={Users} label="Intended Learners" onClick={() => setActiveStep('intended-learners')} />
              <SidebarItem active={activeStep === 'course-structure'} icon={LayoutTemplate} label="Course Structure" onClick={() => setActiveStep('course-structure')} />
              <SidebarItem active={activeStep === 'setup-test-video'} icon={Camera} label="Setup & Test Video" onClick={() => setActiveStep('setup-test-video')} />
            </motion.div>
          ) : phase === 'create' ? (
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-1">
              <button onClick={() => { setPhase('plan'); setActiveStep('setup-test-video') }} className="text-xs text-zinc-500 hover:text-white flex items-center gap-1 px-2 mb-4"><ChevronLeft size={14}/> Back to Planning</button>
              <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-3 px-2">Create Your Content</h3>
              <SidebarItem active={activeStep === 'film-edit'} icon={FileVideo} label="Film & Edit" onClick={() => setActiveStep('film-edit')} />
              <SidebarItem active={activeStep === 'curriculum'} icon={Layout} label="Curriculum" onClick={() => setActiveStep('curriculum')} />
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-1">
              <button onClick={() => { setPhase('create'); setActiveStep('curriculum') }} className="text-xs text-zinc-500 hover:text-white flex items-center gap-1 px-2 mb-4"><ChevronLeft size={14}/> Back to Content</button>
              <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-3 px-2">Publish Course</h3>
              <SidebarItem active={activeStep === 'landing-page'} icon={BookOpen} label="Course Landing Page" onClick={() => setActiveStep('landing-page')} />
              <SidebarItem active={activeStep === 'pricing'} icon={DollarSign} label="Pricing" onClick={() => setActiveStep('pricing')} />
              <SidebarItem active={activeStep === 'course-messages'} icon={MessageSquare} label="Course Messages" onClick={() => setActiveStep('course-messages')} />
            </motion.div>
          )}

        </div>

        <div className="p-6 border-t border-white/5 bg-black/20">
          <button onClick={handleSaveDraft} disabled={isSavingDraft || isPublishing} className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] flex items-center justify-center gap-2">
            {isSavingDraft ? <Loader2 size={18} className="animate-spin"/> : "Save Draft"}
          </button>
        </div>
      </aside>

      {/* --- MAIN WORKSPACE --- */}
      <main className="flex-1 overflow-y-auto bg-transparent relative z-10">
        <div className="max-w-5xl mx-auto p-12 pb-32">
          <AnimatePresence mode="wait">
            {/* Phase 1 */}
            {activeStep === 'intended-learners' && <IntendedLearnersStep key="s1" data={data} setData={setData} />}
            {activeStep === 'course-structure' && <CourseStructureStep key="s2" />}
            {activeStep === 'setup-test-video' && <SetupTestVideoStep key="s3" onContinue={navigateToCreatePhase} />}
            
            {/* Phase 2 */}
            {activeStep === 'film-edit' && <FilmAndEditStep key="s4" />}
            {activeStep === 'curriculum' && <CurriculumStep key="s5" data={data} setData={setData} onContinue={navigateToPublishPhase} />}
            
            {/* Phase 3 */}
            {activeStep === 'landing-page' && <LandingPageStep key="s6" data={data} setData={setData} onContinue={() => setActiveStep('pricing')} />}
            {activeStep === 'pricing' && <PricingStep key="s7" data={data} setData={setData} onContinue={() => setActiveStep('course-messages')} />}
            {activeStep === 'course-messages' && <CourseMessagesStep key="s8" data={data} setData={setData} onPublish={handlePublish} isPublishing={isPublishing} />}
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}

// --- 4. STEP COMPONENTS ---

// STEP 1: INTENDED LEARNERS
function IntendedLearnersStep({ data, setData }: { data: CourseData, setData: any }) {
  const { addToast } = useToast()

  const handleObjChange = (idx: number, val: string) => {
    const newObjs = [...data.objectives]; newObjs[idx] = val;
    setData({ ...data, objectives: newObjs })
  }
  const addObj = () => {
    setData({ ...data, objectives: [...data.objectives, ''] })
    addToast('New objective slot added', 'info')
  }
  const removeObj = (idx: number) => {
    if (data.objectives.length <= 4) return addToast('You must have at least 4 objectives.', 'error')
    setData({ ...data, objectives: data.objectives.filter((_, i) => i !== idx) })
    addToast('Objective removed', 'info')
  }

  const handlePreChange = (idx: number, val: string) => {
    const newPres = [...data.prerequisites]; newPres[idx] = val;
    setData({ ...data, prerequisites: newPres })
  }
  const addPre = () => {
    setData({ ...data, prerequisites: [...data.prerequisites, ''] })
    addToast('Prerequisite slot added', 'info')
  }
  const removePre = (idx: number) => {
    setData({ ...data, prerequisites: data.prerequisites.filter((_, i) => i !== idx) })
    addToast('Prerequisite removed', 'info')
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-12">
      <div>
        <h1 className="text-3xl font-bold mb-2">Intended Learners</h1>
        <p className="text-zinc-400 text-lg">The descriptions you write here will help students decide if your course is the right one for them.</p>
      </div>

      <div className="space-y-4 bg-black/40 p-8 rounded-3xl border border-white/5 backdrop-blur-md">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2 mb-1"><Target className="text-blue-500"/> What will students learn in your course?</h3>
          <p className="text-sm text-zinc-500">You must enter at least 4 learning objectives or outcomes that learners can expect to achieve.</p>
        </div>
        <div className="space-y-3">
          <AnimatePresence>
            {data.objectives.map((obj, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex gap-3 group">
                <div className="flex-1 relative">
                  <input value={obj} onChange={e => handleObjChange(idx, e.target.value)} placeholder="Example: Build a full-stack application from scratch" className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3.5 text-sm outline-none focus:border-blue-500 focus:bg-zinc-900 transition-all text-white placeholder-zinc-700" />
                </div>
                <button onClick={() => removeObj(idx)} className="w-12 flex items-center justify-center text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"><Trash2 size={18}/></button>
              </motion.div>
            ))}
          </AnimatePresence>
          <button onClick={addObj} className="text-blue-500 hover:text-blue-400 font-bold text-sm flex items-center gap-2 px-2 py-2 transition-colors"><Plus size={16}/> Add more to your response</button>
        </div>
      </div>

      <div className="space-y-4 bg-black/40 p-8 rounded-3xl border border-white/5 backdrop-blur-md">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2 mb-1"><AlertCircle className="text-amber-500"/> What are the requirements or prerequisites?</h3>
          <p className="text-sm text-zinc-500">List the required skills, experience, tools, or equipment learners should have prior to taking your course.</p>
        </div>
        <div className="space-y-3">
          <AnimatePresence>
            {data.prerequisites.map((pre, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex gap-3 group">
                <input value={pre} onChange={e => handlePreChange(idx, e.target.value)} placeholder="Example: No prior programming experience needed." className="flex-1 bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3.5 text-sm outline-none focus:border-amber-500 focus:bg-zinc-900 transition-all text-white placeholder-zinc-700" />
                <button onClick={() => removePre(idx)} className="w-12 flex items-center justify-center text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"><Trash2 size={18}/></button>
              </motion.div>
            ))}
          </AnimatePresence>
          <button onClick={addPre} className="text-amber-500 hover:text-amber-400 font-bold text-sm flex items-center gap-2 px-2 py-2 transition-colors"><Plus size={16}/> Add more to your response</button>
        </div>
      </div>

      <div className="space-y-4 bg-black/40 p-8 rounded-3xl border border-white/5 backdrop-blur-md">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2 mb-1"><Users className="text-purple-500"/> Who is this course for?</h3>
          <p className="text-sm text-zinc-500">Select the experience level of your target students.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['Beginner', 'Intermediate', 'Expert'].map(level => (
            <button 
              key={level} 
              onClick={() => { setData({...data, audienceLevel: level}); addToast(`Target audience set to ${level}`, 'success') }}
              className={`p-6 rounded-2xl border flex flex-col items-center justify-center gap-3 transition-all ${
                data.audienceLevel === level ? 'bg-purple-500/20 border-purple-500 text-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.2)] scale-105' : 'bg-zinc-900/50 border-white/10 text-zinc-400 hover:border-white/30 hover:bg-zinc-900'
              }`}
            >
              <div className="font-bold text-lg">{level}</div>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

// STEP 2: COURSE STRUCTURE
function CourseStructureStep() {
  const { addToast } = useToast()

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-12">
      <div>
        <h1 className="text-3xl font-bold mb-2">Course Structure & Guidelines</h1>
        <p className="text-zinc-400 text-lg">Planning your course carefully creates a clear learning path for students and makes filming easier for you.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-zinc-900/80 to-[#0a0a0a]/80 backdrop-blur-md border border-white/10 p-8 rounded-3xl relative overflow-hidden group hover:border-emerald-500/50 transition-colors">
          <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 mb-6"><Lightbulb size={24}/></div>
          <h3 className="text-xl font-bold mb-3">Tips for a Great Structure</h3>
          <ul className="space-y-3 text-sm text-zinc-400">
            <li className="flex gap-3"><CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5"/> <span>Create an outline. Decide what skills you’ll teach and how you’ll teach them.</span></li>
            <li className="flex gap-3"><CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5"/> <span>Introduce yourself and create momentum in the first section.</span></li>
            <li className="flex gap-3"><CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5"/> <span>Sections should have a clear learning objective, containing 3-7 lectures.</span></li>
            <li className="flex gap-3"><CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5"/> <span>Include practice activities (quizzes, assignments) to keep learners engaged.</span></li>
          </ul>
        </div>

        <div className="bg-gradient-to-br from-zinc-900/80 to-[#0a0a0a]/80 backdrop-blur-md border border-white/10 p-8 rounded-3xl relative overflow-hidden group hover:border-blue-500/50 transition-colors">
          <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 mb-6"><FileVideo size={24}/></div>
          <h3 className="text-xl font-bold mb-3">Technical Requirements</h3>
          <ul className="space-y-3 text-sm text-zinc-400">
            <li className="flex gap-3"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" /> <span>Videos must be HD resolution (720p or 1080p).</span></li>
            <li className="flex gap-3"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" /> <span>Audio must be clear, free of echo, and synced with video.</span></li>
            <li className="flex gap-3"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" /> <span>No watermarks or distracting branding over your content.</span></li>
            <li className="flex gap-3"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" /> <span>At least 30 minutes of total video content is required to publish.</span></li>
          </ul>
        </div>
      </div>

      <div className="pt-8 border-t border-white/5">
        <h3 className="text-xl font-bold mb-6">Instructor Resources</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <a href="#" onClick={(e) => {e.preventDefault(); addToast('Opening Video Guide...', 'info')}} className="p-6 bg-zinc-900/40 border border-white/5 rounded-2xl hover:bg-zinc-900 hover:border-white/20 transition-all group backdrop-blur-sm">
            <PlayCircle className="text-rose-500 mb-4 group-hover:scale-110 transition-transform" size={28}/>
            <h4 className="font-bold text-white mb-2">How to create a course</h4>
            <p className="text-xs text-zinc-500">Watch a 5-minute video guide from our top instructors.</p>
          </a>
          
          <a href="#" onClick={(e) => {e.preventDefault(); addToast('Navigating to Trust & Safety...', 'info')}} className="p-6 bg-zinc-900/40 border border-white/5 rounded-2xl hover:bg-zinc-900 hover:border-white/20 transition-all group backdrop-blur-sm">
            <ShieldCheck className="text-amber-500 mb-4 group-hover:scale-110 transition-transform" size={28}/>
            <h4 className="font-bold text-white mb-2">Trust & Safety Guidelines</h4>
            <p className="text-xs text-zinc-500">Learn about our policies to ensure your course gets approved quickly.</p>
          </a>

          <a href="#" onClick={(e) => {e.preventDefault(); addToast('Opening Community...', 'info')}} className="p-6 bg-zinc-900/40 border border-white/5 rounded-2xl hover:bg-zinc-900 hover:border-white/20 transition-all group backdrop-blur-sm">
            <Users className="text-purple-500 mb-4 group-hover:scale-110 transition-transform" size={28}/>
            <h4 className="font-bold text-white mb-2">Instructor Community</h4>
            <p className="text-xs text-zinc-500">Join Discord to ask questions and get feedback on your structure.</p>
          </a>
        </div>
      </div>
    </motion.div>
  )
}

// STEP 3: SETUP & TEST VIDEO
function SetupTestVideoStep({ onContinue }: { onContinue: () => void }) {
  const { addToast } = useToast()
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    await new Promise(r => setTimeout(r, 2000))
    setFileUrl(URL.createObjectURL(file))
    setIsUploading(false)
    addToast('Test video uploaded successfully!', 'success')
  }

  const handleSubmitReview = () => {
    setIsSubmitted(true)
    addToast('Test video sent to experts! Expect feedback within 48 hours.', 'success')
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-12">
      <div>
        <h1 className="text-4xl font-black mb-2">Setup & Test Video</h1>
        <p className="text-zinc-400 text-lg">Get early feedback on your audio, lighting, and camera setup before you record your entire course.</p>
      </div>

      <div className="bg-gradient-to-r from-indigo-900/40 to-purple-900/20 border border-indigo-500/20 p-6 rounded-2xl flex items-start gap-4 backdrop-blur-md">
        <HeartHandshake className="text-indigo-400 shrink-0 mt-1" size={28} />
        <div>
          <h3 className="font-bold text-indigo-100 text-lg mb-1">You don't need to be a pro!</h3>
          <p className="text-sm text-indigo-200/80 leading-relaxed">
            Many of our most successful instructors started by recording on their smartphones in their living rooms. 
            You don't need expensive equipment or heavy editing skills. Our expert review team is here to guide you, 
            provide constructive tips, and ensure your students can hear and see you clearly. <b>We are here to help, not criticize.</b>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <h3 className="text-xl font-bold mb-4">What our experts look for:</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-zinc-900/50 p-5 rounded-2xl border border-white/5 backdrop-blur-sm">
              <Mic className="text-emerald-400 mb-3" size={24} />
              <h4 className="font-bold mb-1">Clear Audio</h4>
              <p className="text-xs text-zinc-400">Audio is the most important part! Minimize echo and background noise. A cheap lapel mic works wonders.</p>
            </div>
            <div className="bg-zinc-900/50 p-5 rounded-2xl border border-white/5 backdrop-blur-sm">
              <Sun className="text-amber-400 mb-3" size={24} />
              <h4 className="font-bold mb-1">Good Lighting</h4>
              <p className="text-xs text-zinc-400">Ensure your face is well-lit. Face a window or use a ring light. Avoid strong backlighting.</p>
            </div>
            <div className="bg-zinc-900/50 p-5 rounded-2xl border border-white/5 backdrop-blur-sm">
              <Camera className="text-blue-400 mb-3" size={24} />
              <h4 className="font-bold mb-1">Camera Framing</h4>
              <p className="text-xs text-zinc-400">Keep the camera steady at eye level. Shoot in landscape mode (horizontal) in at least 720p resolution.</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          {isSubmitted ? (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="h-full bg-emerald-900/20 border border-emerald-500/30 rounded-3xl p-8 flex flex-col items-center justify-center text-center backdrop-blur-md">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Video Submitted!</h3>
              <p className="text-sm text-emerald-200/70">
                Our team is currently reviewing your setup. We will email you personalized feedback within <b>48 hours</b>.
              </p>
            </motion.div>
          ) : (
            <div className="bg-zinc-900/60 border border-white/10 rounded-3xl p-6 flex flex-col h-full backdrop-blur-md">
              <h3 className="font-bold text-lg mb-2">Submit a 2-minute test</h3>
              <p className="text-xs text-zinc-400 mb-6">Record yourself speaking about any topic for 1-2 minutes using your intended setup. (Optional)</p>
              
              {!fileUrl ? (
                <label className="flex-1 min-h-[200px] border-2 border-dashed border-white/20 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 hover:bg-white/5 transition-all group">
                  {isUploading ? (
                    <div className="flex flex-col items-center">
                      <Loader2 className="animate-spin text-emerald-500 mb-2" size={28} />
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Uploading...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-zinc-500 group-hover:text-emerald-400 transition-colors">
                      <UploadCloud size={32} className="mb-3" />
                      <span className="text-sm font-bold">Select Video File</span>
                      <span className="text-xs mt-1 opacity-70">MP4 or MOV (Max 500MB)</span>
                    </div>
                  )}
                  <input type="file" accept="video/*" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                </label>
              ) : (
                <div className="flex-1 flex flex-col">
                  <div className="w-full aspect-video bg-black rounded-xl overflow-hidden mb-4 border border-white/10 relative">
                    <video src={fileUrl} className="w-full h-full object-cover" controls />
                    <button onClick={() => setFileUrl(null)} className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-lg hover:bg-red-500 transition-colors text-white backdrop-blur">
                      <X size={14} />
                    </button>
                  </div>
                  <button onClick={handleSubmitReview} className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 mt-auto shadow-lg shadow-white/5">
                    <Send size={18} /> Send for Expert Review
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="pt-12 mt-12 border-t border-white/10 flex justify-end">
         <button onClick={() => { addToast('Welcome to Phase 2: Creation Workspace!', 'info'); onContinue(); }} className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black text-lg rounded-xl shadow-[0_0_40px_-10px_rgba(59,130,246,0.5)] transition-all flex items-center gap-3 hover:scale-105">
            Continue to Create Course <ArrowRight size={24} />
         </button>
      </div>
    </motion.div>
  )
}

// ============================================================================
// 5. PHASE 2 COMPONENTS
// ============================================================================

function FilmAndEditStep() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-12">
      <div>
        <h1 className="text-4xl font-black mb-2">Film & Edit</h1>
        <p className="text-zinc-400 text-lg">You’re now in the creation phase. It’s time to start producing your content.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-black/40 border border-white/5 rounded-3xl p-8 backdrop-blur-md space-y-6">
           <div className="flex items-center gap-3 text-blue-400 mb-2"><Lightbulb size={24}/><h3 className="text-2xl font-bold text-white">Production Tips</h3></div>
           <p className="text-sm text-zinc-400">Recording can be daunting, but preparation is key. Here’s what you need to know:</p>
           <ul className="space-y-4">
              <li className="flex gap-4"><div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg h-fit"><Mic size={18}/></div><div><h4 className="font-bold text-sm text-white">Invest in Audio</h4><p className="text-xs text-zinc-500">Students will forgive bad video, but bad audio will ruin a course.</p></div></li>
              <li className="flex gap-4"><div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg h-fit"><Camera size={18}/></div><div><h4 className="font-bold text-sm text-white">Eye Contact</h4><p className="text-xs text-zinc-500">Look directly into the lens, not at your screen. Imagine you are talking to one specific student.</p></div></li>
              <li className="flex gap-4"><div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg h-fit"><FileVideo size={18}/></div><div><h4 className="font-bold text-sm text-white">Keep it short</h4><p className="text-xs text-zinc-500">Break complex topics into bite-sized 3-7 minute videos. This increases completion rates.</p></div></li>
           </ul>
        </div>

        <div className="bg-black/40 border border-white/5 rounded-3xl p-8 backdrop-blur-md space-y-6">
           <div className="flex items-center gap-3 text-purple-400 mb-2"><LayoutTemplate size={24}/><h3 className="text-2xl font-bold text-white">Editing Resources</h3></div>
           <p className="text-sm text-zinc-400">You don't need Hollywood software to edit your course. Try these instructor favorites:</p>
           <div className="grid grid-cols-1 gap-3">
              <div className="p-4 bg-zinc-900/50 border border-white/10 rounded-xl flex items-center justify-between hover:border-purple-500/50 transition-colors group cursor-pointer">
                 <div><h4 className="font-bold text-sm text-white">CapCut (Free)</h4><p className="text-xs text-zinc-500">Incredibly powerful, easy to learn, works on Desktop & Mobile.</p></div>
                 <ArrowRight size={16} className="text-zinc-600 group-hover:text-purple-400 transition-colors"/>
              </div>
              <div className="p-4 bg-zinc-900/50 border border-white/10 rounded-xl flex items-center justify-between hover:border-purple-500/50 transition-colors group cursor-pointer">
                 <div><h4 className="font-bold text-sm text-white">OBS Studio (Free)</h4><p className="text-xs text-zinc-500">The industry standard for recording your screen and face simultaneously.</p></div>
                 <ArrowRight size={16} className="text-zinc-600 group-hover:text-purple-400 transition-colors"/>
              </div>
              <div className="p-4 bg-zinc-900/50 border border-white/10 rounded-xl flex items-center justify-between hover:border-purple-500/50 transition-colors group cursor-pointer">
                 <div><h4 className="font-bold text-sm text-white">Descript (Free/Paid)</h4><p className="text-xs text-zinc-500">Edit your video by editing text, just like a word document.</p></div>
                 <ArrowRight size={16} className="text-zinc-600 group-hover:text-purple-400 transition-colors"/>
              </div>
           </div>
        </div>
      </div>
    </motion.div>
  )
}

function CurriculumStep({ data, setData, onContinue }: { data: CourseData, setData: any, onContinue: () => void }) {
  const { addToast } = useToast()

  const addModule = () => {
    setData((prev: CourseData) => ({
      ...prev,
      modules: [...prev.modules, { id: Math.random().toString(36).substring(7), title: 'New Section', items: [], isOpen: true }]
    }))
    addToast('Section added', 'success')
  }

  const updateModule = (mIdx: number, field: string, val: any) => {
    setData((prev: CourseData) => {
      const newMods = [...prev.modules];
      newMods[mIdx] = { ...newMods[mIdx], [field]: val };
      return { ...prev, modules: newMods };
    });
  }

  const removeModule = (mIdx: number) => {
    setData((prev: CourseData) => ({
      ...prev,
      modules: prev.modules.filter((_, i) => i !== mIdx)
    }))
  }

  const addItem = (mIdx: number) => {
    setData((prev: CourseData) => {
      const newMods = [...prev.modules];
      newMods[mIdx].items.push({ 
        id: Math.random().toString(36).substring(7), 
        title: 'New Lecture', 
        type: 'video', 
        isFreePreview: false, 
        isOpen: true, 
        resources: [] 
      });
      return { ...prev, modules: newMods };
    });
    addToast('Content item added', 'info')
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
      <div className="flex justify-between items-end border-b border-white/10 pb-6">
        <div>
          <h1 className="text-4xl font-black mb-2">Curriculum Builder</h1>
          <p className="text-zinc-400">Upload your videos, write articles, build quizzes, and attach resources.</p>
        </div>
        <button onClick={addModule} className="bg-white text-black px-5 py-3 rounded-xl font-bold hover:bg-zinc-200 flex items-center gap-2 transition-all">
          <Plus size={18}/> Add Section
        </button>
      </div>

      <div className="space-y-6">
        {data.modules.length === 0 && (
          <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl bg-black/20 backdrop-blur-sm">
            <Layout className="mx-auto text-zinc-600 mb-4" size={48} />
            <p className="text-zinc-400 font-bold">Your curriculum is empty.</p>
            <p className="text-xs text-zinc-500 mb-4">Start by adding a section to hold your lectures.</p>
            <button onClick={addModule} className="mx-auto px-4 py-2 border border-white/20 rounded-lg text-sm font-bold hover:bg-white/5 transition-colors">Add Section</button>
          </div>
        )}
        
        {data.modules.map((mod, mIdx) => (
          <div key={mod.id} className="bg-zinc-900/60 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl">
            <div className="p-5 flex items-center gap-4 bg-black/60 border-b border-white/5 group">
              <button onClick={() => updateModule(mIdx, 'isOpen', !mod.isOpen)} className="text-zinc-400 hover:text-white transition-colors">
                <ChevronDown size={20} className={`transition-transform duration-300 ${mod.isOpen ? '' : '-rotate-90'}`}/>
              </button>
              <div className="flex-1 flex items-center gap-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Section {mIdx + 1}:</span>
                <input value={mod.title} onChange={e => updateModule(mIdx, 'title', e.target.value)} className="bg-transparent font-bold text-white text-lg w-full outline-none placeholder-zinc-700" placeholder="Enter section title..." />
              </div>
              <button onClick={() => removeModule(mIdx)} className="text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-2"><Trash2 size={18}/></button>
            </div>

            <AnimatePresence>
              {mod.isOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="p-5 space-y-4">
                  {mod.items.map((item, iIdx) => (
                    <ContentItemBuilder key={item.id} item={item} mIdx={mIdx} iIdx={iIdx} data={data} setData={setData} />
                  ))}
                  
                  <button onClick={() => addItem(mIdx)} className="w-full py-4 border-2 border-dashed border-white/10 rounded-xl text-sm font-bold uppercase tracking-wider text-emerald-500 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all flex items-center justify-center gap-2">
                    <Plus size={16}/> Add Curriculum Item
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      <div className="pt-12 mt-12 border-t border-white/10 flex justify-end">
         <button onClick={() => { addToast('Welcome to Phase 3: Publish!', 'info'); onContinue(); }} className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-lg rounded-xl shadow-[0_0_40px_-10px_rgba(168,85,247,0.5)] transition-all flex items-center gap-3 hover:scale-105">
            Continue to Publish Phase <ArrowRight size={24} />
         </button>
      </div>

    </motion.div>
  )
}

function ContentItemBuilder({ item, mIdx, iIdx, data, setData }: any) {
  const { addToast } = useToast()
  const [activeTab, setActiveTab] = useState<'content' | 'resources'>('content')

  const updateItem = (field: keyof ContentItem, val: any) => {
    setData((prev: CourseData) => {
      const newMods = [...prev.modules];
      const newItems = [...newMods[mIdx].items];
      newItems[iIdx] = { ...newItems[iIdx], [field]: val };
      newMods[mIdx] = { ...newMods[mIdx], items: newItems };
      return { ...prev, modules: newMods };
    });
  }

  const deleteItem = () => {
    setData((prev: CourseData) => {
      const newMods = [...prev.modules];
      newMods[mIdx].items = newMods[mIdx].items.filter((_, idx) => idx !== iIdx);
      return { ...prev, modules: newMods };
    });
    addToast('Item removed', 'info')
  }

  const TypeIcon = item.type === 'video' ? Video 
                 : item.type === 'video_slide' ? Presentation 
                 : item.type === 'article' ? FileText 
                 : (item.type === 'quiz' || item.type === 'practice_test') ? ListChecks 
                 : BookOpen;

  return (
    <div className="bg-black/80 border border-white/10 rounded-xl overflow-hidden transition-all shadow-lg">
      <div className="p-4 flex items-center gap-4 hover:bg-white/5 transition-colors cursor-pointer group" onClick={() => updateItem('isOpen', !item.isOpen)}>
        <div className="p-2 bg-zinc-800 rounded-lg text-zinc-300"><TypeIcon size={16}/></div>
        <div className="flex-1">
            <input value={item.title} onChange={e => updateItem('title', e.target.value)} onClick={e=>e.stopPropagation()} className="bg-transparent text-sm font-bold text-white w-full outline-none placeholder-zinc-600" placeholder="Enter lecture title..." />
        </div>
        <div className="flex items-center gap-3" onClick={e=>e.stopPropagation()}>
            <select 
              value={item.type} 
              onChange={e => {updateItem('type', e.target.value); addToast('Content type updated', 'info')}} 
              className="bg-zinc-900 border border-white/10 text-xs text-zinc-300 rounded-lg px-2 py-1.5 outline-none cursor-pointer hover:border-white/30 transition-colors"
            >
                <option value="video">Video</option>
                <option value="video_slide">Video & Slide</option>
                <option value="article">Article</option>
                <option value="quiz">Quiz</option>
                <option value="practice_test">Practice Test</option>
            </select>
            <button onClick={() => updateItem('isFreePreview', !item.isFreePreview)} className={`p-1.5 rounded-lg border transition-colors ${item.isFreePreview ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-transparent border-transparent text-zinc-600 hover:text-white hover:bg-white/5'}`} title="Free Preview Toggle">
              <Eye size={16}/>
            </button>
            <button onClick={deleteItem} className="text-zinc-600 hover:text-red-500 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16}/></button>
        </div>
      </div>

      {item.isOpen && (
        <div className="border-t border-white/5 bg-zinc-900/30">
            <div className="flex px-6 pt-4 border-b border-white/5 text-xs font-bold uppercase tracking-wider">
                <button onClick={()=>setActiveTab('content')} className={`pb-3 px-4 border-b-2 transition-colors ${activeTab === 'content' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-zinc-500 hover:text-white'}`}>Build Content</button>
                <button onClick={()=>setActiveTab('resources')} className={`pb-3 px-4 border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'resources' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-zinc-500 hover:text-white'}`}>Resources <span className="bg-white/10 px-1.5 py-0.5 rounded-full text-[10px]">{item.resources?.length || 0}</span></button>
            </div>

            <div className="p-6">
                {activeTab === 'content' && (
                    <div className="animate-in fade-in">
                        {item.type === 'video' && (
                           <div className="max-w-2xl">
                             <VideoUploader label="Upload Lecture Video" url={item.videoUrl} onUpload={(url:string) => {updateItem('videoUrl', url); addToast('Video processed successfully', 'success')}} />
                           </div>
                        )}
                        {item.type === 'video_slide' && (
                            <div className="grid grid-cols-2 gap-6">
                                <VideoUploader label="Upload Video (Talking Head)" url={item.videoUrl} onUpload={(url:string) => updateItem('videoUrl', url)} />
                                <DocumentUploader label="Upload PDF Presentation" url={item.slideUrl} onUpload={(url:string) => updateItem('slideUrl', url)} />
                            </div>
                        )}
                        {item.type === 'article' && (
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Article Content</label>
                                <textarea value={item.content || ''} onChange={e=>updateItem('content', e.target.value)} placeholder="Start writing your article here..." className="w-full h-64 bg-black/50 border border-white/10 rounded-xl p-4 text-sm outline-none focus:border-emerald-500 focus:bg-black resize-none text-zinc-300 transition-all" />
                            </div>
                        )}
                        {(item.type === 'quiz' || item.type === 'practice_test') && (
                            <QuizBuilder quizData={item.quizData || []} onChange={(q:any) => updateItem('quizData', q)} />
                        )}
                    </div>
                )}
                {activeTab === 'resources' && (
                    <ResourceManager resources={item.resources || []} onChange={(r:any) => updateItem('resources', r)} />
                )}
            </div>
        </div>
      )}
    </div>
  )
}

function VideoUploader({ label = "Upload Video", url, onUpload }: any) {
    const [uploading, setUploading] = useState(false)
    const handleFile = async (e: any) => {
        if(!e.target.files[0]) return
        setUploading(true); await new Promise(r=>setTimeout(r, 1500)); 
        onUpload(URL.createObjectURL(e.target.files[0])); setUploading(false)
    }
    return (
        <label className="flex flex-col items-center justify-center w-full aspect-video bg-black/60 border border-dashed border-white/20 rounded-xl cursor-pointer hover:border-emerald-500 hover:bg-black/80 transition-all overflow-hidden group">
            {url ? <video src={url} controls className="w-full h-full object-cover"/> : (
                <div className="text-center">
                    {uploading ? <Loader2 className="animate-spin text-emerald-500 mx-auto mb-3" size={28}/> : <UploadCloud className="text-zinc-500 group-hover:text-emerald-400 mx-auto mb-3 transition-colors" size={32}/>}
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{uploading ? 'Processing Video...' : label}</span>
                    <p className="text-[10px] text-zinc-600 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">MP4, MOV (Max 2GB)</p>
                </div>
            )}
            <input type="file" accept="video/*" className="hidden" onChange={handleFile} disabled={uploading}/>
        </label>
    )
}

function DocumentUploader({ label, url, onUpload }: any) {
    const [uploading, setUploading] = useState(false)
    const handleFile = async (e: any) => {
        if(!e.target.files[0]) return
        setUploading(true); await new Promise(r=>setTimeout(r, 1000)); 
        onUpload(URL.createObjectURL(e.target.files[0])); setUploading(false)
    }
    return (
        <label className="flex flex-col items-center justify-center w-full aspect-video bg-black/60 border border-dashed border-white/20 rounded-xl cursor-pointer hover:border-purple-500 hover:bg-black/80 transition-all overflow-hidden group">
            {url ? <div className="text-purple-400 flex flex-col items-center"><FileText size={40} className="mb-3"/><span className="text-sm font-bold">PDF Attached Successfully</span></div> : (
                <div className="text-center">
                    {uploading ? <Loader2 className="animate-spin text-purple-500 mx-auto mb-3" size={28}/> : <FileArchive className="text-zinc-500 group-hover:text-purple-400 mx-auto mb-3 transition-colors" size={32}/>}
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{uploading ? 'Uploading PDF...' : label}</span>
                </div>
            )}
            <input type="file" accept=".pdf,.ppt,.pptx" className="hidden" onChange={handleFile} disabled={uploading}/>
        </label>
    )
}

function QuizBuilder({ quizData, onChange }: { quizData: QuizQuestion[], onChange: any }) {
    const addQ = () => onChange([...quizData, { id: Math.random().toString(36).substring(7), question: '', options: ['',''], correctIndex: 0 }])
    const updateQ = (qIdx: number, field: string, val: any) => { const n = [...quizData]; (n[qIdx] as any)[field] = val; onChange(n) }
    const updateOpt = (qIdx: number, oIdx: number, val: string) => { const n = [...quizData]; n[qIdx].options[oIdx] = val; onChange(n) }
    const addOpt = (qIdx: number) => { const n = [...quizData]; n[qIdx].options.push(''); onChange(n) }

    return (
        <div className="space-y-8 animate-in fade-in">
            {quizData.length === 0 && <p className="text-sm text-zinc-500 text-center py-4">No questions added yet. Click below to start.</p>}
            
            {quizData.map((q, qIdx) => (
                <div key={q.id} className="bg-black/40 border border-white/10 rounded-2xl p-6 relative group">
                    <button onClick={() => onChange(quizData.filter((_,i)=>i!==qIdx))} className="absolute top-4 right-4 text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16}/></button>
                    <div className="flex gap-4 mb-6 pr-8">
                        <span className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm font-black shrink-0">{qIdx + 1}</span>
                        <div className="flex-1 space-y-1">
                            <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Question Prompt</label>
                            <input value={q.question} onChange={e=>updateQ(qIdx, 'question', e.target.value)} placeholder="Type your question here..." className="w-full bg-transparent border-b border-white/20 pb-2 outline-none font-medium text-white focus:border-emerald-500 text-lg placeholder-zinc-700 transition-colors" />
                        </div>
                    </div>
                    <div className="pl-12 space-y-3">
                        <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider block mb-2">Multiple Choice Options (Select Correct Answer)</label>
                        {q.options.map((opt, oIdx) => (
                            <div key={oIdx} className="flex items-center gap-3">
                                <input type="radio" name={`correct-${q.id}`} checked={q.correctIndex === oIdx} onChange={() => updateQ(qIdx, 'correctIndex', oIdx)} className="w-5 h-5 accent-emerald-500 cursor-pointer" title="Mark as correct answer" />
                                <input value={opt} onChange={e=>updateOpt(qIdx, oIdx, e.target.value)} placeholder={`Option ${oIdx + 1}`} className={`flex-1 bg-zinc-900/80 border rounded-xl px-4 py-2.5 text-sm outline-none transition-colors ${q.correctIndex === oIdx ? 'border-emerald-500/50 text-emerald-100 bg-emerald-500/5' : 'border-white/5 focus:border-white/30 text-white placeholder-zinc-600'}`} />
                                {q.options.length > 2 && <button onClick={()=>{const n=[...quizData]; n[qIdx].options.splice(oIdx,1); if(q.correctIndex===oIdx)n[qIdx].correctIndex=0; onChange(n)}} className="text-zinc-600 hover:text-red-500"><X size={16}/></button>}
                            </div>
                        ))}
                        {q.options.length < 5 && <button onClick={()=>addOpt(qIdx)} className="text-xs font-bold text-emerald-500 hover:text-emerald-400 flex items-center gap-1 mt-2 px-1"><Plus size={14}/> Add Another Option</button>}
                    </div>
                </div>
            ))}
            <button onClick={addQ} className="w-full py-4 border-2 border-dashed border-white/10 rounded-2xl text-sm font-bold hover:bg-white/5 transition-colors flex items-center justify-center gap-2 text-zinc-400 hover:text-white"><Plus size={18}/> New Question</button>
        </div>
    )
}

function ResourceManager({ resources, onChange }: { resources: ResourceItem[], onChange: any }) {
    const addRes = (type: 'file'|'link'|'code') => onChange([...resources, { id: Math.random().toString(36).substring(7), type, title: '', url: '' }])
    
    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex gap-4 border-b border-white/5 pb-6">
                <button onClick={()=>addRes('file')} className="px-5 py-3 bg-black border border-white/10 rounded-xl text-sm font-bold flex items-center gap-2 hover:border-blue-500 transition-colors"><FileText size={16} className="text-blue-500"/> Upload File (PDF)</button>
                <button onClick={()=>addRes('link')} className="px-5 py-3 bg-black border border-white/10 rounded-xl text-sm font-bold flex items-center gap-2 hover:border-emerald-500 transition-colors"><LinkIcon size={16} className="text-emerald-500"/> External Link</button>
                <button onClick={()=>addRes('code')} className="px-5 py-3 bg-black border border-white/10 rounded-xl text-sm font-bold flex items-center gap-2 hover:border-purple-500 transition-colors"><FileCode size={16} className="text-purple-500"/> Source Code</button>
            </div>
            
            <div className="space-y-3">
              {resources.length === 0 && <p className="text-sm text-zinc-500">No resources attached to this lecture. Students love downloadable files!</p>}
              {resources.map((r, i) => (
                  <div key={r.id} className="flex items-center gap-4 bg-black/60 p-4 rounded-xl border border-white/10 group hover:border-white/20 transition-colors">
                      <div className="p-2 bg-zinc-900 rounded-lg">{r.type === 'file' ? <FileText size={20} className="text-blue-500"/> : r.type === 'link' ? <LinkIcon size={20} className="text-emerald-500"/> : <FileCode size={20} className="text-purple-500"/>}</div>
                      <input value={r.title} onChange={e => {const n=[...resources]; n[i].title=e.target.value; onChange(n)}} placeholder="Resource Title" className="bg-transparent text-sm w-1/3 outline-none font-bold placeholder-zinc-700" />
                      <div className="h-6 w-px bg-white/10 mx-2" />
                      <input value={r.url} onChange={e => {const n=[...resources]; n[i].url=e.target.value; onChange(n)}} placeholder={r.type==='link' ? "Paste URL here..." : "Upload simulated URL will appear here..."} className="bg-transparent text-sm flex-1 outline-none text-zinc-400 placeholder-zinc-700" />
                      <button onClick={() => onChange(resources.filter((_,idx)=>idx!==i))} className="text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={18}/></button>
                  </div>
              ))}
            </div>
        </div>
    )
}

// ============================================================================
// 6. PHASE 3: PUBLISH COMPONENTS 
// ============================================================================

function LandingPageStep({ data, setData, onContinue }: { data: CourseData, setData: any, onContinue: () => void }) {
  const { addToast } = useToast()
  const supabase = createClient() // Added Supabase client
  
  // Added loading states for the uploads
  const [isUploadingThumb, setIsUploadingThumb] = useState(false)
  const [isUploadingPromo, setIsUploadingPromo] = useState(false)

  const handleThumbUpload = async (e: any) => {
    const file = e.target.files?.[0]
    if(!file) return
    
    setIsUploadingThumb(true)
    addToast('Uploading Image to server...', 'info')
    
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `thumbnail-${Math.random().toString(36).substring(2)}.${fileExt}`
      
      // Upload to your 'course-content' bucket
      const { error } = await supabase.storage.from('course-content').upload(fileName, file)
      if (error) throw error

      // Get the permanent public URL
      const { data: publicData } = supabase.storage.from('course-content').getPublicUrl(fileName)
      
      setData({...data, thumbnail: publicData.publicUrl})
      addToast('Image uploaded successfully!', 'success')
    } catch (err: any) {
      console.error(err)
      addToast(err.message || 'Failed to upload image.', 'error')
    } finally {
      setIsUploadingThumb(false)
    }
  }

  const handlePromoUpload = async (e: any) => {
    const file = e.target.files?.[0]
    if(!file) return
    
    setIsUploadingPromo(true)
    addToast('Uploading Promo Video... Please wait.', 'info')
    
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `promo-${Math.random().toString(36).substring(2)}.${fileExt}`
      
      // Upload to your 'course-content' bucket
      const { error } = await supabase.storage.from('course-content').upload(fileName, file)
      if (error) throw error

      const { data: publicData } = supabase.storage.from('course-content').getPublicUrl(fileName)
      
      setData({...data, promoVideo: publicData.publicUrl})
      addToast('Promo Video uploaded successfully!', 'success')
    } catch (err: any) {
      console.error(err)
      addToast(err.message || 'Failed to upload video.', 'error')
    } finally {
      setIsUploadingPromo(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-12">
      <div>
        <h1 className="text-4xl font-black mb-2">Course Landing Page</h1>
        <p className="text-zinc-400 text-lg">Your course landing page is crucial to your success on Grove Academy.</p>
      </div>

      <div className="space-y-8 bg-black/40 p-8 rounded-3xl border border-white/5 backdrop-blur-md shadow-2xl">
        
        <div className="space-y-2">
           <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Course Title</label>
           <input value={data.title || ''} onChange={e => setData({...data, title: e.target.value})} placeholder="Learn Advanced System Design..." className="w-full bg-zinc-900/80 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-purple-500 text-white font-bold" />
        </div>

        <div className="space-y-2">
           <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Course Subtitle</label>
           <input value={data.subtitle || ''} onChange={e => setData({...data, subtitle: e.target.value})} placeholder="Insert your catchy hook here..." className="w-full bg-zinc-900/80 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-purple-500 text-white" />
        </div>

        <div className="space-y-2">
           <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Course Description</label>
           <div className="bg-zinc-900/80 border border-white/10 rounded-xl overflow-hidden focus-within:border-purple-500 transition-colors">
              <div className="flex items-center gap-2 px-4 py-2 border-b border-white/10 bg-black/20 text-zinc-400">
                 <button className="p-1.5 hover:bg-white/10 rounded"><Bold size={14}/></button>
                 <button className="p-1.5 hover:bg-white/10 rounded"><Italic size={14}/></button>
                 <div className="w-px h-4 bg-white/10 mx-1" />
                 <button className="p-1.5 hover:bg-white/10 rounded"><List size={14}/></button>
                 <button className="p-1.5 hover:bg-white/10 rounded"><AlignLeft size={14}/></button>
              </div>
              <textarea value={data.description || ''} onChange={e => setData({...data, description: e.target.value})} placeholder="Insert your detailed course description..." className="w-full h-48 bg-transparent p-4 outline-none resize-none text-white text-sm" />
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="space-y-2">
             <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Language</label>
             <select value={data.language || 'English (US)'} onChange={e => setData({...data, language: e.target.value})} className="w-full bg-zinc-900/80 border border-white/10 rounded-xl px-4 py-3 outline-none cursor-pointer text-sm">
                <option>English (US)</option><option>English (UK)</option><option>Spanish</option><option>French</option>
             </select>
           </div>
           <div className="space-y-2">
             <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Category</label>
             <select value={data.category || ''} onChange={e => setData({...data, category: e.target.value})} className="w-full bg-zinc-900/80 border border-white/10 rounded-xl px-4 py-3 outline-none cursor-pointer text-sm">
                <option value="">Select Category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
             </select>
           </div>
           <div className="space-y-2">
             <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Subcategory (Optional)</label>
             <input value={data.subcategory || ''} onChange={e => setData({...data, subcategory: e.target.value})} placeholder="e.g. Next.js" className="w-full bg-zinc-900/80 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-purple-500 text-sm" />
           </div>
        </div>

        <div className="space-y-2">
           <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">What is primarily taught?</label>
           <input value={data.primaryTopic || ''} onChange={e => setData({...data, primaryTopic: e.target.value})} placeholder="e.g. Web Development" className="w-full bg-zinc-900/80 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-purple-500 text-white" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
           {/* Thumbnail Upload */}
           <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center justify-between">Course Image <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded">Required</span></label>
              <label className="flex flex-col items-center justify-center w-full aspect-video bg-zinc-900/80 border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:border-purple-500 transition-all overflow-hidden relative group">
                  {data.thumbnail ? <img src={data.thumbnail} className="w-full h-full object-cover"/> : (
                      <div className="text-center group-hover:scale-105 transition-transform">
                          {isUploadingThumb ? <Loader2 className="animate-spin text-zinc-500 mx-auto mb-2" size={32}/> : <ImageIcon className="text-zinc-500 mx-auto mb-2" size={32}/>}
                          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{isUploadingThumb ? 'Uploading...' : 'Upload Image'}</span>
                          <p className="text-[10px] text-zinc-600 mt-1">750x422 pixels; .jpg, .jpeg, .png</p>
                      </div>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handleThumbUpload} disabled={isUploadingThumb} />
              </label>
           </div>
           
           {/* Promo Video Upload */}
           <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center justify-between">Promotional Video <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded">Optional</span></label>
              <label className="flex flex-col items-center justify-center w-full aspect-video bg-zinc-900/80 border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:border-purple-500 transition-all overflow-hidden relative group">
                  {data.promoVideo ? <video src={data.promoVideo} className="w-full h-full object-cover" controls/> : (
                      <div className="text-center group-hover:scale-105 transition-transform">
                          {isUploadingPromo ? <Loader2 className="animate-spin text-zinc-500 mx-auto mb-2" size={32}/> : <Video className="text-zinc-500 mx-auto mb-2" size={32}/>}
                          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{isUploadingPromo ? 'Uploading...' : 'Upload Video'}</span>
                          <p className="text-[10px] text-zinc-600 mt-1">Students are 5X more likely to enroll.</p>
                      </div>
                  )}
                  <input type="file" accept="video/*" className="hidden" onChange={handlePromoUpload} disabled={isUploadingPromo} />
              </label>
           </div>
        </div>

      </div>

      <div className="flex justify-end pt-4"><button onClick={onContinue} className="px-8 py-4 bg-white text-black font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-transform flex items-center gap-3 shadow-[0_0_40px_rgba(255,255,255,0.2)]">Next Step <ArrowRight size={20}/></button></div>
    </motion.div>
  )
}

function PricingStep({ data, setData, onContinue }: { data: CourseData, setData: any, onContinue: () => void }) {
  const activeCurrency = CURRENCIES.find(c => c.code === data.currency) || CURRENCIES[0]
  
  // Convert base USD tiers to selected currency
  const localizedTiers = BASE_TIERS.map(tier => ({
      usd: tier,
      localized: tier === 0 ? 0 : Math.round(tier * activeCurrency.rate)
  }))

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-12">
      <div>
        <h1 className="text-4xl font-black mb-2">Pricing</h1>
        <p className="text-zinc-400 text-lg">Select the currency and price tier for your course.</p>
      </div>

      <div className="space-y-8 bg-black/40 p-8 rounded-3xl border border-white/5 backdrop-blur-md shadow-2xl">
        
        {/* Currency Selector */}
        <div className="space-y-3 max-w-sm">
           <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2"><Globe size={14}/> Currency</label>
           <select 
              value={data.currency || 'USD'} 
              onChange={e => setData({...data, currency: e.target.value})} 
              className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 outline-none cursor-pointer hover:border-purple-500 transition-colors font-bold text-lg"
           >
              {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} - {c.name}</option>)}
           </select>
        </div>

        {/* Price Tiers Grid */}
        <div className="space-y-3">
           <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Price Tier</label>
           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {localizedTiers.map(tier => {
                 // Strictly compare numbers so the button highlights correctly
                 const isSelected = Number(data.priceTier) === tier.usd
                 return (
                 <button 
                    key={tier.usd} 
                    onClick={() => setData({...data, priceTier: tier.usd})} 
                    className={`p-6 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all ${
                        isSelected ? 'bg-purple-500/20 border-purple-500 text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.2)] scale-[1.02]' : 'bg-zinc-900/50 border-white/10 hover:border-white/30 hover:bg-zinc-900 text-zinc-300'
                    }`}
                 >
                    <span className="font-black text-2xl tracking-tight">
                        {tier.usd === 0 ? 'Free' : `${activeCurrency.symbol}${tier.localized.toLocaleString()}`}
                    </span>
                    {tier.usd !== 0 && activeCurrency.code !== 'USD' && (
                        <span className="text-[10px] font-bold text-zinc-500 uppercase">Tier: ${tier.usd}</span>
                    )}
                 </button>
              )})}
           </div>
        </div>

      </div>

      <div className="flex justify-end pt-4"><button onClick={onContinue} className="px-8 py-4 bg-white text-black font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-transform flex items-center gap-3 shadow-[0_0_40px_rgba(255,255,255,0.2)]">Next Step <ArrowRight size={20}/></button></div>
    </motion.div>
  )
}

function CourseMessagesStep({ data, setData, onPublish, isPublishing }: { data: CourseData, setData: any, onPublish: () => void, isPublishing: boolean }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-12">
      <div>
        <h1 className="text-4xl font-black mb-2">Course Messages <span className="text-sm font-normal text-zinc-500 bg-white/10 px-2 py-1 rounded ml-2">Optional</span></h1>
        <p className="text-zinc-400 text-lg">Write messages that will be sent automatically to your students.</p>
      </div>

      <div className="space-y-8 bg-black/40 p-8 rounded-3xl border border-white/5 backdrop-blur-md shadow-2xl">
        
        <div className="space-y-2">
           <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2"><MessageSquare size={14}/> Welcome Message</label>
           <textarea 
             value={data.welcomeMessage || ''} 
             onChange={e => setData({...data, welcomeMessage: e.target.value})} 
             placeholder="Welcome to the course! I'm so glad you're here..." 
             className="w-full h-32 bg-zinc-900/80 border border-white/10 rounded-xl p-4 outline-none focus:border-purple-500 resize-none text-sm text-white" 
           />
           <p className="text-[10px] text-zinc-500">Sent immediately when a student enrolls.</p>
        </div>

        <div className="space-y-2">
           <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2"><MessageSquare size={14}/> Congratulations Message</label>
           <textarea 
             value={data.congratsMessage || ''} 
             onChange={e => setData({...data, congratsMessage: e.target.value})} 
             placeholder="Congratulations on completing the course! Here are your next steps..." 
             className="w-full h-32 bg-zinc-900/80 border border-white/10 rounded-xl p-4 outline-none focus:border-purple-500 resize-none text-sm text-white" 
           />
           <p className="text-[10px] text-zinc-500">Sent when a student completes 100% of the curriculum.</p>
        </div>

      </div>

      {/* THE BIG SUBMIT BUTTON */}
      <div className="pt-8">
         <button onClick={onPublish} disabled={isPublishing} className="w-full py-5 bg-purple-600 text-white font-black text-xl uppercase tracking-widest rounded-xl hover:scale-[1.02] transition-transform flex items-center justify-center gap-3 shadow-[0_0_50px_rgba(168,85,247,0.4)] disabled:opacity-50">
            {isPublishing ? <Loader2 className="animate-spin" size={24}/> : <Rocket size={24}/>} Submit for Review
         </button>
         <p className="text-center text-xs text-zinc-500 mt-4">By submitting, you agree to the Grove Academy Instructor Terms of Service.</p>
      </div>

    </motion.div>
  )
}

// --- HELPER COMPONENT ---
const SidebarItem = ({ active, icon: Icon, label, onClick }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all text-sm font-bold ${
    active ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)] scale-[1.02]' : 'text-zinc-400 hover:text-white hover:bg-white/5'
  }`}>
    <Icon size={18} /> {label}
  </button>
)