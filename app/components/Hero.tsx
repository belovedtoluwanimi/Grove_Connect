'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  ArrowRight, PlayCircle, Star, CheckCircle2, 
  TrendingUp, Award, Zap, Users 
} from 'lucide-react'

// --- REUSABLE COMPONENTS ---

// 1. Trust Badge (Social Proof)
const TrustBadge = () => (
  <div className="flex items-center gap-4 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
    <div className="flex -space-x-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="w-10 h-10 rounded-full border-2 border-black bg-neutral-800 overflow-hidden relative">
           <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User" className="w-full h-full object-cover" />
        </div>
      ))}
      <div className="w-10 h-10 rounded-full border-2 border-black bg-neutral-800 flex items-center justify-center text-[10px] font-bold text-white">
        +2k
      </div>
    </div>
    <div className="flex flex-col">
      <div className="flex items-center gap-1">
        {[1,2,3,4,5].map(i => <Star key={i} size={12} className="fill-yellow-500 text-yellow-500" />)}
      </div>
      <p className="text-xs text-gray-400"><span className="text-white font-bold">4.9/5</span> from verified students</p>
    </div>
  </div>
)

// 2. Feature Pill
const FeaturePill = ({ icon: Icon, text }: { icon: any, text: string }) => (
  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-gray-300 backdrop-blur-sm">
    <Icon size={12} className="text-green-400" />
    <span>{text}</span>
  </div>
)

const Hero = () => {
  return (
    <div className="relative w-full min-h-screen bg-black overflow-hidden flex items-center justify-center pt-20 lg:pt-0">
      
      {/* --- BACKGROUND EFFECTS --- */}
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      
      {/* Glowing Spotlights */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-500/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[128px] pointer-events-none" />

      <div className="container px-6 mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        
        {/* --- LEFT COLUMN: COPY & CTA --- */}
        <div className="flex flex-col items-start text-left">
          
          <TrustBadge />

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-6 leading-[1.1]">
            Master Skills. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-400 to-cyan-500">
              Build Your Empire.
            </span>
          </h1>

          <p className="text-lg text-gray-400 mb-8 max-w-xl leading-relaxed">
            The all-in-one ecosystem where students gain recognizable certificates and experts build profitable teaching businesses.
          </p>

          <div className="flex flex-wrap gap-3 mb-10">
            <FeaturePill icon={CheckCircle2} text="Certified Courses" />
            <FeaturePill icon={TrendingUp} text="Real-time Analytics" />
            <FeaturePill icon={Zap} text="Gamified Learning" />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link href="/auth" className="group relative px-8 py-4 bg-white text-black rounded-full font-bold text-lg flex items-center justify-center gap-3 overflow-hidden transition-all hover:w-[105%]">
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-gray-100 to-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative">Start For Free</span>
              <ArrowRight className="relative group-hover:translate-x-1 transition-transform" size={20} />
            </Link>
            
            <button className="px-8 py-4 rounded-full border border-white/10 text-white font-medium flex items-center justify-center gap-3 hover:bg-white/5 transition-colors">
              <PlayCircle size={20} className="text-gray-400" />
              <span>Watch Demo</span>
            </button>
          </div>

          <div className="mt-12 pt-8 border-t border-white/10 w-full flex justify-between text-gray-500 text-sm">
             <div><span className="block text-white font-bold text-xl">10k+</span> Students</div>
             <div><span className="block text-white font-bold text-xl">500+</span> Tutors</div>
             <div><span className="block text-white font-bold text-xl">$1M+</span> Paid out</div>
          </div>
        </div>

        {/* --- RIGHT COLUMN: DYNAMIC VISUALS --- */}
        <div className="relative h-[600px] w-full hidden lg:block perspective-1000">
           
           {/* Card 1: Student Success (Floating) */}
           <motion.div 
             initial={{ opacity: 0, x: 100, y: -50 }}
             animate={{ opacity: 1, x: 0, y: 0 }}
             transition={{ duration: 0.8, ease: "easeOut" }}
             className="absolute top-10 right-10 w-80 bg-neutral-900/90 border border-white/10 backdrop-blur-xl p-6 rounded-2xl shadow-2xl z-20"
           >
              <div className="flex justify-between items-start mb-4">
                 <div className="p-3 bg-green-500/20 rounded-xl"><Award className="text-green-400" size={24} /></div>
                 <span className="bg-green-500 text-black text-[10px] font-bold px-2 py-1 rounded">COMPLETED</span>
              </div>
              <h3 className="text-white font-bold text-lg mb-1">Full Stack Mastery</h3>
              <p className="text-gray-400 text-xs mb-4">Issued to: Beloved Toluwanimi</p>
              <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
                 <motion.div 
                   initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ delay: 1, duration: 1.5 }} 
                   className="h-full bg-green-500" 
                 />
              </div>
           </motion.div>

           {/* Card 2: Tutor Revenue (Floating) */}
           <motion.div 
             initial={{ opacity: 0, x: -50, y: 100 }}
             animate={{ opacity: 1, x: 0, y: 40 }}
             transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
             className="absolute bottom-20 left-10 w-80 bg-white text-black border border-white/10 p-6 rounded-2xl shadow-2xl z-30"
           >
              <div className="flex justify-between items-start mb-6">
                 <div>
                    <p className="text-gray-500 text-xs font-bold uppercase">Monthly Revenue</p>
                    <h3 className="text-3xl font-bold tracking-tight">$4,290.00</h3>
                 </div>
                 <div className="p-2 bg-black/5 rounded-lg"><TrendingUp size={20} className="text-black" /></div>
              </div>
              <div className="flex gap-2 items-end h-16">
                 {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                    <motion.div 
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${h}%` }}
                      transition={{ delay: 0.5 + (i * 0.1), duration: 0.5 }}
                      className={`flex-1 rounded-t-sm ${i === 5 ? 'bg-green-500' : 'bg-gray-200'}`} 
                    />
                 ))}
              </div>
           </motion.div>

           {/* Abstract Connectivity Lines */}
           <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 400 400">
              <motion.path 
                d="M 50 300 Q 150 150 350 100" 
                fill="none" 
                stroke="url(#gradient)" 
                strokeWidth="2"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.3 }}
                transition={{ duration: 2, delay: 0.5 }}
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#22c55e" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
           </svg>

        </div>

      </div>
    </div>
  )
}

export default Hero