'use client'

import React, { useState, useEffect } from 'react'
import { 
  Save, ChevronLeft, Plus, Trash2, Video, FileText, 
  CheckCircle2, Upload, ShieldCheck, DollarSign, 
  Layout, ChevronDown, ChevronRight, X, Loader2, 
  AlertCircle, Eye, Play, ImageIcon, User, Crown, 
  Calendar, MessageSquare, Briefcase, GraduationCap,
  Clock, Settings, Sparkles, Lock
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
  type: 'video' | 'article' | 'quiz' | 'assignment' | 'live_session'
  content?: string
  videoUrl?: string
  duration?: number
  isLocked?: boolean // For drip content
}

interface Section {
  id: string
  title: string
  isMilestone: boolean // For Roadmap feature
  lectures: Lecture[]
  isOpen: boolean
}

interface MentorshipSlot {
  day: string
  startTime: string
  endTime: string
}

interface CourseData {
  mode: CourseMode
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
  // Premium Specifics
  mentorshipEnabled: boolean
  mentorshipSlots: MentorshipSlot[]
  communityAccess: boolean
}

// --- COMPONENTS ---

const NavItem = ({ active, icon: Icon, label, onClick, locked }: any) => (
  <button 
    onClick={onClick}
    disabled={locked}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 relative overflow-hidden group ${
      active 
        ? 'bg-white text-black shadow-lg shadow-white/10' 
        : locked 
          ? 'opacity-40 cursor-not-allowed' 
          : 'text-zinc-400 hover:text-white hover:bg-white/5'
    }`}
  >
    <Icon size={18} className={active ? "text-black" : "text-zinc-500 group-hover:text-white"} />
    <span className="font-medium text-sm">{label}</span>
    {active && <motion.div layoutId="active-nav" className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />}
  </button>
)

const FileUploader = ({ type, url, onUpload, progress }: any) => (
  <div className="relative group cursor-pointer overflow-hidden rounded-2xl border border-dashed border-white/20 bg-zinc-900/50 hover:border-emerald-500/50 transition-all aspect-video flex flex-col items-center justify-center">
    {url ? (
      type === 'video' ? <video src={url} className="w-full h-full object-cover" controls /> : <img src={url} className="w-full h-full object-cover" />
    ) : (
      <div className="text-center p-6">
        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3 group-hover:bg-emerald-500/20 group-hover:text-emerald-400 transition-colors">
          {type === 'video' ? <Video size={20}/> : <ImageIcon size={20}/>}
        </div>
        <p className="text-xs text-zinc-400 font-medium">Click to upload {type}</p>
      </div>
    )}
    {progress > 0 && progress < 100 && (
      <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-500" />
      </div>
    )}
    <input type="file" className="hidden" accept={type === 'video' ? "video/*" : "image/*"} onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} />
  </div>
)

export default function CourseStudio() {
  const router = useRouter()
  const { user } = useAuth()
  
  // State
  const [step, setStep] = useState<Step>('mode')
  const [data, setData] = useState<CourseData>({
    mode: null,
    title: '',
    subtitle: '',
    description: '',
    category: 'Development',
    level: 'Beginner',
    price: '',
    objectives: ['', '', ''],
    curriculum: [],
    thumbnail: null,
    promoVideo: null,
    mentorshipEnabled: false,
    mentorshipSlots: [],
    communityAccess: false
  })
  const [uploadProgress, setUploadProgress] = useState(0)

  // --- ACTIONS ---
  const handleModeSelect = (mode: CourseMode) => {
    setData({ ...data, mode, price: mode === 'premium' ? '199.99' : '49.99' })
    setStep('details')
  }

  // --- RENDERERS ---

  // 1. MODE SELECTION (The Fork)
  if (step === 'mode') return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-zinc-800/30 via-black to-black pointer-events-none" />
      
      <div className="text-center mb-12 relative z-10">
        <h1 className="text-5xl font-black mb-4 tracking-tight">Create a New Experience</h1>
        <p className="text-zinc-400 text-lg">Choose how you want to deliver value to your students.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl w-full relative z-10">
        {/* Standard Option */}
        <motion.div 
          whileHover={{ y: -10 }}
          onClick={() => handleModeSelect('standard')}
          className="bg-zinc-900/50 border border-white/10 p-8 rounded-3xl cursor-pointer hover:border-emerald-500/50 hover:bg-zinc-900/80 transition-all group"
        >
          <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 mb-6 group-hover:scale-110 transition-transform">
            <Video size={32} />
          </div>
          <h3 className="text-2xl font-bold mb-2">Standard Course</h3>
          <p className="text-zinc-400 mb-6 leading-relaxed">
            Upload pre-recorded video lessons. Students learn at their own pace. Perfect for tutorials, guides, and masterclasses.
          </p>
          <ul className="space-y-3 text-sm text-zinc-300">
            <li className="flex gap-2"><CheckCircle2 size={16} className="text-emerald-500"/> Unlimited Students</li>
            <li className="flex gap-2"><CheckCircle2 size={16} className="text-emerald-500"/> Video & Article Content</li>
            <li className="flex gap-2"><CheckCircle2 size={16} className="text-emerald-500"/> Passive Income</li>
          </ul>
        </motion.div>

        {/* Premium Option */}
        <motion.div 
          whileHover={{ y: -10 }}
          onClick={() => handleModeSelect('premium')}
          className="bg-gradient-to-b from-[#1a1500] to-zinc-900 border border-yellow-500/20 p-8 rounded-3xl cursor-pointer hover:border-yellow-500/60 transition-all group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 bg-yellow-500 text-black text-xs font-bold px-3 py-1 rounded-bl-xl">EXCLUSIVE</div>
          <div className="w-16 h-16 bg-yellow-500/10 rounded-2xl flex items-center justify-center text-yellow-500 mb-6 group-hover:scale-110 transition-transform">
            <Crown size={32} />
          </div>
          <h3 className="text-2xl font-bold mb-2 text-white">Premium Experience</h3>
          <p className="text-zinc-400 mb-6 leading-relaxed">
            High-ticket cohort or mentorship program. Includes 1-on-1 video sessions, assignments, and a full roadmap.
          </p>
          <ul className="space-y-3 text-sm text-zinc-300">
            <li className="flex gap-2"><Sparkles size={16} className="text-yellow-500"/> Integrated 1-on-1 Video Calls</li>
            <li className="flex gap-2"><Sparkles size={16} className="text-yellow-500"/> Quizzes & Graded Assignments</li>
            <li className="flex gap-2"><Sparkles size={16} className="text-yellow-500"/> Full Career Roadmap</li>
          </ul>
        </motion.div>
      </div>
      
      <button onClick={() => router.push('/admin/dashboard')} className="mt-12 text-zinc-500 hover:text-white flex items-center gap-2 text-sm">
        <ChevronLeft size={16} /> Cancel and go back
      </button>
    </div>
  )

  // 2. STUDIO DASHBOARD
  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-72 bg-zinc-950 border-r border-white/5 flex flex-col p-6 sticky top-0 h-screen">
        <div className="mb-8">
          <Link href="/admin/dashboard" className="text-zinc-500 hover:text-white flex items-center gap-2 text-sm mb-6 transition-colors">
            <ChevronLeft size={16} /> Back to Dashboard
          </Link>
          <h2 className="font-bold text-xl px-2">{data.title || "Untitled Project"}</h2>
          <div className="flex items-center gap-2 px-2 mt-2">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${data.mode === 'premium' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
              {data.mode} Mode
            </span>
            <span className="text-[10px] text-zinc-500">Draft</span>
          </div>
        </div>

        <nav className="space-y-2 flex-1">
          <NavItem active={step === 'details'} icon={FileText} label="Course Details" onClick={() => setStep('details')} />
          <NavItem active={step === 'curriculum'} icon={Layout} label="Curriculum & Roadmap" onClick={() => setStep('curriculum')} />
          {data.mode === 'premium' && (
            <NavItem active={step === 'mentorship'} icon={Video} label="Mentorship & Live" onClick={() => setStep('mentorship')} />
          )}
          <NavItem active={step === 'pricing'} icon={DollarSign} label="Pricing & Settings" onClick={() => setStep('pricing')} />
          <NavItem active={step === 'review'} icon={ShieldCheck} label="Review & Publish" onClick={() => setStep('review')} />
        </nav>

        <div className="mt-auto">
           <div className="bg-zinc-900 rounded-xl p-4 border border-white/5">
              <h4 className="text-xs font-bold text-zinc-500 uppercase mb-3">Completion</h4>
              <div className="w-full bg-black h-1.5 rounded-full overflow-hidden">
                 <div className="bg-white h-full rounded-full w-1/3" />
              </div>
           </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 bg-black relative overflow-y-auto">
        <div className="max-w-5xl mx-auto p-12">
          
          {/* STEP 1: DETAILS */}
          {step === 'details' && (
            <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="space-y-10">
              <div>
                <h1 className="text-4xl font-bold mb-2">Course Basics</h1>
                <p className="text-zinc-400">Let's start with the foundation of your course.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-400">Course Title</label>
                    <input 
                      value={data.title} 
                      onChange={(e) => setData({...data, title: e.target.value})} 
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-lg focus:border-white/30 outline-none transition-all" 
                      placeholder="e.g. Advanced Full-Stack Masterclass"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-400">Subtitle</label>
                    <input 
                      value={data.subtitle} 
                      onChange={(e) => setData({...data, subtitle: e.target.value})} 
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 focus:border-white/30 outline-none transition-all" 
                      placeholder="A short, catchy tagline."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-400">Description</label>
                    <textarea 
                      value={data.description} 
                      onChange={(e) => setData({...data, description: e.target.value})} 
                      rows={6}
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 focus:border-white/30 outline-none transition-all resize-none" 
                      placeholder="What will students learn?"
                    />
                  </div>
                  
                  {/* Learning Objectives */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-zinc-400">What will students learn?</label>
                    {data.objectives.map((obj, i) => (
                      <div key={i} className="flex gap-2">
                        <div className="flex-1 relative">
                           <CheckCircle2 size={16} className="absolute left-3 top-3.5 text-zinc-600" />
                           <input 
                              value={obj}
                              onChange={(e) => {const n = [...data.objectives]; n[i] = e.target.value; setData({...data, objectives: n})}}
                              className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:border-white/30 outline-none"
                              placeholder="e.g. Build a React App"
                           />
                        </div>
                        <button onClick={() => setData({...data, objectives: data.objectives.filter((_, idx) => idx !== i)})} className="p-3 text-zinc-600 hover:text-red-500 bg-zinc-900 rounded-xl border border-white/5"><Trash2 size={18}/></button>
                      </div>
                    ))}
                    <button onClick={() => setData({...data, objectives: [...data.objectives, '']})} className="text-sm font-bold text-emerald-500 hover:text-emerald-400 flex items-center gap-2 mt-2"><Plus size={16}/> Add Objective</button>
                  </div>
                </div>

                {/* Media Uploads */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-400">Thumbnail</label>
                    <FileUploader type="image" url={data.thumbnail} progress={uploadProgress} onUpload={(f: File) => { /* Upload Logic */ }} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-400">Promo Video</label>
                    <FileUploader type="video" url={data.promoVideo} progress={uploadProgress} onUpload={(f: File) => { /* Upload Logic */ }} />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: CURRICULUM */}
          {step === 'curriculum' && (
            <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="space-y-8">
              <div className="flex justify-between items-end">
                <div>
                  <h1 className="text-4xl font-bold mb-2">Curriculum & Roadmap</h1>
                  <p className="text-zinc-400">Design the journey. {data.mode === 'premium' ? 'Use Milestones for big achievements.' : ''}</p>
                </div>
                <button className="bg-white text-black px-6 py-2.5 rounded-xl font-bold hover:bg-zinc-200 transition-colors flex items-center gap-2">
                  <Plus size={18}/> New Section
                </button>
              </div>

              {/* Empty State / List */}
              <div className="space-y-4">
                 {/* MOCK SECTION FOR UI */}
                 <div className="bg-zinc-900/30 border border-white/10 rounded-2xl overflow-hidden">
                    <div className="p-4 flex items-center gap-4 bg-zinc-900/50 border-b border-white/5">
                        <button className="text-zinc-500 hover:text-white"><ChevronDown size={20}/></button>
                        <div className="flex-1">
                            <input defaultValue="Introduction & Setup" className="bg-transparent text-lg font-bold text-white outline-none w-full" />
                        </div>
                        {data.mode === 'premium' && (
                            <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/10 text-yellow-500 rounded-full border border-yellow-500/20 text-xs font-bold uppercase cursor-pointer hover:bg-yellow-500/20">
                                <Crown size={12} /> Milestone
                            </div>
                        )}
                        <button className="text-zinc-600 hover:text-red-500"><Trash2 size={18}/></button>
                    </div>
                    
                    <div className="p-2 space-y-2">
                        {/* Mock Lecture Item */}
                        <div className="flex items-center gap-4 p-3 hover:bg-white/5 rounded-xl group cursor-pointer border border-transparent hover:border-white/5 transition-all">
                            <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-500"><Play size={14} fill="currentColor"/></div>
                            <span className="text-sm font-medium flex-1">Welcome to the Course</span>
                            <span className="text-xs text-zinc-600 group-hover:text-zinc-400">Video • 2:30</span>
                        </div>
                        {/* Premium Item Mock */}
                        {data.mode === 'premium' && (
                            <div className="flex items-center gap-4 p-3 hover:bg-yellow-500/5 rounded-xl group cursor-pointer border border-transparent hover:border-yellow-500/20 transition-all">
                                <div className="w-8 h-8 rounded-lg bg-yellow-900/20 flex items-center justify-center text-yellow-500"><Briefcase size={14}/></div>
                                <span className="text-sm font-medium flex-1 text-yellow-100">Project: Build Portfolio</span>
                                <span className="text-xs text-yellow-600/70 group-hover:text-yellow-500">Assignment</span>
                            </div>
                        )}
                        
                        <button className="w-full py-3 border border-dashed border-white/10 rounded-xl text-zinc-500 hover:text-white hover:border-white/20 text-sm font-medium mt-2 flex items-center justify-center gap-2">
                            <Plus size={16}/> Add Content
                        </button>
                    </div>
                 </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: MENTORSHIP (PREMIUM ONLY) */}
          {step === 'mentorship' && (
            <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="space-y-10">
               <div>
                  <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                      Mentorship <span className="text-xs bg-yellow-500 text-black px-2 py-1 rounded font-black uppercase tracking-wider">Premium</span>
                  </h1>
                  <p className="text-zinc-400">Configure how students can book 1-on-1 time with you.</p>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                   <div className="bg-zinc-900 border border-white/10 rounded-3xl p-8">
                       <div className="flex justify-between items-start mb-6">
                           <div>
                               <h3 className="text-xl font-bold text-white">Enable 1-on-1 Booking</h3>
                               <p className="text-sm text-zinc-400 mt-1">Allow enrolled students to schedule video calls.</p>
                           </div>
                           <div onClick={() => setData({...data, mentorshipEnabled: !data.mentorshipEnabled})} className={`w-14 h-8 rounded-full p-1 cursor-pointer transition-colors ${data.mentorshipEnabled ? 'bg-emerald-500' : 'bg-zinc-700'}`}>
                               <motion.div layout className="w-6 h-6 bg-white rounded-full shadow-md" />
                           </div>
                       </div>

                       {data.mentorshipEnabled && (
                           <div className="space-y-6 pt-6 border-t border-white/10 animate-in fade-in">
                               <div className="space-y-2">
                                   <label className="text-sm font-medium text-zinc-400">Session Duration</label>
                                   <select className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none">
                                       <option>15 Minutes</option>
                                       <option>30 Minutes</option>
                                       <option>45 Minutes</option>
                                       <option>60 Minutes</option>
                                   </select>
                               </div>
                               <div className="space-y-2">
                                   <label className="text-sm font-medium text-zinc-400">Availability (Weekly)</label>
                                   <div className="grid grid-cols-3 gap-2">
                                       {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(day => (
                                           <div key={day} className="bg-black border border-white/10 rounded-lg p-3 text-center cursor-pointer hover:border-emerald-500/50">
                                               <div className="text-sm font-bold">{day}</div>
                                               <div className="text-xs text-zinc-500 mt-1">9am - 5pm</div>
                                           </div>
                                       ))}
                                   </div>
                               </div>
                           </div>
                       )}
                   </div>

                   <div className="bg-gradient-to-br from-zinc-900 to-black border border-white/10 rounded-3xl p-8 flex flex-col items-center justify-center text-center">
                       <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                           <Video size={32} className="text-zinc-400" />
                       </div>
                       <h3 className="font-bold text-lg mb-2">Integrated Video Conference</h3>
                       <p className="text-sm text-zinc-400 mb-6">
                           When a student books a slot, a secure video link is generated automatically within the platform.
                       </p>
                       <button className="px-4 py-2 bg-white/10 rounded-lg text-sm font-bold hover:bg-white/20 transition-colors">
                           Test Video Room
                       </button>
                   </div>
               </div>
            </motion.div>
          )}

          {/* STEP 4: PRICING */}
          {step === 'pricing' && (
             <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="space-y-10">
                <div className="text-center max-w-2xl mx-auto">
                    <h1 className="text-4xl font-bold mb-4">Set Your Price</h1>
                    <p className="text-zinc-400">Grove Connect takes a flat 5% platform fee. You keep 95%.</p>
                </div>

                <div className="flex justify-center gap-6">
                    {data.mode === 'standard' ? (
                        ['Free', '19.99', '49.99', '99.99'].map(price => (
                            <div key={price} onClick={() => setData({...data, price})} className={`w-40 p-6 rounded-2xl border cursor-pointer text-center transition-all ${data.price === price ? 'bg-emerald-500/10 border-emerald-500 scale-110' : 'bg-zinc-900 border-white/10 hover:border-white/30'}`}>
                                <div className="text-2xl font-bold text-white">{price === 'Free' ? 'Free' : `$${price}`}</div>
                            </div>
                        ))
                    ) : (
                        // Premium Pricing Options
                        ['199.99', '299.99', '499.99', '999.99'].map(price => (
                            <div key={price} onClick={() => setData({...data, price})} className={`w-40 p-6 rounded-2xl border cursor-pointer text-center transition-all ${data.price === price ? 'bg-yellow-500/10 border-yellow-500 scale-110' : 'bg-zinc-900 border-white/10 hover:border-white/30'}`}>
                                <div className="text-2xl font-bold text-white">${price}</div>
                            </div>
                        ))
                    )}
                </div>
             </motion.div>
          )}

        </div>
      </main>

      {/* FOOTER ACTIONS */}
      <div className="fixed bottom-8 right-8 z-50 flex gap-4">
         <button className="px-6 py-3 bg-zinc-900 border border-white/10 rounded-full text-white font-bold hover:bg-zinc-800 shadow-xl backdrop-blur-md">Save Draft</button>
         <button className="px-8 py-3 bg-white text-black rounded-full font-bold hover:bg-zinc-200 shadow-xl shadow-white/10 flex items-center gap-2">
            Publish Course <ArrowRight size={18}/>
         </button>
      </div>

    </div>
  )
}

function ArrowRight({size, className}: any) {
    return <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
}