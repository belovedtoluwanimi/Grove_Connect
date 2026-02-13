'use client'

import React, { useState } from 'react'
import Preloader from './components/Preloader'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import AboutSection from './components/AboutSection'
import YouTubeShowcase from './components/YoutubeShowcase'
// --- NEW IMPORTS ---
import FeaturesSection from './components/FeaturesSection'
import CoursesSection from './components/CoursesSection'
import TestimonialsSection from './components/TestimonialsSection'
import CTASection from './components/CTASection'
import Footer from './components/Footer'

type PageStage = 'preloader' | 'intro' | 'main'

const Home = () => {
  const [stage, setStage] = useState<PageStage>('preloader')

  // Helper to skip ahead for development testing if needed
  // const [stage, setStage] = useState<PageStage>('main') 

  return (
    <>
      {/* STAGE 1: PRELOADER */}
      {stage === 'preloader' && (
        <Preloader onFinish={() => setStage('intro')} />
      )}

      {/* STAGE 2: INTRO / YOUTUBE SHOWCASE */}
      {stage === 'intro' && (
        <YouTubeShowcase onEnter={() => setStage('main')} />
      )}

      {/* STAGE 3: MAIN WEBSITE */}
      {stage === 'main' && (
        <main id='main' className="bg-black min-h-screen w-full animate-in fade-in slide-in-from-bottom-4 duration-1000 flex flex-col">
          <Navbar />
          
          {/* Hero Section */}
          <div className="relative h-screen w-full">
            <Hero />
          </div>

          {/* About Section (Grove Academy Intro) */}
          <AboutSection />

          {/* --- NEW SECTIONS STACKED BELOW --- */}
          
          {/* Why Us? */}
          <FeaturesSection />

          {/* The Products */}
          <CoursesSection />
          
          {/* Social Proof */}
          <TestimonialsSection />
          
          {/* Final Push */}
          <CTASection />

          {/* Footer */}
          <Footer />
          
        </main>
      )}
    </>
  )
}

export default Home