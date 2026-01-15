'use client'

import React, { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Hero from './Hero'
import YouTubeShowcase from './YoutubeShowcase'

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const HomeWrapper = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const youtubeRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top top", // When top of container hits top of screen
        end: "+=100%",   // Scroll distance = 100% of viewport height
        pin: true,       // PIN THE SCREEN: Locks the user in place while animating
        scrub: 1,        // 1s delay on scrub makes it feel smooth/weighty (like auto-scroll)
        anticipatePin: 1 // Prevents a small jitter when pinning starts
      }
    })

    // --- ANIMATION SEQUENCE ---
    // 1. YouTube Slide Up (Primary Action)
    // We move the YouTube section from top:100% (below screen) to top:0% (on screen)
    tl.to(youtubeRef.current, {
      yPercent: -100,
      ease: "none", // Linear is best for scrub
    })

    // 2. Hero Effects (Secondary Action)
    // Happens simultaneously ("<")
    tl.to(heroRef.current, {
      filter: "blur(15px) brightness(0.3)",
      scale: 0.95,
      ease: "none"
    }, "<") // Start at beginning
    
    // 3. Hero Text Fade
    tl.to("#hero-content", { 
      opacity: 0, 
      y: -50,
      ease: "power1.in"
    }, "<")

  }, { scope: containerRef })

  return (
    // CONTAINER: We set it to h-screen.
    // GSAP will handle the "length" of the scroll via the 'pin' property.
    <div ref={containerRef} className="relative w-full h-screen overflow-hidden">
      
      {/* HERO SECTION */}
      <div ref={heroRef} id="hero-container" className="absolute inset-0 w-full h-full z-0">
        <Hero />
      </div>

      {/* YOUTUBE SECTION */}
      {/* Positioned initially 'top-full' (just below the screen) */}
      <div 
        ref={youtubeRef} 
        id="youtube-container" 
        className="absolute top-full left-0 w-full h-full z-10 bg-black"
      >
         <YouTubeShowcase />
      </div>

    </div>
  )
}

export default HomeWrapper