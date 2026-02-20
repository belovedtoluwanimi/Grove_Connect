'use client'

import React, { useState, createContext, useContext } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, LayoutTemplate, FileVideo, BookOpen, Target, AlertCircle, 
  CheckCircle2, X, Plus, Trash2, Info, Lightbulb, PlayCircle, ShieldCheck,
  Camera, Mic, Sun, HeartHandshake, UploadCloud, Send, Loader2,
  ArrowRight, Layout, ChevronDown, ListChecks, FileText, Presentation, 
  FileCode, Link as LinkIcon, FileArchive, ChevronLeft, Video, Eye,
  Bold, Italic, List, AlignLeft, Globe, MessageSquare, Rocket
} from 'lucide-react'

// --- 1. TOAST SYSTEM (Built-in) ---
type ToastType = 'success' | 'error' | 'info'
interface Toast { id: string; message: string; type: ToastType }
const ToastContext = createContext<any>(null)

const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([])
  const addToast = (message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000)
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

interface QuizQuestion { id: string; question: string; options: string[]; correctIndex: number; }
interface ResourceItem { id: string; type: 'file' | 'link' | 'code'; title: string; url: string; }
interface ContentItem {
  id: string; title: string; type: 'video' | 'video_slide' | 'article' | 'quiz' | 'practice_test';
  videoUrl?: string; slideUrl?: string; content?: string; quizData?: QuizQuestion[];
  resources: ResourceItem[]; isOpen: boolean; isFreePreview?: boolean;
}
interface Module { id: string; title: string; items: ContentItem[]; isOpen: boolean; }

interface CourseData {
  objectives: string[]
  prerequisites: string[]
  audienceLevel: string
  modules: Module[]
  
  // Publish Phase Data
  title: string
  subtitle: string
  description: string
  language: string
  category: string
  subcategory: string
  primaryTopic: string
  thumbnailUrl: string | null
  promoVideoUrl: string | null
  currency: string
  priceTier: number
  welcomeMessage: string
  congratsMessage: string
}

// --- CURRENCIES & EXCHANGE RATES (Mock for UI scaling) ---
const CURRENCIES = [
  { code: 'USD', symbol: '$', rate: 1, name: 'US Dollar' },
  { code: 'NGN', symbol: '₦', rate: 1500, name: 'Nigerian Naira' },
  { code: 'GBP', symbol: '£', rate: 0.79, name: 'British Pound' },
  { code: 'INR', symbol: '₹', rate: 83, name: 'Indian Rupee' },
  { code: 'EUR', symbol: '€', rate: 0.92, name: 'Euro' },
  { code: 'CAD', symbol: 'C$', rate: 1.35, name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', rate: 1.53, name: 'Australian Dollar' },
  { code: 'ZAR', symbol: 'R', rate: 18.8, name: 'South African Rand' },
  { code: 'KES', symbol: 'R', rate: 130, name: 'Kenyan Shilling' }
]

// Base USD Tiers
const BASE_TIERS = [0, 9.99, 19.99, 29.99, 49.99, 79.99, 99.99, 149.99, 199.99]

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
  
  const [phase, setPhase] = useState<Phase>('plan')
  const [activeStep, setActiveStep] = useState<Step>('intended-learners')
  
  const [data, setData] = useState<CourseData>({
    objectives: ['', '', '', ''],
    prerequisites: [''],
    audienceLevel: '',
    modules: [{ id: 'mod-1', title: 'Section 1: Introduction', items: [], isOpen: true }],
    title: '', subtitle: '', description: '', language: 'English (US)', category: '', subcategory: '', primaryTopic: '',
    thumbnailUrl: null, promoVideoUrl: null, currency: 'USD', priceTier: 19.99, welcomeMessage: '', congratsMessage: ''
  })

  const handleSave = () => addToast('Changes saved to draft successfully!', 'success')
  const navigateToCreatePhase = () => { setPhase('create'); setActiveStep('film-edit'); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const navigateToPublishPhase = () => { setPhase('publish'); setActiveStep('landing-page'); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  // Background Images per Phase
  const bgImage = phase === 'plan' 
    ? "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop" // Space/Planning
    : phase === 'create'
    ? "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop" // Tech/Creation
    : "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2015&auto=format&fit=crop" // Earth/Launch/Publish

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
          <button className="text-zinc-500 hover:text-white flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-6 transition-colors">
            Back to Dashboard
          </button>
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
          
          {phase === 'plan' && (
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-1">
              <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-3 px-2">Plan Your Course</h3>
              <SidebarItem active={activeStep === 'intended-learners'} icon={Users} label="Intended Learners" onClick={() => setActiveStep('intended-learners')} />
              <SidebarItem active={activeStep === 'course-structure'} icon={LayoutTemplate} label="Course Structure" onClick={() => setActiveStep('course-structure')} />
              <SidebarItem active={activeStep === 'setup-test-video'} icon={Camera} label="Setup & Test Video" onClick={() => setActiveStep('setup-test-video')} />
            </motion.div>
          )}

          {phase === 'create' && (
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-1">
              <button onClick={() => { setPhase('plan'); setActiveStep('setup-test-video') }} className="text-xs text-zinc-500 hover:text-white flex items-center gap-1 px-2 mb-4"><ChevronLeft size={14}/> Back to Planning</button>
              <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-3 px-2">Create Content</h3>
              <SidebarItem active={activeStep === 'film-edit'} icon={FileVideo} label="Film & Edit" onClick={() => setActiveStep('film-edit')} />
              <SidebarItem active={activeStep === 'curriculum'} icon={Layout} label="Curriculum" onClick={() => setActiveStep('curriculum')} />
            </motion.div>
          )}

          {phase === 'publish' && (
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-1">
              <button onClick={() => { setPhase('create'); setActiveStep('curriculum') }} className="text-xs text-zinc-500 hover:text-white flex items-center gap-1 px-2 mb-4"><ChevronLeft size={14}/> Back to Content</button>
              <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-3 px-2">Publish Course</h3>
              <SidebarItem active={activeStep === 'landing-page'} icon={BookOpen} label="Course Landing Page" onClick={() => setActiveStep('landing-page')} />
              <SidebarItem active={activeStep === 'pricing'} icon={DollarSign} label="Pricing" onClick={() => setActiveStep('pricing')} />
              <SidebarItem active={activeStep === 'course-messages'} icon={MessageSquare} label="Course Messages" onClick={() => setActiveStep('course-messages')} />
            </motion.div>
          )}

        </div>

        {/* Dynamic Bottom Button based on Phase */}
        <div className="p-6 border-t border-white/5 bg-black/20">
          {phase === 'publish' && activeStep === 'course-messages' ? (
             <button onClick={() => addToast('Course submitted for review! Our team will get back to you shortly.', 'success')} className="w-full py-3 bg-emerald-500 text-black font-bold rounded-xl hover:bg-emerald-400 transition-all shadow-[0_0_20px_rgba(52,211,153,0.3)] hover:shadow-[0_0_30px_rgba(52,211,153,0.5)] flex items-center justify-center gap-2">
               <Rocket size={18}/> Submit for Review
             </button>
          ) : (
             <button onClick={handleSave} className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]">
               Save Draft
             </button>
          )}
        </div>
      </aside>

      {/* --- MAIN WORKSPACE --- */}
      <main className="flex-1 overflow-y-auto relative z-10">
        <div className="max-w-4xl mx-auto p-12 pb-32">
          <AnimatePresence mode="wait">
            {/* PHASE 1 */}
            {activeStep === 'intended-learners' && <IntendedLearnersStep key="s1" data={data} setData={setData} />}
            {activeStep === 'course-structure' && <CourseStructureStep key="s2" />}
            {activeStep === 'setup-test-video' && <SetupTestVideoStep key="s3" onContinue={navigateToCreatePhase} />}
            
            {/* PHASE 2 */}
            {activeStep === 'film-edit' && <FilmAndEditStep key="s4" />}
            {activeStep === 'curriculum' && <CurriculumStep key="s5" data={data} setData={setData} onContinue={navigateToPublishPhase} />}

            {/* PHASE 3 (NEW) */}
            {activeStep === 'landing-page' && <LandingPageStep key="s6" data={data} setData={setData} />}
            {activeStep === 'pricing' && <PricingStep key="s7" data={data} setData={setData} />}
            {activeStep === 'course-messages' && <CourseMessagesStep key="s8" data={data} setData={setData} />}
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}

// ============================================================================
// 4. PHASE 1 COMPONENTS (Maintained)
// ============================================================================

function IntendedLearnersStep({ data, setData }: any) {
  const { addToast } = useToast()
  const handleObjChange = (idx: number, val: string) => { const n = [...data.objectives]; n[idx] = val; setData({ ...data, objectives: n }) }
  const addObj = () => { setData({ ...data, objectives: [...data.objectives, ''] }); addToast('New objective slot added', 'info') }
  const removeObj = (idx: number) => { if (data.objectives.length <= 4) return addToast('You must have at least 4 objectives.', 'error'); setData({ ...data, objectives: data.objectives.filter((_:any, i:number) => i !== idx) }); addToast('Objective removed', 'info') }

  const handlePreChange = (idx: number, val: string) => { const n = [...data.prerequisites]; n[idx] = val; setData({ ...data, prerequisites: n }) }
  const addPre = () => { setData({ ...data, prerequisites: [...data.prerequisites, ''] }); addToast('Prerequisite slot added', 'info') }
  const removePre = (idx: number) => { setData({ ...data, prerequisites: data.prerequisites.filter((_:any, i:number) => i !== idx) }); addToast('Prerequisite removed', 'info') }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-12">
      <div><h1 className="text-4xl font-black mb-2">Intended Learners</h1><p className="text-zinc-400 text-lg">Descriptions here help students decide if your course is right for them.</p></div>
      <div className="space-y-4 bg-black/40 p-8 rounded-3xl border border-white/5 backdrop-blur-md">
        <div><h3 className="text-xl font-bold flex items-center gap-2 mb-1"><Target className="text-blue-500"/> What will students learn?</h3><p className="text-sm text-zinc-500">Enter at least 4 learning objectives.</p></div>
        <div className="space-y-3">
          <AnimatePresence>
            {data.objectives.map((obj: string, idx: number) => (
              <motion.div key={idx} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex gap-3 group">
                <input value={obj} onChange={e => handleObjChange(idx, e.target.value)} placeholder="Example: Build a full-stack application" className="flex-1 bg-zinc-900/80 border border-white/10 rounded-xl px-4 py-3.5 text-sm outline-none focus:border-blue-500 transition-all text-white placeholder-zinc-700" />
                <button onClick={() => removeObj(idx)} className="w-12 flex items-center justify-center text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"><Trash2 size={18}/></button>
              </motion.div>
            ))}
          </AnimatePresence>
          <button onClick={addObj} className="text-blue-500 hover:text-blue-400 font-bold text-sm flex items-center gap-2 px-2 py-2"><Plus size={16}/> Add more to your response</button>
        </div>
      </div>
      <div className="space-y-4 bg-black/40 p-8 rounded-3xl border border-white/5 backdrop-blur-md">
        <div><h3 className="text-xl font-bold flex items-center gap-2 mb-1"><AlertCircle className="text-amber-500"/> Requirements or prerequisites</h3><p className="text-sm text-zinc-500">List the required skills or experience.</p></div>
        <div className="space-y-3">
          <AnimatePresence>
            {data.prerequisites.map((pre:string, idx:number) => (
              <motion.div key={idx} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex gap-3 group">
                <input value={pre} onChange={e => handlePreChange(idx, e.target.value)} placeholder="Example: No prior programming experience needed." className="flex-1 bg-zinc-900/80 border border-white/10 rounded-xl px-4 py-3.5 text-sm outline-none focus:border-amber-500 transition-all text-white placeholder-zinc-700" />
                <button onClick={() => removePre(idx)} className="w-12 flex items-center justify-center text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"><Trash2 size={18}/></button>
              </motion.div>
            ))}
          </AnimatePresence>
          <button onClick={addPre} className="text-amber-500 hover:text-amber-400 font-bold text-sm flex items-center gap-2 px-2 py-2"><Plus size={16}/> Add more to your response</button>
        </div>
      </div>
      <div className="space-y-4 bg-black/40 p-8 rounded-3xl border border-white/5 backdrop-blur-md">
        <div><h3 className="text-xl font-bold flex items-center gap-2 mb-1"><Users className="text-purple-500"/> Who is this course for?</h3><p className="text-sm text-zinc-500">Select the experience level.</p></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['Beginner', 'Intermediate', 'Expert'].map(level => (
            <button key={level} onClick={() => { setData({...data, audienceLevel: level}); addToast(`Target audience set to ${level}`, 'success') }} className={`p-6 rounded-2xl border flex flex-col items-center justify-center gap-3 transition-all ${data.audienceLevel === level ? 'bg-purple-500/20 border-purple-500 text-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.2)] scale-105' : 'bg-zinc-900/50 border-white/10 text-zinc-400 hover:border-white/30 hover:bg-zinc-900'}`}><div className="font-bold text-lg">{level}</div></button>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

function CourseStructureStep() {
  const { addToast } = useToast()
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-12">
      <div><h1 className="text-4xl font-black mb-2">Course Structure & Guidelines</h1><p className="text-zinc-400 text-lg">Planning creates a clear path for students.</p></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-zinc-900/80 to-[#0a0a0a]/80 backdrop-blur-md border border-white/10 p-8 rounded-3xl relative overflow-hidden group hover:border-emerald-500/50 transition-colors">
          <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 mb-6"><Lightbulb size={24}/></div>
          <h3 className="text-xl font-bold mb-3">Tips for a Great Structure</h3>
          <ul className="space-y-3 text-sm text-zinc-400">
            <li className="flex gap-3"><CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5"/> <span>Create an outline. Decide what skills you’ll teach.</span></li>
            <li className="flex gap-3"><CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5"/> <span>Introduce yourself and create momentum early.</span></li>
            <li className="flex gap-3"><CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5"/> <span>Include practice activities (quizzes, assignments).</span></li>
          </ul>
        </div>
        <div className="bg-gradient-to-br from-zinc-900/80 to-[#0a0a0a]/80 backdrop-blur-md border border-white/10 p-8 rounded-3xl relative overflow-hidden group hover:border-blue-500/50 transition-colors">
          <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 mb-6"><FileVideo size={24}/></div>
          <h3 className="text-xl font-bold mb-3">Technical Requirements</h3>
          <ul className="space-y-3 text-sm text-zinc-400">
            <li className="flex gap-3"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" /> <span>Videos must be HD resolution (720p or 1080p).</span></li>
            <li className="flex gap-3"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" /> <span>Audio must be clear and synced with video.</span></li>
            <li className="flex gap-3"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" /> <span>At least 30 minutes of total video content required.</span></li>
          </ul>
        </div>
      </div>
    </motion.div>
  )
}

function SetupTestVideoStep({ onContinue }: { onContinue: () => void }) {
  const { addToast } = useToast()
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleFileUpload = async (e: any) => {
    if (!e.target.files?.[0]) return
    setIsUploading(true); await new Promise(r => setTimeout(r, 1500));
    setFileUrl(URL.createObjectURL(e.target.files[0])); setIsUploading(false)
    addToast('Test video uploaded successfully!', 'success')
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-12">
      <div><h1 className="text-4xl font-black mb-2">Setup & Test Video</h1><p className="text-zinc-400 text-lg">Get early feedback on your audio, lighting, and camera.</p></div>
      <div className="bg-gradient-to-r from-indigo-900/40 to-purple-900/20 border border-indigo-500/20 p-6 rounded-2xl flex items-start gap-4 backdrop-blur-md">
        <HeartHandshake className="text-indigo-400 shrink-0 mt-1" size={28} />
        <div><h3 className="font-bold text-indigo-100 text-lg mb-1">You don't need to be a pro!</h3><p className="text-sm text-indigo-200/80">We are here to help, not criticize. You don't need heavy editing skills.</p></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <h3 className="text-xl font-bold mb-4">What our experts look for:</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-zinc-900/50 p-5 rounded-2xl border border-white/5"><Mic className="text-emerald-400 mb-3" size={24} /><h4 className="font-bold mb-1">Clear Audio</h4><p className="text-xs text-zinc-400">Minimize echo. A cheap lapel mic works wonders.</p></div>
            <div className="bg-zinc-900/50 p-5 rounded-2xl border border-white/5"><Sun className="text-amber-400 mb-3" size={24} /><h4 className="font-bold mb-1">Good Lighting</h4><p className="text-xs text-zinc-400">Face a window or use a ring light. Avoid backlighting.</p></div>
          </div>
        </div>
        <div className="lg:col-span-2">
          {isSubmitted ? (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="h-full bg-emerald-900/20 border border-emerald-500/30 rounded-3xl p-8 flex flex-col items-center justify-center text-center backdrop-blur-md"><CheckCircle2 size={32} className="text-emerald-400 mb-4"/><h3 className="text-xl font-bold text-white mb-2">Video Submitted!</h3><p className="text-sm text-emerald-200/70">Feedback within 48 hours.</p></motion.div>
          ) : (
            <div className="bg-zinc-900/60 border border-white/10 rounded-3xl p-6 flex flex-col h-full backdrop-blur-md">
              <h3 className="font-bold text-lg mb-2">Submit a test</h3>
              <p className="text-xs text-zinc-400 mb-6">Record 1-2 mins to test setup.</p>
              {!fileUrl ? (
                <label className="flex-1 min-h-[200px] border-2 border-dashed border-white/20 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 transition-all"><UploadCloud size={32} className="mb-3 text-zinc-500" /><span className="text-sm font-bold text-zinc-400">Select Video</span><input type="file" accept="video/*" className="hidden" onChange={handleFileUpload} /></label>
              ) : (
                <div className="flex-1 flex flex-col"><div className="w-full aspect-video bg-black rounded-xl overflow-hidden mb-4 relative"><video src={fileUrl} className="w-full h-full object-cover" controls /><button onClick={() => setFileUrl(null)} className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-lg hover:bg-red-500 text-white"><X size={14} /></button></div><button onClick={() => { setIsSubmitted(true); addToast('Sent to experts!', 'success') }} className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-emerald-400 flex justify-center gap-2"><Send size={18} /> Send for Review</button></div>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="pt-12 mt-12 border-t border-white/10 flex justify-end">
         <button onClick={() => { addToast('Welcome to Phase 2: Creation Workspace!', 'info'); onContinue(); }} className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black text-lg rounded-xl shadow-[0_0_40px_-10px_rgba(59,130,246,0.5)] transition-all flex items-center gap-3 hover:scale-105">Continue to Create Content <ArrowRight size={24} /></button>
      </div>
    </motion.div>
  )
}

// ============================================================================
// 5. PHASE 2 COMPONENTS (Maintained)
// ============================================================================

function FilmAndEditStep() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-12">
      <div><h1 className="text-4xl font-black mb-2">Film & Edit</h1><p className="text-zinc-400 text-lg">It’s time to start producing your content.</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-black/40 border border-white/5 rounded-3xl p-8 backdrop-blur-md space-y-6">
           <div className="flex items-center gap-3 text-blue-400 mb-2"><Lightbulb size={24}/><h3 className="text-2xl font-bold text-white">Production Tips</h3></div>
           <ul className="space-y-4">
              <li className="flex gap-4"><div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg h-fit"><Mic size={18}/></div><div><h4 className="font-bold text-sm text-white">Invest in Audio</h4><p className="text-xs text-zinc-500">Get a dedicated USB or Lapel mic.</p></div></li>
              <li className="flex gap-4"><div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg h-fit"><FileVideo size={18}/></div><div><h4 className="font-bold text-sm text-white">Keep it short</h4><p className="text-xs text-zinc-500">Break complex topics into bite-sized 3-7 minute videos.</p></div></li>
           </ul>
        </div>
        <div className="bg-black/40 border border-white/5 rounded-3xl p-8 backdrop-blur-md space-y-6">
           <div className="flex items-center gap-3 text-purple-400 mb-2"><LayoutTemplate size={24}/><h3 className="text-2xl font-bold text-white">Editing Resources</h3></div>
           <div className="grid grid-cols-1 gap-3">
              <div className="p-4 bg-zinc-900/50 border border-white/10 rounded-xl"><div><h4 className="font-bold text-sm text-white">CapCut (Free)</h4><p className="text-xs text-zinc-500">Powerful, easy to learn.</p></div></div>
              <div className="p-4 bg-zinc-900/50 border border-white/10 rounded-xl"><div><h4 className="font-bold text-sm text-white">OBS Studio (Free)</h4><p className="text-xs text-zinc-500">Record screen & face.</p></div></div>
           </div>
        </div>
      </div>
    </motion.div>
  )
}

function CurriculumStep({ data, setData, onContinue }: { data: CourseData, setData: any, onContinue: () => void }) {
  const { addToast } = useToast()
  const addModule = () => { setData((p:any) => ({...p, modules: [...p.modules, { id: Math.random().toString(36).substr(2,9), title: 'New Section', items: [], isOpen: true }]})); addToast('Section added', 'success') }
  const updateMod = (mIdx: number, f: string, v: any) => setData((p:any) => { const n=[...p.modules]; n[mIdx]={...n[mIdx],[f]:v}; return {...p, modules: n}})
  const addItem = (mIdx: number) => { setData((p:any) => { const n=[...p.modules]; n[mIdx].items.push({ id: Math.random().toString(36).substr(2,9), title: 'New Lecture', type: 'video', isFreePreview: false, isOpen: true, resources: [] }); return {...p, modules: n}}); addToast('Content added', 'info')}
  
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
      <div className="flex justify-between items-end border-b border-white/10 pb-6">
        <div><h1 className="text-4xl font-black mb-2">Curriculum Builder</h1><p className="text-zinc-400">Upload your videos, write articles, build quizzes.</p></div>
        <button onClick={addModule} className="bg-white text-black px-5 py-3 rounded-xl font-bold hover:bg-zinc-200 flex items-center gap-2"><Plus size={18}/> Add Section</button>
      </div>
      <div className="space-y-6">
        {data.modules.map((mod:any, mIdx:number) => (
          <div key={mod.id} className="bg-zinc-900/60 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl">
            <div className="p-5 flex items-center gap-4 bg-black/60 border-b border-white/5">
              <button onClick={() => updateMod(mIdx, 'isOpen', !mod.isOpen)} className="text-zinc-400 hover:text-white"><ChevronDown size={20} className={mod.isOpen?'':'-rotate-90'}/></button>
              <div className="flex-1 flex items-center gap-3">
                <span className="text-[10px] font-black uppercase text-zinc-500">Section {mIdx + 1}:</span>
                <input value={mod.title} onChange={e => updateMod(mIdx, 'title', e.target.value)} className="bg-transparent font-bold text-white text-lg w-full outline-none" />
              </div>
              <button onClick={() => setData((p:any) => ({...p, modules: p.modules.filter((_:any, i:number) => i !== mIdx)}))} className="text-zinc-600 hover:text-red-500"><Trash2 size={18}/></button>
            </div>
            {mod.isOpen && (
              <div className="p-5 space-y-4">
                {mod.items.map((item:any, iIdx:number) => (
                   <ContentItemBuilder key={item.id} item={item} mIdx={mIdx} iIdx={iIdx} data={data} setData={setData} />
                ))}
                <button onClick={() => addItem(mIdx)} className="w-full py-4 border-2 border-dashed border-white/10 rounded-xl text-sm font-bold uppercase tracking-wider text-blue-500 hover:bg-blue-500/10 transition-all flex justify-center gap-2"><Plus size={16}/> Add Content</button>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="pt-12 flex justify-end">
         <button onClick={() => { addToast('Welcome to Phase 3: Publish!', 'info'); onContinue(); }} className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-lg rounded-xl shadow-[0_0_40px_-10px_rgba(16,185,129,0.5)] transition-all flex items-center gap-3 hover:scale-105">Continue to Publish Phase <ArrowRight size={24} /></button>
      </div>
    </motion.div>
  )
}

function ContentItemBuilder({ item, mIdx, iIdx, data, setData }: any) {
  const [activeTab, setActiveTab] = useState<'content' | 'resources'>('content')
  const updateItem = (f: string, v: any) => setData((p:any) => { const n=[...p.modules]; n[mIdx].items[iIdx]={...n[mIdx].items[iIdx], [f]:v}; return {...p, modules:n} })

  const TypeIcon = item.type === 'video' ? Video : item.type === 'video_slide' ? Presentation : item.type === 'article' ? FileText : item.type === 'quiz' ? ListChecks : BookOpen

  return (
    <div className="bg-black/80 border border-white/10 rounded-xl overflow-hidden transition-all shadow-lg">
      <div className="p-4 flex items-center gap-4 hover:bg-white/5 cursor-pointer group" onClick={() => updateItem('isOpen', !item.isOpen)}>
        <div className="p-2 bg-zinc-800 rounded-lg text-zinc-300"><TypeIcon size={16}/></div>
        <div className="flex-1"><input value={item.title} onChange={e => updateItem('title', e.target.value)} onClick={e=>e.stopPropagation()} className="bg-transparent text-sm font-bold text-white w-full outline-none" placeholder="Lecture Title" /></div>
        <div className="flex items-center gap-3" onClick={e=>e.stopPropagation()}>
            <select value={item.type} onChange={e => updateItem('type', e.target.value)} className="bg-zinc-900 border border-white/10 text-xs text-zinc-300 rounded-lg px-2 py-1.5 outline-none cursor-pointer">
                <option value="video">Video</option><option value="video_slide">Video & Slide</option><option value="article">Article</option><option value="quiz">Quiz</option><option value="assignment">Assignment</option>
            </select>
            <button onClick={() => updateItem('isFreePreview', !item.isFreePreview)} className={`p-1.5 rounded-lg border ${item.isFreePreview ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'border-transparent text-zinc-600'}`}><Eye size={16}/></button>
            <button onClick={() => setData((p:any)=>{const n=[...p.modules]; n[mIdx].items.splice(iIdx,1); return {...p, modules:n}})} className="text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>
        </div>
      </div>
      {item.isOpen && (
        <div className="border-t border-white/5 bg-zinc-900/30">
            <div className="flex px-6 pt-4 border-b border-white/5 text-xs font-bold uppercase tracking-wider">
                <button onClick={()=>setActiveTab('content')} className={`pb-3 px-4 border-b-2 ${activeTab === 'content' ? 'border-blue-500 text-blue-400' : 'border-transparent text-zinc-500'}`}>Content</button>
                <button onClick={()=>setActiveTab('resources')} className={`pb-3 px-4 border-b-2 flex items-center gap-2 ${activeTab === 'resources' ? 'border-blue-500 text-blue-400' : 'border-transparent text-zinc-500'}`}>Resources <span className="bg-white/10 px-1.5 rounded-full">{item.resources?.length || 0}</span></button>
            </div>
            <div className="p-6">
                {activeTab === 'content' && (
                    <div className="space-y-4">
                        {item.type === 'video' && <div className="max-w-2xl"><VideoUploader url={item.videoUrl} onUpload={(url:string) => updateItem('videoUrl', url)} /></div>}
                        {item.type === 'article' && <textarea value={item.content || ''} onChange={e=>updateItem('content', e.target.value)} placeholder="Write article..." className="w-full h-48 bg-black/50 border border-white/10 rounded-xl p-4 text-sm outline-none focus:border-blue-500" />}
                        {item.type === 'quiz' && <QuizBuilder quizData={item.quizData || []} onChange={(q:any) => updateItem('quizData', q)} />}
                    </div>
                )}
                {activeTab === 'resources' && <ResourceManager resources={item.resources || []} onChange={(r:any) => updateItem('resources', r)} />}
            </div>
        </div>
      )}
    </div>
  )
}

function VideoUploader({ url, onUpload }: any) {
  const [uploading, setUploading] = useState(false)
  const handleFile = async (e: any) => { if(!e.target.files[0]) return; setUploading(true); await new Promise(r=>setTimeout(r, 1000)); onUpload(URL.createObjectURL(e.target.files[0])); setUploading(false) }
  return (
      <label className="flex flex-col items-center justify-center w-full aspect-video bg-black/60 border border-dashed border-white/20 rounded-xl cursor-pointer hover:border-blue-500 overflow-hidden">
          {url ? <video src={url} controls className="w-full h-full object-cover"/> : <div className="text-center">{uploading ? <Loader2 className="animate-spin text-blue-500 mx-auto mb-3" size={28}/> : <UploadCloud className="text-zinc-500 mx-auto mb-3" size={32}/>}<span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{uploading ? 'Processing...' : 'Upload Video'}</span></div>}
          <input type="file" accept="video/*" className="hidden" onChange={handleFile} disabled={uploading}/>
      </label>
  )
}

function QuizBuilder({ quizData, onChange }: any) {
  const addQ = () => onChange([...quizData, { id: Math.random().toString(36).substr(2,9), question: '', options: ['',''], correctIndex: 0 }])
  const updateQ = (qIdx: number, field: string, val: any) => { const n = [...quizData]; n[qIdx][field] = val; onChange(n) }
  const updateOpt = (qIdx: number, oIdx: number, val: string) => { const n = [...quizData]; n[qIdx].options[oIdx] = val; onChange(n) }
  return (
      <div className="space-y-6">
          {quizData.map((q:any, qIdx:number) => (
              <div key={q.id} className="bg-black/40 border border-white/10 rounded-2xl p-6 relative">
                  <button onClick={() => onChange(quizData.filter((_:any,i:number)=>i!==qIdx))} className="absolute top-4 right-4 text-zinc-600 hover:text-red-500"><Trash2 size={16}/></button>
                  <div className="flex gap-4 mb-4"><span className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm font-black shrink-0">{qIdx+1}</span><input value={q.question} onChange={e=>updateQ(qIdx, 'question', e.target.value)} placeholder="Question Prompt" className="flex-1 bg-transparent border-b border-white/20 outline-none focus:border-blue-500" /></div>
                  <div className="pl-12 space-y-3">
                      {q.options.map((opt:string, oIdx:number) => (
                          <div key={oIdx} className="flex items-center gap-3">
                              <input type="radio" checked={q.correctIndex === oIdx} onChange={() => updateQ(qIdx, 'correctIndex', oIdx)} className="w-4 h-4 accent-blue-500" />
                              <input value={opt} onChange={e=>updateOpt(qIdx, oIdx, e.target.value)} placeholder={`Option ${oIdx + 1}`} className="flex-1 bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none" />
                          </div>
                      ))}
                      <button onClick={() => {const n=[...quizData]; n[qIdx].options.push(''); onChange(n)}} className="text-xs font-bold text-blue-500 flex items-center gap-1 mt-2"><Plus size={14}/> Add Option</button>
                  </div>
              </div>
          ))}
          <button onClick={addQ} className="w-full py-4 border-2 border-dashed border-white/10 rounded-2xl text-sm font-bold text-zinc-400 hover:text-white flex justify-center gap-2"><Plus size={18}/> New Question</button>
      </div>
  )
}

function ResourceManager({ resources, onChange }: any) {
  const addRes = (type: string) => onChange([...resources, { id: Math.random().toString(36).substr(2,9), type, title: '', url: '' }])
  return (
      <div className="space-y-4">
          <div className="flex gap-4 border-b border-white/5 pb-4">
              <button onClick={()=>addRes('pdf')} className="px-4 py-2 bg-black border border-white/10 rounded-xl text-xs font-bold flex gap-2"><FileText size={14} className="text-blue-500"/> PDF</button>
              <button onClick={()=>addRes('link')} className="px-4 py-2 bg-black border border-white/10 rounded-xl text-xs font-bold flex gap-2"><LinkIcon size={14} className="text-emerald-500"/> Link</button>
          </div>
          <div className="space-y-3">
            {resources.map((r:any, i:number) => (
                <div key={r.id} className="flex items-center gap-4 bg-black/60 p-3 rounded-xl border border-white/10">
                    <input value={r.title} onChange={e => {const n=[...resources]; n[i].title=e.target.value; onChange(n)}} placeholder="Resource Title" className="bg-transparent text-sm w-1/3 outline-none" />
                    <input value={r.url} onChange={e => {const n=[...resources]; n[i].url=e.target.value; onChange(n)}} placeholder="URL or File Link" className="bg-zinc-900 text-sm flex-1 rounded-lg px-3 py-2 outline-none border border-transparent focus:border-white/20" />
                    <button onClick={() => onChange(resources.filter((_:any,idx:number)=>idx!==i))} className="text-zinc-600 hover:text-red-500"><Trash2 size={16}/></button>
                </div>
            ))}
          </div>
      </div>
  )
}


// ============================================================================
// 6. PHASE 3: PUBLISH COMPONENTS (NEW)
// ============================================================================

function LandingPageStep({ data, setData, onContinue }: { data: CourseData, setData: any, onContinue: () => void }) {
  const { addToast } = useToast()

  const handleThumbUpload = async (e: any) => {
    if(!e.target.files[0]) return
    addToast('Uploading Image...', 'info')
    await new Promise(r=>setTimeout(r, 1000))
    setData({...data, thumbnailUrl: URL.createObjectURL(e.target.files[0])})
    addToast('Image attached', 'success')
  }

  const handlePromoUpload = async (e: any) => {
    if(!e.target.files[0]) return
    addToast('Uploading Promo Video...', 'info')
    await new Promise(r=>setTimeout(r, 2000))
    setData({...data, promoVideoUrl: URL.createObjectURL(e.target.files[0])})
    addToast('Promo Video attached', 'success')
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
           <input value={data.title} onChange={e => setData({...data, title: e.target.value})} placeholder="Learn Advanced System Design..." className="w-full bg-zinc-900/80 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 text-white font-bold" />
        </div>

        <div className="space-y-2">
           <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Course Subtitle</label>
           <input value={data.subtitle} onChange={e => setData({...data, subtitle: e.target.value})} placeholder="Insert your catchy hook here..." className="w-full bg-zinc-900/80 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 text-white" />
        </div>

        <div className="space-y-2">
           <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Course Description</label>
           <div className="bg-zinc-900/80 border border-white/10 rounded-xl overflow-hidden focus-within:border-emerald-500 transition-colors">
              {/* Fake Rich Text Toolbar */}
              <div className="flex items-center gap-2 px-4 py-2 border-b border-white/10 bg-black/20 text-zinc-400">
                 <button className="p-1.5 hover:bg-white/10 rounded"><Bold size={14}/></button>
                 <button className="p-1.5 hover:bg-white/10 rounded"><Italic size={14}/></button>
                 <div className="w-px h-4 bg-white/10 mx-1" />
                 <button className="p-1.5 hover:bg-white/10 rounded"><List size={14}/></button>
                 <button className="p-1.5 hover:bg-white/10 rounded"><AlignLeft size={14}/></button>
              </div>
              <textarea value={data.description} onChange={e => setData({...data, description: e.target.value})} placeholder="Insert your detailed course description..." className="w-full h-48 bg-transparent p-4 outline-none resize-none text-white text-sm" />
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="space-y-2">
             <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Basic Info</label>
             <select value={data.language} onChange={e => setData({...data, language: e.target.value})} className="w-full bg-zinc-900/80 border border-white/10 rounded-xl px-4 py-3 outline-none cursor-pointer">
                <option>English (US)</option><option>English (UK)</option><option>Spanish</option><option>French</option>
             </select>
           </div>
           <div className="space-y-2">
             <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Category</label>
             <select value={data.category} onChange={e => setData({...data, category: e.target.value})} className="w-full bg-zinc-900/80 border border-white/10 rounded-xl px-4 py-3 outline-none cursor-pointer">
                <option value="">Select Category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
             </select>
           </div>
           <div className="space-y-2">
             <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Subcategory</label>
             <input value={data.subcategory} onChange={e => setData({...data, subcategory: e.target.value})} placeholder="e.g. Next.js" className="w-full bg-zinc-900/80 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-emerald-500" />
           </div>
        </div>

        <div className="space-y-2">
           <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">What is primarily taught?</label>
           <input value={data.primaryTopic} onChange={e => setData({...data, primaryTopic: e.target.value})} placeholder="e.g. Web Development" className="w-full bg-zinc-900/80 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 text-white" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
           {/* Thumbnail Upload */}
           <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center justify-between">Course Image <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded">Required</span></label>
              <label className="flex flex-col items-center justify-center w-full aspect-video bg-zinc-900/80 border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:border-emerald-500 transition-all overflow-hidden relative group">
                  {data.thumbnailUrl ? <img src={data.thumbnailUrl} className="w-full h-full object-cover"/> : (
                      <div className="text-center group-hover:scale-105 transition-transform">
                          <ImageIcon className="text-zinc-500 mx-auto mb-2" size={32}/>
                          <span className="text-xs font-bold text-zinc-400">Upload Image</span>
                          <p className="text-[10px] text-zinc-600 mt-1">750x422 pixels; .jpg, .jpeg, .gif, or .png</p>
                      </div>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handleThumbUpload} />
              </label>
           </div>
           
           {/* Promo Video Upload */}
           <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center justify-between">Promotional Video <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded">Optional</span></label>
              <label className="flex flex-col items-center justify-center w-full aspect-video bg-zinc-900/80 border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:border-emerald-500 transition-all overflow-hidden relative group">
                  {data.promoVideoUrl ? <video src={data.promoVideoUrl} className="w-full h-full object-cover" controls/> : (
                      <div className="text-center group-hover:scale-105 transition-transform">
                          <Video className="text-zinc-500 mx-auto mb-2" size={32}/>
                          <span className="text-xs font-bold text-zinc-400">Upload Video</span>
                          <p className="text-[10px] text-zinc-600 mt-1">Students who watch promo videos are 5X more likely to enroll.</p>
                      </div>
                  )}
                  <input type="file" accept="video/*" className="hidden" onChange={handlePromoUpload} />
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
              value={data.currency} 
              onChange={e => setData({...data, currency: e.target.value})} 
              className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 outline-none cursor-pointer hover:border-emerald-500 transition-colors font-bold text-lg"
           >
              {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} - {c.name}</option>)}
           </select>
        </div>

        {/* Price Tiers Grid */}
        <div className="space-y-3">
           <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Price Tier</label>
           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {localizedTiers.map(tier => (
                 <button 
                    key={tier.usd} 
                    onClick={() => setData({...data, priceTier: tier.usd})} 
                    className={`p-6 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all ${
                        data.priceTier === tier.usd ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)] scale-[1.02]' : 'bg-zinc-900/50 border-white/10 hover:border-white/30 hover:bg-zinc-900 text-zinc-300'
                    }`}
                 >
                    <span className="font-black text-2xl tracking-tight">
                        {tier.usd === 0 ? 'Free' : `${activeCurrency.symbol}${tier.localized.toLocaleString()}`}
                    </span>
                    {tier.usd !== 0 && activeCurrency.code !== 'USD' && (
                        <span className="text-[10px] font-bold text-zinc-500 uppercase">Tier: ${tier.usd}</span>
                    )}
                 </button>
              ))}
           </div>
        </div>

      </div>

      <div className="flex justify-end pt-4"><button onClick={onContinue} className="px-8 py-4 bg-white text-black font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-transform flex items-center gap-3 shadow-[0_0_40px_rgba(255,255,255,0.2)]">Next Step <ArrowRight size={20}/></button></div>
    </motion.div>
  )
}

function CourseMessagesStep({ data, setData }: { data: CourseData, setData: any }) {
  const { addToast } = useToast()

  const handleFinalSubmit = () => {
    // Basic Validation Check before fake submission
    if(!data.title) return addToast("Please set a course title in Landing Page step.", "error")
    
    addToast("Course submitted for review! Redirecting...", "success")
    setTimeout(() => {
        // Redirect to dashboard logic here
        window.location.href = '/dashboard/instructor'
    }, 2000)
  }

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
             value={data.welcomeMessage} 
             onChange={e => setData({...data, welcomeMessage: e.target.value})} 
             placeholder="Welcome to the course! I'm so glad you're here..." 
             className="w-full h-32 bg-zinc-900/80 border border-white/10 rounded-xl p-4 outline-none focus:border-blue-500 resize-none text-sm text-white" 
           />
           <p className="text-[10px] text-zinc-500">Sent immediately when a student enrolls.</p>
        </div>

        <div className="space-y-2">
           <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2"><MessageSquare size={14}/> Congratulations Message</label>
           <textarea 
             value={data.congratsMessage} 
             onChange={e => setData({...data, congratsMessage: e.target.value})} 
             placeholder="Congratulations on completing the course! Here are your next steps..." 
             className="w-full h-32 bg-zinc-900/80 border border-white/10 rounded-xl p-4 outline-none focus:border-emerald-500 resize-none text-sm text-white" 
           />
           <p className="text-[10px] text-zinc-500">Sent when a student completes 100% of the curriculum.</p>
        </div>

      </div>

      {/* THE BIG SUBMIT BUTTON */}
      <div className="pt-8">
         <button onClick={handleFinalSubmit} className="w-full py-5 bg-emerald-500 text-black font-black text-xl uppercase tracking-widest rounded-xl hover:scale-[1.02] transition-transform flex items-center justify-center gap-3 shadow-[0_0_50px_rgba(16,185,129,0.4)]">
            <Rocket size={24}/> Submit for Review
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