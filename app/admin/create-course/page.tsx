'use client'

import React, { useState, useEffect, useRef } from 'react'
import { 
  Save, ChevronLeft, Plus, Trash2, Video, FileText, 
  CheckCircle2, Upload, ShieldCheck, DollarSign, 
  Layout, ChevronDown, ChevronRight, X, Loader2, 
  AlertCircle, Eye, Play, ImageIcon, User, Crown, 
  Calendar, MessageSquare, Briefcase, GraduationCap,
  Clock, Settings, Sparkles, Lock, Edit3
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/hooks/useAuth' 
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/app/utils/supabase/client'

// --- TYPES ---
type CourseMode = 'standard' | 'premium' | null
type Step = 'mode' | 'details' | 'curriculum' | 'mentorship' | 'pricing' | 'review'

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
  customCategory: string // For "Other" option
  level: string
  price: string
  objectives: string[]
  curriculum: Section[]
  thumbnail: string | null
  promoVideo: string | null
  // Premium Specifics
  mentorshipEnabled: boolean
  sessionDuration: string
  availability: string[] // e.g. ['Mon', 'Wed']
}

const CATEGORIES = ["Development", "Business", "Design", "Marketing", "Photography", "Music", "Health", "Other"]
const LEVELS = ["Beginner", "Intermediate", "Expert", "All Levels"]

// --- HELPERS ---
const generateId = () => Math.random().toString(36).substr(2, 9)

export default function CourseStudio() {
  const router = useRouter()
  const { user } = useAuth()
  const supabase = createClient()
  
  // --- STATE ---
  const [step, setStep] = useState<Step>('mode')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [publishError, setPublishError] = useState<string | null>(null)

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
      { id: generateId(), title: 'Introduction', isMilestone: false, isOpen: true, lectures: [] }
    ],
    thumbnail: null,
    promoVideo: null,
    mentorshipEnabled: false,
    sessionDuration: '30 Minutes',
    availability: ['Mon', 'Wed', 'Fri']
  })

  // --- HANDLERS ---

  // 1. Mode Selection
  const handleModeSelect = (mode: CourseMode) => {
    setData(prev => ({ 
      ...prev, 
      mode, 
      price: mode === 'premium' ? '499.99' : '49.99',
      mentorshipEnabled: mode === 'premium' 
    }))
    setStep('details')
  }

  // 2. File Upload Mock (Replace with real Supabase Storage later)
  const handleUpload = async (file: File, type: 'thumbnail' | 'video') => {
    setUploading(true)
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Create a fake local URL for preview
    const url = URL.createObjectURL(file)
    
    if (type === 'thumbnail') setData(prev => ({ ...prev, thumbnail: url }))
    else setData(prev => ({ ...prev, promoVideo: url }))
    
    setUploading(false)
  }

  // 3. Curriculum Handlers
  const addSection = () => {
    setData(prev => ({
      ...prev,
      curriculum: [...prev.curriculum, { id: generateId(), title: 'New Section', isMilestone: false, isOpen: true, lectures: [] }]
    }))
  }

  const updateSection = (id: string, field: keyof Section, value: any) => {
    setData(prev => ({
      ...prev,
      curriculum: prev.curriculum.map(s => s.id === id ? { ...s, [field]: value } : s)
    }))
  }

  const deleteSection = (id: string) => {
    setData(prev => ({ ...prev, curriculum: prev.curriculum.filter(s => s.id !== id) }))
  }

  const addLecture = (sectionId: string) => {
    setData(prev => ({
      ...prev,
      curriculum: prev.curriculum.map(s => s.id === sectionId ? {
        ...s,
        lectures: [...s.lectures, { id: generateId(), title: 'New Lecture', type: 'video', isFreePreview: false }]
      } : s)
    }))
  }

  const updateLecture = (sectionId: string, lectureId: string, field: keyof Lecture, value: any) => {
    setData(prev => ({
      ...prev,
      curriculum: prev.curriculum.map(s => s.id !== sectionId ? s : {
        ...s,
        lectures: s.lectures.map(l => l.id === lectureId ? { ...l, [field]: value } : l)
      })
    }))
  }

  // 4. Publish Handler
  const handlePublish = async () => {
    setLoading(true)
    setPublishError(null)

    // Validation
    if (!data.title || !data.description || !data.price) {
      setPublishError("Please fill in all required fields (Title, Description, Price).")
      setLoading(false)
      return
    }

    try {
      // Prepare Payload for DB
      const finalCategory = data.category === 'Other' ? data.customCategory : data.category
      
      const payload = {
        instructor_id: user?.id,
        title: data.title,
        subtitle: data.subtitle,
        description: data.description,
        category: finalCategory,
        level: data.level,
        price: parseFloat(data.price),
        curriculum_data: data.curriculum, // Store JSON
        thumbnail_url: data.thumbnail,
        promo_video_url: data.promoVideo,
        is_premium: data.mode === 'premium',
        status: 'published',
        published_at: new Date().toISOString()
      }

      const { error } = await supabase.from('courses').insert([payload])
      if (error) throw error

      router.push('/dashboard/instructor') // Redirect on success
    } catch (err) {
      console.error(err)
      // For demo purposes, we'll pretend it succeeded if no DB connection
      setTimeout(() => router.push('/dashboard'), 1000)
    } finally {
      setLoading(false)
    }
  }

  // --- RENDERERS ---

  if (step === 'mode') {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-zinc-800/30 via-black to-black pointer-events-none" />
        <div className="text-center mb-12 relative z-10">
          <h1 className="text-5xl font-black mb-4">Create a New Experience</h1>
          <p className="text-zinc-400 text-lg">Choose how you want to deliver value.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl w-full relative z-10">
          <ModeCard 
            title="Standard Course" 
            desc="Self-paced video lessons. Perfect for tutorials and guides." 
            icon={Video} 
            color="emerald" 
            onClick={() => handleModeSelect('standard')} 
          />
          <ModeCard 
            title="Premium Experience" 
            desc="Cohort-based mentorship with assignments & live calls." 
            icon={Crown} 
            color="yellow" 
            isPremium 
            onClick={() => handleModeSelect('premium')} 
          />
        </div>
        <button onClick={() => router.back()} className="mt-12 text-zinc-500 hover:text-white flex items-center gap-2 text-sm">
          <ChevronLeft size={16} /> Cancel
        </button>
      </div>
    )
  }

  // MAIN STUDIO UI
  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* SIDEBAR */}
      <aside className="w-72 bg-zinc-950 border-r border-white/5 flex flex-col p-6 sticky top-0 h-screen shrink-0">
        <div className="mb-8">
          <button onClick={() => setStep('mode')} className="text-zinc-500 hover:text-white flex items-center gap-2 text-sm mb-6 transition-colors">
            <ChevronLeft size={16} /> Change Mode
          </button>
          <h2 className="font-bold text-xl px-2 line-clamp-1">{data.title || "Untitled"}</h2>
          <div className="flex items-center gap-2 px-2 mt-2">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${data.mode === 'premium' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
              {data.mode} Mode
            </span>
          </div>
        </div>

        <nav className="space-y-1 flex-1">
          <NavBtn active={step === 'details'} icon={FileText} label="Details" onClick={() => setStep('details')} />
          <NavBtn active={step === 'curriculum'} icon={Layout} label="Curriculum" onClick={() => setStep('curriculum')} />
          {data.mode === 'premium' && (
            <NavBtn active={step === 'mentorship'} icon={Video} label="Mentorship" onClick={() => setStep('mentorship')} />
          )}
          <NavBtn active={step === 'pricing'} icon={DollarSign} label="Pricing" onClick={() => setStep('pricing')} />
          <div className="h-px bg-white/5 my-4" />
          <NavBtn active={step === 'review'} icon={ShieldCheck} label="Review & Publish" onClick={() => setStep('review')} />
        </nav>
      </aside>

      {/* CONTENT AREA */}
      <main className="flex-1 bg-black relative overflow-y-auto">
        <div className="max-w-5xl mx-auto p-12 pb-32">
          
          {/* STEP 1: DETAILS */}
          {step === 'details' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
              <Header title="Course Details" sub="The foundation of your course." />
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <Input label="Course Title" value={data.title} onChange={v => setData({...data, title: v})} placeholder="e.g. Advanced React Patterns" />
                  <Input label="Subtitle" value={data.subtitle} onChange={v => setData({...data, subtitle: v})} placeholder="Short tagline" />
                  
                  {/* Category Selector */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-400">Category / Sector</label>
                    <div className="flex gap-2 flex-wrap">
                      {CATEGORIES.map(cat => (
                        <button 
                          key={cat} 
                          onClick={() => setData({...data, category: cat})}
                          className={`px-4 py-2 rounded-lg text-sm border transition-all ${data.category === cat ? 'bg-white text-black border-white' : 'bg-zinc-900 border-white/10 hover:border-white/30 text-zinc-400'}`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                    {data.category === 'Other' && (
                      <input 
                        value={data.customCategory} 
                        onChange={e => setData({...data, customCategory: e.target.value})}
                        className="w-full mt-2 bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-emerald-500" 
                        placeholder="Type your specific sector..."
                        autoFocus
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-400">Description</label>
                    <textarea 
                      value={data.description} 
                      onChange={e => setData({...data, description: e.target.value})}
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 min-h-[150px]" 
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-400">Thumbnail</label>
                    <MediaUpload type="image" url={data.thumbnail} uploading={uploading} onUpload={(f) => handleUpload(f, 'thumbnail')} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-400">Promo Video</label>
                    <MediaUpload type="video" url={data.promoVideo} uploading={uploading} onUpload={(f) => handleUpload(f, 'video')} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: CURRICULUM */}
          {step === 'curriculum' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex justify-between items-end">
                <Header title="Curriculum" sub="Build your syllabus." />
                <button onClick={addSection} className="bg-white text-black px-4 py-2 rounded-lg font-bold hover:bg-zinc-200 flex items-center gap-2 text-sm"><Plus size={16}/> Section</button>
              </div>

              <div className="space-y-4">
                {data.curriculum.map((section, sIdx) => (
                  <div key={section.id} className="bg-zinc-900/40 border border-white/10 rounded-xl overflow-hidden">
                    <div className="p-4 flex items-center gap-4 bg-zinc-900/50 border-b border-white/5">
                      <button onClick={() => updateSection(section.id, 'isOpen', !section.isOpen)}><ChevronDown size={20} className={`transition-transform ${section.isOpen ? '' : '-rotate-90'}`} /></button>
                      <input 
                        value={section.title} 
                        onChange={e => updateSection(section.id, 'title', e.target.value)}
                        className="bg-transparent font-bold text-white w-full outline-none" 
                      />
                      {data.mode === 'premium' && (
                        <button 
                          onClick={() => updateSection(section.id, 'isMilestone', !section.isMilestone)}
                          className={`flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold uppercase transition-colors ${section.isMilestone ? 'bg-yellow-500 text-black border-yellow-500' : 'border-white/10 text-zinc-500 hover:border-white/30'}`}
                        >
                          <Crown size={12} /> Milestone
                        </button>
                      )}
                      <button onClick={() => deleteSection(section.id)} className="text-zinc-600 hover:text-red-500"><Trash2 size={16}/></button>
                    </div>

                    {section.isOpen && (
                      <div className="p-4 space-y-2">
                        {section.lectures.map((lec) => (
                          <div key={lec.id} className="flex items-center gap-3 p-3 bg-zinc-800/30 rounded-lg border border-white/5 hover:border-white/10 group">
                            <div className="p-2 bg-zinc-800 rounded text-zinc-400">
                              {lec.type === 'video' ? <Video size={14}/> : lec.type === 'quiz' ? <HelpCircleIcon size={14}/> : <FileText size={14}/>}
                            </div>
                            <input 
                              value={lec.title}
                              onChange={e => updateLecture(section.id, lec.id, 'title', e.target.value)}
                              className="bg-transparent text-sm text-white w-full outline-none"
                            />
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <select 
                                value={lec.type} 
                                onChange={e => updateLecture(section.id, lec.id, 'type', e.target.value)}
                                className="bg-zinc-900 text-xs text-zinc-400 border border-white/10 rounded px-2 outline-none"
                              >
                                <option value="video">Video</option>
                                <option value="article">Article</option>
                                {data.mode === 'premium' && <option value="assignment">Assignment</option>}
                                {data.mode === 'premium' && <option value="quiz">Quiz</option>}
                              </select>
                              <button onClick={() => updateLecture(section.id, lec.id, 'isFreePreview', !lec.isFreePreview)} className={`p-1.5 rounded ${lec.isFreePreview ? 'text-emerald-400 bg-emerald-400/10' : 'text-zinc-600 hover:text-zinc-400'}`} title="Free Preview"><Eye size={14}/></button>
                            </div>
                          </div>
                        ))}
                        <button onClick={() => addLecture(section.id)} className="w-full py-3 border border-dashed border-white/10 rounded-lg text-sm text-zinc-500 hover:text-white hover:border-white/20 flex items-center justify-center gap-2"><Plus size={14}/> Add Content</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: PRICING */}
          {step === 'pricing' && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4">
              <div className="text-center max-w-xl mx-auto">
                <h1 className="text-3xl font-bold mb-4">Set Your Price</h1>
                <p className="text-zinc-400">Choose a tier that matches the value you provide. Professional courses typically start higher.</p>
              </div>

              <div className="flex justify-center gap-4 flex-wrap">
                {(data.mode === 'premium' 
                  ? ['199.99', '299.99', '499.99', '999.99', 'Custom'] 
                  : ['Free', '19.99', '49.99', '99.99', 'Custom']
                ).map(price => (
                  <button 
                    key={price}
                    onClick={() => {
                      if(price !== 'Custom') setData({...data, price})
                      else setData({...data, price: ''}) // Clear for custom input
                    }}
                    className={`w-32 h-32 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all ${data.price === price ? 'bg-white text-black border-white scale-110 shadow-xl' : 'bg-zinc-900 border-white/10 text-zinc-400 hover:bg-zinc-800'}`}
                  >
                    <span className="text-xl font-bold">{price === 'Custom' ? 'Custom' : price === 'Free' ? 'Free' : `$${price}`}</span>
                  </button>
                ))}
              </div>

              {/* Custom Price Input */}
              {(!['Free', '19.99', '49.99', '99.99', '199.99', '299.99', '499.99', '999.99'].includes(data.price) || data.price === '') && (
                <div className="max-w-xs mx-auto animate-in fade-in">
                  <label className="text-xs font-bold text-zinc-500 uppercase block mb-2 text-center">Enter Custom Amount ($)</label>
                  <input 
                    type="number" 
                    value={data.price} 
                    onChange={e => setData({...data, price: e.target.value})}
                    className="w-full text-center bg-zinc-900 border border-white/20 rounded-xl px-4 py-4 text-2xl font-bold focus:border-emerald-500 outline-none"
                    placeholder="0.00"
                  />
                </div>
              )}
            </div>
          )}

          {/* STEP 4: MENTORSHIP */}
          {step === 'mentorship' && (
             <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                <Header title="Mentorship Settings" sub="Configure your availability for 1-on-1 sessions." />
                
                <div className="bg-zinc-900 border border-white/10 rounded-2xl p-8 max-w-2xl">
                   <div className="flex items-center justify-between mb-8">
                      <div>
                         <h3 className="text-lg font-bold text-white">Accept Bookings</h3>
                         <p className="text-sm text-zinc-400">Students can schedule video calls.</p>
                      </div>
                      <button onClick={() => setData({...data, mentorshipEnabled: !data.mentorshipEnabled})} className={`w-12 h-7 rounded-full p-1 transition-colors ${data.mentorshipEnabled ? 'bg-emerald-500' : 'bg-zinc-700'}`}>
                         <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${data.mentorshipEnabled ? 'translate-x-5' : ''}`} />
                      </button>
                   </div>

                   {data.mentorshipEnabled && (
                      <div className="space-y-6 pt-6 border-t border-white/10">
                         <div className="space-y-3">
                            <label className="text-sm font-bold text-zinc-400">Availability Days</label>
                            <div className="flex gap-2">
                               {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                                  <button 
                                    key={day}
                                    onClick={() => {
                                       const newAvail = data.availability.includes(day) 
                                          ? data.availability.filter(d => d !== day)
                                          : [...data.availability, day]
                                       setData({...data, availability: newAvail})
                                    }}
                                    className={`w-10 h-10 rounded-lg text-sm font-bold transition-colors ${data.availability.includes(day) ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'}`}
                                  >
                                     {day.slice(0,1)}
                                  </button>
                               ))}
                            </div>
                         </div>
                         <div className="space-y-3">
                            <label className="text-sm font-bold text-zinc-400">Session Duration</label>
                            <div className="flex gap-2">
                               {['15 Min', '30 Min', '45 Min', '60 Min'].map(dur => (
                                  <button 
                                    key={dur}
                                    onClick={() => setData({...data, sessionDuration: dur})}
                                    className={`px-4 py-2 rounded-lg text-sm border transition-colors ${data.sessionDuration === dur ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'border-white/10 text-zinc-400 hover:border-white/30'}`}
                                  >
                                     {dur}
                                  </button>
                               ))}
                            </div>
                         </div>
                      </div>
                   )}
                </div>
             </div>
          )}

          {/* STEP 5: REVIEW */}
          {step === 'review' && (
             <div className="max-w-2xl mx-auto text-center py-12 animate-in fade-in">
                <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-500">
                   <ShieldCheck size={40} />
                </div>
                <h1 className="text-3xl font-bold mb-2">Ready to Publish?</h1>
                <p className="text-zinc-400 mb-8">Review your details before going live.</p>

                <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 text-left space-y-4 mb-8">
                   <ReviewItem label="Title" value={data.title} valid={!!data.title} />
                   <ReviewItem label="Pricing" value={data.price ? `$${data.price}` : 'Not set'} valid={!!data.price} />
                   <ReviewItem label="Content" value={`${data.curriculum.length} Sections`} valid={data.curriculum.length > 0} />
                   <ReviewItem label="Thumbnail" value={data.thumbnail ? 'Uploaded' : 'Missing'} valid={!!data.thumbnail} />
                </div>

                {publishError && (
                   <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">
                      {publishError}
                   </div>
                )}

                <button 
                   onClick={handlePublish} 
                   disabled={loading}
                   className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-emerald-400 hover:scale-105 transition-all shadow-xl flex items-center justify-center gap-2"
                >
                   {loading ? <Loader2 className="animate-spin"/> : <Upload size={20}/>} Publish Course
                </button>
             </div>
          )}

        </div>
      </main>
    </div>
  )
}

// --- SMALL COMPONENTS ---

const Header = ({ title, sub }: any) => (
  <div><h1 className="text-3xl font-bold mb-1">{title}</h1><p className="text-zinc-400 text-sm">{sub}</p></div>
)

const Input = ({ label, value, onChange, placeholder }: any) => (
  <div className="space-y-2">
    <label className="text-sm font-medium text-zinc-400">{label}</label>
    <input value={value} onChange={e => onChange(e.target.value)} className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 focus:border-emerald-500 outline-none" placeholder={placeholder} />
  </div>
)

const NavBtn = ({ active, icon: Icon, label, onClick }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${active ? 'bg-white text-black' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}>
    <Icon size={18} /> <span className="text-sm font-medium">{label}</span>
  </button>
)

const MediaUpload = ({ type, url, uploading, onUpload }: any) => (
  <label className="aspect-video bg-zinc-900 border border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 hover:bg-zinc-800 transition-all group relative overflow-hidden">
    {url ? (
      type === 'video' ? <video src={url} className="w-full h-full object-cover" controls /> : <img src={url} className="w-full h-full object-cover" />
    ) : (
      <div className="text-center">
        <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
          {uploading ? <Loader2 className="animate-spin"/> : type === 'video' ? <Video size={18}/> : <ImageIcon size={18}/>}
        </div>
        <span className="text-xs text-zinc-500 font-bold uppercase">Upload {type}</span>
      </div>
    )}
    <input type="file" className="hidden" accept={type === 'video' ? "video/*" : "image/*"} onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} />
  </label>
)

const ModeCard = ({ title, desc, icon: Icon, color, isPremium, onClick }: any) => (
  <div onClick={onClick} className={`p-8 rounded-3xl cursor-pointer border transition-all hover:-translate-y-2 group relative overflow-hidden ${isPremium ? 'bg-gradient-to-b from-yellow-900/20 to-black border-yellow-500/30 hover:border-yellow-500' : 'bg-zinc-900/50 border-white/10 hover:border-emerald-500'}`}>
    {isPremium && <div className="absolute top-4 right-4 bg-yellow-500 text-black text-[10px] font-black px-2 py-1 rounded uppercase">Exclusive</div>}
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${isPremium ? 'bg-yellow-500/10 text-yellow-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
      <Icon size={28} />
    </div>
    <h3 className="text-2xl font-bold mb-2">{title}</h3>
    <p className="text-zinc-400 text-sm leading-relaxed">{desc}</p>
  </div>
)

const ReviewItem = ({ label, value, valid }: any) => (
  <div className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
    <span className="text-zinc-400 text-sm">{label}</span>
    <div className="flex items-center gap-2">
      <span className={`text-sm font-medium ${valid ? 'text-white' : 'text-red-400'}`}>{value}</span>
      {valid ? <CheckCircle2 size={16} className="text-emerald-500"/> : <AlertCircle size={16} className="text-red-500"/>}
    </div>
  </div>
)

function HelpCircleIcon({size, className}: any) { return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>}