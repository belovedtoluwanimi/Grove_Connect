'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/app/utils/supabase/client'
import { Check, X, AlertTriangle, Play } from 'lucide-react'

export default function AdminReviewPage() {
  const supabase = createClient()
  const [reviews, setReviews] = useState<any[]>([])

  useEffect(() => {
    const fetchReviews = async () => {
      // Fetch courses waiting for review
      const { data } = await supabase
        .from('courses')
        .select('*, instructor:profiles(full_name, email)')
        .eq('status', 'Review')
      
      setReviews(data || [])
    }
    fetchReviews()
  }, [])

  const handleDecision = async (id: string, decision: 'Active' | 'Draft') => {
    await supabase.from('courses').update({ status: decision }).eq('id', id)
    setReviews(reviews.filter(r => r.id !== id)) // Remove from list locally
    alert(`Course marked as ${decision}`)
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Grove Agency <span className="text-green-500">Review Queue</span></h1>
      
      <div className="grid gap-6">
        {reviews.map(course => (
          <div key={course.id} className="bg-neutral-900 border border-white/10 rounded-xl p-6 flex gap-6">
            
            {/* Thumbnail Preview */}
            <div className="w-64 h-36 bg-black rounded-lg relative overflow-hidden shrink-0">
               {course.thumbnail_url && <img src={course.thumbnail_url} className="object-cover w-full h-full" />}
               <a href={course.video_url} target="_blank" className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/20 transition-colors">
                  <Play className="text-white" fill="white" />
               </a>
            </div>

            {/* Details & Algorithm Feedback */}
            <div className="flex-1">
               <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold">{course.title}</h2>
                    <p className="text-gray-400 text-sm">by {course.instructor.full_name} ({course.instructor.email})</p>
                  </div>
                  <div className={`px-3 py-1 rounded text-xs font-bold ${course.quality_score > 80 ? 'bg-green-900 text-green-400' : 'bg-yellow-900 text-yellow-400'}`}>
                     Algorithm Score: {course.quality_score}/100
                  </div>
               </div>

               {/* Algorithm Flags */}
               {course.admin_flags && course.admin_flags.length > 0 && (
                 <div className="mt-4 bg-red-900/10 border border-red-500/20 p-3 rounded text-sm text-red-300">
                    <strong className="flex items-center gap-2 mb-1"><AlertTriangle size={14}/> Automated Flags:</strong>
                    <ul className="list-disc pl-5 space-y-1">
                       {course.admin_flags.map((flag: string, i: number) => <li key={i}>{flag}</li>)}
                    </ul>
                 </div>
               )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 justify-center border-l border-white/10 pl-6">
               <button onClick={() => handleDecision(course.id, 'Active')} className="bg-green-600 hover:bg-green-500 p-3 rounded-full text-white"><Check size={24}/></button>
               <button onClick={() => handleDecision(course.id, 'Draft')} className="bg-red-600 hover:bg-red-500 p-3 rounded-full text-white"><X size={24}/></button>
            </div>

          </div>
        ))}
        {reviews.length === 0 && <p className="text-gray-500 text-center py-20">No courses pending review.</p>}
      </div>
    </div>
  )
}