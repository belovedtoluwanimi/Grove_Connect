'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/app/utils/supabase/client'
import { 
  PlayCircle, CheckCircle2, Circle, FileText, Presentation, ListChecks, 
  ChevronLeft, ChevronDown, ChevronUp, Bot, Send, Search, Download, Link as LinkIcon, 
  FileCode, Sparkles, Loader2, Maximize, MessageSquare,
  X,
  ArrowRight
} from 'lucide-react'

// --- TYPES (Matching our Course Creator) ---
interface QuizQuestion { id: string; question: string; options: string[]; correctIndex: number; }
interface ResourceItem { id: string; type: 'file' | 'link' | 'code'; title: string; url: string; }
interface ContentItem {
  id: string; title: string; type: 'video' | 'video_slide' | 'article' | 'quiz' | 'practice_test';
  videoUrl?: string; slideUrl?: string; content?: string; quizData?: QuizQuestion[];
  resources: ResourceItem[]; isOpen?: boolean;
}
interface Module { id: string; title: string; items: ContentItem[]; isOpen?: boolean; }
interface Course { id: string; title: string; curriculum_data: Module[]; instructor_id: string; }

export default function ClassroomPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  
  // State
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Navigation State
  const [activeModIdx, setActiveModIdx] = useState(0)
  const [activeItemIdx, setActiveItemIdx] = useState(0)
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set())
  const [sidebarOpen, setSidebarOpen] = useState(true)
  
  // Tools State
  const [activeTab, setActiveTab] = useState<'overview' | 'resources' | 'ai'>('overview')
  const [aiMessages, setAiMessages] = useState<{role: 'user'|'ai', text: string}[]>([
    { role: 'ai', text: "Hi! I'm your Grove AI Tutor. Need help understanding this lecture? Ask me anything!" }
  ])
  const [aiInput, setAiInput] = useState('')
  const [isAiTyping, setIsAiTyping] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Fetch Course
  useEffect(() => {
    const fetchCourse = async () => {
      if (!params.courseId) return
      const { data, error } = await supabase.from('courses').select('*').eq('id', params.courseId).single()
      if (data) {
        // Ensure all modules are open by default in the sidebar
        const parsedCurriculum = (data.curriculum_data || []).map((m: Module) => ({...m, isOpen: true}))
        setCourse({ ...data, curriculum_data: parsedCurriculum })
      }
      setLoading(false)
    }
    fetchCourse()
  }, [params.courseId])

  // Scroll AI Chat to bottom
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }) }, [aiMessages])

  if (loading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center"><Loader2 className="animate-spin text-emerald-500" size={48} /></div>
  if (!course) return <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center">Course not found.</div>

  const activeModule = course.curriculum_data[activeModIdx]
  const activeItem = activeModule?.items[activeItemIdx]

  // Calculate Progress
  const totalItems = course.curriculum_data.reduce((acc, mod) => acc + mod.items.length, 0)
  const progressPercent = totalItems === 0 ? 0 : Math.round((completedItems.size / totalItems) * 100)

  const toggleComplete = (id: string) => {
    const newSet = new Set(completedItems)
    if (newSet.has(id)) newSet.delete(id)
    else newSet.add(id)
    setCompletedItems(newSet)
  }

  const handleNext = () => {
    if(!activeItem) return
    toggleComplete(activeItem.id) // Auto-complete on next
    if (activeItemIdx < activeModule.items.length - 1) {
      setActiveItemIdx(prev => prev + 1)
    } else if (activeModIdx < course.curriculum_data.length - 1) {
      setActiveModIdx(prev => prev + 1)
      setActiveItemIdx(0)
    }
  }

  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if(!aiInput.trim()) return
    
    const userText = aiInput
    setAiMessages(prev => [...prev, {role: 'user', text: userText}])
    setAiInput('')
    setIsAiTyping(true)
    setActiveTab('ai') // Force open AI tab

    // MOCK AI CALL - Replace this with your actual /api/chat route fetching OpenAI
    setTimeout(() => {
      setAiMessages(prev => [...prev, {
        role: 'ai', 
        text: `That's a great question about "${activeItem?.title}". Based on this specific lecture, here is a detailed breakdown to help you understand better...` 
      }])
      setIsAiTyping(false)
    }, 1500)
  }

  return (
    <div className="h-screen flex flex-col bg-[#050505] text-white font-sans overflow-hidden selection:bg-emerald-500/30 relative">
      
      {/* --- CINEMATIC BACKGROUND --- */}
      <div className="absolute inset-0 z-0 pointer-events-none">
         <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-900/20 blur-[150px] rounded-full mix-blend-screen" />
         <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-900/20 blur-[150px] rounded-full mix-blend-screen" />
         <div className="absolute inset-0 bg-black/60 backdrop-blur-3xl" />
      </div>

      {/* --- TOP NAVBAR --- */}
      <header className="h-16 border-b border-white/5 bg-white/[0.02] backdrop-blur-xl flex items-center justify-between px-6 z-20 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/dashboard')} className="p-2 hover:bg-white/10 rounded-full transition-colors text-zinc-400 hover:text-white"><ChevronLeft size={20}/></button>
          <div className="h-6 w-px bg-white/10" />
          <h1 className="font-bold truncate max-w-md">{course.title}</h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
             <div className="w-32 h-2 bg-zinc-900 rounded-full overflow-hidden border border-white/5">
                <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${progressPercent}%` }} />
             </div>
             <span className="text-xs font-bold text-emerald-500">{progressPercent}%</span>
          </div>
          <button onClick={() => setActiveTab('ai')} className="px-4 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-xs font-bold flex items-center gap-2 hover:bg-blue-500/20 transition-all">
            <Sparkles size={14}/> Ask AI Tutor
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden z-10 relative">
        
        {/* --- MAIN CONTENT AREA --- */}
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto custom-scrollbar">
          
          {/* Content Renderer Layer */}
          <div className="w-full bg-black/40 aspect-video max-h-[70vh] border-b border-white/5 relative flex items-center justify-center overflow-hidden">
             {!activeItem ? (
                 <div className="text-zinc-500">Select a lesson to begin.</div>
             ) : (
                 <ContentRenderer item={activeItem} onComplete={handleNext} />
             )}
          </div>

          {/* Bottom Tabs & Details Layer */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 lg:p-10 max-w-7xl mx-auto w-full">
             
             {/* Left Column: Context Tabs */}
             <div className="lg:col-span-2 space-y-6">
                <div className="flex gap-6 border-b border-white/5 text-sm font-bold uppercase tracking-wider">
                   <button onClick={() => setActiveTab('overview')} className={`pb-3 transition-colors ${activeTab === 'overview' ? 'border-b-2 border-emerald-500 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>Overview</button>
                   <button onClick={() => setActiveTab('resources')} className={`pb-3 transition-colors flex items-center gap-2 ${activeTab === 'resources' ? 'border-b-2 border-emerald-500 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>Resources <span className="bg-white/10 px-1.5 rounded-full text-[10px]">{activeItem?.resources?.length || 0}</span></button>
                </div>
                
                <div className="animate-in fade-in slide-in-from-bottom-4">
                  {activeTab === 'overview' && (
                     <div className="space-y-4">
                        <h2 className="text-2xl font-bold">{activeItem?.title}</h2>
                        <p className="text-zinc-400 leading-relaxed max-w-3xl">In this module, we will explore the core concepts of the selected topic. Pay close attention to the practical examples demonstrated in the material. If you get stuck, remember you can ask your AI Tutor on the right!</p>
                     </div>
                  )}
                  {activeTab === 'resources' && (
                     <div className="space-y-3">
                        {(!activeItem?.resources || activeItem.resources.length === 0) && <p className="text-zinc-500 italic">No downloadable resources attached to this lesson.</p>}
                        {activeItem?.resources?.map(res => (
                           <a key={res.id} href={res.url} target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors group">
                              <div className="flex items-center gap-4">
                                 <div className="p-3 bg-black/50 rounded-xl text-zinc-400 group-hover:text-emerald-400 transition-colors">
                                    {res.type === 'file' ? <FileText size={20}/> : res.type === 'code' ? <FileCode size={20}/> : <LinkIcon size={20}/>}
                                 </div>
                                 <div><h4 className="font-bold text-sm">{res.title || 'Untitled Resource'}</h4><p className="text-xs text-zinc-500 uppercase">{res.type}</p></div>
                              </div>
                              <Download size={18} className="text-zinc-600 group-hover:text-white transition-colors"/>
                           </a>
                        ))}
                     </div>
                  )}
                </div>
             </div>

             {/* Right Column: AI Tutor Panel */}
             <div className="lg:col-span-1 h-[500px] flex flex-col bg-white/[0.02] border border-white/10 rounded-3xl backdrop-blur-2xl overflow-hidden shadow-2xl">
                <div className="p-4 bg-gradient-to-r from-blue-900/40 to-purple-900/40 border-b border-white/10 flex items-center gap-3">
                   <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg"><Bot size={20}/></div>
                   <div><h3 className="font-bold text-sm">Grove AI Tutor</h3><p className="text-[10px] text-blue-300/70 uppercase tracking-widest">Context-Aware Assistant</p></div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                   {aiMessages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                         <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-emerald-600 text-white rounded-br-sm' : 'bg-white/10 text-zinc-200 border border-white/5 rounded-bl-sm'}`}>
                            {msg.text}
                         </div>
                      </div>
                   ))}
                   {isAiTyping && (
                      <div className="flex justify-start"><div className="p-3 bg-white/10 border border-white/5 rounded-2xl rounded-bl-sm flex gap-1"><div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce"/><div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce delay-75"/><div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce delay-150"/></div></div>
                   )}
                   <div ref={chatEndRef} />
                </div>

                <div className="p-3 bg-black/40 border-t border-white/5">
                   <form onSubmit={handleAiSubmit} className="flex gap-2">
                      <input value={aiInput} onChange={e=>setAiInput(e.target.value)} placeholder="Ask about this lecture..." className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-500 transition-colors placeholder-zinc-600 text-white" />
                      <button type="submit" disabled={!aiInput.trim() || isAiTyping} className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-colors disabled:opacity-50"><Send size={18}/></button>
                   </form>
                </div>
             </div>

          </div>
        </main>

        {/* --- CURRICULUM SIDEBAR --- */}
        <AnimatePresence>
          {sidebarOpen && (
             <motion.aside initial={{ width: 0, opacity: 0 }} animate={{ width: 350, opacity: 1 }} exit={{ width: 0, opacity: 0 }} className="h-full border-l border-white/5 bg-black/40 backdrop-blur-xl flex flex-col shrink-0">
               <div className="p-6 border-b border-white/5 flex items-center justify-between">
                  <h3 className="font-black text-lg">Curriculum</h3>
                  <button onClick={() => setSidebarOpen(false)} className="text-zinc-500 hover:text-white p-1"><Maximize size={18}/></button>
               </div>
               
               <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                  {course.curriculum_data.map((mod, mIdx) => (
                    <div key={mod.id} className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
                       <button onClick={() => {
                          const newCourse = {...course}; 
                          newCourse.curriculum_data[mIdx].isOpen = !mod.isOpen; 
                          setCourse(newCourse)
                       }} className="w-full p-4 flex items-center justify-between bg-black/20 hover:bg-white/5 transition-colors">
                          <div className="flex flex-col items-start text-left">
                             <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1">Section {mIdx + 1}</span>
                             <span className="font-bold text-sm text-zinc-200">{mod.title}</span>
                          </div>
                          {mod.isOpen ? <ChevronUp size={16} className="text-zinc-500"/> : <ChevronDown size={16} className="text-zinc-500"/>}
                       </button>

                       <AnimatePresence>
                          {mod.isOpen && (
                             <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                                {mod.items.map((item, iIdx) => {
                                   const isSelected = activeModIdx === mIdx && activeItemIdx === iIdx
                                   const isCompleted = completedItems.has(item.id)
                                   const Icon = item.type === 'video' ? PlayCircle : item.type === 'article' ? FileText : item.type === 'video_slide' ? Presentation : ListChecks
                                   
                                   return (
                                     <div key={item.id} onClick={() => {setActiveModIdx(mIdx); setActiveItemIdx(iIdx)}} className={`w-full p-3 pl-4 flex items-start gap-3 cursor-pointer transition-colors border-l-2 ${isSelected ? 'bg-emerald-500/10 border-emerald-500' : 'border-transparent hover:bg-white/5'}`}>
                                        <button onClick={(e) => {e.stopPropagation(); toggleComplete(item.id)}} className="mt-0.5 shrink-0 text-zinc-500 hover:text-emerald-400 transition-colors">
                                           {isCompleted ? <CheckCircle2 size={16} className="text-emerald-500"/> : <Circle size={16}/>}
                                        </button>
                                        <div className="flex flex-col text-left">
                                           <span className={`text-sm ${isSelected ? 'font-bold text-emerald-100' : 'text-zinc-400'}`}>{item.title}</span>
                                           <span className="flex items-center gap-1 text-[10px] text-zinc-600 uppercase mt-1"><Icon size={10}/> {item.type.replace('_', ' ')}</span>
                                        </div>
                                     </div>
                                   )
                                })}
                             </motion.div>
                          )}
                       </AnimatePresence>
                    </div>
                  ))}
               </div>
             </motion.aside>
          )}
        </AnimatePresence>

        {/* Sidebar Toggle Button (when closed) */}
        {!sidebarOpen && (
          <button onClick={() => setSidebarOpen(true)} className="absolute top-4 right-4 z-30 p-3 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl text-zinc-400 hover:text-white hover:border-emerald-500 transition-all backdrop-blur-xl">
             <ListChecks size={20} />
          </button>
        )}

      </div>
    </div>
  )
}

// --- SUB-COMPONENT: Dynamic Content Renderer ---
function ContentRenderer({ item, onComplete }: { item: ContentItem, onComplete: () => void }) {
  
  if (item.type === 'video' || item.type === 'video_slide') {
    return (
      <div className="w-full h-full flex bg-black relative group">
         {/* Video Area */}
         <div className="flex-1 flex items-center justify-center bg-black relative">
            {item.videoUrl ? (
               <video src={item.videoUrl} controls autoPlay className="w-full h-full object-contain" onEnded={onComplete} />
            ) : (
               <div className="text-center text-zinc-600"><PlayCircle size={48} className="mx-auto mb-4 opacity-50"/><p>No video source attached.</p></div>
            )}
         </div>
         
         {/* Split Slide Area (if applicable) */}
         {item.type === 'video_slide' && (
            <div className="w-1/2 border-l border-white/10 bg-zinc-900 flex items-center justify-center p-4">
               {item.slideUrl ? (
                  <iframe src={`${item.slideUrl}#toolbar=0`} className="w-full h-full rounded-xl bg-white" title="Presentation Slide" />
               ) : (
                  <div className="text-center text-zinc-600"><Presentation size={48} className="mx-auto mb-4 opacity-50"/><p>No slide attached.</p></div>
               )}
            </div>
         )}
      </div>
    )
  }

  if (item.type === 'article') {
    return (
      <div className="w-full h-full bg-zinc-900/50 overflow-y-auto p-10 lg:p-16 custom-scrollbar">
         <div className="max-w-3xl mx-auto space-y-6">
            <h1 className="text-4xl font-black mb-8">{item.title}</h1>
            {/* Extremely simple Markdown/Text renderer */}
            <div className="text-zinc-300 leading-relaxed text-lg whitespace-pre-wrap font-serif">
               {item.content || <span className="italic text-zinc-600">No article content written yet.</span>}
            </div>
            <div className="pt-12 border-t border-white/10 mt-12 flex justify-end">
               <button onClick={onComplete} className="px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-500 transition-colors flex items-center gap-2">Mark as Complete <CheckCircle2 size={18}/></button>
            </div>
         </div>
      </div>
    )
  }

  if (item.type === 'quiz' || item.type === 'practice_test') {
    return <QuizRenderer quizData={item.quizData || []} onComplete={onComplete} />
  }

  return <div className="text-zinc-500">Unsupported content type.</div>
}

// --- SUB-COMPONENT: Interactive Quiz Engine ---
function QuizRenderer({ quizData, onComplete }: { quizData: QuizQuestion[], onComplete: () => void }) {
  const [currentQ, setCurrentQ] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [showAnswer, setShowAnswer] = useState(false)
  const [score, setScore] = useState(0)

  if (!quizData || quizData.length === 0) return <div className="text-zinc-500">No questions in this quiz.</div>

  const q = quizData[currentQ]
  const isFinished = currentQ >= quizData.length

  const handleCheck = () => {
    if (selected === null) return
    if (selected === q.correctIndex) setScore(s => s + 1)
    setShowAnswer(true)
  }

  const handleNext = () => {
    setSelected(null)
    setShowAnswer(false)
    setCurrentQ(c => c + 1)
  }

  if (isFinished) {
    const passed = score / quizData.length >= 0.7
    return (
       <div className="text-center animate-in zoom-in fade-in duration-500">
          <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6 border-4 ${passed ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-red-500/20 border-red-500 text-red-400'}`}>
             <ListChecks size={48}/>
          </div>
          <h2 className="text-3xl font-black mb-2">{passed ? 'Great Job!' : 'Keep Practicing'}</h2>
          <p className="text-zinc-400 text-lg mb-8">You scored {score} out of {quizData.length}</p>
          <button onClick={onComplete} className="px-8 py-4 bg-white text-black font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-transform">Continue Course</button>
       </div>
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-8">
       <div className="mb-8 flex items-center justify-between text-sm font-bold text-zinc-500 uppercase tracking-wider">
          <span>Question {currentQ + 1} of {quizData.length}</span>
          <span>Score: {score}</span>
       </div>
       
       <h2 className="text-2xl font-bold text-white mb-8 leading-snug">{q.question}</h2>
       
       <div className="space-y-3 mb-10">
          {q.options.map((opt, idx) => {
             const isCorrect = showAnswer && idx === q.correctIndex
             const isWrong = showAnswer && selected === idx && idx !== q.correctIndex
             let borderClass = 'border-white/10 hover:border-white/30 hover:bg-white/5'
             if (selected === idx && !showAnswer) borderClass = 'border-blue-500 bg-blue-500/10 text-blue-100'
             if (isCorrect) borderClass = 'border-emerald-500 bg-emerald-500/20 text-emerald-100'
             if (isWrong) borderClass = 'border-red-500 bg-red-500/20 text-red-100'

             return (
               <button 
                 key={idx} 
                 disabled={showAnswer}
                 onClick={() => setSelected(idx)} 
                 className={`w-full text-left p-5 rounded-2xl border transition-all flex items-center justify-between ${borderClass}`}
               >
                  <span className="font-medium">{opt}</span>
                  {isCorrect && <CheckCircle2 size={20} className="text-emerald-500"/>}
                  {isWrong && <X size={20} className="text-red-500"/>}
               </button>
             )
          })}
       </div>

       {!showAnswer ? (
          <button onClick={handleCheck} disabled={selected === null} className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Check Answer</button>
       ) : (
          <button onClick={handleNext} className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2">Next Question <ArrowRight size={18}/></button>
       )}
    </div>
  )
}