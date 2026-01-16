'use client'

import React from 'react'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

const CTASection = () => {
  return (
    <section className="relative w-full py-24 md:py-32 px-6 md:px-12 bg-black overflow-hidden z-10 border-t border-green-500/10">
      
      {/* Radiant Background Effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-green-900/40 via-black to-emerald-900/40 opacity-60" />
      <div className="absolute -top-[50%] left-[20%] w-[800px] h-[800px] bg-green-500/20 blur-[150px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center gap-8">
        <h2 className="text-4xl md:text-6xl font-bold text-white leading-tight">
          Ready to Dominate the <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">
            Digital Space?
          </span>
        </h2>
        <p className="text-xl text-gray-300 max-w-2xl">
          Join thousands of creators who are leveling up their skills and building sustainable careers with Grove Connect.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
           <Link href="/auth">
            <button className="flex items-center justify-center gap-2 cursor-pointer bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-full font-bold text-lg transition-all duration-300 shadow-lg shadow-green-900/30 hover:shadow-green-900/50 hover:scale-105">
              Get Started Now
              <ArrowRight className="w-5 h-5" />
            </button>
           </Link>
             <button className="flex items-center justify-center border border-white/20 cursor-pointer gap-2 bg-white/10 hover:border-green-400 hover:bg-green-500/10 text-white px-8 py-4 rounded-full font-bold text-lg transition-all duration-300 backdrop-blur-md">
              View Pricing
            </button>
        </div>
      </div>
    </section>
  )
}

export default CTASection