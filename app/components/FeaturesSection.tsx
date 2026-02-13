'use client'

import React, { useState, useEffect } from 'react'
import { Zap, Users, TrendingUp, Award } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// --- DATA ---
// Just the nouns, so we can construct "Built for [Noun] by [Noun]"
const NOUNS = [
  "Creators",
  "YouTubers",
  "Programmers",
  "Editors",
  "Founders",
  "Students",
  "Tutors"
]

const features = [
  {
    icon: <Zap className="w-8 h-8 text-green-400" />,
    title: "Actionable Strategies",
    description: "Skip the fluff. Our courses focus on practical steps you can implement immediately to see results."
  },
  {
    icon: <Users className="w-8 h-8 text-green-400" />,
    title: "Vibrant Community",
    description: "Join a network of like-minded creators. Collaborate, share feedback, and grow together."
  },
  {
    icon: <TrendingUp className="w-8 h-8 text-green-400" />,
    title: "Proven Growth Tactics",
    description: "Learn the exact methods we've used to build massive audiences across multiple platforms."
  },
  {
    icon: <Award className="w-8 h-8 text-green-400" />,
    title: "Expert-Led Instructors",
    description: "Learn directly from industry professionals who are actively succeeding in the creator economy right now."
  }
]

// Helper component for the animated word to keep code clean
const AnimatedWord = ({ word }: { word: string }) => (
  <div className="relative h-[1.2em] min-w-[2ch] inline-flex items-center overflow-hidden align-bottom">
    <AnimatePresence mode="popLayout">
      <motion.span
        key={word}
        initial={{ y: "100%" }} // Start from bottom
        animate={{ y: 0 }}      // Slide to center
        exit={{ y: "-100%" }}   // Slide out to top
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="block text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600 px-1"
      >
        {word}
      </motion.span>
    </AnimatePresence>
  </div>
)

const FeaturesSection = () => {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % NOUNS.length)
    }, 3000)
    return () => clearInterval(timer)
  }, [])

  return (
    <section className="relative w-full py-20 md:py-32 px-6 md:px-12 bg-neutral-950 border-t border-green-500/10 z-10">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="text-center mb-16 md:mb-24">
          <span className="text-green-400 font-medium tracking-widest uppercase text-sm">
            Why Choose Us
          </span>
          
          <h2 className="text-3xl md:text-5xl font-bold text-white mt-4 mb-6 leading-tight flex flex-wrap justify-center gap-x-2 md:gap-x-3">
            {/* The Static and Dynamic Text Line */}
            <span className="whitespace-nowrap">Built for</span>
            <AnimatedWord word={NOUNS[index]} />
            <span className="whitespace-nowrap">by</span>
            <AnimatedWord word={NOUNS[index]} />
            <span>.</span>
          </h2>

          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            We provide the ecosystem you need to turn your passion into a sustainable career.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, idx) => (
            <div key={idx} className="group p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-green-500/50 hover:bg-white/10 transition-all duration-300 relative overflow-hidden">
              {/* Hover Gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
              
              <div className="mb-6 p-4 bg-black/50 rounded-xl w-fit border border-green-500/20 group-hover:border-green-500/50 transition-colors">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-4 group-hover:text-green-400 transition-colors">
                {feature.title}
              </h3>
              <p className="text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default FeaturesSection