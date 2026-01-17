'use client'

import React, { useState } from 'react'
import { 
  Save, ChevronLeft, Plus, GripVertical, Trash2, 
  Video, FileText, HelpCircle, CheckCircle2, Upload, 
  AlertTriangle, ShieldCheck, Eye 
} from 'lucide-react'
import Link from 'next/link'

// --- TYPES & STEPS ---
type Step = 'learners' | 'curriculum' | 'landing' | 'settings' | 'legal'

const steps: { id: Step; label: string }[] = [
  { id: 'learners', label: 'Intended Learners' },
  { id: 'curriculum', label: 'Curriculum' },
  { id: 'landing', label: 'Course Landing Page' },
  { id: 'settings', label: 'Pricing & Settings' },
  { id: 'legal', label: 'Legal & Review' },
]

const CreateCoursePage = () => {
  const [activeStep, setActiveStep] = useState<Step>('learners')
  
  // --- MOCK STATE FOR DEMO ---
  const [objectives, setObjectives] = useState(['', '', '', ''])
  const [curriculum, setCurriculum] = useState([
    { id: 1, title: 'Introduction', lectures: [{ title: 'Welcome to the course', type: 'video' }] }
  ])

  // --- HELPER FUNCTIONS ---
  const handleObjectiveChange = (index: number, value: string) => {
    const newObjs = [...objectives]
    newObjs[index] = value
    setObjectives(newObjs)
  }

  const addSection = () => {
    setCurriculum([...curriculum, { id: Date.now(), title: 'New Section', lectures: [] }])
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans">
      
      {/* --- TOP BAR: ACTIONS --- */}
      <header className="h-16 border-b border-white/10 bg-black flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard" className="text-gray-400 hover:text-white flex items-center gap-2 transition-colors">
            <ChevronLeft size={20} />
            <span className="hidden md:inline font-medium">Back to Dashboard</span>
          </Link>
          <div className="h-6 w-[1px] bg-white/10 mx-2" />
          <h1 className="font-bold text-lg hidden md:block">Mastering Next.js 15 <span className="text-gray-500 font-normal ml-2">Draft</span></h1>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400 hidden md:inline">Saved 2 mins ago</span>
          <button className="px-4 py-2 text-sm font-medium text-white bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors">
            Preview
          </button>
          <button className="px-6 py-2 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-lg shadow-green-900/20 transition-all">
            Submit for Review
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        
        {/* --- LEFT SIDEBAR: NAVIGATION --- */}
        <aside className="w-64 bg-neutral-950 border-r border-white/10 hidden md:flex flex-col overflow-y-auto">
          <div className="p-6">
            <h2 className="text-xs uppercase text-gray-500 font-bold tracking-widest mb-4">Plan Your Course</h2>
            <nav className="space-y-1">
              {steps.map((step) => (
                <button
                  key={step.id}
                  onClick={() => setActiveStep(step.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium flex items-center justify-between transition-all ${
                    activeStep === step.id 
                      ? 'bg-green-600/10 text-green-400 border border-green-600/20' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  {step.label}
                  {activeStep === step.id && <div className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                </button>
              ))}
            </nav>
          </div>
          
          <div className="mt-auto p-6 border-t border-white/10">
            <div className="bg-blue-900/10 border border-blue-500/20 p-4 rounded-lg">
              <h4 className="text-blue-400 font-bold text-xs uppercase mb-2">Instructor Tip</h4>
              <p className="text-xs text-blue-200/70 leading-relaxed">
                Break your course into small, digestible chunks. Students prefer videos under 10 minutes.
              </p>
            </div>
          </div>
        </aside>

        {/* --- MAIN CONTENT AREA --- */}
        <main className="flex-1 overflow-y-auto bg-black p-6 md:p-12">
          <div className="max-w-4xl mx-auto">
            
            {/* 1. INTENDED LEARNERS */}
            {activeStep === 'learners' && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">Intended Learners</h2>
                  <p className="text-gray-400">The following descriptions will be publicly visible on your Course Landing Page and will have a direct impact on your course performance.</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-white font-medium mb-3">What will students learn in your course?</label>
                    <div className="space-y-3">
                      {objectives.map((obj, idx) => (
                        <div key={idx} className="flex gap-2 group">
                          <input 
                            type="text" 
                            value={obj}
                            onChange={(e) => handleObjectiveChange(idx, e.target.value)}
                            placeholder="Example: Define the roles and responsibilities of a project manager" 
                            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:border-green-500 outline-none transition-colors"
                          />
                          <button className="p-3 text-gray-500 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))}
                      <button 
                        onClick={() => setObjectives([...objectives, ''])}
                        className="text-green-400 font-medium text-sm flex items-center gap-2 hover:text-green-300 mt-2"
                      >
                        <Plus size={16} /> Add more to your response
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-3">Who is this course for?</label>
                    <input type="text" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:border-green-500 outline-none transition-colors" placeholder="Example: Beginner Python developers curious about Data Science" />
                  </div>
                </div>
              </div>
            )}

            {/* 2. CURRICULUM (COMPLEX UI) */}
            {activeStep === 'curriculum' && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="flex justify-between items-end border-b border-white/10 pb-6">
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2">Curriculum</h2>
                    <p className="text-gray-400">Start putting together your course by creating sections, lectures and quizzes.</p>
                  </div>
                </div>

                {/* Section List */}
                <div className="space-y-6">
                  {curriculum.map((section, sIdx) => (
                    <div key={section.id} className="bg-neutral-900/40 border border-white/10 rounded-xl overflow-hidden group">
                      
                      {/* Section Header */}
                      <div className="p-4 bg-white/5 flex items-center gap-3 border-b border-white/10">
                        <span className="font-bold text-gray-500 text-sm">Section {sIdx + 1}:</span>
                        <div className="flex-1 flex items-center gap-2">
                           <FileText size={16} className="text-white" />
                           <span className="text-white font-medium">{section.title}</span>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button className="p-2 hover:bg-white/10 rounded text-gray-400"><Trash2 size={16}/></button>
                           <button className="p-2 hover:bg-white/10 rounded text-gray-400"><GripVertical size={16}/></button>
                        </div>
                      </div>

                      {/* Lectures */}
                      <div className="p-4 space-y-3">
                        {section.lectures.length === 0 && (
                          <div className="text-center py-4 text-gray-500 text-sm italic">
                            No content in this section yet.
                          </div>
                        )}
                        {section.lectures.map((lecture, lIdx) => (
                           <div key={lIdx} className="flex items-center gap-3 p-3 bg-black border border-white/10 rounded-lg ml-6">
                              <CheckCircle2 size={16} className="text-gray-600" />
                              <span className="text-sm text-gray-300">Lecture {sIdx+1}.{lIdx+1}:</span>
                              <span className="text-white text-sm flex-1">{lecture.title}</span>
                              <span className="text-xs uppercase bg-white/10 px-2 py-0.5 rounded text-gray-400">{lecture.type}</span>
                           </div>
                        ))}
                        
                        <div className="ml-6 mt-4">
                           <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 border-dashed rounded-lg text-sm text-gray-400 hover:text-white hover:border-green-500 hover:text-green-500 transition-all w-full justify-center">
                              <Plus size={16} /> Add Curriculum Item
                           </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={addSection}
                  className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg font-medium text-white transition-all"
                >
                  <Plus size={18} /> New Section
                </button>
              </div>
            )}

            {/* 3. LANDING PAGE */}
            {activeStep === 'landing' && (
               <div className="space-y-8 animate-in fade-in duration-500">
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2">Course Landing Page</h2>
                    <p className="text-gray-400">This is your course's storefront. Make it compelling.</p>
                  </div>

                  <div className="space-y-6">
                     <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-300">Course Title</label>
                        <input type="text" className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-green-500 outline-none" placeholder="Insert your course title." />
                     </div>

                     <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-300">Course Subtitle</label>
                        <input type="text" className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-green-500 outline-none" placeholder="Insert your course subtitle." />
                     </div>

                     <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-300">Description</label>
                        <textarea className="w-full h-40 bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-green-500 outline-none" placeholder="Insert your course description." />
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                        <div className="space-y-2">
                           <label className="text-sm font-bold text-gray-300">Course Image</label>
                           <div className="aspect-video bg-neutral-900 border-2 border-dashed border-white/20 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:border-green-500 hover:text-green-500 cursor-pointer transition-colors">
                              <Upload size={32} className="mb-2" />
                              <span className="text-xs">Upload Image (750x422)</span>
                           </div>
                        </div>
                        <div className="space-y-2">
                           <label className="text-sm font-bold text-gray-300">Promotional Video</label>
                           <div className="aspect-video bg-neutral-900 border-2 border-dashed border-white/20 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:border-green-500 hover:text-green-500 cursor-pointer transition-colors">
                              <Video size={32} className="mb-2" />
                              <span className="text-xs">Upload Video</span>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            )}

            {/* 4. LEGAL & REVIEW (CRITICAL) */}
            {activeStep === 'legal' && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="bg-red-900/10 border border-red-500/20 p-6 rounded-xl">
                  <div className="flex items-start gap-4">
                     <ShieldCheck className="w-8 h-8 text-red-500 shrink-0" />
                     <div>
                        <h2 className="text-xl font-bold text-white mb-2">Legal Compliance Review</h2>
                        <p className="text-gray-400 text-sm leading-relaxed">
                           Grove Connect takes intellectual property very seriously. Before submitting, you must verify that your course complies with our Trust & Safety policies.
                        </p>
                     </div>
                  </div>
                </div>

                <div className="space-y-4">
                   {[
                      "I certify that I own the rights to all content (video, audio, images, code) in this course.",
                      "I agree that Grove Connect has the right to distribute this content according to the Instructor Terms.",
                      "I confirm this course does not contain illegal content, hate speech, or explicit material.",
                      "I understand that any copyright violation will result in immediate account termination."
                   ].map((text, i) => (
                      <label key={i} className="flex items-start gap-3 p-4 bg-white/5 border border-white/10 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                         <input type="checkbox" className="mt-1 w-5 h-5 accent-green-600" />
                         <span className="text-gray-300 text-sm">{text}</span>
                      </label>
                   ))}
                </div>

                <div className="pt-8 border-t border-white/10 flex justify-end">
                   <button className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-full shadow-lg shadow-green-900/40 hover:scale-105 transition-all flex items-center gap-2">
                      <Save size={20} />
                      Complete & Submit Course
                   </button>
                </div>
              </div>
            )}

            {/* 5. PRICING (Simplified placeholder) */}
            {activeStep === 'settings' && (
               <div className="text-center py-20">
                  <h2 className="text-2xl font-bold text-white">Pricing & Coupons</h2>
                  <p className="text-gray-400 mt-2">Set your price tier and create promotional coupons.</p>
                  <div className="mt-8 p-6 bg-white/5 rounded-xl border border-white/10 inline-block">
                     <p className="text-sm text-gray-500">Pricing Tier Selector would go here.</p>
                  </div>
               </div>
            )}

          </div>
        </main>
      </div>
    </div>
  )
}

export default CreateCoursePage