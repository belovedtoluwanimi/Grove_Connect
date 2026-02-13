import React from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function BlogPage() {
  return (
    <div className="pt-32 pb-20 bg-[#050505] min-h-screen text-white px-6">
        <Navbar />
        <h1 className="text-4xl font-bold mb-12 text-center">Latest from the Blog</h1>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1,2,3].map(i => (
                <div key={i} className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden hover:border-emerald-500/30 transition-all">
                    <div className="h-48 bg-zinc-800" />
                    <div className="p-6">
                        <span className="text-emerald-400 text-xs font-bold uppercase">Tutorial</span>
                        <h3 className="text-xl font-bold mt-2 mb-3">How to scale your channel in 2026</h3>
                        <p className="text-zinc-400 text-sm">A deep dive into the new algorithm changes...</p>
                    </div>
                </div>
            ))}
        </div>
        <Footer />
    </div>
  )
}