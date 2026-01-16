'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Play, Handshake, X, ChevronRight } from 'lucide-react'
import { heroVideo } from '../assets' 

// --- TYPEWRITER COMPONENT (Same as before) ---
const TypewriterGlitchText = ({ text }: { text: string }) => {
  const [displayText, setDisplayText] = useState(text)
  const [animationState, setAnimationState] = useState<'idle' | 'glitch' | 'typing'>('idle')
  const targetText = useRef(text)

  useEffect(() => {
    if (text !== targetText.current) {
      targetText.current = text
      setAnimationState('glitch')
      const glitchTimer = setTimeout(() => {
        setDisplayText('')
        setAnimationState('typing')
      }, 300)
      return () => clearTimeout(glitchTimer)
    }
  }, [text])

  useEffect(() => {
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
      }, 30)
      return () => clearInterval(typeInterval)
    }
  }, [animationState])

  return (
    <span 
      className={`relative inline-block ${animationState === 'glitch' ? 'animate-glitch text-red-400' : ''} ${animationState === 'typing' ? 'border-r-2 border-green-400 animate-pulse' : ''}`}
      data-text={displayText} 
    >
      {displayText}
    </span>
  )
}

// --- MAIN COMPONENT ---
// Added 'onEnter' prop to tell parent when to close this section
const YouTubeShowcase = ({ onEnter }: { onEnter: () => void }) => {
  const [hoveredState, setHoveredState] = useState<'youtube' | 'brand' | null>(null)
  
  const getRevealText = () => {
    if (hoveredState === 'youtube') return "Click to explore our enlightening YouTube videos"
    if (hoveredState === 'brand') return "Click for brand deals & collaborations"
    return "Welcome to Grove Connect"
  }

  return (
    <div className="fixed inset-0 z-[50] w-full h-screen bg-black flex flex-col justify-center items-center overflow-hidden animate-in fade-in duration-700">
      
      {/* GLITCH STYLES */}
      <style jsx global>{`
        @keyframes glitch-anim {
          0% { clip-path: inset(20% 0 80% 0); transform: translate(-2px, 1px); }
          20% { clip-path: inset(60% 0 10% 0); transform: translate(2px, -1px); }
          40% { clip-path: inset(40% 0 50% 0); transform: translate(-2px, 2px); }
          60% { clip-path: inset(80% 0 5% 0); transform: translate(2px, -2px); }
          80% { clip-path: inset(10% 0 70% 0); transform: translate(-1px, 1px); }
          100% { clip-path: inset(30% 0 50% 0); transform: translate(1px, -1px); }
        }
        .animate-glitch::before, .animate-glitch::after {
          content: attr(data-text); position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: black;
        }
        .animate-glitch::before { left: 2px; text-shadow: -1px 0 #ff00c1; animation: glitch-anim 0.3s infinite linear alternate-reverse; }
        .animate-glitch::after { left: -2px; text-shadow: -1px 0 #00fff9; animation: glitch-anim 0.2s infinite linear alternate-reverse; }
      `}</style>

      {/* --- TOP RIGHT CLOSE BUTTON (Optional "Cancel" interaction) --- */}
      <button 
        onClick={onEnter}
        className="absolute top-8 right-8 z-30 text-white/50 hover:text-white transition-colors flex items-center gap-2 group"
      >
        <span className="text-sm uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Skip Intro</span>
        <X size={32} />
      </button>

      {/* Background Video */}
      <div className="absolute inset-0 z-0 opacity-40">
        <video className="w-full h-full object-cover" src={heroVideo} autoPlay muted loop playsInline />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/40" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-12 w-full max-w-5xl px-4">
        
        {/* Dynamic Text */}
        <div className="h-24 flex items-center justify-center w-full"> 
          <p className="text-center text-3xl md:text-5xl font-light tracking-wide text-gray-200">
             <TypewriterGlitchText text={getRevealText()} />
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row gap-8 md:gap-20 items-center">
          {/* YouTube */}
          <a href="https://www.youtube.com/@GroveConnect" target="_blank" rel="noreferrer"
             className="group flex flex-col items-center gap-4 cursor-pointer"
             onMouseEnter={() => setHoveredState('youtube')} onMouseLeave={() => setHoveredState(null)}>
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border border-white/20 bg-white/5 backdrop-blur-md flex items-center justify-center group-hover:bg-red-600 group-hover:border-red-600 transition-all duration-500">
              <Play className="w-10 h-10 text-white fill-white group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-white font-medium tracking-wider uppercase text-sm group-hover:text-red-400 transition-colors">Watch Content</span>
          </a>

          <div className="hidden md:block w-[1px] h-24 bg-white/20" />

          {/* Brand Deals */}
          <a href="mailto:groveconn3ct22@gmail.com"
             className="group flex flex-col items-center gap-4 cursor-pointer"
             onMouseEnter={() => setHoveredState('brand')} onMouseLeave={() => setHoveredState(null)}>
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border border-white/20 bg-white/5 backdrop-blur-md flex items-center justify-center group-hover:bg-green-600 group-hover:border-green-600 transition-all duration-500">
              <Handshake className="w-10 h-10 text-white group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-white font-medium tracking-wider uppercase text-sm group-hover:text-green-400 transition-colors">Brand Deals</span>
          </a>
        </div>

        {/* --- MAIN ENTRY BUTTON --- */}
        <button 
          onClick={onEnter}
          className="mt-12 group relative px-8 py-4 bg-transparent overflow-hidden rounded-full border border-white/30 hover:border-green-500 transition-colors duration-300"
        >
          <div className="absolute inset-0 w-0 bg-green-600 transition-all duration-[250ms] ease-out group-hover:w-full opacity-10" />
          <div className="relative cursor-pointer flex items-center gap-3">
             <span className="text-lg text-white font-light  tracking-widest uppercase">Enter Website</span>
             <ChevronRight className="text-white group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

      </div>
    </div>
  )
}

export default YouTubeShowcase