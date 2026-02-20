'use client'

import React, { useState, createContext, useContext } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, LayoutTemplate, FileVideo, BookOpen, Target, AlertCircle, 
  CheckCircle2, X, Plus, Trash2, Info, Lightbulb, PlayCircle, ShieldCheck,
  Camera, Mic, Sun, HeartHandshake, UploadCloud, Send, Loader2
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
type Step = 'intended-learners' | 'course-structure' | 'setup-test-video' | 'setup-curriculum' 
interface CourseData {
  objectives: string[]
  prerequisites: string[]
  audienceLevel: string
}

// --- 3. MAIN COMPONENT ---
export default function CreateCoursePage() {
  return (
    <ToastProvider>
      <CourseBuilder />
    </ToastProvider>
  )
}

function CourseBuilder() {
  const [activeStep, setActiveStep] = useState<Step>('intended-learners')
  const { addToast } = useToast()
  
  // State for "Plan Your Course"
  const [data, setData] = useState<CourseData>({
    objectives: ['', '', '', ''], // Minimum 4
    prerequisites: [''],
    audienceLevel: ''
  })

  // Mock Save Function
  const handleSave = () => {
    addToast('Changes saved to draft successfully!', 'success')
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white flex font-sans selection:bg-emerald-500/30">
      
      {/* --- SIDEBAR --- */}
      <aside className="w-72 bg-[#0a0a0a] border-r border-white/10 flex flex-col h-screen sticky top-0 shrink-0">
        <div className="p-6 border-b border-white/5">
          <button className="text-zinc-500 hover:text-white flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-6 transition-colors">
            Back to Dashboard
          </button>
          <h2 className="font-bold text-lg leading-tight">Build Your Course</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-8">
          {/* Section: Plan Your Course */}
          <div>
            <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-3 px-2">Plan Your Course</h3>
            <nav className="space-y-1">
              <SidebarItem active={activeStep === 'intended-learners'} icon={Users} label="Intended Learners" onClick={() => setActiveStep('intended-learners')} />
              <SidebarItem active={activeStep === 'course-structure'} icon={LayoutTemplate} label="Course Structure" onClick={() => setActiveStep('course-structure')} />
              <SidebarItem active={activeStep === 'setup-test-video'} icon={Camera} label="Setup & Test Video" onClick={() => setActiveStep('setup-test-video')} />
            </nav>
          </div>

          {/* Section: Create Your Content (Placeholders for future) */}
          <div className="opacity-50 pointer-events-none">
            <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-3 px-2">Create Your Content</h3>
            <nav className="space-y-1">
              <SidebarItem active={false} icon={FileVideo} label="Curriculum" onClick={() => {}} />
              <SidebarItem active={false} icon={BookOpen} label="Landing Page" onClick={() => {}} />
            </nav>
          </div>
        </div>

        <div className="p-6 border-t border-white/5">
          <button onClick={handleSave} className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-all shadow-lg">
            Save Draft
          </button>
        </div>
      </aside>

      {/* --- MAIN WORKSPACE --- */}
      <main className="flex-1 overflow-y-auto bg-black relative">
        <div className="max-w-5xl mx-auto p-12 pb-32">
          {activeStep === 'intended-learners' && <IntendedLearnersStep data={data} setData={setData} />}
          {activeStep === 'course-structure' && <CourseStructureStep />}
          {activeStep === 'setup-test-video' && <SetupTestVideoStep />}
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
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
      <div>
        <h1 className="text-3xl font-bold mb-2">Intended Learners</h1>
        <p className="text-zinc-400 text-lg">The descriptions you write here will help students decide if your course is the right one for them.</p>
      </div>

      {/* 1. Objectives */}
      <div className="space-y-4">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2 mb-1"><Target className="text-emerald-500"/> What will students learn in your course?</h3>
          <p className="text-sm text-zinc-500">You must enter at least 4 learning objectives or outcomes that learners can expect to achieve.</p>
        </div>
        <div className="space-y-3">
          <AnimatePresence>
            {data.objectives.map((obj, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex gap-3 group">
                <div className="flex-1 relative">
                  <input value={obj} onChange={e => handleObjChange(idx, e.target.value)} placeholder="Example: Build a full-stack Next.js application from scratch" className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3.5 text-sm outline-none focus:border-emerald-500 focus:bg-zinc-900 transition-all text-white placeholder-zinc-700" />
                </div>
                <button onClick={() => removeObj(idx)} className="w-12 flex items-center justify-center text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"><Trash2 size={18}/></button>
              </motion.div>
            ))}
          </AnimatePresence>
          <button onClick={addObj} className="text-emerald-500 hover:text-emerald-400 font-bold text-sm flex items-center gap-2 px-2 py-2 transition-colors"><Plus size={16}/> Add more to your response</button>
        </div>
      </div>

      {/* 2. Prerequisites */}
      <div className="space-y-4 pt-6 border-t border-white/5">
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

      {/* 3. Target Audience */}
      <div className="space-y-4 pt-6 border-t border-white/5">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2 mb-1"><Users className="text-blue-500"/> Who is this course for?</h3>
          <p className="text-sm text-zinc-500">Select the experience level of your target students.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['Beginner', 'Intermediate', 'Expert'].map(level => (
            <button 
              key={level} 
              onClick={() => { setData({...data, audienceLevel: level}); addToast(`Target audience set to ${level}`, 'success') }}
              className={`p-6 rounded-2xl border flex flex-col items-center justify-center gap-3 transition-all ${
                data.audienceLevel === level ? 'bg-blue-500/10 border-blue-500 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.15)] scale-105' : 'bg-zinc-900/50 border-white/10 text-zinc-400 hover:border-white/30 hover:bg-zinc-900'
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
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
      <div>
        <h1 className="text-3xl font-bold mb-2">Course Structure & Guidelines</h1>
        <p className="text-zinc-400 text-lg">Planning your course carefully creates a clear learning path for students and makes filming easier for you.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tips Card */}
        <div className="bg-gradient-to-br from-zinc-900 to-[#0a0a0a] border border-white/10 p-8 rounded-3xl relative overflow-hidden group hover:border-emerald-500/50 transition-colors">
          <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 mb-6"><Lightbulb size={24}/></div>
          <h3 className="text-xl font-bold mb-3">Tips for a Great Structure</h3>
          <ul className="space-y-3 text-sm text-zinc-400">
            <li className="flex gap-3"><CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5"/> <span>Create an outline. Decide what skills you’ll teach and how you’ll teach them.</span></li>
            <li className="flex gap-3"><CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5"/> <span>Introduce yourself and create momentum in the first section.</span></li>
            <li className="flex gap-3"><CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5"/> <span>Sections should have a clear learning objective, containing 3-7 lectures.</span></li>
            <li className="flex gap-3"><CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5"/> <span>Include practice activities (quizzes, assignments) to keep learners engaged.</span></li>
          </ul>
        </div>

        {/* Requirements Card */}
        <div className="bg-gradient-to-br from-zinc-900 to-[#0a0a0a] border border-white/10 p-8 rounded-3xl relative overflow-hidden group hover:border-blue-500/50 transition-colors">
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

      {/* Resources Section */}
      <div className="pt-8 border-t border-white/5">
        <h3 className="text-xl font-bold mb-6">Instructor Resources</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <a href="#" onClick={(e) => {e.preventDefault(); addToast('Opening Video Guide...', 'info')}} className="p-6 bg-zinc-900/40 border border-white/5 rounded-2xl hover:bg-zinc-900 hover:border-white/20 transition-all group">
            <PlayCircle className="text-rose-500 mb-4 group-hover:scale-110 transition-transform" size={28}/>
            <h4 className="font-bold text-white mb-2">How to create a course</h4>
            <p className="text-xs text-zinc-500">Watch a 5-minute video guide from our top instructors.</p>
          </a>
          
          <a href="#" onClick={(e) => {e.preventDefault(); addToast('Navigating to Trust & Safety...', 'info')}} className="p-6 bg-zinc-900/40 border border-white/5 rounded-2xl hover:bg-zinc-900 hover:border-white/20 transition-all group">
            <ShieldCheck className="text-amber-500 mb-4 group-hover:scale-110 transition-transform" size={28}/>
            <h4 className="font-bold text-white mb-2">Trust & Safety Guidelines</h4>
            <p className="text-xs text-zinc-500">Learn about our policies to ensure your course gets approved quickly.</p>
          </a>

          <a href="#" onClick={(e) => {e.preventDefault(); addToast('Opening Community...', 'info')}} className="p-6 bg-zinc-900/40 border border-white/5 rounded-2xl hover:bg-zinc-900 hover:border-white/20 transition-all group">
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
function SetupTestVideoStep() {
  const { addToast } = useToast()
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setIsUploading(true)
    // Simulate upload delay
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
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
      <div>
        <h1 className="text-3xl font-bold mb-2">Setup & Test Video</h1>
        <p className="text-zinc-400 text-lg">Get early feedback on your audio, lighting, and camera setup before you record your entire course.</p>
      </div>

      {/* Empathetic Reassurance Banner */}
      <div className="bg-gradient-to-r from-indigo-900/30 to-purple-900/10 border border-indigo-500/20 p-6 rounded-2xl flex items-start gap-4">
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
        
        {/* Left Column: Tips */}
        <div className="lg:col-span-3 space-y-6">
          <h3 className="text-xl font-bold mb-4">What our experts look for:</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-zinc-900/50 p-5 rounded-2xl border border-white/5">
              <Mic className="text-emerald-400 mb-3" size={24} />
              <h4 className="font-bold mb-1">Clear Audio</h4>
              <p className="text-xs text-zinc-400">Audio is the most important part! Minimize echo and background noise. A cheap lapel mic works wonders.</p>
            </div>
            
            <div className="bg-zinc-900/50 p-5 rounded-2xl border border-white/5">
              <Sun className="text-amber-400 mb-3" size={24} />
              <h4 className="font-bold mb-1">Good Lighting</h4>
              <p className="text-xs text-zinc-400">Ensure your face is well-lit. Face a window or use a ring light. Avoid strong backlighting (don't sit with a window behind you).</p>
            </div>
            
            <div className="bg-zinc-900/50 p-5 rounded-2xl border border-white/5">
              <Camera className="text-blue-400 mb-3" size={24} />
              <h4 className="font-bold mb-1">Camera Framing</h4>
              <p className="text-xs text-zinc-400">Keep the camera steady at eye level. Shoot in landscape mode (horizontal) in at least 720p resolution.</p>
            </div>
          </div>
        </div>

        {/* Right Column: Upload & Submit */}
        <div className="lg:col-span-2">
          {isSubmitted ? (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="h-full bg-emerald-900/20 border border-emerald-500/30 rounded-3xl p-8 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Video Submitted!</h3>
              <p className="text-sm text-emerald-200/70">
                Our team is currently reviewing your setup. We will email you personalized feedback within <b>48 hours</b>.
              </p>
            </motion.div>
          ) : (
            <div className="bg-zinc-900 border border-white/10 rounded-3xl p-6 flex flex-col h-full">
              <h3 className="font-bold text-lg mb-2">Submit a 2-minute test</h3>
              <p className="text-xs text-zinc-400 mb-6">Record yourself speaking about any topic for 1-2 minutes using your intended setup.</p>
              
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
    </motion.div>
  )
}

// --- HELPER COMPONENT ---
const SidebarItem = ({ active, icon: Icon, label, onClick }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold ${
    active ? 'bg-white text-black shadow-lg' : 'text-zinc-400 hover:text-white hover:bg-white/5'
  }`}>
    <Icon size={18} /> {label}
  </button>
)