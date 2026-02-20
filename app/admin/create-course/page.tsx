'use client'

import React, { useState, createContext, useContext, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, LayoutTemplate, FileVideo, BookOpen, Target, AlertCircle, 
  CheckCircle2, X, Plus, Trash2, Info, Lightbulb, PlayCircle, ShieldCheck,
  Camera, Mic, Sun, HeartHandshake, UploadCloud, Send, Loader2, ArrowRight,
  ListChecks, FileText, Presentation, FileCode, Link as LinkIcon, Settings,
  ChevronDown, HelpCircle, FileArchive,
  Eye,
  Video,
  Layout
} from 'lucide-react'

// ============================================================================
// 1. TYPES & INTERFACES
// ============================================================================

type Phase = 'plan' | 'create'
type PlanStep = 'intended-learners' | 'course-structure'
type CreateStep = 'film-edit' | 'curriculum'

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
  type: 'video' | 'video_slide' | 'article' | 'quiz' | 'practice_test'
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
}

export interface CourseData {
  objectives: string[]
  prerequisites: string[]
  audienceLevel: string
  modules: Module[]
}

const INITIAL_DATA: CourseData = {
  objectives: ['', '', '', ''],
  prerequisites: [''],
  audienceLevel: '',
  modules: [
    { id: 'mod-1', title: 'Section 1: Introduction', items: [], isOpen: true }
  ]
}

// ============================================================================
// 2. TOAST SYSTEM
// ============================================================================

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
                'bg-blue-900/90 border-blue-500/50 text-blue-100'
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

// ============================================================================
// 3. MAIN COMPONENT (State Controller)
// ============================================================================

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
  const [planStep, setPlanStep] = useState<PlanStep>('intended-learners')
  const [createStep, setCreateStep] = useState<CreateStep>('film-edit')
  
  const [data, setData] = useState<CourseData>(INITIAL_DATA)

  const handleSaveDraft = () => {
    addToast('Course draft saved securely!', 'success')
  }

  // Cinematic Background Images based on Phase
  const bgImage = phase === 'plan' 
    ? "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop" // Deep space/planning vibe
    : "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop" // Tech/creation vibe

  return (
    <div className="min-h-screen bg-[#050505] text-white flex font-sans selection:bg-emerald-500/30 relative overflow-hidden">
      
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
         <img src={bgImage} alt="bg" className="w-full h-full object-cover opacity-20 transition-opacity duration-1000" />
         <div className="absolute inset-0 bg-gradient-to-r from-black via-black/90 to-transparent" />
         <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
      </div>

      {/* --- SIDEBAR --- */}
      <aside className="w-72 border-r border-white/10 flex flex-col h-screen sticky top-0 shrink-0 z-20 bg-black/60 backdrop-blur-xl">
        <div className="p-6 border-b border-white/5">
          <button className="text-zinc-500 hover:text-white flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-6 transition-colors">
            Exit Studio
          </button>
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-[10px] font-black uppercase px-2 py-1 rounded border ${phase === 'plan' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
              Phase: {phase}
            </span>
          </div>
          <h2 className="font-bold text-xl leading-tight">Course Studio</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {phase === 'plan' ? (
            <motion.div initial={{opacity:0, x:-10}} animate={{opacity:1, x:0}} className="space-y-1">
              <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-3 px-2">Phase 1: Planning</h3>
              <SidebarItem active={planStep === 'intended-learners'} icon={Users} label="Intended Learners" onClick={() => setPlanStep('intended-learners')} />
              <SidebarItem active={planStep === 'course-structure'} icon={LayoutTemplate} label="Course Structure" onClick={() => setPlanStep('course-structure')} />
            </motion.div>
          ) : (
            <motion.div initial={{opacity:0, x:-10}} animate={{opacity:1, x:0}} className="space-y-1">
              <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-3 px-2">Phase 2: Creation</h3>
              <SidebarItem active={createStep === 'film-edit'} icon={Camera} label="Film & Edit" onClick={() => setCreateStep('film-edit')} />
              <SidebarItem active={createStep === 'curriculum'} icon={Layout} label="Curriculum" onClick={() => setCreateStep('curriculum')} />
            </motion.div>
          )}
        </div>

        <div className="p-6 border-t border-white/5 space-y-3">
          <button onClick={handleSaveDraft} className="w-full py-3 bg-zinc-900 text-white font-bold rounded-xl hover:bg-zinc-800 transition-all border border-white/10">
            Save Draft
          </button>
        </div>
      </aside>

      {/* --- MAIN WORKSPACE --- */}
      <main className="flex-1 overflow-y-auto relative z-10">
        <div className="max-w-5xl mx-auto p-12 pb-32">
          
          <AnimatePresence mode="wait">
            {phase === 'plan' && planStep === 'intended-learners' && <IntendedLearnersStep key="plan-1" data={data} setData={setData} />}
            {phase === 'plan' && planStep === 'course-structure' && <CourseStructureStep key="plan-2" onContinue={() => setPhase('create')} />}
            
            {phase === 'create' && createStep === 'film-edit' && <FilmAndEditStep key="create-1" />}
            {phase === 'create' && createStep === 'curriculum' && <CurriculumStep key="create-2" data={data} setData={setData} />}
          </AnimatePresence>

        </div>
      </main>
    </div>
  )
}

// ============================================================================
// 4. PHASE 1: PLAN YOUR COURSE
// ============================================================================

function IntendedLearnersStep({ data, setData }: { data: CourseData, setData: any }) {
  const { addToast } = useToast()

  const handleObjChange = (idx: number, val: string) => {
    const newObjs = [...data.objectives]; newObjs[idx] = val;
    setData({ ...data, objectives: newObjs })
  }
  const addObj = () => {
    setData({ ...data, objectives: [...data.objectives, ''] })
    addToast('Objective slot added', 'info')
  }
  const removeObj = (idx: number) => {
    if (data.objectives.length <= 4) return addToast('You must have at least 4 objectives.', 'error')
    setData({ ...data, objectives: data.objectives.filter((_, i) => i !== idx) })
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-12">
      <div>
        <h1 className="text-4xl font-black mb-3">Intended Learners</h1>
        <p className="text-zinc-400 text-lg">Define your audience to help students decide if this course is right for them.</p>
      </div>

      <div className="space-y-4 bg-black/40 p-8 rounded-3xl border border-white/10 backdrop-blur-md shadow-2xl">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2 mb-1"><Target className="text-purple-500"/> What will students learn?</h3>
          <p className="text-sm text-zinc-500">Enter at least 4 learning outcomes.</p>
        </div>
        <div className="space-y-3">
          <AnimatePresence>
            {data.objectives.map((obj, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex gap-3 group">
                <input value={obj} onChange={e => handleObjChange(idx, e.target.value)} placeholder="e.g. Build a full-stack Next.js application" className="flex-1 bg-zinc-900/80 border border-white/10 rounded-xl px-4 py-3.5 text-sm outline-none focus:border-purple-500 transition-all text-white placeholder-zinc-600" />
                <button onClick={() => removeObj(idx)} className="w-12 flex items-center justify-center text-zinc-600 hover:text-red-500 bg-zinc-900/50 hover:bg-red-500/10 rounded-xl transition-all"><Trash2 size={18}/></button>
              </motion.div>
            ))}
          </AnimatePresence>
          <button onClick={addObj} className="text-purple-400 hover:text-purple-300 font-bold text-sm flex items-center gap-2 px-2 py-2 transition-colors"><Plus size={16}/> Add Outcome</button>
        </div>
      </div>
    </motion.div>
  )
}

function CourseStructureStep({ onContinue }: { onContinue: () => void }) {
  const { addToast } = useToast()

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-12">
      <div>
        <h1 className="text-4xl font-black mb-3">Course Structure</h1>
        <p className="text-zinc-400 text-lg">Planning your course carefully creates a clear learning path.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-purple-900/20 to-black border border-white/10 p-8 rounded-3xl relative overflow-hidden group hover:border-purple-500/50 transition-colors">
          <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-500 mb-6"><Lightbulb size={24}/></div>
          <h3 className="text-xl font-bold mb-3">Tips for a Great Structure</h3>
          <ul className="space-y-3 text-sm text-zinc-400">
            <li className="flex gap-3"><CheckCircle2 size={16} className="text-purple-500 shrink-0 mt-0.5"/> <span>Create an outline. Decide what skills you’ll teach.</span></li>
            <li className="flex gap-3"><CheckCircle2 size={16} className="text-purple-500 shrink-0 mt-0.5"/> <span>Sections should have a clear learning objective (3-7 lectures).</span></li>
            <li className="flex gap-3"><CheckCircle2 size={16} className="text-purple-500 shrink-0 mt-0.5"/> <span>Include practice activities (quizzes, assignments).</span></li>
          </ul>
        </div>
      </div>

      {/* TRANSITION BUTTON */}
      <div className="pt-12 flex justify-end">
         <button onClick={() => { addToast("Moving to Content Creation!", "success"); onContinue(); }} className="px-8 py-4 bg-white text-black font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-transform flex items-center gap-3 shadow-[0_0_40px_rgba(255,255,255,0.2)]">
             Continue to Create Content <ArrowRight size={20}/>
         </button>
      </div>
    </motion.div>
  )
}

// ============================================================================
// 5. PHASE 2: CREATE YOUR CONTENT
// ============================================================================

function FilmAndEditStep() {
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
        <h1 className="text-4xl font-black mb-3">Film & Edit</h1>
        <p className="text-zinc-400 text-lg">Set up your recording environment and get expert feedback.</p>
      </div>

      {/* Empathetic Banner */}
      <div className="bg-gradient-to-r from-emerald-900/30 to-teal-900/10 border border-emerald-500/20 p-6 rounded-2xl flex items-start gap-4 backdrop-blur-md">
        <HeartHandshake className="text-emerald-400 shrink-0 mt-1" size={28} />
        <div>
          <h3 className="font-bold text-emerald-100 text-lg mb-1">You don't need to be a pro!</h3>
          <p className="text-sm text-emerald-200/80 leading-relaxed">
            Many successful instructors started by recording on smartphones. You don't need heavy editing skills. Our expert review team is here to guide you, not criticize.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Tips */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold mb-4">Requirements & Tips</h3>
          <div className="bg-black/50 p-5 rounded-2xl border border-white/5 flex gap-4"><Mic className="text-emerald-400 shrink-0" size={24} /><div><h4 className="font-bold">Clear Audio</h4><p className="text-xs text-zinc-400 mt-1">Minimize echo. A cheap lapel mic works wonders.</p></div></div>
          <div className="bg-black/50 p-5 rounded-2xl border border-white/5 flex gap-4"><Sun className="text-amber-400 shrink-0" size={24} /><div><h4 className="font-bold">Lighting</h4><p className="text-xs text-zinc-400 mt-1">Face a window or use a ring light. Avoid strong backlighting.</p></div></div>
          <div className="bg-black/50 p-5 rounded-2xl border border-white/5 flex gap-4"><Camera className="text-blue-400 shrink-0" size={24} /><div><h4 className="font-bold">Framing</h4><p className="text-xs text-zinc-400 mt-1">Shoot in landscape (horizontal) in at least 720p HD.</p></div></div>
        </div>

        {/* Test Video Area */}
        <div>
          {isSubmitted ? (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="h-full bg-emerald-900/20 border border-emerald-500/30 rounded-3xl p-8 flex flex-col items-center justify-center text-center">
              <CheckCircle2 size={48} className="text-emerald-400 mb-4"/>
              <h3 className="text-xl font-bold text-white mb-2">Video Submitted!</h3>
              <p className="text-sm text-emerald-200/70">Our team is reviewing your setup. We will email you personalized feedback within 48 hours.</p>
            </motion.div>
          ) : (
            <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-6 flex flex-col h-full backdrop-blur-md">
              <h3 className="font-bold text-lg mb-2">Submit a 2-minute test</h3>
              <p className="text-xs text-zinc-400 mb-6">Record yourself speaking to test your mic and camera.</p>
              
              {!fileUrl ? (
                <label className="flex-1 min-h-[250px] border-2 border-dashed border-white/20 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 bg-black/40 hover:bg-black/60 transition-all group">
                  {isUploading ? (
                    <div className="flex flex-col items-center"><Loader2 className="animate-spin text-emerald-500 mb-2" size={28} /><span className="text-xs font-bold text-zinc-400">Uploading...</span></div>
                  ) : (
                    <div className="flex flex-col items-center text-zinc-500 group-hover:text-emerald-400"><UploadCloud size={32} className="mb-3" /><span className="text-sm font-bold">Select Video File</span></div>
                  )}
                  <input type="file" accept="video/*" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                </label>
              ) : (
                <div className="flex-1 flex flex-col">
                  <div className="w-full aspect-video bg-black rounded-xl overflow-hidden mb-4 border border-white/10 relative">
                    <video src={fileUrl} className="w-full h-full object-cover" controls />
                    <button onClick={() => setFileUrl(null)} className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-lg hover:bg-red-500 text-white backdrop-blur"><X size={14} /></button>
                  </div>
                  <button onClick={handleSubmitReview} className="w-full py-4 bg-emerald-500 text-black font-bold rounded-xl hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 mt-auto">
                    <Send size={18} /> Send for Expert Review
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function CurriculumStep({ data, setData }: { data: CourseData, setData: any }) {
  const { addToast } = useToast()

  const addModule = () => {
    setData((p: CourseData) => ({...p, modules: [...p.modules, { id: Date.now().toString(), title: 'New Section', items: [], isOpen: true }]}))
    addToast('Section added', 'success')
  }

  const updateModule = (mIdx: number, field: string, val: any) => {
    const newMods = [...data.modules]; newMods[mIdx] = { ...newMods[mIdx], [field]: val };
    setData((p: CourseData) => ({...p, modules: newMods}))
  }

  const addItem = (mIdx: number) => {
    const newMods = [...data.modules]
    newMods[mIdx].items.push({ 
      id: Date.now().toString(), title: 'New Lecture', type: 'video', 
      isFreePreview: false, isOpen: true, resources: [] 
    })
    setData((p: CourseData) => ({...p, modules: newMods}))
    addToast('Content item added', 'success')
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
      <div className="flex justify-between items-end border-b border-white/10 pb-6">
        <div><h1 className="text-4xl font-black mb-2">Curriculum</h1><p className="text-zinc-400">Start putting together your course by creating sections and lectures.</p></div>
        <button onClick={addModule} className="bg-white text-black px-5 py-3 rounded-xl font-bold hover:bg-zinc-200 flex items-center gap-2"><Plus size={18}/> Add Section</button>
      </div>

      <div className="space-y-6">
        {data.modules.map((mod, mIdx) => (
          <div key={mod.id} className="bg-zinc-900/60 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md shadow-2xl">
            {/* Section Header */}
            <div className="p-5 flex items-center gap-4 bg-black/40 border-b border-white/5">
              <button onClick={() => updateModule(mIdx, 'isOpen', !mod.isOpen)} className="text-zinc-400 hover:text-white"><ChevronDown size={20} className={mod.isOpen?'':'-rotate-90'}/></button>
              <div className="flex-1 flex items-center gap-3">
                <span className="text-xs font-black uppercase tracking-wider text-zinc-500">Section {mIdx + 1}:</span>
                <input value={mod.title} onChange={e => updateModule(mIdx, 'title', e.target.value)} className="bg-transparent font-bold text-white text-lg w-full outline-none" />
              </div>
              <button onClick={() => setData((p: CourseData) => ({...p, modules: p.modules.filter((_, i) => i !== mIdx)}))} className="text-zinc-600 hover:text-red-500"><Trash2 size={18}/></button>
            </div>

            {/* Items List */}
            {mod.isOpen && (
              <div className="p-5 space-y-4">
                {mod.items.map((item, iIdx) => (
                  <ContentItemBuilder 
                    key={item.id} item={item} mIdx={mIdx} iIdx={iIdx} data={data} setData={setData} 
                  />
                ))}
                <button onClick={() => addItem(mIdx)} className="w-full py-4 border-2 border-dashed border-white/10 rounded-xl text-sm font-bold uppercase tracking-wider text-emerald-500 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all flex items-center justify-center gap-2">
                  <Plus size={16}/> Add Curriculum Item
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  )
}

// --- 6. THE BEAST: CONTENT ITEM BUILDER (Handles Video, Slides, Quizzes, Resources) ---

function ContentItemBuilder({ item, mIdx, iIdx, data, setData }: any) {
  const { addToast } = useToast()
  const [activeTab, setActiveTab] = useState<'content' | 'resources'>('content')

  const updateItem = (field: string, val: any) => {
    const newMods = [...data.modules]
    newMods[mIdx].items[iIdx] = { ...newMods[mIdx].items[iIdx], [field]: val }
    setData({ ...data, modules: newMods })
  }

  // Icons based on type
  const TypeIcon = item.type === 'video' ? Video : item.type === 'video_slide' ? Presentation : item.type === 'article' ? FileText : item.type === 'quiz' || item.type === 'practice_test' ? ListChecks : BookOpen

  return (
    <div className="bg-black/60 border border-white/10 rounded-xl overflow-hidden transition-all">
      {/* Item Header Row */}
      <div className="p-4 flex items-center gap-4 hover:bg-white/5 transition-colors cursor-pointer" onClick={() => updateItem('isOpen', !item.isOpen)}>
        <div className="p-2 bg-zinc-800 rounded-lg text-zinc-400"><TypeIcon size={16}/></div>
        <div className="flex-1 flex gap-4 items-center">
            <input value={item.title} onChange={e => updateItem('title', e.target.value)} onClick={e=>e.stopPropagation()} className="bg-transparent text-sm font-bold text-white w-full outline-none" placeholder="Lecture Title" />
        </div>
        <div className="flex items-center gap-3" onClick={e=>e.stopPropagation()}>
            <select value={item.type} onChange={e => {updateItem('type', e.target.value); addToast('Content type changed', 'info')}} className="bg-zinc-900 border border-white/10 text-xs text-zinc-300 rounded px-2 py-1 outline-none cursor-pointer">
                <option value="video">Video</option>
                <option value="video_slide">Video & Slide</option>
                <option value="article">Article</option>
                <option value="quiz">Quiz</option>
                <option value="practice_test">Practice Test</option>
            </select>
            <button onClick={() => updateItem('isFreePreview', !item.isFreePreview)} className={`p-1.5 rounded-md ${item.isFreePreview ? 'bg-emerald-500/20 text-emerald-400' : 'text-zinc-600 hover:text-white'}`} title="Free Preview"><Eye size={16}/></button>
            <button onClick={() => { const n = [...data.modules]; n[mIdx].items.splice(iIdx, 1); setData({...data, modules: n}) }} className="text-zinc-600 hover:text-red-500"><Trash2 size={16}/></button>
        </div>
      </div>

      {/* Expanded Content Area */}
      {item.isOpen && (
        <div className="border-t border-white/5 bg-zinc-900/30">
            {/* Tabs */}
            <div className="flex gap-6 px-6 pt-4 border-b border-white/5 text-sm font-bold">
                <button onClick={()=>setActiveTab('content')} className={`pb-3 border-b-2 transition-colors ${activeTab === 'content' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-zinc-500 hover:text-white'}`}>Content</button>
                <button onClick={()=>setActiveTab('resources')} className={`pb-3 border-b-2 transition-colors ${activeTab === 'resources' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-zinc-500 hover:text-white'}`}>Resources ({item.resources?.length || 0})</button>
            </div>

            <div className="p-6">
                {activeTab === 'content' && (
                    <div className="animate-in fade-in">
                        {item.type === 'video' && <VideoUploader url={item.videoUrl} onUpload={(url:string) => {updateItem('videoUrl', url); addToast('Video uploaded', 'success')}} />}
                        {item.type === 'video_slide' && (
                            <div className="grid grid-cols-2 gap-6">
                                <VideoUploader label="Upload Video" url={item.videoUrl} onUpload={(url:string) => updateItem('videoUrl', url)} />
                                <DocumentUploader label="Upload PDF Slide" url={item.slideUrl} onUpload={(url:string) => updateItem('slideUrl', url)} />
                            </div>
                        )}
                        {item.type === 'article' && (
                            <textarea value={item.content || ''} onChange={e=>updateItem('content', e.target.value)} placeholder="Write your article here..." className="w-full h-48 bg-black border border-white/10 rounded-xl p-4 text-sm outline-none focus:border-emerald-500 resize-none text-zinc-300" />
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

// --- SUB-BUILDERS FOR CONTENT TYPES ---

function VideoUploader({ label = "Upload Video", url, onUpload }: any) {
    const [uploading, setUploading] = useState(false)
    const handleFile = async (e: any) => {
        if(!e.target.files[0]) return
        setUploading(true); await new Promise(r=>setTimeout(r, 1500)); 
        onUpload(URL.createObjectURL(e.target.files[0])); setUploading(false)
    }
    return (
        <label className="flex flex-col items-center justify-center w-full aspect-video bg-black border border-dashed border-white/20 rounded-xl cursor-pointer hover:border-emerald-500 transition-all overflow-hidden group">
            {url ? <video src={url} controls className="w-full h-full object-cover"/> : (
                <div className="text-center">
                    {uploading ? <Loader2 className="animate-spin text-emerald-500 mx-auto mb-2" size={24}/> : <UploadCloud className="text-zinc-500 group-hover:text-emerald-400 mx-auto mb-2 transition-colors" size={24}/>}
                    <span className="text-xs font-bold text-zinc-400 uppercase">{uploading ? 'Uploading...' : label}</span>
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
        <label className="flex flex-col items-center justify-center w-full aspect-video bg-black border border-dashed border-white/20 rounded-xl cursor-pointer hover:border-blue-500 transition-all overflow-hidden group">
            {url ? <div className="text-blue-400 flex flex-col items-center"><FileText size={32} className="mb-2"/><span className="text-xs font-bold">PDF Attached</span></div> : (
                <div className="text-center">
                    {uploading ? <Loader2 className="animate-spin text-blue-500 mx-auto mb-2" size={24}/> : <FileArchive className="text-zinc-500 group-hover:text-blue-400 mx-auto mb-2 transition-colors" size={24}/>}
                    <span className="text-xs font-bold text-zinc-400 uppercase">{uploading ? 'Uploading...' : label}</span>
                </div>
            )}
            <input type="file" accept=".pdf,.ppt,.pptx" className="hidden" onChange={handleFile} disabled={uploading}/>
        </label>
    )
}

function QuizBuilder({ quizData, onChange }: { quizData: QuizQuestion[], onChange: any }) {
    const addQ = () => onChange([...quizData, { id: Date.now().toString(), question: '', options: ['',''], correctIndex: 0 }])
    const updateQ = (qIdx: number, field: string, val: any) => { const n = [...quizData]; (n[qIdx] as any)[field] = val; onChange(n) }
    const updateOpt = (qIdx: number, oIdx: number, val: string) => { const n = [...quizData]; n[qIdx].options[oIdx] = val; onChange(n) }
    const addOpt = (qIdx: number) => { const n = [...quizData]; n[qIdx].options.push(''); onChange(n) }

    return (
        <div className="space-y-6">
            {quizData.map((q, qIdx) => (
                <div key={q.id} className="bg-black border border-white/10 rounded-xl p-5">
                    <div className="flex gap-4 mb-4">
                        <span className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold shrink-0">{qIdx + 1}</span>
                        <input value={q.question} onChange={e=>updateQ(qIdx, 'question', e.target.value)} placeholder="Type your question here..." className="flex-1 bg-transparent border-b border-white/20 pb-2 outline-none font-medium text-white focus:border-emerald-500" />
                        <button onClick={() => onChange(quizData.filter((_,i)=>i!==qIdx))} className="text-zinc-600 hover:text-red-500"><Trash2 size={16}/></button>
                    </div>
                    <div className="pl-10 space-y-3">
                        {q.options.map((opt, oIdx) => (
                            <div key={oIdx} className="flex items-center gap-3">
                                <input type="radio" name={`correct-${q.id}`} checked={q.correctIndex === oIdx} onChange={() => updateQ(qIdx, 'correctIndex', oIdx)} className="w-4 h-4 accent-emerald-500 cursor-pointer" />
                                <input value={opt} onChange={e=>updateOpt(qIdx, oIdx, e.target.value)} placeholder={`Option ${oIdx + 1}`} className={`flex-1 bg-zinc-900 border rounded-lg px-3 py-2 text-sm outline-none transition-colors ${q.correctIndex === oIdx ? 'border-emerald-500/50' : 'border-white/5 focus:border-white/20'}`} />
                            </div>
                        ))}
                        {q.options.length < 5 && <button onClick={()=>addOpt(qIdx)} className="text-xs font-bold text-zinc-500 hover:text-white flex items-center gap-1"><Plus size={12}/> Add Option</button>}
                    </div>
                </div>
            ))}
            <button onClick={addQ} className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-bold hover:bg-white/10 transition-colors flex items-center justify-center gap-2"><Plus size={16}/> New Question</button>
        </div>
    )
}

function ResourceManager({ resources, onChange }: { resources: ResourceItem[], onChange: any }) {
    const addRes = (type: 'file'|'link'|'code') => onChange([...resources, { id: Date.now().toString(), type, title: '', url: '' }])
    
    return (
        <div className="space-y-4">
            <div className="flex gap-3 mb-6">
                <button onClick={()=>addRes('file')} className="px-4 py-2 bg-black border border-white/10 rounded-lg text-xs font-bold flex items-center gap-2 hover:border-blue-500"><FileText size={14} className="text-blue-500"/> Add PDF/Doc</button>
                <button onClick={()=>addRes('link')} className="px-4 py-2 bg-black border border-white/10 rounded-lg text-xs font-bold flex items-center gap-2 hover:border-emerald-500"><LinkIcon size={14} className="text-emerald-500"/> Add Link</button>
                <button onClick={()=>addRes('code')} className="px-4 py-2 bg-black border border-white/10 rounded-lg text-xs font-bold flex items-center gap-2 hover:border-purple-500"><FileCode size={14} className="text-purple-500"/> Add Source Code</button>
            </div>
            
            {resources.map((r, i) => (
                <div key={r.id} className="flex items-center gap-4 bg-black p-3 rounded-xl border border-white/10">
                    <div className="p-2 bg-zinc-900 rounded-lg">{r.type === 'file' ? <FileText size={16} className="text-blue-500"/> : r.type === 'link' ? <LinkIcon size={16} className="text-emerald-500"/> : <FileCode size={16} className="text-purple-500"/>}</div>
                    <input value={r.title} onChange={e => {const n=[...resources]; n[i].title=e.target.value; onChange(n)}} placeholder="Resource Title" className="bg-transparent text-sm w-1/3 outline-none font-medium border-b border-white/10 focus:border-white/40 pb-1" />
                    <input value={r.url} onChange={e => {const n=[...resources]; n[i].url=e.target.value; onChange(n)}} placeholder={r.type==='link' ? "https://" : "Upload simulated..."} className="bg-zinc-900 text-sm flex-1 rounded-lg px-3 py-2 outline-none focus:border-emerald-500 border border-transparent" />
                    <button onClick={() => onChange(resources.filter((_,idx)=>idx!==i))} className="text-zinc-600 hover:text-red-500"><Trash2 size={16}/></button>
                </div>
            ))}
            {resources.length === 0 && <p className="text-sm text-zinc-500 text-center py-4">No resources attached to this lecture.</p>}
        </div>
    )
}

// --- HELPER COMPONENT ---
const SidebarItem = ({ active, icon: Icon, label, onClick }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold ${
    active ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]' : 'text-zinc-400 hover:text-white hover:bg-white/5'
  }`}>
    <Icon size={18} /> {label}
  </button>
)