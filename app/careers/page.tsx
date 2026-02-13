import React from 'react'
import { ArrowRight } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function CareersPage() {
  return (
    <div className="pt-32 pb-20 bg-[#050505] min-h-screen text-white px-6">
        <Navbar />
        <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl font-black mb-8">Join the <span className="text-emerald-500">Grove Team</span></h1>
            <p className="text-xl text-zinc-400 mb-16">We're looking for passionate individuals to help us shape the future of creator education.</p>
            
            <div className="space-y-4">
                {['Senior React Developer', 'Product Designer', 'Community Manager', 'Video Editor'].map(job => (
                    <div key={job} className="flex items-center justify-between p-6 bg-zinc-900/50 border border-white/10 rounded-xl hover:border-emerald-500/50 transition-all cursor-pointer group">
                        <div>
                            <h3 className="font-bold text-lg text-white">{job}</h3>
                            <p className="text-sm text-zinc-500">Remote • Full-Time</p>
                        </div>
                        <ArrowRight className="text-zinc-500 group-hover:text-emerald-500 transition-colors" />
                    </div>
                ))}
            </div>
        </div>
        <Footer />
    </div>
  )
}