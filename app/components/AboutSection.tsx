'use client'

import React from 'react'
import Image from 'next/image'
import { CheckCircle2, ArrowRight, PlayCircle, BookOpen } from 'lucide-react'
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
    // CHANGED: py-16 md:py-0  ->  py-20 md:py-32
    <section className="relative w-full min-h-screen flex items-center justify-center bg-[#2e2e2e] py-20 md:py-32 px-6 md:px-12 overflow-hidden border-t border-green-500/10 z-0">
      
      {/* --- AMBIENT GRADIENTS --- */}
      <div className="absolute -top-[20%] -left-[10%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] rounded-full bg-green-600/20 blur-[80px] md:blur-[100px] -z-10 pointer-events-none" />
      <div className="absolute -bottom-[20%] -right-[10%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] rounded-full bg-emerald-600/20 blur-[80px] md:blur-[100px] -z-10 pointer-events-none" />

      {/* CONTAINER */}
      <div className="max-w-7xl w-full mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-20 relative z-10">
        
        {/* RIGHT SIDE (Image) - MOVED FIRST ON MOBILE FOR VISUAL IMPACT */}
        {/* On Mobile: Order 1. On Desktop: Order 2 (lg:order-2) */}
        <div className="w-full lg:w-1/2 relative order-1 lg:order-2">
          
          {/* Decorative Elements */}
          <div className="absolute -top-6 -right-6 w-2/3 h-full border-2 border-green-500/20 rounded-3xl z-0 hidden md:block" />
          <div className="absolute -bottom-6 -left-6 w-2/3 h-full bg-neutral-900/50 rounded-3xl z-0 hidden md:block" />
          
          {/* Main Image Card */}
          <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl shadow-green-900/20 border border-white/10 group aspect-video lg:aspect-[4/3]">
             {/* Hover Overlay */}
            <div className="absolute inset-0 bg-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-20 pointer-events-none" />
            
            <Image
              src={courseImage}
              alt="Grove Connect Digital Courses"
              fill
              className="object-cover transform transition-transform duration-700 group-hover:scale-105"
            />

            {/* Floating Badge (Mobile & Desktop) */}
            <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-md border border-green-500/30 px-4 py-2 rounded-lg flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs md:text-sm font-medium text-white">New Courses Available</span>
            </div>
          </div>
        </div>

        {/* LEFT SIDE (Text Content) */}
        {/* On Mobile: Order 2. On Desktop: Order 1 (lg:order-1) */}
        <div className="w-full lg:w-1/2 flex flex-col gap-6 md:gap-8 order-2 lg:order-1">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-4 h-4 text-green-400" />
              <span className="text-green-400 font-medium tracking-widest uppercase text-xs md:text-sm">
                Grove Academy
              </span>
            </div>
            
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
              Master the Skills of <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-700">
                Tomorrow, Today.
              </span>
            </h2>
            
            <p className="text-gray-400 text-base md:text-lg leading-relaxed">
              Unlock your potential with our expert-led digital courses. Whether you want to 
              launch a YouTube channel, code your first website, or master video production, 
              Grove Connect provides the structured learning path you need to succeed in the creator economy.
            </p>
          </div>

          {/* Feature List */}
          <div className="grid grid-cols-1 gap-3 md:gap-4">
            {courseFeatures.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 group p-2 rounded-lg hover:bg-white/5 transition-colors cursor-default">
                <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 text-green-500 flex-shrink-0 group-hover:scale-110 transition-transform duration-300" />
                <span className="text-sm md:text-base text-gray-300 group-hover:text-white transition-colors">
                  {item}
                </span>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="pt-2 md:pt-4 flex flex-col sm:flex-row gap-4">
            <Link href="/courses">
              <button className="flex items-center cursor-pointer justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full font-medium transition-all duration-300 shadow-lg shadow-green-900/20 hover:shadow-green-900/40">
              Browse Courses
              <ArrowRight className="w-4 h-4" />
            </button>
            </Link>
            
            <Link href="https://www.youtube.com/@GroveConnect" target="_blank" rel="noopener noreferrer">
            <button className="flex items-center justify-center cursor-pointer  gap-2 text-white border border-white/20 hover:border-green-500/50 px-6 py-3 rounded-full font-medium transition-all duration-300 hover:bg-green-400/5">
              <PlayCircle className="w-4 h-4 text-green-400" />
              Free Tutorials
            </button></Link>
          </div>
        </div>

      </div>
    </section>
  )
}

export default AboutSection