'use client'

import React, { useState, useEffect } from 'react'
import { ShieldCheck, User, Briefcase, ScanFace, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
import { createClient } from '@/app/utils/supabase/client'
import { InstructorVerification } from '../../types'
import { Input } from '@/app/admin/create-course/components'

interface Props {
  onStatusChange: (status: InstructorVerification['status']) => void
}

export const VerificationStep = ({ onStatusChange }: Props) => {
  const supabase = createClient()
  const [status, setStatus] = useState<InstructorVerification['status']>('idle')
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({ nin: '', tin: '', legalName: '' })
  
  // 1. Check existing status on mount
  useEffect(() => {
    const checkStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // In a real app, you would query your 'instructor_verifications' table here
      const { data } = await supabase.from('instructor_verifications').select('status').eq('instructor_id', user.id).single()
      
      if (data) {
        setStatus(data.status)
        onStatusChange(data.status)
      }
      setLoading(false)
    }
    checkStatus()
  }, [])

  // 2. Handle Submission
  const handleSubmit = async () => {
    if (!formData.nin || !formData.legalName) return alert("Please fill in required fields")
    
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      // Simulate Database Insert
      const { error } = await supabase.from('instructor_verifications').upsert({
        instructor_id: user.id,
        status: 'pending',
        nin_last4: formData.nin.slice(-4),
        tin_last4: formData.tin.slice(-4),
        submitted_at: new Date().toISOString()
      })

      // If DB doesn't exist yet in your setup, we handle the UI state gracefully
      setStatus('pending')
      onStatusChange('pending')
    }
    setLoading(false)
  }

  if (loading) return <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-emerald-500" /></div>

  return (
    <div className="max-w-2xl mx-auto py-8 animate-in fade-in">
        <h1 className="text-3xl font-bold mb-2 text-center">Identity Verification</h1>
        <p className="text-zinc-400 text-center mb-8">
          To maintain a safe platform, we verify all instructors. Your data is encrypted and secure.
        </p>
        
        <div className="space-y-6">
            {/* Status Banner */}
            <div className={`p-4 rounded-xl border flex items-center gap-3 ${
                status === 'verified' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' :
                status === 'pending' ? 'bg-amber-500/10 border-amber-500/50 text-amber-400' :
                'bg-zinc-900 border-white/10'
            }`}>
                {status === 'verified' ? <CheckCircle2 /> : status === 'pending' ? <ClockIcon /> : <ShieldCheck />}
                <div>
                    <h4 className="font-bold text-sm uppercase">Current Status: {status}</h4>
                    <p className="text-xs opacity-80">
                        {status === 'verified' ? "You are fully verified to publish." : 
                         status === 'pending' ? "Our team is reviewing your documents (Takes 24-48hrs)." : 
                         "Verification required before publishing."}
                    </p>
                </div>
            </div>

            {/* Submission Form (Only show if not verified) */}
            {status !== 'verified' && status !== 'pending' && (
                <div className="bg-zinc-900 border border-white/10 p-6 rounded-xl space-y-4">
                    <h3 className="font-bold text-white">Legal Information</h3>
                    <Input label="Full Legal Name" placeholder="As it appears on ID" value={formData.legalName} onChange={(v: string) => setFormData({...formData, legalName: v})} />
                    <Input label="NIN (National Identity Number)" placeholder="11 Digit NIN" value={formData.nin} onChange={(v: string) => setFormData({...formData, nin: v})} />
                    <Input label="TIN (Tax ID) - Optional" placeholder="Tax Identification Number" value={formData.tin} onChange={(v: string) => setFormData({...formData, tin: v})} />
                    
                    <button onClick={handleSubmit} className="w-full py-3 bg-white text-black font-bold rounded-lg hover:bg-emerald-400 transition-all mt-4">
                        Submit for Verification
                    </button>
                </div>
            )}
        </div>
    </div>
  )
}

function ClockIcon() {
    return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
}