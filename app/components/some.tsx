'use client'

import React from 'react'
import { heroImage } from '../assets' 
import Image from 'next/image'
import MagicButton from './MagicButton'
import { TextGenerateEffect } from './ui/TextGenerateEffect'
import { CircleArrowOutUpRightIcon, LayoutDashboard, GraduationCap } from 'lucide-react'

const Hero = () => {
  return (
    <div id='home' className="relative w-full h-screen overflow-hidden">
      {/* Background Image */}
      <Image
        src={heroImage}
        alt='Hero'
        fill
        className="w-full h-full object-cover"
        priority 
      />

      {/* Overlay 
        - Darker gradient for better text readability
      */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80 flex justify-center items-center px-5">
        
        <div id="hero-content" className="relative flex flex-col items-center justify-center max-w-[89vw] md:max-w-3xl z-10 text-center">
          
          {/* Badge / Tagline */}
          <div className="mb-6 flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-xs font-medium uppercase tracking-wider text-green-300">
              The Future of EdTech is Live
            </span>
          </div>

          {/* Heading - Reflecting the Dual Nature (Tutor + Student) */}
          <TextGenerateEffect
            words="Teach without limits Learn without boundaries"
            className="text-center text-[40px] md:text-5xl lg:text-7xl leading-tight font-bold tracking-tight"
          />

          {/* Subtext - Highlighting specific features we built */}
          <p className="text-center md:tracking-wide mb-8 text-sm md:text-lg text-gray-300 mt-6 max-w-2xl leading-relaxed">
            Experience the complete ecosystem. Instructors get 
            <span className="text-white font-bold"> real-time analytics</span> and 
            <span className="text-white font-bold"> seamless course creation</span>. 
            Students get 
            <span className="text-white font-bold"> gamified progress</span>, 
            <span className="text-white font-bold"> streaks</span>, and 
            <span className="text-white font-bold"> certifications</span>.
          </p>

          {/* Buttons Wrapper */}
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            
            <a href="/auth">
              <MagicButton 
                title="Start Your Journey"
                icon={<CircleArrowOutUpRightIcon size={18} />}
                position="right"
              />
            </a>

            {/* Secondary Link (Optional text link for visual balance) */}
            <div className="flex gap-6 mt-4 sm:mt-0 text-sm text-gray-400 font-medium">
               <div className="flex items-center gap-2">
                  <LayoutDashboard size={16} className="text-green-500"/>
                  <span>Instructor Hub</span>
               </div>
               <div className="w-[1px] h-4 bg-white/10"></div>
               <div className="flex items-center gap-2">
                  <GraduationCap size={16} className="text-blue-500"/>
                  <span>Student Portal</span>
               </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  )
}

export default Hero