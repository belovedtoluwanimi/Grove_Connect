'use client'

import React, { useState, useEffect } from 'react'
import { 
  Save, ChevronLeft, Plus, Trash2, Video, FileText, 
  CheckCircle2, Upload, ShieldCheck, DollarSign, 
  Layout, ChevronDown, ChevronRight, X, Loader2, 
  AlertCircle, Eye, Info, Play,
  ImageIcon
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/hooks/useAuth' 
import { motion, AnimatePresence } from 'framer-motion'
import API_URL from '../../utils/api'

// --- TYPES ---
type Step = 'learners' | 'curriculum' | 'landing' | 'settings' | 'legal'

interface Lecture {
  id: string
  title: string
  type: 'video' | 'article' | 'quiz'
  videoUrl?: string
  articleContent?: string
  isContentOpen: boolean
}

interface Section {
  id: string
  title: string
  lectures: Lecture[]
  isOpen: boolean
}

interface CourseData {
  title: string
  subtitle: string
  description: string
  category: string
  level: string
  price: string
  objectives: string[]
  curriculum: Section[]
  thumbnail: string | null
  promoVideo: string | null
}

// --- CONFIG ---
const PLATFORM_FEE_PERCENT = 5;

const steps: { id: Step; label: string; icon: any }[] = [
  { id: 'learners', label: 'Target Audience', icon: UsersIcon },
  { id: 'curriculum', label: 'Curriculum', icon: Layout },
  { id: 'landing', label: 'Landing Page', icon: Video },
  { id: 'settings', label: 'Pricing', icon: DollarSign },
  { id: 'legal', label: 'Review & Publish', icon: ShieldCheck },
]

function UsersIcon({className}: {className?: string}) {
    return <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
}

// --- TOAST NOTIFICATION COMPONENT ---
const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => (
  <motion.div 
    initial={{ opacity: 0, y: 50, scale: 0.9 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: 20, scale: 0.9 }}
    className={`fixed bottom-8 right-8 z-[100] flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border backdrop-blur-md ${
      type === 'success' 
        ? 'bg-green-900/80 border-green-500/50 text-white' 
        : 'bg-red-900/80 border-red-500/50 text-white'
    }`}
  >
    {type === 'success' ? <CheckCircle2 size={20} className="text-green-400" /> : <AlertCircle size={20} className="text-red-400" />}
    <div>
      <h4 className="font-bold text-sm">{type === 'success' ? 'Success' : 'Error'}</h4>
      <p className="text-xs opacity-90">{message}</p>
    </div>
    <button onClick={onClose} className="ml-4 opacity-50 hover:opacity-100"><X size={16} /></button>
  </motion.div>
)

export default function CreateCoursePage() {
  const router = useRouter()
  const { user } = useAuth()
  
  const [activeStep, setActiveStep] = useState<Step>('learners')
  const [isSaving, setIsSaving] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  
  // Notification State
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null)

  // Central State
  const [data, setData] = useState<CourseData>({
    title: '',
    subtitle: '',
    description: '',
    category: 'Development',
    level: 'Beginner',
    price: '49.99',
    objectives: ['', '', '', ''],
    curriculum: [
      { id: 'sec-1', title: 'Introduction', isOpen: true, lectures: [{ id: 'lec-1', title: 'Welcome to the course', type: 'video', isContentOpen: false }] }
    ],
    thumbnail: null,
    promoVideo: null
  })

  const [agreements, setAgreements] = useState({
    rights: false,
    quality: false,
    prohibited: false,
    terms: false
  })

  // --- HELPERS ---
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  const getSectionNumber = (index: number) => `${index + 1}.0`
  const getLectureNumber = (secIndex: number, lecIndex: number) => `${secIndex + 1}.${lecIndex + 1}`

  // --- HANDLERS (LEARNERS) ---
  const handleObjectiveChange = (index: number, value: string) => {
    const newObjs = [...data.objectives]
    newObjs[index] = value
    setData({ ...data, objectives: newObjs })
  }
  const addObjective = () => setData({ ...data, objectives: [...data.objectives, ''] })
  const removeObjective = (index: number) => setData({ ...data, objectives: data.objectives.filter((_, i) => i !== index) })

  // --- HANDLERS (CURRICULUM) ---
  const addSection = () => setData({ ...data, curriculum: [...data.curriculum, { id: `sec-${Date.now()}`, title: 'New Section', lectures: [], isOpen: true }] })
  const updateSectionTitle = (id: string, title: string) => setData({ ...data, curriculum: data.curriculum.map(s => s.id === id ? { ...s, title } : s) })
  const toggleSection = (id: string) => setData({ ...data, curriculum: data.curriculum.map(s => s.id === id ? { ...s, isOpen: !s.isOpen } : s) })
  const deleteSection = (id: string) => { if(confirm("Delete section?")) setData({ ...data, curriculum: data.curriculum.filter(s => s.id !== id) }) }
  
  const addLecture = (sectionId: string) => {
    const newLecture: Lecture = { id: `lec-${Date.now()}`, title: 'New Lecture', type: 'video', isContentOpen: true }
    setData({ ...data, curriculum: data.curriculum.map(s => s.id === sectionId ? { ...s, lectures: [...s.lectures, newLecture] } : s) })
  }
  const updateLecture = (sId: string, lId: string, field: keyof Lecture, val: any) => {
    setData({ ...data, curriculum: data.curriculum.map(s => s.id !== sId ? s : { ...s, lectures: s.lectures.map(l => l.id === lId ? { ...l, [field]: val } : l) }) })
  }
  const toggleLectureContent = (sId: string, lId: string) => {
    setData({ ...data, curriculum: data.curriculum.map(s => s.id !== sId ? s : { ...s, lectures: s.lectures.map(l => l.id === lId ? { ...l, isContentOpen: !l.isContentOpen } : l) }) })
  }
  const deleteLecture = (sId: string, lId: string) => {
    setData({ ...data, curriculum: data.curriculum.map(s => s.id !== sId ? s : { ...s, lectures: s.lectures.filter(l => l.id !== lId) }) })
  }

  // --- HANDLERS (UPLOAD) ---
  const handleFileUpload = async (file: File, context: 'thumbnail' | 'video' | 'lecture', sId?: string, lId?: string) => {
    setUploadProgress(10)
    const interval = setInterval(() => setUploadProgress(p => p < 90 ? p + 10 : p), 200)

    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch(`${API_URL}/api/upload`, { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Upload failed')
      const responseData = await res.json()
      
      clearInterval(interval)
      setUploadProgress(100)
      
      if (context === 'thumbnail') setData(prev => ({ ...prev, thumbnail: responseData.url }))
      else if (context === 'video') setData(prev => ({ ...prev, promoVideo: responseData.url }))
      else if (context === 'lecture' && sId && lId) updateLecture(sId, lId, 'videoUrl', responseData.url)
      
      showToast(`${context === 'thumbnail' ? 'Image' : 'Video'} uploaded successfully!`, 'success')
      setTimeout(() => setUploadProgress(0), 1000)

    } catch (error) {
      console.error(error)
      clearInterval(interval)
      setUploadProgress(0)
      showToast('Upload failed. Is the backend running?', 'error')
    }
  }

  // --- HANDLERS (SUBMIT) ---
  const handleSubmit = async () => {
    if (!user) return showToast("You must be logged in.", 'error')
    
    setIsSaving(true)
    try {
        const payload = { ...data, instructor_id: user.id, thumbnailUrl: data.thumbnail, promoVideoUrl: data.promoVideo }
        const res = await fetch(`${API_URL}/api/courses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        if(!res.ok) throw new Error()
        
        showToast("Course Published Successfully! Redirecting...", 'success')
        setTimeout(() => router.push('/admin/dashboard'), 2000)
    } catch (e) {
        showToast("Error publishing course. Try again.", 'error')
    } finally {
        setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans selection:bg-green-500/30">
      
      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>

      {/* HEADER */}
      <header className="h-16 border-b border-white/10 bg-black/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard" className="text-gray-400 hover:text-white flex items-center gap-2 transition-colors">
            <ChevronLeft size={20} /> <span className="hidden md:inline font-medium">Back</span>
          </Link>
          <div className="h-6 w-[1px] bg-white/10 mx-2" />
          <h1 className="font-bold text-lg hidden md:block">
             {data.title || "Untitled Course"} 
             <span className="text-gray-500 font-normal ml-2 text-xs uppercase bg-white/5 px-2 py-1 rounded tracking-wider">Draft Mode</span>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          {uploadProgress > 0 && (
             <div className="flex items-center gap-2 bg-neutral-900 border border-white/10 px-3 py-1.5 rounded-full">
                <Loader2 size={12} className="animate-spin text-green-500" />
                <span className="text-xs text-green-400">Uploading {uploadProgress}%</span>
             </div>
          )}
          <button className="px-4 py-2 text-sm font-medium text-white bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors">
            Preview Course
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR */}
        <aside className="w-64 bg-neutral-950 border-r border-white/10 hidden md:flex flex-col overflow-y-auto p-6">
            <nav className="space-y-1">
              {steps.map((step) => (
                <button key={step.id} onClick={() => setActiveStep(step.id)} className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-3 transition-all ${activeStep === step.id ? 'bg-green-600/10 text-green-400 border border-green-600/20 shadow-[0_0_10px_rgba(34,197,94,0.1)]' : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'}`}>
                  <step.icon size={18} /> {step.label}
                </button>
              ))}
            </nav>
        </aside>

        {/* CONTENT */}
        <main className="flex-1 overflow-y-auto bg-black p-6 md:p-12 relative">
          <div className="max-w-6xl mx-auto pb-24">
            
            {/* 1. LEARNERS */}
            {activeStep === 'learners' && (
               <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} className="space-y-6 max-w-4xl">
                  <div><h2 className="text-3xl font-bold">Target Audience</h2><p className="text-gray-400">Who is this course for and what will they gain?</p></div>
                  <div className="bg-neutral-900/50 p-8 rounded-2xl border border-white/10">
                    <label className="block text-white font-medium mb-4">What will students learn in your course?</label>
                    <div className="space-y-3">
                      {data.objectives.map((obj, idx) => (
                        <div key={idx} className="flex gap-2 group">
                          <input value={obj} onChange={(e) => handleObjectiveChange(idx, e.target.value)} placeholder={`Example: Build a full-stack app from scratch`} className="flex-1 bg-black border border-white/10 rounded-lg px-4 py-3 focus:border-green-500 outline-none transition-all" />
                          <button onClick={() => removeObjective(idx)} className="p-3 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-50 group-hover:opacity-100"><Trash2 size={18} /></button>
                        </div>
                      ))}
                      <button onClick={addObjective} className="text-green-400 font-medium text-sm flex items-center gap-2 hover:text-green-300 mt-2 px-1"><Plus size={16} /> Add another objective</button>
                    </div>
                  </div>
               </motion.div>
            )}

            {/* 2. CURRICULUM */}
            {activeStep === 'curriculum' && (
              <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} className="space-y-8 max-w-4xl">
                <div className="flex justify-between items-end">
                  <div><h2 className="text-3xl font-bold">Curriculum</h2><p className="text-gray-400">Structure your course content.</p></div>
                  <button onClick={addSection} className="bg-white text-black px-5 py-2.5 rounded-lg font-bold hover:bg-gray-200 flex items-center gap-2 shadow-lg"><Plus size={18} /> Add Section</button>
                </div>
                <div className="space-y-6">
                  {data.curriculum.map((section, sIdx) => (
                    <div key={section.id} className="bg-neutral-900/30 border border-white/10 rounded-xl overflow-hidden">
                      <div className="p-4 bg-white/5 flex items-center gap-4 border-b border-white/5 select-none">
                        <button onClick={() => toggleSection(section.id)} className="text-gray-400 hover:text-white"><ChevronDown size={20} className={`transform transition-transform ${section.isOpen ? 'rotate-0' : '-rotate-90'}`} /></button>
                        <span className="font-mono text-gray-500 font-bold">{getSectionNumber(sIdx)}</span>
                        <input value={section.title} onChange={(e) => updateSectionTitle(section.id, e.target.value)} className="bg-transparent font-bold text-white w-full outline-none text-lg flex-1" placeholder="Section Title" />
                        <button onClick={() => deleteSection(section.id)} className="text-gray-600 hover:text-red-400"><Trash2 size={16} /></button>
                      </div>
                      {section.isOpen && (
                        <div className="p-4 space-y-4">
                            {section.lectures.map((lecture, lIdx) => (
                                <div key={lecture.id} className="bg-neutral-800/40 border border-white/5 rounded-lg overflow-hidden transition-all hover:border-white/10">
                                    <div className="flex items-center gap-4 p-3 cursor-pointer hover:bg-white/5" onClick={() => toggleLectureContent(section.id, lecture.id)}>
                                        <Layout size={16} className="text-gray-500" />
                                        <span className="font-mono text-gray-500 text-sm">{getLectureNumber(sIdx, lIdx)}</span>
                                        <input value={lecture.title} onChange={(e) => updateLecture(section.id, lecture.id, 'title', e.target.value)} onClick={(e) => e.stopPropagation()} className="bg-transparent text-sm text-white w-full outline-none font-medium flex-1" placeholder="Lecture Title" />
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[10px] uppercase px-2 py-0.5 rounded border ${lecture.type === 'video' ? 'border-blue-500/30 text-blue-400 bg-blue-500/10' : 'border-orange-500/30 text-orange-400 bg-orange-500/10'}`}>{lecture.type}</span>
                                            {lecture.isContentOpen ? <ChevronDown size={16} className="text-green-400" /> : <ChevronLeft size={16} className="text-gray-500" />}
                                            <button onClick={(e) => { e.stopPropagation(); deleteLecture(section.id, lecture.id) }} className="text-gray-600 hover:text-red-400 ml-2"><X size={16} /></button>
                                        </div>
                                    </div>
                                    {lecture.isContentOpen && (
                                        <div className="p-6 bg-black/40 border-t border-white/5 animate-in slide-in-from-top-2">
                                            <div className="flex gap-4 mb-6 border-b border-white/10 pb-2">
                                                {['video', 'article'].map(t => (
                                                    <button key={t} onClick={() => updateLecture(section.id, lecture.id, 'type', t)} className={`pb-2 capitalize text-sm font-medium ${lecture.type === t ? 'text-green-400 border-b-2 border-green-400' : 'text-gray-500 hover:text-white'}`}>{t}</button>
                                                ))}
                                            </div>
                                            {lecture.type === 'video' && (
                                                <div className="flex items-center gap-6">
                                                    <div className="aspect-video w-48 bg-black rounded-lg border border-white/10 flex items-center justify-center relative overflow-hidden group">
                                                        {lecture.videoUrl ? <video src={lecture.videoUrl} className="w-full h-full object-cover" controls /> : <Video size={32} className="text-gray-700" />}
                                                    </div>
                                                    <div className="space-y-3">
                                                        <p className="text-sm text-gray-400">Upload high-quality video (1080p, MP4).</p>
                                                        <label className="inline-flex items-center gap-2 px-4 py-2 bg-white text-black text-sm font-bold rounded-lg cursor-pointer hover:bg-gray-200 transition-colors">
                                                            <Upload size={16} /> {lecture.videoUrl ? "Replace Video" : "Upload Video"}
                                                            <input type="file" className="hidden" accept="video/*" onChange={(e) => { if(e.target.files?.[0]) handleFileUpload(e.target.files[0], 'lecture', section.id, lecture.id) }} />
                                                        </label>
                                                    </div>
                                                </div>
                                            )}
                                            {lecture.type === 'article' && (
                                                <textarea value={lecture.articleContent || ''} onChange={(e) => updateLecture(section.id, lecture.id, 'articleContent', e.target.value)} className="w-full h-40 bg-black border border-white/10 rounded-lg p-4 text-sm text-gray-300 focus:border-green-500 outline-none" placeholder="Write your article content here..." />
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                            <button onClick={() => addLecture(section.id)} className="w-full py-3 border border-dashed border-white/10 rounded-lg text-sm text-gray-500 hover:text-green-400 hover:border-green-500/30 transition-all flex items-center justify-center gap-2"><Plus size={14} /> Add Content Item</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* 3. LANDING PAGE */}
            {activeStep === 'landing' && (
               <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  {/* Left: Editor */}
                  <div className="space-y-8">
                     <div><h2 className="text-3xl font-bold">Landing Page</h2><p className="text-gray-400">Design how your course appears in the marketplace.</p></div>
                     <div className="space-y-5">
                        <div className="space-y-2"><label className="text-xs font-bold text-gray-500 uppercase">Title</label><input value={data.title} onChange={(e) => setData({...data, title: e.target.value})} className="w-full bg-neutral-900 border border-white/10 rounded-lg p-3 outline-none focus:border-green-500" placeholder="e.g. Master React JS" /></div>
                        <div className="space-y-2"><label className="text-xs font-bold text-gray-500 uppercase">Subtitle</label><input value={data.subtitle} onChange={(e) => setData({...data, subtitle: e.target.value})} className="w-full bg-neutral-900 border border-white/10 rounded-lg p-3 outline-none focus:border-green-500" placeholder="Short catchy description" /></div>
                        <div className="space-y-2"><label className="text-xs font-bold text-gray-500 uppercase">Description</label><textarea value={data.description} onChange={(e) => setData({...data, description: e.target.value})} className="w-full h-40 bg-neutral-900 border border-white/10 rounded-lg p-3 outline-none focus:border-green-500 resize-none" placeholder="Detailed course description..." /></div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">Thumbnail</label>
                                <label className="aspect-video bg-neutral-900 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-green-500 transition-colors group relative overflow-hidden">
                                    {data.thumbnail ? <img src={data.thumbnail} className="w-full h-full object-cover" /> : <div className="text-center text-gray-500"><Upload size={24} className="mx-auto mb-2" /><span className="text-xs">Upload Image</span></div>}
                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'thumbnail')} />
                                    {data.thumbnail && <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold">Change</div>}
                                </label>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">Promo Video</label>
                                <label className="aspect-video bg-neutral-900 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-green-500 transition-colors group relative overflow-hidden">
                                    {data.promoVideo ? <video src={data.promoVideo} className="w-full h-full object-cover" /> : <div className="text-center text-gray-500"><Video size={24} className="mx-auto mb-2" /><span className="text-xs">Upload Video</span></div>}
                                    <input type="file" className="hidden" accept="video/*" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'video')} />
                                </label>
                            </div>
                        </div>
                     </div>
                  </div>

                  {/* Right: Live Preview */}
                  <div className="sticky top-24 h-fit">
                      <h3 className="text-sm font-bold text-gray-500 uppercase mb-4 flex items-center gap-2"><Eye size={16}/> Live Preview</h3>
                      <div className="bg-neutral-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                          <div className="relative aspect-video bg-neutral-800">
                              {data.thumbnail ? (
                                  <img src={data.thumbnail} className="w-full h-full object-cover" />
                              ) : (
                                  <div className="flex items-center justify-center h-full text-gray-600 bg-neutral-950"><ImageIcon size={48} /></div>
                              )}
                              <div className="absolute inset-0 flex items-center justify-center bg-black/20"><div className="bg-white/20 backdrop-blur-md p-4 rounded-full border border-white/30"><Play size={24} fill="white" /></div></div>
                          </div>
                          <div className="p-6 space-y-4">
                              <div>
                                  <h2 className="text-xl font-bold text-white leading-tight mb-1">{data.title || "Course Title"}</h2>
                                  <p className="text-sm text-gray-400 line-clamp-2">{data.subtitle || "Your course subtitle will appear here."}</p>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-yellow-500 font-bold">
                                  <span>4.8</span> <div className="flex gap-0.5">{'★★★★★'.split('').map((s,i)=><span key={i}>{s}</span>)}</div> <span className="text-gray-500 font-normal">(0 reviews)</span>
                              </div>
                              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                                  <div className="font-bold text-2xl">${data.price}</div>
                                  <div className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded">Beginner</div>
                              </div>
                          </div>
                      </div>
                  </div>
               </motion.div>
            )}

            {/* 4. SETTINGS (PRICING) */}
            {activeStep === 'settings' && (
               <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} className="space-y-8">
                  <div className="text-center max-w-2xl mx-auto">
                    <h2 className="text-3xl font-bold text-white mb-3">Pricing & Revenue</h2>
                    <p className="text-gray-400">Set a price for your course. <span className="text-white">Grove Connect takes a flat {PLATFORM_FEE_PERCENT}% platform fee</span> to cover hosting and marketing costs. You keep the rest.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {['Free', '19.99', '49.99', '99.99'].map((tier) => {
                          const priceNum = tier === 'Free' ? 0 : parseFloat(tier);
                          const platformFee = (priceNum * (PLATFORM_FEE_PERCENT / 100)).toFixed(2);
                          const earnings = (priceNum - parseFloat(platformFee)).toFixed(2);
                          
                          return (
                              <div key={tier} onClick={() => setData({...data, price: tier})} 
                                   className={`relative cursor-pointer group rounded-2xl border transition-all duration-300 overflow-hidden ${data.price === tier ? 'bg-green-900/20 border-green-500 shadow-xl shadow-green-900/20 scale-105 z-10' : 'bg-neutral-900/50 border-white/10 hover:border-white/30'}`}>
                                  {data.price === tier && <div className="absolute top-0 inset-x-0 h-1 bg-green-500" />}
                                  <div className="p-6 flex flex-col items-center">
                                      <h3 className="text-3xl font-bold text-white mb-1">{tier === 'Free' ? 'Free' : `$${tier}`}</h3>
                                      <span className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-6">{tier === 'Free' ? 'Lead Magnet' : 'Standard Tier'}</span>
                                      
                                      <div className="w-full space-y-3 pt-4 border-t border-white/5">
                                          <div className="flex justify-between text-sm"><span className="text-gray-400">Platform Fee</span><span className="text-red-400">-${platformFee}</span></div>
                                          <div className="flex justify-between text-sm font-bold"><span className="text-green-400">Your Earnings</span><span className="text-white">${earnings}</span></div>
                                      </div>
                                  </div>
                              </div>
                          )
                      })}
                  </div>
               </motion.div>
            )}

            {/* 5. LEGAL */}
            {activeStep === 'legal' && (
              <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} className="space-y-8 max-w-4xl mx-auto">
                <div className="bg-gradient-to-r from-red-900/20 to-transparent border-l-4 border-red-500 p-6 rounded-r-xl">
                  <div className="flex gap-4">
                     <ShieldCheck className="text-red-500 shrink-0" size={28} />
                     <div>
                        <h3 className="font-bold text-lg text-white mb-1">Instructor Terms & Compliance</h3>
                        <p className="text-sm text-gray-400">You are entering a legal agreement. False declarations will result in an immediate permanent ban and potential legal action.</p>
                     </div>
                  </div>
                </div>

                <div className="bg-neutral-900/50 border border-white/10 rounded-2xl p-8 space-y-6">
                   {[
                       { key: 'rights', label: "I own all rights to the content", desc: "I certify that I own the rights to all video, audio, images, and code used in this course." },
                       { key: 'quality', label: "Content Quality Agreement", desc: "I agree that my course meets the HD video (1080p) and audio standards required." },
                       { key: 'prohibited', label: "No Prohibited Content", desc: "This course does not contain hate speech, explicit material, or illegal activities." },
                       { key: 'terms', label: "Revenue Share Agreement", desc: `I understand and agree to the 95% / 5% revenue split policy.` }
                   ].map((item: any) => (
                       <label key={item.key} className="flex gap-4 cursor-pointer group">
                           <div className="pt-1"><input type="checkbox" checked={(agreements as any)[item.key]} onChange={() => setAgreements({...agreements, [item.key]: !(agreements as any)[item.key]})} className="w-5 h-5 accent-green-500 bg-neutral-800 border-white/20 rounded" /></div>
                           <div>
                               <div className="font-bold text-white group-hover:text-green-400 transition-colors">{item.label}</div>
                               <div className="text-sm text-gray-500">{item.desc}</div>
                           </div>
                       </label>
                   ))}
                </div>

                <div className="flex justify-end pt-4">
                   <button 
                     onClick={handleSubmit}
                     disabled={isSaving || !Object.values(agreements).every(Boolean)}
                     className="bg-green-600 hover:bg-green-500 text-black font-bold py-4 px-12 rounded-full shadow-[0_0_20px_rgba(22,163,74,0.3)] hover:scale-105 transition-all flex items-center gap-3 disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
                   >
                      {isSaving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                      {isSaving ? 'Processing...' : 'Complete & Publish Course'}
                   </button>
                </div>
              </motion.div>
            )}

            {/* NAV FOOTER */}
            <div className="fixed bottom-0 right-0 p-6 flex gap-4 z-40">
                {activeStep !== 'learners' && <button onClick={() => { const idx = steps.findIndex(s => s.id === activeStep); setActiveStep(steps[idx-1].id)}} className="px-6 py-3 rounded-full bg-neutral-900 border border-white/10 hover:bg-neutral-800 shadow-xl text-white font-medium">Back</button>}
                {activeStep !== 'legal' && <button onClick={() => { const idx = steps.findIndex(s => s.id === activeStep); setActiveStep(steps[idx+1].id)}} className="px-8 py-3 rounded-full bg-white text-black font-bold hover:bg-gray-200 shadow-xl transition-transform hover:scale-105">Next Step</button>}
            </div>

          </div>
        </main>
      </div>
    </div>
  )
}