'use client'

import React, { useState, useEffect } from 'react'
import { 
  FileText, Layout, DollarSign, ShieldCheck, CheckCircle2, 
  ChevronLeft, Calendar, Loader2, MonitorPlay, Crown, AlertTriangle, Cloud, Eye, Play, Plus, Trash2, Video
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/hooks/useAuth' 
import { createClient } from '@/app/utils/supabase/client'
import { CourseData, INITIAL_AVAILABILITY, Step, InstructorVerification, CourseMode } from './types'
import { saveDraft, loadDraft, clearDraft, INITIAL_DATA, generateId, uploadFileToSupabase } from './utils'
import { NavBtn, Input, MediaUpload, TextArea } from './components/ui-parts'
import { VerificationStep } from './components/steps/VerificationStep'
import { ModeStep, CurriculumStep } from './components' // See below for defining these if not in file 2, but for brevity I will define ModeStep and CurriculumStep logic inside the components file or inline below.

// RE-IMPORTING STEPS FROM COMPONENTS.TSX TO PAGE (Assuming you pasted File 2 content into components.tsx)
import { ModeStep as ModeStepComponent, CurriculumStep as CurriculumStepComponent } from './components'

// --- CONSTANTS ---
const CATEGORIES = ["Development", "Business", "Finance", "Design", "Marketing", "Other"]
const STANDARD_PRICES = ['Free', '19', '49', '99', 'Custom']
const PREMIUM_PRICES = ['199', '499', '999', 'Custom']

export default function CourseStudioPage() {
  const router = useRouter()
  const { user } = useAuth()
  const supabase = createClient()
  
  // --- STATE ---
  const [data, setData] = useState<CourseData>(INITIAL_DATA)
  const [step, setStep] = useState<Step>('mode')
  const [loading, setLoading] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [verificationStatus, setVerificationStatus] = useState<InstructorVerification['status']>('idle')

  // --- EFFECTS ---
  useEffect(() => {
    const draft = loadDraft()
    if (draft) {
      setData(draft.data)
      setLastSaved(new Date(draft.timestamp))
    }
  }, [])

  useEffect(() => {
    if (data.mode) {
      saveDraft(data)
      setLastSaved(new Date())
    }
  }, [data])

  // --- HANDLERS ---

  const handleModeSelect = (mode: 'standard' | 'premium') => {
    if (data.mode && data.mode !== mode) {
        if (!confirm("Switching modes might hide some premium data. Continue?")) return
    }
    
    const newData = { ...data, mode }
    if (mode === 'premium') {
      // Init premium config if missing
      if (!newData.premiumConfig) {
        newData.premiumConfig = {
            format: 'self_paced',
            communityAccess: true,
            prioritySupport: true,
            scheduling: {
                timezone: 'UTC',
                platform: 'google_meet',
                sessionDuration: 30,
                bufferTime: 15,
                availability: INITIAL_AVAILABILITY,
                bookingRules: { maxPerWeek: 5, minLeadTime: 24 }
            }
        }
      }
      newData.pricing.amount = '499'
    } else {
      // Standard mode defaults
      newData.pricing.amount = '49'
    }
    setData(newData)
    setStep('details')
  }

  // --- SUB-COMPONENTS FOR SPECIFIC STEPS (Defined here for access to 'data' state easily) ---

  const PricingStep = () => (
    <div className="space-y-8 animate-in fade-in">
        <div><h1 className="text-3xl font-bold mb-2">Pricing</h1><p className="text-zinc-400">Set your value.</p></div>
        <div className="flex gap-4 flex-wrap">
            {(data.mode === 'premium' ? PREMIUM_PRICES : STANDARD_PRICES).map(p => (
                <button key={p} onClick={() => setData(prev => ({...prev, pricing: { ...prev.pricing, amount: p === 'Custom' ? '' : p === 'Free' ? '0' : p }}))} 
                    className={`px-6 py-4 rounded-xl border transition-all ${data.pricing.amount === (p==='Free'?'0':p) ? 'bg-white text-black border-white scale-105' : 'bg-zinc-900 border-white/10 text-zinc-400 hover:border-white/30'}`}>
                    {p === 'Custom' ? 'Custom' : p === 'Free' ? 'Free' : `$${p}`}
                </button>
            ))}
        </div>
        <Input label="Custom Amount ($)" type="number" value={data.pricing.amount} onChange={(v: string) => setData(prev => ({...prev, pricing: {...prev.pricing, amount: v}}))} placeholder="0.00" />
    </div>
  )

  const SchedulingStep = () => {
      if (!data.premiumConfig) return null
      
      const updateConfig = (key: string, val: any) => {
          setData(prev => ({
              ...prev, 
              premiumConfig: { ...prev.premiumConfig!, scheduling: { ...prev.premiumConfig!.scheduling, [key]: val } }
          }))
      }

      return (
          <div className="space-y-8 animate-in fade-in">
              <div><h1 className="text-3xl font-bold mb-2">Mentorship Scheduling</h1><p className="text-zinc-400">Configure availability.</p></div>
              
              <div className="bg-zinc-900 border border-white/10 rounded-xl p-6 space-y-6">
                  {data.premiumConfig.scheduling.availability.map((day, idx) => (
                      <div key={day.day} className={`flex items-center gap-4 p-3 rounded-lg border ${day.enabled ? 'bg-amber-500/10 border-amber-500/30' : 'border-white/5 bg-black/20'}`}>
                          <input type="checkbox" checked={day.enabled} onChange={(e) => {
                              const newAvail = [...data.premiumConfig!.scheduling.availability];
                              newAvail[idx].enabled = e.target.checked;
                              updateConfig('availability', newAvail);
                          }} className="w-5 h-5 accent-amber-500" />
                          <span className="w-24 font-bold">{day.day}</span>
                          {day.enabled && (
                              <div className="flex gap-2 items-center">
                                  <input type="time" value={day.windows[0].start} onChange={(e) => {
                                      const newAvail = [...data.premiumConfig!.scheduling.availability];
                                      newAvail[idx].windows[0].start = e.target.value;
                                      updateConfig('availability', newAvail);
                                  }} className="bg-black border border-white/20 rounded px-2 py-1 text-sm" />
                                  <span>to</span>
                                  <input type="time" value={day.windows[0].end} onChange={(e) => {
                                      const newAvail = [...data.premiumConfig!.scheduling.availability];
                                      newAvail[idx].windows[0].end = e.target.value;
                                      updateConfig('availability', newAvail);
                                  }} className="bg-black border border-white/20 rounded px-2 py-1 text-sm" />
                              </div>
                          )}
                      </div>
                  ))}
              </div>
          </div>
      )
  }

  // --- PUBLISH LOGIC ---
  const handlePublishAction = async () => {
    setError(null)
    
    // Validation
    if (!data.title) { setError("Title is required"); return }
    if (!data.description) { setError("Description is required"); return }
    if (data.modules.length === 0) { setError("Add at least one module"); return }
    if (verificationStatus !== 'verified') { setError("Verification required"); setStep('verification'); return }

    setLoading(true)
    try {
        if(!user) throw new Error("Not authenticated")
        
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
            status: verificationStatus === 'verified' ? 'published' : 'draft',
            published_at: new Date().toISOString()
        }

        const { error } = await supabase.from('courses').insert([payload])
        if (error) throw error

        clearDraft()
        router.push('/dashboard/instructor')
    } catch (e: any) {
        setError(e.message)
    } finally {
        setLoading(false)
    }
  }

  // --- MAIN RENDER ---
  if (step === 'mode') return <ModeStepComponent onSelect={handleModeSelect} />

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
          <NavBtn active={step === 'verification'} icon={ShieldCheck} label="Verification" onClick={() => setStep('verification')} alert={verificationStatus !== 'verified'} />
          <NavBtn active={step === 'review'} icon={CheckCircle2} label="Publish" onClick={() => setStep('review')} />
        </nav>

        <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
           <span className="flex items-center gap-1"><Cloud size={10}/> {lastSaved ? 'Saved' : 'Draft'}</span>
           <button onClick={() => { clearDraft(); setData(INITIAL_DATA); setStep('mode') }} className="hover:text-red-400">Reset</button>
        </div>
      </aside>

      {/* CONTENT */}
      <main className="flex-1 relative overflow-y-auto bg-black">
        <div className="max-w-4xl mx-auto p-12 pb-32">
          
          {step === 'details' && (
             <div className="space-y-8 animate-in fade-in">
                <div className="mb-6"><h1 className="text-3xl font-bold mb-2">Course Essentials</h1></div>
                <Input label="Title" value={data.title} onChange={(v: string) => setData(p => ({...p, title: v}))} placeholder="Course Title" />
                <Input label="Subtitle" value={data.subtitle} onChange={(v: string) => setData(p => ({...p, subtitle: v}))} placeholder="Catchy hook" />
                <div className="space-y-2">
                   <label className="text-xs font-bold text-zinc-500 uppercase">Category</label>
                   <div className="flex gap-2 flex-wrap">
                      {CATEGORIES.map(c => (
                         <button key={c} onClick={() => setData(p => ({...p, category: c}))} className={`px-3 py-1 rounded-full text-xs border ${data.category === c ? 'bg-white text-black' : 'border-white/10 text-zinc-400'}`}>{c}</button>
                      ))}
                   </div>
                   {data.category === 'Other' && <Input value={data.customCategory} onChange={(v: string) => setData(p => ({...p, customCategory: v}))} placeholder="Specify category..." />}
                </div>
                <MediaUpload label="Thumbnail" type="image" url={data.thumbnail} onUpload={(url) => setData(p => ({...p, thumbnail: url}))} />
             </div>
          )}

          {step === 'curriculum' && <CurriculumStepComponent data={data} setData={setData} />}
          {step === 'mentorship' && <SchedulingStep />}
          {step === 'pricing' && <PricingStep />}
          {step === 'verification' && <VerificationStep onStatusChange={setVerificationStatus} />}
          
          {step === 'review' && (
             <div className="space-y-8 animate-in fade-in">
                <div className="mb-6"><h1 className="text-3xl font-bold mb-2">Final Review</h1></div>
                <div className="bg-zinc-900 border border-white/10 rounded-xl p-6 text-sm space-y-4">
                    <div className="flex justify-between border-b border-white/5 pb-2"><span>Title</span> <span className="font-bold text-white">{data.title}</span></div>
                    <div className="flex justify-between border-b border-white/5 pb-2"><span>Price</span> <span className="font-bold text-white">${data.pricing.amount}</span></div>
                    <div className="flex justify-between border-b border-white/5 pb-2"><span>Status</span> <span className={`${verificationStatus==='verified'?'text-emerald-500':'text-amber-500'} font-bold capitalize`}>{verificationStatus}</span></div>
                </div>
                {error && <div className="p-4 bg-red-900/20 text-red-400 rounded border border-red-500/20">{error}</div>}
                <button onClick={handlePublishAction} disabled={loading} className="w-full py-4 bg-emerald-500 text-black font-bold rounded-xl flex justify-center gap-2">
                    {loading ? <Loader2 className="animate-spin"/> : <MonitorPlay/>} Publish Course
                </button>
             </div>
          )}

        </div>
      </main>
      
      {/* PREVIEW PANEL */}
      <aside className="hidden 2xl:block w-80 border-l border-white/10 bg-[#0a0a0a] p-6 shrink-0 sticky top-0 h-screen">
         <h4 className="text-xs font-bold text-zinc-500 uppercase mb-4">Preview</h4>
         <div className="bg-black rounded-xl overflow-hidden border border-white/10 shadow-2xl">
             <div className="aspect-video bg-zinc-900 relative">
                 {data.thumbnail && <img src={data.thumbnail} className="w-full h-full object-cover" />}
             </div>
             <div className="p-4">
                 <h3 className="font-bold text-lg leading-tight mb-1">{data.title || "Untitled Course"}</h3>
                 <div className="flex justify-between items-center border-t border-white/10 pt-3 mt-3">
                     <span className="font-black text-lg">${data.pricing.amount || '0'}</span>
                 </div>
             </div>
         </div>
      </aside>

    </div>
  )
}