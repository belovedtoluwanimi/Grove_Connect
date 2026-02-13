'use client'

import React from 'react'
import { ArrowRight, Youtube, Briefcase, Mail, Sparkles, ExternalLink } from 'lucide-react'
import Link from 'next/link'

const CTASection = () => {
  return (
    <section className="relative w-full py-24 md:py-32 px-6 md:px-12 bg-black overflow-hidden z-10 border-t border-white/10">
      
      {/* --- BACKGROUND EFFECTS --- */}
      {/* 1. The Grid Floor */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] opacity-30 pointer-events-none" />
      
      {/* 2. The Glow Orb */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center gap-16">
        
        {/* --- 1. PRIMARY CTA (The Main Goal) --- */}
        <div className="text-center flex flex-col items-center gap-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest">
            <Sparkles size={12} /> Limitless Potential
          </div>
          
          <h2 className="text-5xl md:text-7xl font-black text-white leading-[1.1] tracking-tight">
            Ready to Dominate the <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-green-400 to-cyan-500">
              Digital Space?
            </span>
          </h2>
          
          <p className="text-xl text-zinc-400 max-w-2xl leading-relaxed">
            Join thousands of creators who are leveling up their skills, building massive audiences, and earning sustainable income with Grove Connect.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 mt-4 w-full sm:w-auto">
            <Link href="/auth" className="w-full sm:w-auto">
                <button className="group w-full sm:w-auto flex items-center justify-center gap-3 cursor-pointer bg-white text-black hover:bg-zinc-200 px-8 py-4 rounded-full font-bold text-lg transition-all duration-300 shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_rgba(255,255,255,0.5)] hover:scale-105">
                    Get Started Now
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
            </Link>
            <button className="flex items-center justify-center border border-white/10 cursor-pointer gap-2 bg-white/5 hover:bg-white/10 text-white px-8 py-4 rounded-full font-bold text-lg transition-all duration-300 backdrop-blur-md">
                View Pricing
            </button>
          </div>
        </div>

        {/* --- 2. THE ECOSYSTEM GRID (Secondary Actions) --- */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 pt-12 border-t border-white/5">
            
            {/* Card A: YouTube (Grove+) */}
            <Link 
                href="https://youtube.com/@groveconnect" // Replace with actual URL
                target="_blank"
                className="group relative p-6 bg-zinc-900/40 border border-white/5 hover:border-red-500/50 rounded-2xl transition-all duration-300 overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex flex-col h-full justify-between gap-4">
                    <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
                        <Youtube size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            Grove+ <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded font-black uppercase tracking-wider">Free</span>
                        </h3>
                        <p className="text-sm text-zinc-400 mt-1">Exclusive tutorials & behind-the-scenes content.</p>
                    </div>
                    <div className="flex items-center text-xs font-bold text-red-400 uppercase tracking-wider">
                        Subscribe Now <ExternalLink size={12} className="ml-1" />
                    </div>
                </div>
            </Link>

            {/* Card B: Careers */}
            <Link 
                href="mailto:careers@groveconnect.com"
                className="group relative p-6 bg-zinc-900/40 border border-white/5 hover:border-blue-500/50 rounded-2xl transition-all duration-300 overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex flex-col h-full justify-between gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                        <Briefcase size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Join the Team</h3>
                        <p className="text-sm text-zinc-400 mt-1">Help us build the future of education.</p>
                    </div>
                    <div className="flex items-center text-xs font-bold text-blue-400 uppercase tracking-wider">
                        Apply via Email <ArrowRight size={12} className="ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                </div>
            </Link>

            {/* Card C: Brand Deals */}
            <Link 
                href="mailto:partners@groveconnect.com"
                className="group relative p-6 bg-zinc-900/40 border border-white/5 hover:border-purple-500/50 rounded-2xl transition-all duration-300 overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex flex-col h-full justify-between gap-4">
                    <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
                        <Mail size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Brand & Partners</h3>
                        <p className="text-sm text-zinc-400 mt-1">Collaborate with Grove Connect.</p>
                    </div>
                    <div className="flex items-center text-xs font-bold text-purple-400 uppercase tracking-wider">
                        Contact Us <ArrowRight size={12} className="ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                </div>
            </Link>

        </div>

      </div>
    </section>
  )
}

export default CTASection