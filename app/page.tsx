'use client'

import React, { useState } from 'react'
import Preloader from './components/Preloader'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import AboutSection from './components/AboutSection'
import YouTubeShowcase from './components/YoutubeShowcase'

// Define the stages of the user journey
type PageStage = 'preloader' | 'intro' | 'main'

const Home = () => {
  const [stage, setStage] = useState<PageStage>('preloader')

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
        <main className="bg-black min-h-screen w-full animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <Navbar />
          
          {/* Simple Hero Section */}
          <div className="relative h-screen w-full">
            <Hero />
          </div>

          {/* About Section */}
          <div className="relative z-20 bg-black">
            <AboutSection />
          </div>
          
        </main>
      )}
    </>
  )
}

export default Home