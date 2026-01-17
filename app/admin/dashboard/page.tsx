'use client'

import React, { useState } from 'react'
import { 
  LayoutDashboard, BookOpen, Users, DollarSign, Settings, 
  Bell, Search, Plus, Upload, FileText, Check, AlertCircle, X,
  BarChart3, MoreVertical, ShieldCheck
} from 'lucide-react'
import Link from 'next/link'

// --- 1. MOCK DATA ---
const stats = [
  { label: "Total Revenue", value: "$124,592", change: "+14%", icon: DollarSign },
  { label: "Active Students", value: "8,400", change: "+5%", icon: Users },
  { label: "Course Rating", value: "4.8/5.0", change: "+0.2", icon: StarIcon }, // Helper below
  { label: "Completion Rate", value: "68%", change: "+2%", icon: BarChart3 },
]

const recentCourses = [
  { id: 1, title: "Advanced React Patterns", students: 1200, price: "$49.99", status: "Active", revenue: "$58,000" },
  { id: 2, title: "AI for Designers", students: 850, price: "$39.99", status: "Review", revenue: "$0" },
  { id: 3, title: "Cinematic Editing", students: 2100, price: "$89.99", status: "Active", revenue: "$180,000" },
  { id: 4, title: "Python Bootcamp", students: 500, price: "$29.99", status: "Draft", revenue: "$0" },
]

function StarIcon({ className }: { className?: string }) {
  return <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" /></svg>
}

// --- 2. LEGAL COMPLIANCE MODAL ---
const CreateCourseModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [step, setStep] = useState(1) // 1: Details, 2: Upload, 3: Legal
  const [agreed, setAgreed] = useState({ copyright: false, gdpr: false, terms: false })

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#0a0a0a] w-full max-w-3xl rounded-2xl border border-white/10 shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/10">
          <div>
            <h2 className="text-xl font-bold text-white">Create New Course</h2>
            <p className="text-sm text-gray-400">Step {step} of 3</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X /></button>
        </div>

        {/* Modal Content */}
        <div className="p-8 overflow-y-auto flex-grow">
          
          {/* STEP 1: DETAILS */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider text-gray-400">Course Title</label>
                <input type="text" className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-green-500 focus:outline-none" placeholder="e.g. Master Video Editing" />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider text-gray-400">Description</label>
                <textarea className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-green-500 focus:outline-none h-32" placeholder="What will students learn?" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wider text-gray-400">Price ($)</label>
                  <input type="number" className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-green-500 focus:outline-none" placeholder="49.99" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wider text-gray-400">Category</label>
                  <select className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-green-500 focus:outline-none">
                    <option>Development</option>
                    <option>Business</option>
                    <option>Design</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: MEDIA UPLOAD */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="border-2 border-dashed border-white/20 rounded-xl p-12 flex flex-col items-center justify-center text-center hover:border-green-500/50 hover:bg-white/5 transition-all cursor-pointer">
                <div className="w-16 h-16 bg-green-900/20 rounded-full flex items-center justify-center mb-4">
                  <Upload className="text-green-500 w-8 h-8" />
                </div>
                <h3 className="text-white font-medium text-lg">Upload Course Material</h3>
                <p className="text-gray-400 text-sm mt-2 max-w-sm">
                  Drag and drop video files (MP4, MOV) or documents (PDF). Max file size 5GB.
                </p>
              </div>
              <div className="flex items-center gap-3 bg-blue-900/20 p-4 rounded-lg border border-blue-500/30">
                <AlertCircle className="text-blue-400 w-5 h-5 flex-shrink-0" />
                <p className="text-sm text-blue-200">
                  Ensure all videos are at least 1080p. High-quality audio is required for approval.
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: LEGAL COMPLIANCE */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="bg-red-900/10 border border-red-500/20 p-4 rounded-lg mb-6">
                <h3 className="text-red-400 font-bold flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-5 h-5" /> Legal Compliance Check
                </h3>
                <p className="text-sm text-red-200/80">
                  Grove Connect adheres to strict international copyright and educational laws. 
                  False declarations will result in immediate account termination and potential legal action.
                </p>
              </div>

              <div className="space-y-4">
                <label className="flex items-start gap-3 p-4 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10">
                  <input type="checkbox" checked={agreed.copyright} onChange={() => setAgreed({...agreed, copyright: !agreed.copyright})} className="mt-1 w-4 h-4 accent-green-500" />
                  <div className="text-sm">
                    <strong className="text-white block mb-1">Intellectual Property Rights</strong>
                    <span className="text-gray-400">I certify that I own all content in this course or have explicit written permission to use it. No copyrighted music or video is used without license.</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-4 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10">
                  <input type="checkbox" checked={agreed.gdpr} onChange={() => setAgreed({...agreed, gdpr: !agreed.gdpr})} className="mt-1 w-4 h-4 accent-green-500" />
                  <div className="text-sm">
                    <strong className="text-white block mb-1">Student Data & Privacy (GDPR/CCPA)</strong>
                    <span className="text-gray-400">I agree not to harvest student data off-platform or solicit personal information in violation of privacy laws.</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-4 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10">
                  <input type="checkbox" checked={agreed.terms} onChange={() => setAgreed({...agreed, terms: !agreed.terms})} className="mt-1 w-4 h-4 accent-green-500" />
                  <div className="text-sm">
                    <strong className="text-white block mb-1">Grove Connect Terms of Instructor</strong>
                    <span className="text-gray-400">I have read and agree to the Instructor Revenue Share Agreement and Code of Conduct.</span>
                  </div>
                </label>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-white/10 flex justify-between bg-black/40">
          <button 
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            className="px-6 py-2 text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
          >
            Back
          </button>
          <button 
            onClick={() => {
              if (step < 3) setStep(step + 1)
              else onClose() // Submit logic here
            }}
            disabled={step === 3 && (!agreed.copyright || !agreed.gdpr || !agreed.terms)}
            className="px-8 py-2 bg-green-600 hover:bg-green-700 text-white rounded-full font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {step === 3 ? 'Certify & Publish' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  )
}

// --- 3. MAIN DASHBOARD PAGE ---
const DashboardPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <div className="min-h-screen bg-black flex text-white overflow-hidden font-sans">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-neutral-950 border-r border-white/10 hidden lg:flex flex-col z-20">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-bold tracking-tighter">GROVE <span className="text-green-500">ADMIN</span></h2>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {[
            { name: "Overview", icon: LayoutDashboard, active: true },
            { name: "My Courses", icon: BookOpen, active: false },
            { name: "Students", icon: Users, active: false },
            { name: "Earnings", icon: DollarSign, active: false },
            { name: "Settings", icon: Settings, active: false },
          ].map((item) => (
            <button key={item.name} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${item.active ? 'bg-green-600/10 text-green-400 border border-green-600/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
              <item.icon size={18} />
              {item.name}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-green-500 to-emerald-700" />
             <div>
                <p className="text-sm font-bold">Alex Johnson</p>
                <p className="text-xs text-gray-500">Lead Instructor</p>
             </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col relative overflow-y-auto h-screen">
        {/* Header */}
        <header className="h-16 border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between px-8">
          <div className="flex items-center gap-4 text-gray-400 bg-white/5 px-4 py-2 rounded-full border border-white/10 w-96">
            <Search size={16} />
            <input type="text" placeholder="Search analytics, courses..." className="bg-transparent outline-none text-sm w-full text-white" />
          </div>
          <div className="flex items-center gap-6">
            <button className="relative text-gray-400 hover:text-white">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            </button>
          </div>
        </header>

        {/* Dashboard Body */}
        <div className="p-8 space-y-8 max-w-[1600px] mx-auto w-full">
          
          {/* Header Action */}
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-bold text-white">Dashboard Overview</h1>
              <p className="text-gray-400 mt-1">Track your performance and manage content.</p>
            </div>
            <Link href = "/admin/create-course">
            <button 
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 shadow-lg shadow-green-900/20 transition-all hover:scale-105"
            >
              <Plus size={18} />
              Create New Course
            </button>
            </Link>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <div key={i} className="bg-neutral-900/50 border border-white/10 p-6 rounded-xl hover:border-green-500/30 transition-colors group">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-white/5 rounded-lg text-green-400 group-hover:bg-green-500 group-hover:text-white transition-colors">
                    <stat.icon size={20} />
                  </div>
                  <span className="text-xs font-medium text-green-400 bg-green-900/20 px-2 py-1 rounded">{stat.change}</span>
                </div>
                <h3 className="text-3xl font-bold text-white mb-1">{stat.value}</h3>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Complex Table Section */}
          <div className="bg-neutral-900/30 border border-white/10 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h3 className="text-lg font-bold">Recent Courses</h3>
              <button className="text-sm text-green-400 hover:text-white">View All</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-white/5 text-xs uppercase text-gray-400">
                  <tr>
                    <th className="p-4">Course Name</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Price</th>
                    <th className="p-4">Students</th>
                    <th className="p-4">Total Revenue</th>
                    <th className="p-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {recentCourses.map((course) => (
                    <tr key={course.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-neutral-800 rounded-md border border-white/10 flex items-center justify-center">
                            <FileText size={16} className="text-gray-500" />
                          </div>
                          <span className="font-medium text-white">{course.title}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                          course.status === 'Active' ? 'bg-green-900/20 text-green-400 border-green-500/30' :
                          course.status === 'Review' ? 'bg-yellow-900/20 text-yellow-400 border-yellow-500/30' :
                          'bg-gray-800 text-gray-400 border-gray-600'
                        }`}>
                          {course.status}
                        </span>
                      </td>
                      <td className="p-4 text-gray-300">{course.price}</td>
                      <td className="p-4 text-gray-300">{course.students}</td>
                      <td className="p-4 font-mono text-green-400">{course.revenue}</td>
                      <td className="p-4">
                        <button className="text-gray-500 hover:text-white">
                          <MoreVertical size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>

      {/* MODAL INJECTION */}
      <CreateCourseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

    </div>
  )
}

export default DashboardPage