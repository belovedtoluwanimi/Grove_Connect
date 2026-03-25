'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { 
  Lock, CreditCard, ShieldCheck, PlayCircle, 
  Award, ArrowLeft, Loader2 
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/app/utils/supabase/client'
import { motion } from 'framer-motion'
import { usePaystackPayment } from 'react-paystack'

export default function CheckoutClient() {
  const router = useRouter()
  const supabase = createClient()

  const [checkoutItems, setCheckoutItems] = useState<any[]>([])
  const [cartTotal, setCartTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/auth')
      setUser(user)

      const sessionData = localStorage.getItem('grove_checkout_session')
      if (sessionData) {
          const items = JSON.parse(sessionData)
          setCheckoutItems(items)
          setCartTotal(items.reduce((sum: number, item: any) => sum + item.price, 0))
      } else {
          router.push('/courses') 
      }
      setLoading(false)
    }
    init()
  }, [router, supabase])

  const config = {
      reference: (new Date()).getTime().toString(),
      email: user?.email || "student@groveconnect.com",
      amount: cartTotal * 100, 
      publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY as string,
      currency: 'NGN', 
  }

  const initializePayment = usePaystackPayment(config)

  const onSuccess = async (reference: any) => {
      setIsProcessing(true)

      try {
          const enrollmentsToInsert = checkoutItems.map(item => ({
              user_id: user.id,
              course_id: item.id
          }))

          const { error } = await supabase.from('enrollments').insert(enrollmentsToInsert)
          
          if (error && error.code !== '23505') throw error

          const fullCart = JSON.parse(localStorage.getItem('grove_cart') || '[]')
          const purchasedIds = new Set(checkoutItems.map(item => item.id))
          const remainingCart = fullCart.filter((item: any) => !purchasedIds.has(item.id))
          
          localStorage.setItem('grove_cart', JSON.stringify(remainingCart))
          localStorage.removeItem('grove_checkout_session') 

          router.push(`/dashboard`)

      } catch (err) {
          console.error("Database Error post-payment:", err)
          alert("Payment went through, but we hit a snag updating your dashboard. Please contact support.")
          setIsProcessing(false)
      }
  }

  const onClose = () => {
      setIsProcessing(false)
  }

  const triggerCheckout = () => {
      setIsProcessing(true)
      initializePayment({ onSuccess, onClose } as any)
  }

  if (loading) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-500 w-10 h-10" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-emerald-500/30 py-12 px-6 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-900/20 blur-[150px] rounded-full pointer-events-none" />
      <div className="max-w-6xl mx-auto relative z-10">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-8 font-bold text-sm">
            <ArrowLeft size={16} /> Back to Cart
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-7 space-y-8">
            <div>
              <h1 className="text-4xl font-black mb-2">Secure Checkout</h1>
              <p className="text-zinc-400">Complete your transaction via Paystack's secure gateway.</p>
            </div>

            <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
               <div className="flex flex-col items-center justify-center py-12 space-y-6">
                  <div className="flex justify-center gap-4 text-emerald-500">
                      <Lock size={48} />
                      <CreditCard size={48} />
                  </div>
                  <h3 className="text-2xl font-bold">Paystack Secure Gateway</h3>
                  <p className="text-sm text-zinc-400 max-w-sm mx-auto text-center border border-emerald-500/20 bg-emerald-500/5 p-4 rounded-xl">
                      Grove Connect does not store your card details. We use bank-grade encryption to process your payment safely.
                  </p>
               </div>

               <button 
                  onClick={triggerCheckout}
                  disabled={isProcessing || cartTotal === 0}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-lg font-black py-4 rounded-xl shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isProcessing ? <><Loader2 className="animate-spin" /> Processing...</> : `Pay ${cartTotal === 0 ? 'Free' : '₦'+cartTotal.toLocaleString()}`}
                </button>
            </div>
          </div>

          <div className="lg:col-span-5">
             <div className="sticky top-28 space-y-6">
                <div className="bg-neutral-900/50 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-2xl">
                    <h2 className="text-xl font-black mb-4 border-b border-white/10 pb-4">Order Summary ({checkoutItems.length} items)</h2>
                    
                    <div className="space-y-4 max-h-[350px] overflow-y-auto custom-scrollbar pr-2 mb-6">
                        {checkoutItems.map((item, idx) => (
                            <motion.div initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} transition={{delay: idx*0.1}} key={item.id} className="flex gap-4 items-center bg-black/40 p-3 rounded-xl border border-white/5">
                                <div className="w-20 h-14 relative rounded-md overflow-hidden shrink-0 border border-white/10">
                                    <Image src={item.thumbnail_url} alt="" fill className="object-cover" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-sm font-bold line-clamp-1">{item.title}</h4>
                                    <p className="text-xs text-emerald-400">{item.instructor_name}</p>
                                </div>
                                <div className="font-bold text-white">₦{item.price.toLocaleString()}</div>
                            </motion.div>
                        ))}
                    </div>

                    <div className="pt-4 border-t border-white/10 space-y-4">
                        <div className="flex justify-between items-end mb-4">
                            <span className="text-zinc-400 font-bold">Total Price</span>
                            <span className="text-4xl font-black text-white">₦{cartTotal.toLocaleString()}</span>
                        </div>
                        
                        <div className="space-y-3 pt-4 border-t border-white/10">
                            <p className="font-bold text-white text-sm">Your purchase includes:</p>
                            <div className="flex items-center gap-3 text-sm text-zinc-400">
                                <PlayCircle size={16} className="text-emerald-500" /> Full lifetime access
                            </div>
                            <div className="flex items-center gap-3 text-sm text-zinc-400">
                                <Award size={16} className="text-emerald-500" /> Certificate of completion
                            </div>
                        </div>
                    </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}