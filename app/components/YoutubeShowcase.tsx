'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Play, Handshake } from 'lucide-react'
import { heroVideo } from '../assets' 

// --- 1. SPECIAL ANIMATED TEXT COMPONENT ---
const TypewriterGlitchText = ({ text }: { text: string }) => {
  const [displayText, setDisplayText] = useState(text)
  const [animationState, setAnimationState] = useState<'idle' | 'glitch' | 'typing'>('idle')
  
  // We use a ref to track the actual target text we want to show
  const targetText = useRef(text)

  useEffect(() => {
    // If the prop changes, start the "Exit" (Glitch) sequence
    if (text !== targetText.current) {
      targetText.current = text
      setAnimationState('glitch')

      // Phase 1: Glitch for 300ms (Exit)
      const glitchTimer = setTimeout(() => {
        setDisplayText('') // Clear text for typewriter start
        setAnimationState('typing') // Switch to typing mode
      }, 300)

      return () => clearTimeout(glitchTimer)
    }
  }, [text])

  useEffect(() => {
    // Phase 2: Typewriter Effect (Entry)
    if (animationState === 'typing') {
      let currentIndex = 0
      const fullText = targetText.current
      
      const typeInterval = setInterval(() => {
        if (currentIndex <= fullText.length) {
          setDisplayText(fullText.slice(0, currentIndex))
          currentIndex++
        } else {
          clearInterval(typeInterval)
          setAnimationState('idle')
        }
      }, 30) // Typing speed (lower = faster)

      return () => clearInterval(typeInterval)
    }
  }, [animationState])

  return (
    <span 
      className={`
        relative inline-block
        ${animationState === 'glitch' ? 'animate-glitch text-red-400' : ''}
        ${animationState === 'typing' ? 'border-r-2 border-green-400 animate-pulse' : ''}
      `}
      // Adding a data-text attribute helps CSS create the "ghost" glitch layers
      data-text={displayText} 
    >
      {displayText}
    </span>
  )
}

// --- 2. MAIN COMPONENT ---
const YouTubeShowcase = () => {
  const [hoveredState, setHoveredState] = useState<'youtube' | 'brand' | null>(null)
  
  const getRevealText = () => {
    if (hoveredState === 'youtube') return "Click to explore our enlightening YouTube videos"
    if (hoveredState === 'brand') return "Click for brand deals & collaborations"
    return "Explore Grove Connect"
  }

  return (
    <div id='youtube' className="relative w-full min-h-screen bg-black flex flex-col justify-center items-center">
      
      {/* --- INJECT STYLES FOR GLITCH ANIMATION --- */}
      <style jsx global>{`
        @keyframes glitch-anim {
          0% { clip-path: inset(20% 0 80% 0); transform: translate(-2px, 1px); }
          20% { clip-path: inset(60% 0 10% 0); transform: translate(2px, -1px); }
          40% { clip-path: inset(40% 0 50% 0); transform: translate(-2px, 2px); }
          60% { clip-path: inset(80% 0 5% 0); transform: translate(2px, -2px); }
          80% { clip-path: inset(10% 0 70% 0); transform: translate(-1px, 1px); }
          100% { clip-path: inset(30% 0 50% 0); transform: translate(1px, -1px); }
        }
        .animate-glitch {
          position: relative;
        }
        .animate-glitch::before,
        .animate-glitch::after {
          content: attr(data-text);
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: black;
        }
        .animate-glitch::before {
          left: 2px;
          text-shadow: -1px 0 #ff00c1;
          animation: glitch-anim 0.3s infinite linear alternate-reverse;
        }
        .animate-glitch::after {
          left: -2px;
          text-shadow: -1px 0 #00fff9;
          animation: glitch-anim 0.2s infinite linear alternate-reverse;
        }
      `}</style>

      {/* Top Gradient Fade */}
      <div className="absolute -top-32 left-0 w-full h-32 bg-gradient-to-b from-transparent to-black z-20 pointer-events-none" />

      {/* Background Video */}
      <div className="absolute inset-0 z-0 opacity-40">
        <video
          className="w-full h-full object-cover"
          src={heroVideo} 
          autoPlay
          muted
          loop
          playsInline
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 flex flex-col items-center gap-12 w-full max-w-4xl px-4 mt-10">
        
        {/* Dynamic Reveal Text Area */}
        <div className="h-20 flex items-center justify-center w-full"> 
          {/* Fixed height (h-20) prevents layout jumps during text changes */}
          <p className="text-center text-2xl md:text-5xl w-full font-light tracking-wide text-gray-200">
             <TypewriterGlitchText text={getRevealText()} />
          </p>
        </div>

        {/* Buttons Container */}
        <div className="flex flex-col md:flex-row gap-8 md:gap-16 items-center">
          
          {/* Button 1: YouTube */}
          <a 
            href="https://www.youtube.com/@GroveConnect" 
            target="_blank"
            rel="noreferrer"
            className="group relative flex flex-col items-center gap-4 cursor-pointer"
            onMouseEnter={() => setHoveredState('youtube')}
            onMouseLeave={() => setHoveredState(null)}
          >
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border border-white/20 bg-white/5 backdrop-blur-md flex items-center justify-center group-hover:bg-red-600 group-hover:border-red-600 transition-all duration-500 shadow-2xl group-hover:shadow-[0_0_40px_rgba(220,38,38,0.5)]">
              <Play className="w-10 h-10 md:w-12 md:h-12 text-white fill-white group-hover:scale-110 transition-transform duration-300" />
            </div>
            <span className="text-white font-medium tracking-wider uppercase text-sm group-hover:text-red-400 transition-colors">
              Watch Content
            </span>
          </a>

          {/* Divider */}
          <div className="hidden md:block w-[1px] h-24 bg-gradient-to-b from-transparent via-gray-500 to-transparent" />

          {/* Button 2: Brand Deals */}
          <a 
            href="mailto:groveconn3ct22@gmail.com" // Fixed: Added 'mailto:' prefix
            className="group relative flex flex-col items-center gap-4 cursor-pointer"
            onMouseEnter={() => setHoveredState('brand')}
            onMouseLeave={() => setHoveredState(null)}
          >
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border border-white/20 bg-white/5 backdrop-blur-md flex items-center justify-center group-hover:bg-green-600 group-hover:border-green-600 transition-all duration-500 shadow-2xl group-hover:shadow-[0_0_40px_rgba(22,163,74,0.5)]">
              <Handshake className="w-10 h-10 md:w-12 md:h-12 text-white group-hover:scale-110 transition-transform duration-300" />
            </div>
            <span className="text-white font-medium tracking-wider uppercase text-sm group-hover:text-green-400 transition-colors">
              Brand Deals
            </span>
          </a>

        </div>
      </div>
    </div>
  )
}

export default YouTubeShowcase