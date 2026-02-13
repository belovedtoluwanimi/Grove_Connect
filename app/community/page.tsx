import React from 'react'
import { MessageSquare } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function CommunityPage() {
  return (
    <div className="h-screen bg-[#050505] flex items-center justify-center text-white px-6 text-center">
        <Navbar />
        <div className="max-w-xl">
            <div className="w-16 h-16 bg-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-indigo-400"><MessageSquare size={32}/></div>
            <h1 className="text-4xl font-bold mb-4">Join the Grove Community</h1>
            <p className="text-zinc-400 mb-8">Connect with 10,000+ creators on our exclusive Discord server. Share work, get feedback, and find collaborators.</p>
            <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-full font-bold transition-all">Launch Discord</button>
        </div>
        <Footer />
    </div>
  )
}