'use client'

import React, { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { Observer } from 'gsap/Observer'
import Hero from './Hero'
import YouTubeShowcase from './YoutubeShowcase'

if (typeof window !== "undefined") {
  gsap.registerPlugin(Observer);
}

const HomeWrapper = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const isAnimating = useRef(false)
  const currentSection = useRef(0)

  useGSAP(() => {
    
    // 1. INITIAL SETUP: Force GSAP to handle positioning
    // We set YouTube section to be 100% down (off-screen) immediately
    gsap.set("#youtube-container", { yPercent: 100, autoAlpha: 1 });
    gsap.set("#hero-container", { zIndex: 10 });

    // --- ANIMATION FUNCTION ---
    const gotoSection = (index: number) => {
      if (isAnimating.current) return
      isAnimating.current = true

      const tl = gsap.timeline({
        defaults: { duration: 1.0, ease: "power3.inOut" },
        onComplete: () => {
          isAnimating.current = false
        }
      })

      if (index === 1) {
        // SCROLL DOWN -> SHOW YOUTUBE
        tl.to("#hero-container", {
          yPercent: -20, 
          autoAlpha: 0,
          filter: "blur(10px) brightness(0.4)",
          scale: 0.95,
        })
        .to("#youtube-container", { 
          yPercent: 0, // Slide UP to center
        }, "<")
      } else {
        // SCROLL UP -> SHOW HERO
        tl.to("#youtube-container", {
          yPercent: 100, // Slide DOWN off-screen
        })
        .to("#hero-container", {
          yPercent: 0,
          autoAlpha: 1,
          filter: "blur(0px) brightness(1)",
          scale: 1,
        }, "<")
      }
    }

    // --- OBSERVER ---
    Observer.create({
      target: window,
      type: "wheel,touch,pointer",
      
      // FIX: wheelSpeed -1 usually fixes the "inverted" feel on mouse wheels
      wheelSpeed: -1,
      
      // SENSITIVITY: Lower = More Immediate
      tolerance: 5,
      preventDefault: true,

      onUp: () => {
        // Logic: Moving "Up" means looking at content below (Next Section)
        if (!isAnimating.current && currentSection.current === 0) {
          currentSection.current = 1;
          gotoSection(1);
        }
      },
      
      onDown: () => {
        // Logic: Moving "Down" means looking at content above (Prev Section)
        if (!isAnimating.current && currentSection.current === 1) {
          currentSection.current = 0;
          gotoSection(0);
        }
      },
    })

  }, { scope: containerRef })

  return (
    <div ref={containerRef} className="relative w-full h-screen overflow-hidden bg-black touch-none">
      
      {/* SECTION 1: HERO */}
      <div 
        id="hero-container" 
        className="absolute inset-0 w-full h-full will-change-transform"
      >
        <Hero />
      </div>

      {/* SECTION 2: YOUTUBE SHOWCASE */}
      {/* REMOVED 'translate-y-[100%]' class to avoid conflict. GSAP handles it now. */}
      <div 
        id="youtube-container" 
        className="absolute top-0 inset-x-0 w-full h-full z-20 will-change-transform bg-black"
      >
        <YouTubeShowcase />
      </div>

    </div>
  )
}

export default HomeWrapper