'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { 
  Lock, CreditCard, ShieldCheck, CheckCircle2, 
  PlayCircle, FileText, Award, ArrowLeft, Loader2, AlertCircle
} from 'lucide-react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/app/utils/supabase/client'

export default function CheckoutPage() {
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()
  const courseId = params?.id as string

  // State
  const [course, setCourse] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal'>('card')
  const [user, setUser] = useState<any>(null)

  // 1. Fetch Real Course Data & User
  useEffect(() => {
    const init = async () => {
      // Auth Check
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
          router.push('/auth')
          return
      }
      setUser(user)

      // Fetch Course Details
      const { data, error } = await supabase
        .from('courses')
        .select('*, profiles(full_name)')
        .eq('id', courseId)
        .single()

      if (error || !data) {
          console.error("Course fetch error:", error)
          // Handle error (optional: redirect to library)
      } else {
          setCourse(data)
      }
      setLoading(false)
    }

    if (courseId) init()
  }, [courseId, router, supabase])

  // 2. Handle Real Enrollment (The Fix)
  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)

    // A. Create Enrollment Record in Supabase
    const { error } = await supabase
        .from('enrollments')
        .insert({
            user_id: user.id,
            course_id: courseId
        })

    // B. Handle Result
    if (error) {
        // If error code is 23505, it means "Already Enrolled" - Safe to proceed
        if (error.code === '23505') {
             router.push(`/courses/${courseId}/learn`)
        } else {
             console.error("Enrollment failed:", error)
             alert("Payment failed. Please try again.")
             setIsProcessing(false)
        }
    } else {
        // Success!
        // Optional: Add a slight delay for UX (showing the spinner)
        setTimeout(() => {
            router.push(`/courses/${courseId}/learn`)
        }, 1000)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="animate-spin text-green-500 w-10 h-10" />
    </div>
  )

  if (!course) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white gap-4">
        <AlertCircle size={40} className="text-red-500" />
        <p>Course not found.</p>
        <Link href="/courses" className="text-green-400 hover:underline">Return to courses</Link>
    </div>
  )

  // Safe Instructor Name
  const instructorName = Array.isArray(course.profiles) 
    ? course.profiles[0]?.full_name 
    : course.profiles?.full_name || "Grove Instructor"

  return (
    <div className="min-h-screen bg-black text-white selection:bg-green-500/30">
      
      {/* NAVBAR */}
      <nav className="h-20 border-b border-white/10 flex items-center justify-between px-6 md:px-12 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <Link href={`/courses/${courseId}`} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={18} />
          <span className="text-sm font-medium">Cancel</span>
        </Link>
        <div className="flex items-center gap-2 text-green-400">
          <Lock size={16} />
          <span className="text-sm font-bold uppercase tracking-wider">Secure Checkout</span>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-12 px-6 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* --- LEFT: PAYMENT FORM --- */}
          <div className="lg:col-span-7 space-y-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Checkout</h1>
              <p className="text-gray-400">Complete your purchase to start learning immediately.</p>
            </div>

            {/* Address (Visual Only for MVP) */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-green-600 text-xs flex items-center justify-center">1</span>
                Billing Address
              </h2>
              <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                   <label className="text-xs font-bold text-gray-500 uppercase">Country</label>
                   <select className="w-full bg-neutral-900 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-green-500 outline-none">
                      <option>Nigeria</option>
                      <option>United States</option>
                      <option>United Kingdom</option>
                   </select>
                </div>
                <div className="space-y-1">
                   <label className="text-xs font-bold text-gray-500 uppercase">State / Province</label>
                   <input type="text" className="w-full bg-neutral-900 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-green-500 outline-none" placeholder="e.g. Lagos" />
                </div>
              </form>
            </div>

            {/* Payment Method */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-green-600 text-xs flex items-center justify-center">2</span>
                Payment Method
              </h2>
              
              <div className="flex gap-4">
                <div 
                  onClick={() => setPaymentMethod('card')}
                  className={`flex-1 border rounded-xl p-4 cursor-pointer transition-all flex items-center gap-3 ${paymentMethod === 'card' ? 'border-green-500 bg-green-900/10' : 'border-white/10 bg-neutral-900 hover:bg-neutral-800'}`}
                >
                  <CreditCard className={paymentMethod === 'card' ? 'text-green-400' : 'text-gray-400'} />
                  <span className="font-bold">Card</span>
                </div>
                <div 
                  onClick={() => setPaymentMethod('paypal')}
                  className={`flex-1 border rounded-xl p-4 cursor-pointer transition-all flex items-center gap-3 ${paymentMethod === 'paypal' ? 'border-blue-500 bg-blue-900/10' : 'border-white/10 bg-neutral-900 hover:bg-neutral-800'}`}
                >
                  <span className={`font-bold italic ${paymentMethod === 'paypal' ? 'text-blue-400' : 'text-gray-400'}`}>PayPal</span>
                </div>
              </div>

              {/* Card Inputs (Visual Only) */}
              {paymentMethod === 'card' && (
                 <div className="bg-neutral-900 border border-white/10 rounded-xl p-6 space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div className="space-y-1">
                       <label className="text-xs font-bold text-gray-500 uppercase">Card Number</label>
                       <div className="relative">
                          <input type="text" className="w-full bg-black border border-white/10 rounded-lg pl-10 pr-4 py-3 focus:border-green-500 outline-none" placeholder="0000 0000 0000 0000" />
                          <CreditCard className="absolute left-3 top-3.5 text-gray-500" size={18} />
                       </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <input type="text" className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 focus:border-green-500 outline-none" placeholder="MM / YY" />
                       <input type="text" className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 focus:border-green-500 outline-none" placeholder="CVC" />
                    </div>
                 </div>
              )}
            </div>

            {/* ACTION BUTTON */}
            <button 
              onClick={handlePayment}
              disabled={isProcessing}
              className="w-full bg-green-600 hover:bg-green-700 text-white text-lg font-bold py-4 rounded-xl shadow-lg shadow-green-900/30 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isProcessing ? <Loader2 className="animate-spin" /> : `Pay ${course.price === 0 ? 'Free' : '$'+course.price}`}
            </button>
            
            <p className="text-center text-xs text-gray-500 flex items-center justify-center gap-2">
               <Lock size={12} /> Secure encrypted payment
            </p>
          </div>

          {/* --- RIGHT: ORDER SUMMARY (Sticky) --- */}
          <div className="lg:col-span-5">
             <div className="sticky top-28 space-y-6">
                <div className="bg-neutral-900/50 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                   
                   {/* Thumbnail */}
                   <div className="relative h-48 w-full">
                      <Image 
                        src={course.thumbnail_url || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3"} 
                        alt="Course" 
                        fill 
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black/20" />
                      <div className="absolute bottom-4 left-4 right-4">
                          <h3 className="text-white font-bold text-lg leading-tight shadow-black drop-shadow-md">{course.title}</h3>
                          <p className="text-gray-200 text-sm mt-1">{instructorName}</p>
                      </div>
                   </div>

                   {/* Price Details */}
                   <div className="p-6 space-y-4">
                      <div className="flex justify-between items-end pb-4 border-b border-white/10">
                         <div>
                            <p className="text-3xl font-bold text-white">{course.price === 0 ? 'Free' : `$${course.price}`}</p>
                            {course.original_price > 0 && <p className="text-sm text-gray-500 line-through">${course.original_price}</p>}
                         </div>
                      </div>

                      {/* Features */}
                      <div className="space-y-3">
                          <p className="font-bold text-white text-sm">Includes:</p>
                          <div className="flex items-center gap-3 text-sm text-gray-300">
                             <PlayCircle size={16} className="text-green-500" /> 
                             <span>Full lifetime access</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-300">
                             <FileText size={16} className="text-green-500" /> 
                             <span>Access on mobile and TV</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-300">
                             <Award size={16} className="text-green-500" /> 
                             <span>Certificate of completion</span>
                          </div>
                      </div>
                   </div>
                   
                   {/* Guarantee */}
                   <div className="bg-white/5 p-4 flex items-center gap-3">
                      <ShieldCheck className="text-green-400 w-8 h-8 shrink-0" />
                      <div>
                          <p className="text-white font-bold text-sm">30-Day Guarantee</p>
                          <p className="text-gray-400 text-xs">Full refund if not satisfied.</p>
                      </div>
                   </div>
                </div>
             </div>
          </div>

        </div>
      </main>
    </div>
  )
}