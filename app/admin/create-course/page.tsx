'use client'

import React, { useState, useEffect } from 'react'
import { 
  FileText, Layout, DollarSign, ShieldCheck, CheckCircle2, 
  ChevronLeft, Calendar, Loader2, MonitorPlay, Crown, AlertTriangle, Cloud, Eye, Play 
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/hooks/useAuth' 
import { createClient } from '@/app/utils/supabase/client'
import { CourseData, INITIAL_AVAILABILITY, Step } from './types'
import { 
  NavBtn, ModeStep, CurriculumStep, SchedulingStep, VerificationStep, 
  Input, MediaUpload, ReviewRow 
} from './components'

// --- INITIAL STATE ---
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
  modules: [{ id: 'mod-1', title: 'Introduction', items: [], isOpen: true, isMilestone: false }],
  pricing: { type: 'one_time', amount: '', currency: 'USD' }
}

const CATEGORIES = ["Development", "Business", "Finance", "Design", "Marketing", "Other"]

export default function CourseStudioPage() {
  const router = useRouter()
  const { user } = useAuth()
  const supabase = createClient()
  
  // State
  const [data, setData] = useState<CourseData>(INITIAL_DATA)
  const [step, setStep] = useState<Step>('mode')
  const [loading, setLoading] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Load draft
  useEffect(() => {
    const saved = localStorage.getItem('grove_course_draft')
    if (saved) {
      try { setData(JSON.parse(saved)); setLastSaved(new Date()) } catch(e) {}
    }
  }, [])

  // Auto-save
  useEffect(() => {
    if (data.mode) {
      const t = setTimeout(() => {
        localStorage.setItem('grove_course_draft', JSON.stringify(data))
        setLastSaved(new Date())
      }, 2000)
      return () => clearTimeout(t)
    }
  }, [data])

  const handleModeSelect = (mode: 'standard' | 'premium') => {
    const newData = { ...data, mode }
    if (mode === 'premium') {
      newData.premiumConfig = {
        format: 'self_paced',
        features: { oneOnOne: true, prioritySupport: true, assignments: true, community: true },
        scheduling: {
          timezone: 'UTC',
          platform: 'google_meet',
          sessionDuration: 30,
          bufferTime: 15,
          availability: INITIAL_AVAILABILITY,
          bookingRules: { maxPerWeek: 5, minLeadTime: 24 }
        }
      }
      newData.pricing.amount = '499'
    } else {
      delete newData.premiumConfig
      newData.pricing.amount = '49'
    }
    setData(newData)
    setStep('details')
  }

  const validatePublish = () => {
    if (!data.title) return "Title is missing."
    if (!data.description) return "Description is missing."
    if (!data.thumbnail) return "Thumbnail is required."
    if (data.modules.length === 0) return "Add at least one section/phase."
    if (data.mode === 'premium' && !data.premiumConfig) return "Premium config missing."
    return null
  }

  const handlePublish = async () => {
    setError(null)
    const validationError = validatePublish()
    if (validationError) { setError(validationError); return }
    if (!isVerified) { setStep('verification'); return }

    setLoading(true)
    try {
      if (!user) throw new Error("Unauthorized")
      
      const payload = {
        instructor_id: user.id,
        title: data.title,
        subtitle: data.subtitle,
        description: data.description,
        category: data.category === 'Other' ? data.customCategory : data.category,
        level: data.level,
        thumbnail_url: data.thumbnail,
        promo_video_url: data.promoVideo,
        price: parseFloat(data.pricing.amount),
        currency: data.pricing.currency,
        is_premium: data.mode === 'premium',
        curriculum_data: data.modules,
        program_config: data.premiumConfig || null,
        status: 'published',
        published_at: new Date().toISOString()
      }

      const { error } = await supabase.from('courses').insert([payload])
      if (error) throw error

      localStorage.removeItem('grove_course_draft')
      router.push('/dashboard/instructor')
    } catch (e: any) {
      console.error(e)
      setError(e.message || "Failed to publish")
    } finally {
      setLoading(false)
    }
  }

  if (step === 'mode') return <ModeStep onSelect={handleModeSelect} />

  return (
    <div className="min-h-screen bg-[#050505] text-white flex font-sans selection:bg-emerald-500/30">
      
      {/* SIDEBAR */}
      <aside className="w-72 bg-[#0a0a0a] border-r border-white/10 flex flex-col p-6 sticky top-0 h-screen shrink-0 z-20">
        <div className="mb-8">
          <button onClick={() => setStep('mode')} className="text-zinc-500 hover:text-white flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-4 transition-colors">
            <ChevronLeft size={14} /> Back
          </button>
          <h2 className="font-bold text-lg leading-tight mb-2 line-clamp-2">{data.title || "Untitled Course"}</h2>
          <span className={`text-[10px] font-black uppercase px-2 py-1 rounded border w-fit flex items-center gap-1 ${data.mode === 'premium' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
            {data.mode === 'premium' && <Crown size={10} fill="currentColor"/>} {data.mode}
          </span>
        </div>

        <nav className="space-y-1 flex-1">
          <NavBtn active={step === 'details'} icon={FileText} label="Details" onClick={() => setStep('details')} />
          <NavBtn active={step === 'curriculum'} icon={Layout} label={data.mode === 'premium' ? 'Roadmap' : 'Curriculum'} onClick={() => setStep('curriculum')} />
          {data.mode === 'premium' && <NavBtn active={step === 'mentorship'} icon={Calendar} label="Scheduling" onClick={() => setStep('mentorship')} />}
          <NavBtn active={step === 'pricing'} icon={DollarSign} label="Pricing" onClick={() => setStep('pricing')} />
          <div className="h-px bg-white/10 my-4" />
          <NavBtn active={step === 'verification'} icon={ShieldCheck} label="Verification" onClick={() => setStep('verification')} alert={!isVerified} />
          <NavBtn active={step === 'review'} icon={CheckCircle2} label="Publish" onClick={() => setStep('review')} />
        </nav>

        <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
           <span className="flex items-center gap-1"><Cloud size={10}/> {lastSaved ? 'Saved' : 'Draft'}</span>
           <span>{lastSaved?.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 relative overflow-y-auto bg-black">
        <div className="max-w-4xl mx-auto p-12 pb-32">
          
          {/* Details Step */}
          {step === 'details' && (
             <div className="space-y-8 animate-in fade-in">
                <div className="mb-6"><h1 className="text-3xl font-bold mb-2">Course Essentials</h1><p className="text-zinc-400">Foundation info.</p></div>
                <Input label="Title" value={data.title} onChange={(v: string) => setData({...data, title: v})} placeholder="Course Title" />
                <Input label="Subtitle" value={data.subtitle} onChange={(v: string) => setData({...data, subtitle: v})} placeholder="Catchy hook" />
                <div className="space-y-2">
                   <label className="text-xs font-bold text-zinc-500 uppercase">Category</label>
                   <div className="flex gap-2 flex-wrap">
                      {CATEGORIES.map(c => (
                         <button key={c} onClick={() => setData({...data, category: c})} className={`px-3 py-1 rounded-full text-xs border ${data.category === c ? 'bg-white text-black' : 'border-white/10 text-zinc-400'}`}>{c}</button>
                      ))}
                   </div>
                </div>
                <MediaUpload label="Thumbnail" type="image" url={data.thumbnail} onUpload={(url) => setData({...data, thumbnail: url})} />
             </div>
          )}

          {/* Curriculum Step */}
          {step === 'curriculum' && <CurriculumStep data={data} setData={setData} />}

          {/* Mentorship Step */}
          {step === 'mentorship' && data.mode === 'premium' && <SchedulingStep data={data} setData={setData} />}

          {/* Pricing Step */}
          {step === 'pricing' && (
             <div className="space-y-8 animate-in fade-in">
                <div className="mb-6"><h1 className="text-3xl font-bold mb-2">Pricing</h1><p className="text-zinc-400">Set your value.</p></div>
                <div className="flex gap-4">
                   {['Free', '19', '49', '99', '199', '499'].map(p => (
                      <button key={p} onClick={() => setData({...data, pricing: { ...data.pricing, amount: p === 'Free' ? '0' : p }})} className={`px-6 py-4 rounded-xl border ${data.pricing.amount === p ? 'bg-white text-black' : 'border-white/10 text-zinc-400'}`}>{p === 'Free' ? 'Free' : `$${p}`}</button>
                   ))}
                </div>
                <Input label="Custom Amount" value={data.pricing.amount} onChange={(v: string) => setData({...data, pricing: {...data.pricing, amount: v}})} placeholder="0.00" type="number" />
             </div>
          )}

          {/* Verification Step */}
          {step === 'verification' && <VerificationStep onComplete={() => setIsVerified(true)} />}

          {/* Review Step */}
          {step === 'review' && (
             <div className="space-y-8 animate-in fade-in">
                <div className="mb-6"><h1 className="text-3xl font-bold mb-2">Review & Publish</h1><p className="text-zinc-400">Final check.</p></div>
                
                <div className="bg-zinc-900 border border-white/10 rounded-xl p-6 space-y-4">
                   <div className="flex justify-between border-b border-white/5 pb-4">
                      <span className="text-zinc-400">Mode</span>
                      <span className="capitalize font-bold">{data.mode}</span>
                   </div>
                   <div className="flex justify-between border-b border-white/5 pb-4">
                      <span className="text-zinc-400">Title</span>
                      <span className="font-bold">{data.title || 'Missing'}</span>
                   </div>
                   <div className="flex justify-between border-b border-white/5 pb-4">
                      <span className="text-zinc-400">Price</span>
                      <span className="font-bold">${data.pricing.amount}</span>
                   </div>
                   <div className="flex justify-between">
                      <span className="text-zinc-400">Verification</span>
                      <span className={isVerified ? "text-emerald-500 font-bold" : "text-red-500 font-bold"}>{isVerified ? 'Passed' : 'Pending'}</span>
                   </div>
                </div>

                {error && <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg flex gap-2"><AlertTriangle size={16}/> {error}</div>}

                <button onClick={handlePublish} disabled={loading} className="w-full py-4 bg-emerald-500 text-black font-bold rounded-xl hover:bg-emerald-400 disabled:opacity-50 flex items-center justify-center gap-2">
                   {loading ? <Loader2 className="animate-spin"/> : <MonitorPlay size={20}/>} Publish Course
                </button>
             </div>
          )}

        </div>
      </main>
      
      {/* 3. DESKTOP PREVIEW */}
      <aside className="hidden 2xl:block w-80 border-l border-white/10 bg-[#0a0a0a] p-6 shrink-0 sticky top-0 h-screen">
         <h4 className="text-xs font-bold text-zinc-500 uppercase mb-4">Preview</h4>
         <div className="bg-black rounded-xl overflow-hidden border border-white/10 shadow-2xl">
             <div className="aspect-video bg-zinc-900 relative">
                 {data.thumbnail && <img src={data.thumbnail} className="w-full h-full object-cover" />}
             </div>
             <div className="p-4">
                 <h3 className="font-bold text-lg leading-tight mb-1">{data.title || "Untitled Course"}</h3>
                 <p className="text-xs text-zinc-400 line-clamp-2 mb-3">{data.subtitle}</p>
                 <div className="flex justify-between items-center border-t border-white/10 pt-3">
                     <span className="font-black text-lg">${data.pricing.amount || '0'}</span>
                     <span className="text-[10px] bg-white/10 px-2 py-1 rounded text-zinc-300">{data.category}</span>
                 </div>
             </div>
         </div>
      </aside>

    </div>
  )
}