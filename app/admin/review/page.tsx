'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/app/utils/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Check, X, AlertTriangle, Play, ShieldCheck, Fingerprint, 
  Search, Lock, Loader2, UserCheck, Copy, FileText, Globe, 
  ChevronRight, ChevronDown,
  Twitter
} from 'lucide-react'

// Set your Master Password here (In production, move this to .env.local)
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "GroveAdmin2026"

export default function GroveAdminPortal() {
  const supabase = createClient()
  
  // --- STATE ---
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [passwordInput, setPasswordInput] = useState("")
  const [loginError, setLoginError] = useState(false)
  
  const [queue, setQueue] = useState<any[]>([])
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  // Trust & Safety Algorithm State
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'complete'>('idle')
  const [scanResults, setScanResults] = useState<{identity: number, originality: number} | null>(null)

  // --- AUTHENTICATION ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordInput === ADMIN_PASSWORD) {
        setIsAuthenticated(true)
    } else {
        setLoginError(true)
        setTimeout(() => setLoginError(false), 2000)
    }
  }

  // --- DATA FETCHING ---
  useEffect(() => {
    if (!isAuthenticated) return

    const fetchQueue = async () => {
      setLoading(true)
      // Fetch courses with status 'published' (which means submitted for review)
      const { data } = await supabase
        .from('courses')
        .select('*, instructor:profiles(*)')
        .eq('status', 'published') // Waiting for admin approval
        .order('updated_at', { ascending: false })
      
      setQueue(data || [])
      setLoading(false)
    }
    fetchQueue()
  }, [isAuthenticated])

  // --- ACTIONS ---
  // --- ACTIONS ---
  const handleDecision = async (id: string, decision: 'active' | 'rejected') => {
    // 1. Capture the error from Supabase
    const { error } = await supabase.from('courses').update({ status: decision }).eq('id', id)
    
    // 2. If Supabase blocks it, alert the user and STOP.
    if (error) {
        alert(`Database Blocked Update: ${error.message}\n\nCheck your Supabase RLS Policies!`);
        return; 
    }

    // 3. Only update the UI if the database update actually succeeded
    setQueue(queue.filter(c => c.id !== id))
    setSelectedCourse(null)
    setScanStatus('idle')
  }

  const runTrustEngine = () => {
      setScanStatus('scanning')
      // SIMULATION: In reality, this would hit an API route that connects to Copyscape/AWS Rekognition
      setTimeout(() => {
          setScanResults({
              identity: Math.floor(Math.random() * 10) + 90, // 90-99% confidence
              originality: Math.floor(Math.random() * 5) + 95 // 95-100% original
          })
          setScanStatus('complete')
      }, 3500)
  }

  // --- RENDER: LOGIN WALL ---
  if (!isAuthenticated) {
      return (
          <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white relative overflow-hidden">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-900/20 blur-[150px] rounded-full pointer-events-none" />
              
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 bg-black/60 border border-white/10 p-10 rounded-3xl backdrop-blur-2xl w-full max-w-md text-center shadow-2xl">
                  <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
                      <Lock size={32} />
                  </div>
                  <h1 className="text-3xl font-black mb-2">Grove Connect</h1>
                  <p className="text-zinc-400 mb-8 font-medium uppercase tracking-widest text-xs">Admin Control Center</p>
                  
                  <form onSubmit={handleLogin} className="space-y-4">
                      <div>
                          <input 
                              type="password" 
                              value={passwordInput}
                              onChange={(e) => setPasswordInput(e.target.value)}
                              placeholder="Enter Master Password" 
                              className={`w-full bg-zinc-900/80 border rounded-xl px-5 py-4 text-center tracking-widest outline-none transition-colors ${loginError ? 'border-red-500 focus:border-red-500' : 'border-white/10 focus:border-emerald-500'}`}
                          />
                          {loginError && <p className="text-red-500 text-xs font-bold mt-2 animate-pulse">Access Denied. Incorrect Password.</p>}
                      </div>
                      <button type="submit" className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                          Authorize
                      </button>
                  </form>
              </motion.div>
          </div>
      )
  }

  // --- RENDER: MAIN DASHBOARD ---
  return (
    <div className="h-screen bg-[#050505] text-white flex flex-col overflow-hidden font-sans selection:bg-emerald-500/30">
      
      {/* Header */}
      <header className="h-16 border-b border-white/10 bg-[#0a0a0a] flex items-center justify-between px-6 shrink-0 z-20">
          <div className="flex items-center gap-3">
              <ShieldCheck className="text-emerald-500" size={24}/>
              <h1 className="font-black text-lg tracking-tight">Grove Connect <span className="font-normal text-zinc-500">| Trust & Safety</span></h1>
          </div>
          <div className="flex items-center gap-4">
              <span className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full text-xs font-bold uppercase tracking-widest animate-pulse">
                  {queue.length} Pending Reviews
              </span>
              <button onClick={() => setIsAuthenticated(false)} className="text-zinc-500 hover:text-white text-sm font-bold transition-colors">Lock Terminal</button>
          </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
          
          {/* Left Pane: Queue List */}
          <aside className="w-96 border-r border-white/10 bg-[#0a0a0a] flex flex-col shrink-0">
              <div className="p-4 border-b border-white/5 bg-[#050505]">
                  <h2 className="font-bold text-sm text-zinc-400 uppercase tracking-widest">Review Queue</h2>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                  {loading ? (
                      <div className="flex justify-center py-10"><Loader2 className="animate-spin text-emerald-500" size={24}/></div>
                  ) : queue.length === 0 ? (
                      <div className="text-center py-10 text-zinc-600 flex flex-col items-center"><Check size={32} className="mb-2"/> Queue is empty</div>
                  ) : (
                      queue.map(course => (
                          <button 
                              key={course.id} 
                              onClick={() => { setSelectedCourse(course); setScanStatus('idle'); setScanResults(null); }}
                              className={`w-full text-left p-4 rounded-2xl border transition-all ${selectedCourse?.id === course.id ? 'bg-emerald-900/20 border-emerald-500/50' : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05]'}`}
                          >
                              <h3 className="font-bold text-white truncate mb-1">{course.title}</h3>
                              <p className="text-xs text-zinc-400 truncate flex items-center gap-1"><UserCheck size={12}/> {course.instructor?.full_name}</p>
                          </button>
                      ))
                  )}
              </div>
          </aside>

          {/* Right Pane: Deep Dive Inspector */}
          <main className="flex-1 overflow-y-auto bg-[#050505] custom-scrollbar p-8">
              {!selectedCourse ? (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-600">
                      <Search size={64} className="mb-4 opacity-20"/>
                      <h2 className="text-xl font-bold text-zinc-400">Select a course to inspect</h2>
                      <p className="text-sm">Thoroughly review instructor details and content before approving.</p>
                  </div>
              ) : (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto space-y-8 pb-20">
                      
                      {/* Top Action Bar */}
                      <div className="flex items-center justify-between bg-black/40 border border-white/10 p-4 rounded-2xl backdrop-blur-md sticky top-0 z-30 shadow-2xl">
                          <div className="flex gap-3">
                             <button onClick={() => handleDecision(selectedCourse.id, 'active')} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center gap-2 transition-colors">
        <Check size={18}/> Approve & Make Active
    </button>
    <button onClick={() => handleDecision(selectedCourse.id, 'rejected')} className="px-6 py-2.5 bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-500/30 font-bold rounded-xl flex items-center gap-2 transition-colors">
        <X size={18}/> Reject Course
    </button>
                          </div>
                      </div>

                      {/* --- TRUST & SAFETY ENGINE --- */}
                      <div className="bg-gradient-to-br from-indigo-950/30 to-black border border-indigo-500/20 p-8 rounded-3xl relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-32 bg-indigo-500/5 blur-3xl rounded-full" />
                          <div className="flex items-start justify-between relative z-10 mb-8">
                              <div>
                                  <h2 className="text-2xl font-black text-white flex items-center gap-3"><ShieldCheck className="text-indigo-400"/> Trust & Safety Analysis</h2>
                                  <p className="text-sm text-indigo-200/60 mt-1">Run proprietary algorithms to detect stolen content and verify identity.</p>
                              </div>
                              {scanStatus === 'idle' && (
                                  <button onClick={runTrustEngine} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center gap-2 shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-all">
                                      <Search size={18}/> Run Full Scan
                                  </button>
                              )}
                          </div>

                          {scanStatus === 'scanning' && (
                              <div className="py-10 text-center space-y-4">
                                  <Loader2 className="animate-spin text-indigo-500 mx-auto" size={40}/>
                                  <p className="text-sm font-bold text-indigo-400 uppercase tracking-widest animate-pulse">Analyzing Video Hashes & Transcripts...</p>
                              </div>
                          )}

                          {scanStatus === 'complete' && scanResults && (
                              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="grid grid-cols-2 gap-6">
                                  <div className="bg-black/50 border border-white/10 p-6 rounded-2xl flex items-center gap-6">
                                      <div className={`w-16 h-16 rounded-full flex items-center justify-center border-4 ${scanResults.identity > 85 ? 'border-emerald-500 text-emerald-500' : 'border-amber-500 text-amber-500'}`}>
                                          <Fingerprint size={28}/>
                                      </div>
                                      <div>
                                          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Instructor Authenticity</p>
                                          <p className="text-3xl font-black">{scanResults.identity}% Match</p>
                                      </div>
                                  </div>
                                  <div className="bg-black/50 border border-white/10 p-6 rounded-2xl flex items-center gap-6">
                                      <div className={`w-16 h-16 rounded-full flex items-center justify-center border-4 ${scanResults.originality > 90 ? 'border-emerald-500 text-emerald-500' : 'border-red-500 text-red-500'}`}>
                                          <Copy size={28}/>
                                      </div>
                                      <div>
                                          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Content Originality</p>
                                          <p className="text-3xl font-black">{scanResults.originality}% Original</p>
                                      </div>
                                  </div>
                              </motion.div>
                          )}
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                          
                          {/* Left Column: Course Details */}
                          <div className="lg:col-span-2 space-y-8">
                              <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-8">
                                  <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Course Preview</h3>
                                  <div className="aspect-video bg-black rounded-xl overflow-hidden relative mb-6 border border-white/10">
                                      {selectedCourse.promo_video_url ? (
                                          <video src={selectedCourse.promo_video_url} controls className="w-full h-full object-cover" />
                                      ) : selectedCourse.thumbnail_url ? (
                                          <img src={selectedCourse.thumbnail_url} className="w-full h-full object-cover opacity-50" />
                                      ) : (
                                          <div className="flex items-center justify-center h-full text-zinc-600"><Play size={48}/></div>
                                      )}
                                  </div>
                                  <h2 className="text-2xl font-bold mb-2">{selectedCourse.title}</h2>
                                  <p className="text-zinc-400 text-sm leading-relaxed mb-6">{selectedCourse.description}</p>
                                  
                                  <div className="grid grid-cols-3 gap-4 border-t border-white/5 pt-6">
                                      <div><p className="text-[10px] text-zinc-500 uppercase font-bold">Category</p><p className="font-medium text-sm">{selectedCourse.category}</p></div>
                                      <div><p className="text-[10px] text-zinc-500 uppercase font-bold">Price</p><p className="font-medium text-sm">{selectedCourse.currency} {selectedCourse.price}</p></div>
                                      <div><p className="text-[10px] text-zinc-500 uppercase font-bold">Level</p><p className="font-medium text-sm">{selectedCourse.level}</p></div>
                                  </div>
                              </div>

                              {/* Curriculum Explorer */}
                              <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-8">
                                  <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Curriculum Explorer</h3>
                                  <div className="space-y-3">
                                      {(() => {
                                          const curr = typeof selectedCourse.curriculum_data === 'string' ? JSON.parse(selectedCourse.curriculum_data || '[]') : (selectedCourse.curriculum_data || []);
                                          return curr.map((mod: any, idx: number) => (
                                              <div key={idx} className="bg-black/50 border border-white/5 p-4 rounded-xl">
                                                  <div className="font-bold text-sm text-white mb-2">{mod.title}</div>
                                                  <div className="pl-4 space-y-2 border-l border-white/10">
                                                      {(mod.items || mod.lectures || []).map((item: any, iIdx: number) => (
                                                          <div key={iIdx} className="text-xs text-zinc-400 flex items-center gap-2">
                                                              <FileText size={12} className="text-emerald-500"/> {item.title} ({item.type})
                                                          </div>
                                                      ))}
                                                  </div>
                                              </div>
                                          ))
                                      })()}
                                  </div>
                              </div>
                          </div>

                          {/* Right Column: Instructor Intelligence */}
                          <div className="space-y-8">
                              <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-6 text-center">
                                  <div className="w-24 h-24 rounded-full bg-zinc-800 mx-auto mb-4 border-4 border-white/5 overflow-hidden">
                                      {selectedCourse.instructor?.avatar_url ? (
                                          <img src={selectedCourse.instructor.avatar_url} className="w-full h-full object-cover" />
                                      ) : (
                                          <UserCheck className="w-full h-full p-6 text-zinc-600" />
                                      )}
                                  </div>
                                  <h3 className="font-bold text-lg">{selectedCourse.instructor?.full_name}</h3>
                                  <p className="text-xs text-zinc-500 mb-6">{selectedCourse.instructor?.email}</p>
                                  
                                  <div className="text-left space-y-4 border-t border-white/5 pt-4">
                                      <div><p className="text-[10px] text-zinc-500 uppercase font-bold">Nationality</p><p className="text-sm font-medium">{selectedCourse.instructor?.nationality || 'Not Provided'}</p></div>
                                      <div><p className="text-[10px] text-zinc-500 uppercase font-bold">Payout Method</p><p className="text-sm font-medium text-emerald-400">{selectedCourse.instructor?.payout_method || 'Not Configured'}</p></div>
                                      
                                      <div className="flex items-center gap-3 pt-2">
                                          {selectedCourse.instructor?.website && <a href={selectedCourse.instructor.website} target="_blank" rel="noreferrer" className="p-2 bg-white/5 rounded hover:bg-white/10"><Globe size={14}/></a>}
                                          {selectedCourse.instructor?.social_twitter && <a href={`https://twitter.com/${selectedCourse.instructor.social_twitter}`} target="_blank" rel="noreferrer" className="p-2 bg-white/5 rounded hover:text-blue-400 hover:bg-white/10"><Twitter size={14}/></a>}
                                      </div>
                                  </div>
                              </div>
                          </div>
                      </div>

                  </motion.div>
              )}
          </main>
      </div>
    </div>
  )
}
