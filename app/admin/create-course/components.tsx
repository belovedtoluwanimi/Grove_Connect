'use client'

import React, { useState } from 'react'
import { 
  Video, FileText, CheckCircle2, Upload, Layout, ChevronDown, 
  Trash2, Plus, Calendar, Clock, Map, User, Briefcase, 
  ShieldCheck, Loader2, ScanFace, X, MonitorPlay, Crown
} from 'lucide-react'
import { CourseData, INITIAL_AVAILABILITY } from './types'

// --- UI PRIMITIVES ---

export const Input = ({ label, value, onChange, placeholder, type = 'text', error }: any) => (
  <div className="space-y-2 w-full">
    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{label}</label>
    <input 
      type={type}
      value={value} 
      onChange={e => onChange(e.target.value)} 
      className={`w-full bg-zinc-900 border ${error ? 'border-red-500' : 'border-white/10'} rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-all text-white placeholder-zinc-700`} 
      placeholder={placeholder} 
    />
    {error && <p className="text-red-500 text-xs">{error}</p>}
  </div>
)

export const MediaUpload = ({ label, type, url, onUpload }: { label: string, type: 'image'|'video', url: string|null, onUpload: (url: string) => void }) => {
  const [uploading, setUploading] = useState(false)
  
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return
    setUploading(true)
    // Simulate upload delay
    await new Promise(r => setTimeout(r, 1500))
    onUpload(URL.createObjectURL(e.target.files[0]))
    setUploading(false)
  }

  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{label}</label>
      <label className="aspect-video bg-zinc-900 border border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-white/40 transition-all relative overflow-hidden group">
        {url ? (
          type === 'video' ? <video src={url} className="w-full h-full object-cover" controls /> : <img src={url} className="w-full h-full object-cover" />
        ) : (
          <div className="text-center group-hover:scale-105 transition-transform">
            <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
              {uploading ? <Loader2 className="animate-spin text-zinc-500"/> : <Upload size={18} className="text-zinc-500"/>}
            </div>
            <span className="text-xs text-zinc-500 font-bold uppercase">{uploading ? 'Uploading...' : `Click to Upload ${type}`}</span>
          </div>
        )}
        <input type="file" className="hidden" accept={type === 'video' ? "video/*" : "image/*"} onChange={handleFile} />
      </label>
    </div>
  )
}

export const NavBtn = ({ active, icon: Icon, label, onClick, alert }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium ${active ? 'bg-white text-black shadow-lg shadow-white/5' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}>
    <Icon size={18} /> <span className="flex-1 text-left">{label}</span> {alert && <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
  </button>
)

// --- STEPS ---

export const ModeStep = ({ onSelect }: { onSelect: (m: 'standard' | 'premium') => void }) => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-12">
    <div>
        <h1 className="text-5xl font-black mb-4 tracking-tight">Select Course Format</h1>
        <p className="text-zinc-400 text-lg">Choose how you want to deliver value.</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl px-4">
      {/* Standard */}
      <div onClick={() => onSelect('standard')} className="group p-8 rounded-3xl bg-[#0a0a0a] border border-white/10 hover:border-emerald-500/50 cursor-pointer transition-all hover:-translate-y-2 text-left relative overflow-hidden">
          <div className="absolute top-0 right-0 p-20 bg-emerald-500/5 blur-3xl rounded-full" />
          <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 mb-6 border border-emerald-500/20"><MonitorPlay size={28} /></div>
          <h3 className="text-2xl font-bold mb-2">Standard Course</h3>
          <p className="text-zinc-400 text-sm mb-6">Pre-recorded video lessons. Students learn at their own pace. Ideal for tutorials and guides.</p>
          <span className="text-emerald-500 text-sm font-bold flex items-center gap-2">Select Standard &rarr;</span>
      </div>
      {/* Premium */}
      <div onClick={() => onSelect('premium')} className="group p-8 rounded-3xl bg-gradient-to-b from-[#110e05] to-[#0a0a0a] border border-amber-500/20 hover:border-amber-500 cursor-pointer transition-all hover:-translate-y-2 text-left relative overflow-hidden">
          <div className="absolute top-0 right-0 p-20 bg-amber-500/5 blur-3xl rounded-full" />
          <div className="absolute top-4 right-4 bg-amber-500 text-black text-[10px] font-black px-3 py-1 rounded uppercase">Exclusive</div>
          <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 mb-6 border border-amber-500/20"><Crown size={28} /></div>
          <h3 className="text-2xl font-bold mb-2 text-white">Premium Program</h3>
          <p className="text-zinc-400 text-sm mb-6">High-ticket mentorship. Includes 1-on-1 calls, structured roadmap, and assignments.</p>
          <span className="text-amber-500 text-sm font-bold flex items-center gap-2">Select Premium &rarr;</span>
      </div>
    </div>
  </div>
)

export const CurriculumStep = ({ data, setData }: { data: CourseData, setData: any }) => {
  const updateModule = (idx: number, field: string, val: any) => {
    const newMods = [...data.modules]
    newMods[idx] = { ...newMods[idx], [field]: val }
    setData((prev: CourseData) => ({ ...prev, modules: newMods }))
  }

  const addItem = (modIdx: number) => {
    const newMods = [...data.modules]
    newMods[modIdx].items.push({ 
      id: Date.now().toString(), 
      title: '', 
      type: 'video', 
      duration: 0, 
      isFreePreview: false 
    })
    setData((prev: CourseData) => ({ ...prev, modules: newMods }))
  }

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="flex justify-between items-end border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">{data.mode === 'premium' ? "Program Roadmap" : "Course Curriculum"}</h1>
          <p className="text-zinc-400">{data.mode === 'premium' ? "Define phases and milestones for your students." : "Organize your lectures into sections."}</p>
        </div>
        <button 
          onClick={() => setData((prev: CourseData) => ({...prev, modules: [...prev.modules, { id: Date.now().toString(), title: '', items: [], isOpen: true, isMilestone: false }]}))}
          className="bg-white text-black px-4 py-2 rounded-lg font-bold hover:bg-zinc-200 flex items-center gap-2 text-sm"
        >
          <Plus size={16}/> Add {data.mode === 'premium' ? 'Phase' : 'Section'}
        </button>
      </div>

      <div className="space-y-6">
        {data.modules.length === 0 && (
          <div className="text-center py-12 border border-dashed border-white/10 rounded-xl">
            <p className="text-zinc-500">No content yet. Add a section to start.</p>
          </div>
        )}
        
        {data.modules.map((mod, mIdx) => (
          <div key={mod.id} className="bg-zinc-900/40 border border-white/10 rounded-xl overflow-hidden transition-all">
            <div className="p-4 flex items-center gap-4 bg-zinc-900/80 border-b border-white/5">
              <button onClick={() => updateModule(mIdx, 'isOpen', !mod.isOpen)}><ChevronDown size={20} className={`transition-transform ${mod.isOpen ? '' : '-rotate-90'}`} /></button>
              <div className="flex-1">
                <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider block mb-1">
                  {data.mode === 'premium' ? `Phase ${mIdx + 1}` : `Section ${mIdx + 1}`}
                </span>
                <input 
                  value={mod.title} 
                  onChange={(e) => updateModule(mIdx, 'title', e.target.value)}
                  className="bg-transparent font-bold text-white w-full outline-none placeholder-zinc-700"
                  placeholder={data.mode === 'premium' ? "e.g. Foundation & Basics" : "e.g. Introduction"}
                />
              </div>
              {data.mode === 'premium' && (
                <button 
                  onClick={() => updateModule(mIdx, 'isMilestone', !mod.isMilestone)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold uppercase transition-colors ${mod.isMilestone ? 'bg-amber-500/20 text-amber-500 border-amber-500/50' : 'border-white/10 text-zinc-600 hover:border-white/30'}`}
                >
                  <Crown size={12} /> Milestone
                </button>
              )}
              <button onClick={() => setData((prev: CourseData) => ({...prev, modules: prev.modules.filter((_, i) => i !== mIdx)}))} className="text-zinc-600 hover:text-red-500 p-2"><Trash2 size={16}/></button>
            </div>

            {mod.isOpen && (
              <div className="p-4 space-y-3">
                {mod.items.map((item, iIdx) => (
                  <div key={item.id} className="flex items-center gap-3 p-3 bg-black/40 rounded-lg border border-white/5 group hover:border-white/10 transition-colors">
                    <div className={`p-2 rounded-md ${item.type === 'video' ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/10 text-purple-500'}`}>
                      {item.type === 'video' ? <Video size={14}/> : <FileText size={14}/>}
                    </div>
                    <input 
                      value={item.title}
                      onChange={(e) => {
                        const newMods = [...data.modules]
                        newMods[mIdx].items[iIdx].title = e.target.value
                        setData({...data, modules: newMods})
                      }}
                      className="bg-transparent text-sm text-white flex-1 outline-none"
                      placeholder="Content title..."
                    />
                    <select 
                      value={item.type}
                      onChange={(e) => {
                        const newMods = [...data.modules]
                        newMods[mIdx].items[iIdx].type = e.target.value as any
                        setData({...data, modules: newMods})
                      }}
                      className="bg-zinc-800 text-xs rounded border border-white/10 text-zinc-400 outline-none px-2 py-1"
                    >
                      <option value="video">Video</option>
                      <option value="article">Article</option>
                      <option value="quiz">Quiz</option>
                      <option value="assignment">Assignment</option>
                    </select>
                    <button 
                      onClick={() => {
                        const newMods = [...data.modules]
                        newMods[mIdx].items = newMods[mIdx].items.filter((_, i) => i !== iIdx)
                        setData({...data, modules: newMods})
                      }}
                      className="text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={14}/>
                    </button>
                  </div>
                ))}
                <button onClick={() => addItem(mIdx)} className="w-full py-3 border border-dashed border-white/10 rounded-lg text-xs font-bold uppercase text-zinc-500 hover:text-white hover:border-white/20 flex items-center justify-center gap-2 transition-all">
                  <Plus size={14}/> Add Content
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export const SchedulingStep = ({ data, setData }: { data: CourseData, setData: any }) => {
  if (!data.premiumConfig) return null

  const updateConfig = (field: string, val: any) => {
    setData((prev: CourseData) => ({
      ...prev,
      premiumConfig: { ...prev.premiumConfig!, scheduling: { ...prev.premiumConfig!.scheduling, [field]: val } }
    }))
  }

  const updateAvailability = (dayIdx: number, field: string, val: any) => {
    const newAvail = [...data.premiumConfig!.scheduling.availability]
    if (field === 'enabled') {
        newAvail[dayIdx].enabled = val
    } else if (field === 'start' || field === 'end') {
        newAvail[dayIdx].windows[0] = { ...newAvail[dayIdx].windows[0], [field]: val }
    }
    updateConfig('availability', newAvail)
  }

  return (
    <div className="space-y-10 animate-in fade-in">
      <div>
        <h1 className="text-3xl font-bold mb-2">Mentorship Scheduling</h1>
        <p className="text-zinc-400">Configure when students can book 1:1 sessions with you.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
           <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6">
              <h3 className="text-sm font-bold uppercase text-zinc-500 mb-4 flex items-center gap-2"><Clock size={16}/> Weekly Availability</h3>
              <div className="space-y-2">
                 {data.premiumConfig.scheduling.availability.map((day, idx) => (
                    <div key={day.day} className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${day.enabled ? 'bg-amber-500/5 border-amber-500/20' : 'bg-black/20 border-white/5 opacity-50'}`}>
                        <input 
                          type="checkbox" 
                          checked={day.enabled} 
                          onChange={(e) => updateAvailability(idx, 'enabled', e.target.checked)}
                          className="w-4 h-4 accent-amber-500"
                        />
                        <span className="w-24 font-bold text-sm">{day.day}</span>
                        {day.enabled && (
                           <div className="flex items-center gap-2 text-sm">
                              <input 
                                type="time" 
                                value={day.windows[0].start} 
                                onChange={(e) => updateAvailability(idx, 'start', e.target.value)}
                                className="bg-black border border-white/10 rounded px-2 py-1 outline-none"
                              />
                              <span className="text-zinc-500">-</span>
                              <input 
                                type="time" 
                                value={day.windows[0].end} 
                                onChange={(e) => updateAvailability(idx, 'end', e.target.value)}
                                className="bg-black border border-white/10 rounded px-2 py-1 outline-none"
                              />
                           </div>
                        )}
                    </div>
                 ))}
              </div>
           </div>
        </div>

        <div className="space-y-6">
           <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold uppercase text-zinc-500 mb-4 flex items-center gap-2"><Video size={16}/> Session Settings</h3>
              
              <div className="space-y-2">
                 <label className="text-xs font-bold text-zinc-400">Meeting Platform</label>
                 <select 
                    value={data.premiumConfig.scheduling.platform}
                    onChange={(e) => updateConfig('platform', e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none"
                 >
                    <option value="google_meet">Google Meet</option>
                    <option value="zoom">Zoom</option>
                    <option value="jitsi">Jitsi (Integrated)</option>
                    <option value="custom">Custom Link</option>
                 </select>
              </div>

              {data.premiumConfig.scheduling.platform === 'custom' && (
                 <Input 
                    label="Custom Meeting Link" 
                    value={data.premiumConfig.scheduling.customLink || ''} 
                    onChange={(v: string) => updateConfig('customLink', v)}
                    placeholder="https://..."
                 />
              )}

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-400">Duration (min)</label>
                    <input 
                       type="number" 
                       value={data.premiumConfig.scheduling.sessionDuration}
                       onChange={(e) => updateConfig('sessionDuration', parseInt(e.target.value))}
                       className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none"
                    />
                 </div>
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-400">Buffer (min)</label>
                    <input 
                       type="number" 
                       value={data.premiumConfig.scheduling.bufferTime}
                       onChange={(e) => updateConfig('bufferTime', parseInt(e.target.value))}
                       className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none"
                    />
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}

export const VerificationStep = ({ onComplete }: { onComplete: () => void }) => {
  const [status, setStatus] = useState({ identity: false, profile: false, payout: false })
  
  const verify = (key: keyof typeof status) => {
    setStatus(prev => {
        const next = { ...prev, [key]: true }
        if (Object.values(next).every(Boolean)) {
            setTimeout(onComplete, 1000)
        }
        return next
    })
  }

  return (
    <div className="max-w-2xl mx-auto py-8 animate-in fade-in">
        <h1 className="text-3xl font-bold mb-2 text-center">Instructor Verification</h1>
        <p className="text-zinc-400 text-center mb-8">Complete these steps to unlock publishing.</p>
        
        <div className="space-y-4">
            <VerifyCard 
                icon={ScanFace} 
                title="Identity Verification" 
                desc="Upload a government ID to confirm your identity." 
                done={status.identity} 
                onClick={() => verify('identity')} 
            />
            <VerifyCard 
                icon={User} 
                title="Profile Completion" 
                desc="Ensure your bio, photo, and expertise are set." 
                done={status.profile} 
                onClick={() => verify('profile')} 
            />
            <VerifyCard 
                icon={Briefcase} 
                title="Payout Method" 
                desc="Connect a Stripe or Bank account for earnings." 
                done={status.payout} 
                onClick={() => verify('payout')} 
            />
        </div>
    </div>
  )
}

const VerifyCard = ({ icon: Icon, title, desc, done, onClick }: any) => (
    <div className="bg-zinc-900 border border-white/10 p-6 rounded-xl flex items-center gap-6">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${done ? 'bg-emerald-500/20 text-emerald-500' : 'bg-white/5 text-zinc-500'}`}>
            {done ? <CheckCircle2 size={24}/> : <Icon size={24}/>}
        </div>
        <div className="flex-1">
            <h4 className="font-bold text-white">{title}</h4>
            <p className="text-xs text-zinc-400">{desc}</p>
        </div>
        <button 
            onClick={onClick}
            disabled={done}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${done ? 'bg-emerald-500/10 text-emerald-500' : 'bg-white text-black hover:bg-zinc-200'}`}
        >
            {done ? 'Verified' : 'Verify Now'}
        </button>
    </div>
)

export const ReviewRow = ({ label, value, active }: any) => (
    <div className="flex justify-between py-1">
        <span className="text-zinc-500">{label}</span>
        <span className={`font-medium ${active ? 'text-emerald-500' : 'text-white'}`}>{value}</span>
    </div>
)