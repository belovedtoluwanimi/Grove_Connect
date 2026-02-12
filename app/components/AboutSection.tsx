'use client'

import React from 'react'
import Image from 'next/image'
import { CheckCircle2, ArrowRight, PlayCircle, BookOpen, Sparkles } from 'lucide-react'
import { aboutImage, courseImage } from '../assets' 
import Link from 'next/link'

const courseFeatures = [
  "Master Video Editing & Cinematic Production.",
  "Web Development: From Code to Deployment.",
  "YouTube Growth Strategies & Content Analytics.",
  "Brand Building & Digital Marketing Fundamentals."
]

const AboutSection = () => {
  return (
    <section className="relative w-full py-24 md:py-32 px-6 overflow-hidden bg-neutral-950 z-20">
      
      {/* --- BACKGROUND ACCENTS (Matches Hero Vibe) --- */}
      {/* Solid background ensures no overlap transparency issues */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-green-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* CONTAINER */}
      <div className="max-w-7xl w-full mx-auto flex flex-col lg:flex-row items-center gap-16 lg:gap-24 relative z-10">
        
        {/* --- LEFT SIDE: TEXT CONTENT --- */}
        <div className="w-full lg:w-1/2 flex flex-col gap-8 order-2 lg:order-1">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 mb-6">
              <Sparkles className="w-3 h-3 text-green-400" />
              <span className="text-green-400 text-xs font-bold tracking-wide uppercase">
                Grove Academy
              </span>
            </div>
            
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-[1.1] tracking-tight">
              Master the Skills of <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">
                Tomorrow, Today.
              </span>
            </h2>
            
            <p className="text-zinc-400 text-lg leading-relaxed max-w-xl">
              Unlock your potential with our expert-led digital courses. Whether you want to launch a YouTube channel or code your first website, Grove Connect provides the structured learning path you need.
            </p>
          </div>

          {/* Feature List (Modernized) */}
          <div className="space-y-4">
            {courseFeatures.map((item, idx) => (
              <div key={idx} className="flex items-start gap-4 group">
                <div className="mt-1 p-1 rounded-full bg-green-500/10 text-green-500 group-hover:bg-green-500 group-hover:text-black transition-colors duration-300">
                   <CheckCircle2 size={16} />
                </div>
                <span className="text-zinc-300 group-hover:text-white transition-colors">
                  {item}
                </span>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="pt-4 flex flex-wrap gap-4">
            <Link href="/courses">
              <button className="group px-8 py-3.5 bg-white text-black rounded-full font-bold flex items-center gap-2 hover:bg-gray-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                Browse Courses
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
            
            <button className="px-8 py-3.5 rounded-full border border-white/10 text-white font-medium hover:bg-white/5 transition-colors flex items-center gap-2">
              <PlayCircle className="w-4 h-4 text-zinc-400" />
              Free Tutorials
            </button>
          </div>
        </div>

        {/* --- RIGHT SIDE: VISUALS (Modern Glass Card) --- */}
        <div className="w-full lg:w-1/2 relative order-1 lg:order-2 perspective-1000">
          
          {/* Main Card */}
          <div className="relative z-10 rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-neutral-900 group">
             {/* Image */}
             <div className="relative aspect-[4/3] w-full">
                <Image
                  src={courseImage}
                  alt="Grove Connect Academy"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-100"
                />
                {/* Gradient Overlay for Text Readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
             </div>

             {/* Floating UI Elements inside Card */}
             <div className="absolute bottom-6 left-6 right-6">
                <div className="flex items-center justify-between">
                   <div>
                      <p className="text-green-400 text-xs font-bold uppercase mb-1">Featured Course</p>
                      <h3 className="text-white font-bold text-xl">Digital Cinematography</h3>
                   </div>
                   <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                      <ArrowRight className="text-black" size={20} />
                   </div>
                </div>
             </div>
          </div>

          {/* Decorative Back Card (Offset) */}
          <div className="absolute top-4 -right-4 w-full h-full rounded-3xl border border-white/5 bg-white/5 -z-10 hidden md:block" />
          
        </div>

      </div>
    </section>
  )
}

export default AboutSection