'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { 
  Lock, CreditCard, ShieldCheck, CheckCircle2, 
  PlayCircle, FileText, Award, ArrowLeft, Loader2 
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// --- MOCK DATA (In real app, fetch via Supabase using params.id) ---
const course = {
  id: '1',
  title: "Full Stack Web Development Bootcamp 2026",
  instructor: "Sarah Chen",
  price: 19.99,
  originalPrice: 89.99,
  thumbnail: "https://images.unsplash.com/photo-1587620962725-abab7fe55159?q=80&w=2831&auto=format&fit=crop", // Coding background
  features: [
    "42.5 hours of on-demand video",
    "140 downloadable resources",
    "Full lifetime access",
    "Access on mobile and TV",
    "Certificate of completion"
  ]
}

const CheckoutPage = () => {
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal'>('card')

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)

    // SIMULATE PAYMENT PROCESS
    setTimeout(() => {
      setIsProcessing(false)
      alert("Payment Successful! Access granted.")
      router.push('/dashboard') // Redirect to student dashboard
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-green-500/30">
      
      {/* NAVBAR SIMPLIFIED (Focus on checkout) */}
      <nav className="h-20 border-b border-white/10 flex items-center justify-between px-6 md:px-12 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <Link href="/courses" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={18} />
          <span className="text-sm font-medium">Cancel & Return</span>
        </Link>
        <div className="flex items-center gap-2 text-green-400">
          <Lock size={16} />
          <span className="text-sm font-bold uppercase tracking-wider">Secure Checkout</span>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-12 px-6 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* --- LEFT COLUMN: PAYMENT DETAILS --- */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* 1. Header */}
            <div>
              <h1 className="text-3xl font-bold mb-2">Checkout</h1>
              <p className="text-gray-400">Complete your purchase to start learning immediately.</p>
            </div>

            {/* 2. Billing Address */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-green-600 text-xs flex items-center justify-center">1</span>
                Billing Address
              </h2>
              <form id="checkout-form" onSubmit={handlePayment} className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            {/* 3. Payment Method */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-green-600 text-xs flex items-center justify-center">2</span>
                Payment Method
              </h2>
              
              {/* Method Toggle */}
              <div className="flex gap-4">
                <div 
                  onClick={() => setPaymentMethod('card')}
                  className={`flex-1 border rounded-xl p-4 cursor-pointer transition-all flex items-center gap-3 ${paymentMethod === 'card' ? 'border-green-500 bg-green-900/10' : 'border-white/10 bg-neutral-900 hover:bg-neutral-800'}`}
                >
                  <CreditCard className={paymentMethod === 'card' ? 'text-green-400' : 'text-gray-400'} />
                  <span className="font-bold">Credit/Debit Card</span>
                </div>
                <div 
                  onClick={() => setPaymentMethod('paypal')}
                  className={`flex-1 border rounded-xl p-4 cursor-pointer transition-all flex items-center gap-3 ${paymentMethod === 'paypal' ? 'border-blue-500 bg-blue-900/10' : 'border-white/10 bg-neutral-900 hover:bg-neutral-800'}`}
                >
                   {/* Simple text for logo representation */}
                  <span className={`font-bold italic ${paymentMethod === 'paypal' ? 'text-blue-400' : 'text-gray-400'}`}>PayPal</span>
                </div>
              </div>

              {/* Card Inputs */}
              {paymentMethod === 'card' && (
                 <div className="bg-neutral-900 border border-white/10 rounded-xl p-6 space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div className="space-y-1">
                       <label className="text-xs font-bold text-gray-500 uppercase">Name on Card</label>
                       <input type="text" className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 focus:border-green-500 outline-none transition-colors" placeholder="e.g. Alex Johnson" />
                    </div>
                    <div className="space-y-1">
                       <label className="text-xs font-bold text-gray-500 uppercase">Card Number</label>
                       <div className="relative">
                          <input type="text" className="w-full bg-black border border-white/10 rounded-lg pl-10 pr-4 py-3 focus:border-green-500 outline-none transition-colors" placeholder="0000 0000 0000 0000" />
                          <CreditCard className="absolute left-3 top-3.5 text-gray-500" size={18} />
                       </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase">Expiry Date</label>
                          <input type="text" className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 focus:border-green-500 outline-none transition-colors" placeholder="MM / YY" />
                       </div>
                       <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase">CVC / CVV</label>
                          <div className="relative">
                             <input type="text" className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 focus:border-green-500 outline-none transition-colors" placeholder="123" />
                             <Lock className="absolute right-3 top-3.5 text-gray-500" size={16} />
                          </div>
                       </div>
                    </div>
                 </div>
              )}
            </div>

            {/* Complete Button */}
            <button 
              onClick={handlePayment}
              disabled={isProcessing}
              className="w-full bg-green-600 hover:bg-green-700 text-white text-lg font-bold py-4 rounded-xl shadow-lg shadow-green-900/30 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isProcessing ? <Loader2 className="animate-spin" /> : "Complete Secure Payment"}
            </button>
            
            <p className="text-center text-xs text-gray-500 flex items-center justify-center gap-2">
               <Lock size={12} /> 256-bit SSL Encrypted payment. Your data is safe.
            </p>

          </div>

          {/* --- RIGHT COLUMN: ORDER SUMMARY (Sticky) --- */}
          <div className="lg:col-span-5">
             <div className="sticky top-28 space-y-6">
                
                {/* 1. The Card */}
                <div className="bg-neutral-900/50 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                   
                   {/* Course Thumbnail */}
                   <div className="relative h-48 w-full">
                      <Image 
                        src={course.thumbnail} 
                        alt="Course Thumbnail" 
                        fill 
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black/20" />
                      <div className="absolute bottom-4 left-4 right-4">
                         <h3 className="text-white font-bold text-lg leading-tight shadow-black drop-shadow-md">{course.title}</h3>
                         <p className="text-gray-200 text-sm mt-1">{course.instructor}</p>
                      </div>
                   </div>

                   {/* Price Breakdown */}
                   <div className="p-6 space-y-4">
                      <div className="flex justify-between items-end pb-4 border-b border-white/10">
                         <div>
                            <p className="text-3xl font-bold text-white">${course.price}</p>
                            <p className="text-sm text-gray-500 line-through">${course.originalPrice}</p>
                         </div>
                         <span className="text-green-400 font-bold bg-green-900/20 px-3 py-1 rounded-full text-sm">
                            {Math.round(((course.originalPrice - course.price) / course.originalPrice) * 100)}% OFF
                         </span>
                      </div>

                      {/* "What You Get" List */}
                      <div className="space-y-3">
                         <p className="font-bold text-white text-sm">This course includes:</p>
                         {course.features.map((feature, i) => (
                            <div key={i} className="flex items-start gap-3 text-sm text-gray-300">
                               {i === 0 ? <PlayCircle size={16} className="shrink-0 mt-0.5 text-green-500" /> : 
                                i === 1 ? <FileText size={16} className="shrink-0 mt-0.5 text-green-500" /> :
                                i === 4 ? <Award size={16} className="shrink-0 mt-0.5 text-green-500" /> :
                                <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-green-500" />}
                               <span>{feature}</span>
                            </div>
                         ))}
                      </div>
                   </div>
                   
                   {/* Guarantee Footer */}
                   <div className="bg-white/5 p-4 flex items-center gap-3">
                      <ShieldCheck className="text-green-400 w-8 h-8 shrink-0" />
                      <div>
                         <p className="text-white font-bold text-sm">30-Day Money-Back Guarantee</p>
                         <p className="text-gray-400 text-xs">Not satisfied? Get a full refund, no questions asked.</p>
                      </div>
                   </div>
                </div>

                {/* Testimonial (Social Proof) */}
                <div className="bg-neutral-900 border border-white/10 p-4 rounded-xl flex gap-3">
                   <div className="w-10 h-10 rounded-full bg-blue-900 flex items-center justify-center text-white font-bold">
                      J
                   </div>
                   <div>
                      <p className="text-xs text-gray-400 italic">"This course changed my career. I went from knowing nothing to getting hired in 3 months."</p>
                      <p className="text-xs font-bold text-white mt-1">- James O., Student</p>
                   </div>
                </div>

             </div>
          </div>

        </div>
      </main>
    </div>
  )
}

export default CheckoutPage