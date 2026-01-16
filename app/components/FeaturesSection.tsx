'use client'

import React from 'react'
import { Zap, Users, TrendingUp, Award } from 'lucide-react'

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

const FeaturesSection = () => {
  return (
    <section className="relative w-full py-20 md:py-32 px-6 md:px-12 bg-neutral-950 border-t border-green-500/10 z-10">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="text-center mb-16 md:mb-24">
          <span className="text-green-400 font-medium tracking-widest uppercase text-sm">
            Why Choose Us
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-white mt-4 mb-6">
            Built for Creators, by Creators.
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