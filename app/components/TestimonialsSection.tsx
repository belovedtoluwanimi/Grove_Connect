'use client'

import React from 'react'
import { Quote } from 'lucide-react'

const testimonials = [
  {
    quote: "Grove Academy completely changed my perspective on content creation. The strategies are practical and immediately actionable. My channel grew by 300% in 3 months.",
    name: "Alex Rivera",
    role: "YouTube Creator (50K Subs)"
  },
  {
    quote: "The video editing masterclass is gold. I went from basic cuts to producing cinematic travel films that brands are now paying me for. Best investment I've made.",
    name: "Sarah Chen",
    role: "Freelance Videographer"
  },
  {
    quote: "What I love most is the community. It's not just courses; it's a support network. Connecting with other serious creators has been invaluable for my growth.",
    name: "David Okonkwo",
    role: "Digital Entrepreneur"
  }
]

const TestimonialsSection = () => {
  return (
    <section className="relative w-full py-20 md:py-32 px-6 md:px-12 bg-neutral-950 border-t border-green-500/10 z-10">
      
      {/* Subtle background glow */}
       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-600/10 blur-[120px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
           <span className="text-green-400 font-medium tracking-widest uppercase text-sm">
              Testimonials
            </span>
          <h2 className="text-3xl md:text-5xl font-bold text-white mt-4">
            Trusted by Creators Worldwide
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((item, idx) => (
            <div key={idx} className="relative p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 flex flex-col gap-6 hover:-translate-y-2 transition-transform duration-300">
              <Quote className="w-10 h-10 text-green-500/50" />
              <p className="text-lg text-gray-300 leading-relaxed italic">
                "{item.quote}"
              </p>
              <div className="mt-auto pt-4 flex flex-col">
                <span className="text-white font-bold text-lg">{item.name}</span>
                <span className="text-green-400 text-sm">{item.role}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default TestimonialsSection