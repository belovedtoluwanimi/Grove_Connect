'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { 
  ArrowRight, Play, Code2, Book, Mic, Youtube, 
  Music, Laptop, Pencil, Gamepad2, BrainCircuit
} from 'lucide-react'

// --- FLOATING ICON COMPONENT ---
const FloatingItem = ({ icon: Icon, delay, x, y, color, size = 24, rotate }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 50, scale: 0.8 }}
    animate={{ 
      opacity: [0.3, 0.8, 0.3], 
      y: [0, -20, 0], 
      rotate: [rotate - 10, rotate + 10, rotate - 10]
    }}
    transition={{ 
      duration: 5, 
      delay: delay, 
      repeat: Infinity,
      ease: "easeInOut" 
    }}
    className={`absolute ${x} ${y} p-4 rounded-3xl bg-black/40 border border-white/5 backdrop-blur-md shadow-2xl z-10 pointer-events-none`}
  >
    <Icon size={size} className={color} />
  </motion.div>
)

const Hero = () => {
  return (
    <div className="relative w-full h-screen bg-[#020202] overflow-hidden flex flex-col items-center justify-center pt-20">
      
      {/* --- 1. BACKGROUND LAYERS --- */}
      
      {/* A. Abstract Image Texture (Adds richness) */}
      <div className="absolute inset-0 z-0 opacity-30 select-none pointer-events-none">
        <Image 
            src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop"
            alt="Abstract Texture"
            fill
            className="object-cover"
            priority
        />
        {/* Dark Fade Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#020202] via-[#020202]/80 to-[#020202]" />
      </div>

      {/* B. The Grid (Global Overlay) */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none"></div>

      {/* C. Vibrant Color Splashes (Gamified RGB Vibe) */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-emerald-500/20 rounded-full blur-[120px] pointer-events-none z-0 mix-blend-screen" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none z-0 mix-blend-screen" />
      <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[800px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none z-0" />


      {/* --- 2. FLOATING ICONS (The Gamified Elements) --- */}
      {/* Left Side */}
      <FloatingItem icon={Book} color="text-blue-400" delay={0} x="left-[10%]" y="top-[20%]" rotate={-15} size={32} />
      <FloatingItem icon={Code2} color="text-emerald-400" delay={1.5} x="left-[5%]" y="bottom-[30%]" rotate={10} size={28} />
      <FloatingItem icon={Youtube} color="text-red-500" delay={0.5} x="left-[20%]" y="bottom-[15%]" rotate={-5} size={40} />
      <FloatingItem icon={Pencil} color="text-yellow-400" delay={2} x="left-[15%]" y="top-[40%]" rotate={20} size={24} />

      {/* Right Side */}
      <FloatingItem icon={Mic} color="text-purple-400" delay={1} x="right-[10%]" y="top-[25%]" rotate={15} size={36} />
      <FloatingItem icon={Laptop} color="text-gray-300" delay={2.5} x="right-[5%]" y="bottom-[25%]" rotate={-10} size={32} />
      <FloatingItem icon={Music} color="text-pink-400" delay={0.2} x="right-[18%]" y="bottom-[10%]" rotate={5} size={28} />
      <FloatingItem icon={Gamepad2} color="text-green-400" delay={3} x="right-[15%]" y="top-[45%]" rotate={-20} size={30} />


      {/* --- 3. MAIN CONTENT --- */}
      <div className="relative z-10 max-w-5xl px-6 text-center">
        
        {/* Badge */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-emerald-400 mb-8 hover:bg-white/10 transition-colors cursor-default backdrop-blur-md"
        >
          <BrainCircuit size={16} />
          <span>Level Up Your Future</span>
        </motion.div>

        {/* Headline */}
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight text-white mb-8 leading-[1.1] drop-shadow-2xl">
          Learn. Play. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-500 animate-gradient-x">
            Create.
          </span>
        </h1>

        {/* Subtext */}
        <p className="text-lg md:text-xl text-zinc-300/80 mb-10 max-w-2xl mx-auto leading-relaxed text-shadow-sm">
          The playground for creators. Master coding, launch your podcast, or build a business—all while earning real XP and certificates.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/auth" className="group relative px-8 py-4 bg-white text-black rounded-full font-bold text-lg flex items-center gap-3 overflow-hidden shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:scale-105 transition-transform duration-300">
            <span className="relative z-10">Start Your Quest</span>
            <ArrowRight className="relative z-10 group-hover:translate-x-1 transition-transform" size={20} />
            <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
          
          <button className="px-8 py-4 rounded-full border border-white/10 text-white font-bold flex items-center gap-3 hover:bg-white/5 backdrop-blur-sm transition-all">
            <div className="w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500">
              <Play size={10} fill="currentColor" />
            </div>
            <span>See How It Works</span>
          </button>
        </div>

        {/* Trust/Social Proof */}
        <div className="mt-16 flex flex-col items-center gap-4 opacity-50 grayscale hover:grayscale-0 transition-all duration-700">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Trusted by learners from</p>
          <div className="flex items-center text-white/70 gap-8 md:gap-12">
             <span className="text-xl font-bold font-sans">Google</span>
             <span className="text-xl font-bold font-sans">Spotify</span>
             <span className="text-xl font-bold font-sans">Twitch</span>
             <span className="text-xl font-bold font-sans">Vercel</span>
          </div>
        </div>

      </div>

      {/* --- 4. 3D GRID FLOOR (Perspective Effect) --- */}
      <div className="absolute bottom-0 w-full h-[40vh] bg-gradient-to-t from-emerald-900/10 to-transparent pointer-events-none z-0" />
      <div className="absolute bottom-0 w-full h-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none transform perspective-[500px] rotate-x-12 opacity-40 z-0" />

    </div>
  )
}

export default Hero