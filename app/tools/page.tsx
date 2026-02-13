import React from 'react'
import { PenTool, Video, Mic } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function ToolsPage() {
  return (
    <div className="pt-32 pb-20 bg-[#050505] min-h-screen text-white px-6">
        <Navbar />
        <h1 className="text-4xl font-bold mb-12 text-center">Creator Toolkit</h1>
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
            <ToolCard icon={Video} name="Thumbnail Generator" desc="Create clicky thumbnails in seconds." />
            <ToolCard icon={PenTool} name="Script Writer AI" desc="Generate video scripts with AI." />
            <ToolCard icon={Mic} name="Audio Enhancer" desc="Remove background noise instantly." />
        </div>
        <Footer />
    </div>
  )
}

const ToolCard = ({icon:Icon, name, desc}: any) => (
    <div className="p-6 bg-zinc-900/50 border border-white/10 rounded-2xl hover:bg-zinc-900 transition-colors cursor-pointer">
        <Icon className="text-emerald-400 mb-4" size={24} />
        <h3 className="font-bold text-white mb-2">{name}</h3>
        <p className="text-zinc-400 text-sm">{desc}</p>
    </div>
)