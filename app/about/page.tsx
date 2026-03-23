'use client'

import React, { useRef, useState, useEffect } from 'react'
import Image from 'next/image'
import Navbar from '../components/Navbar' // Adjust path if necessary
import Footer from '../components/Footer' // Adjust path if necessary
import { Linkedin, Twitter, Youtube, ArrowRight, Volume2, VolumeX, MapPin, Target, Eye } from 'lucide-react'
import { motion, useScroll, useTransform } from 'framer-motion'

// REPLACE these with actual founder photos from your assets
import { Ajiboss, Daniel, Dunsin, EmmaDesigns, Eniola, heroImage, Joseph, Obong } from '../assets' 

// --- 1. FOUNDER DATA STRUCTURE ---
type FounderData = {
  name: string
  role: string
  bio: string[]
  image: any 
  socials: {
    linkedin?: string
    twitter?: string
    youtube?: string
  }
}

const founders: FounderData[] = [
  {
    name: "Beloved Joseph",
    role: "CEO & Co-Founder | The Visionary",
    image: Joseph, 
    bio: [
      "Beloved spent over a decade in digital media strategy, realizing that the tools available to creators were fragmented and outdated.",
      "Driven by an obsession with efficiency and community building, Beloved founded Grove Connect to unify the creator journey into one seamless ecosystem. They believe that the future of the economy is built by individuals, not just corporations."
    ],
    socials: {
      linkedin: "www.linkedin.com/in/joseph-beloved-3152b8293",
      twitter: "#"
    }
  },
  {
    name: "Eniola Adekeye",
    role: "CTO & Co-Founder | The Architect",
    image: Eniola, 
    bio: [
      "A former lead engineer at major tech giants, Eniola saw the technical hurdles holding brilliant creatives back.",
      "She architected the Grove Connect platform from the ground up, focusing on scalability, speed, and an intuitive user experience. Her mission is to make complex technology invisible so creators can focus purely on their craft."
    ],
    socials: {
      linkedin: "#",
      twitter: "#",
      youtube: "#"
    }
  },
  {
    name: "Oluwadunsin Olowonirejuaro",
    role: "Head of Community & Growth | The Catalyst",
    image: Dunsin, 
    bio: [
      "Oluwadunsin started as a YouTube creator himself, growing a community to over 500K subscribers. He understands the lonely grind of the creator path intimately.",
      "At Grove Connect, he bridges the gap between platform and people. He leads our educational initiatives and ensures that our community remains a vibrant, supportive space for genuine collaboration."
    ],
    socials: {
      linkedin: "#",
      twitter: "#",
      youtube: "#"
    }
  },
  {
    name: "Emmanuel Ajibola",
    role: "Head of Community & Growth | The Catalyst",
    image: Ajiboss, 
    bio: [
      "Emmanuel started as a YouTube creator himself, growing a community to over 500K subscribers. He understands the lonely grind of the creator path intimately.",
      "At Grove Connect, he bridges the gap between platform and people. He leads our educational initiatives and ensures that our community remains a vibrant, supportive space for genuine collaboration."
    ],
    socials: {
      linkedin: "#",
      twitter: "#",
      youtube: "#"
    }
  },
  {
    name: "Daniel Akerele",
    role: "Head of Community & Growth | The Catalyst",
    image: Daniel, 
    bio: [
      "Daniel started as a YouTube creator himself, growing a community to over 500K subscribers. He understands the lonely grind of the creator path intimately.",
      "At Grove Connect, he bridges the gap between platform and people. He leads our educational initiatives and ensures that our community remains a vibrant, supportive space for genuine collaboration."
    ],
    socials: {
      linkedin: "#",
      twitter: "#",
      youtube: "#"
    }
  },
  {
    name: "Emmanuel Olorunmola",
    role: "Head of Community & Growth | The Catalyst",
    image: EmmaDesigns, 
    bio: [
      "Emmanuel started as a YouTube creator himself, growing a community to over 500K subscribers. He understands the lonely grind of the creator path intimately.",
      "At Grove Connect, he bridges the gap between platform and people. He leads our educational initiatives and ensures that our community remains a vibrant, supportive space for genuine collaboration."
    ],
    socials: {
      linkedin: "#",
      twitter: "#",
      youtube: "#"
    }
  },
  {
    name: "George Ifiok",
    role: "Head of Community & Growth | The Catalyst",
    image: Obong, 
    bio: [
      "George started as a YouTube creator himself, growing a community to over 500K subscribers. He understands the lonely grind of the creator path intimately.",
      "At Grove Connect, he bridges the gap between platform and people. He leads our educational initiatives and ensures that our community remains a vibrant, supportive space for genuine collaboration."
    ],
    socials: {
      linkedin: "#",
      twitter: "#",
      youtube: "#"
    }
  }
]

// --- 2. THE CINEMATIC STORY PAGE ---
const AboutPage = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isMuted, setIsMuted] = useState(true)

  // --- PARALLAX SCROLLING HOOKS ---
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] })
  const yBg1 = useTransform(scrollYProgress, [0, 1], ["0%", "50%"])
  const yBg2 = useTransform(scrollYProgress, [0, 1], ["0%", "-50%"])
  const opacityStory = useTransform(scrollYProgress, [0, 0.2, 0.3], [1, 1, 0])

  // Toggle Audio
  const toggleAudio = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.play().catch(e => console.error("Audio playback failed:", e))
        setIsMuted(false)
      } else {
        audioRef.current.pause()
        setIsMuted(true)
      }
    }
  }

  return (
    <main ref={containerRef} className="bg-[#050505] min-h-screen w-full relative overflow-x-hidden text-white font-sans selection:bg-green-500/30">
      <Navbar />

      {/* --- SOOTHING BACKGROUND MUSIC --- */}
      {/* High-quality royalty-free ambient cinematic track */}
      <audio ref={audioRef} loop src="https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=ambient-piano-amp-strings-10711.mp3" />
      
      <button 
        onClick={toggleAudio} 
        className="fixed bottom-8 right-8 md:bottom-12 md:left-12 z-50 p-4 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 hover:bg-green-500/20 hover:border-green-500/50 hover:text-green-400 transition-all shadow-2xl group"
        title={isMuted ? "Play background music" : "Mute background music"}
      >
        {isMuted ? <VolumeX size={24} className="text-zinc-500 group-hover:text-green-400"/> : <Volume2 size={24} className="text-green-400 animate-pulse"/>}
      </button>

      {/* --- AMBIENT PARALLAX BACKGROUND GLOW --- */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <motion.div style={{ y: yBg1 }} className="absolute top-[-10%] right-[-5%] w-[800px] h-[800px] rounded-full bg-green-900/20 blur-[150px] mix-blend-screen" />
          <motion.div style={{ y: yBg2 }} className="absolute bottom-[10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-emerald-900/10 blur-[120px] mix-blend-screen" />
      </div>

      {/* --- CHAPTER 1: THE SPARK (HERO) --- */}
      <motion.section style={{ opacity: opacityStory }} className="min-h-screen flex flex-col justify-center px-6 md:px-12 relative z-10 pt-20">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-green-500/30 bg-green-500/10 text-green-400 font-bold tracking-widest uppercase text-xs mb-8 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
             <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> Est. Late 2025
          </span>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white mb-8 leading-[1.05] tracking-tight drop-shadow-2xl">
            It Started With <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-400 to-cyan-500">
              A Microphone.
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-zinc-400 leading-relaxed font-medium">
            Before it was a global e-learning platform, Grove Connect was just a YouTube channel. A collective of friends turning on cameras to record podcasts, share wild adventures, host heated debates, and play games. 
          </p>
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 opacity-50 animate-bounce">
            <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">Scroll the Story</span>
            <div className="w-px h-16 bg-gradient-to-b from-green-500 to-transparent" />
        </div>
      </motion.section>

      {/* --- CHAPTER 2: THE VISION & MISSION --- */}
      <section className="py-32 px-6 md:px-12 relative z-10 border-t border-white/5 bg-black/40 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} className="space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400 mb-6 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                    <Eye size={32} />
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-white">Our Vision</h2>
                <div className="w-12 h-1 bg-green-500 rounded-full" />
                <p className="text-lg text-zinc-400 leading-relaxed">
                    We looked around and realized the creator economy was deeply fragmented. Brilliant minds had the talent, but the tools to teach, share, and scale were scattered. Our vision was to unify the entire creator journey into one seamless, powerful ecosystem where technology is invisible, and human creativity is limitless.
                </p>
            </motion.div>
            
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} viewport={{ once: true, margin: "-100px" }} className="space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-6 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
                    <Target size={32} />
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-white">Our Mission</h2>
                <div className="w-12 h-1 bg-cyan-500 rounded-full" />
                <p className="text-lg text-zinc-400 leading-relaxed">
                    To democratize digital education and community building. We are engineering the ultimate infrastructure that empowers the next generation of digital media entrepreneurs to build engaged communities, share knowledge, and achieve true financial freedom without technical barriers.
                </p>
            </motion.div>
        </div>
      </section>

      {/* --- CHAPTER 3: THE ASSEMBLY (FOUNDERS) --- */}
      <section className="py-32 px-6 md:px-12 relative z-10">
        <div className="max-w-4xl mx-auto text-center mb-32">
          <h2 className="text-5xl md:text-6xl font-black mb-8 text-white">The Assembly</h2>
          <p className="text-xl text-zinc-400 leading-relaxed font-medium">
            The mission was far too big for one person. It started with a vision, followed by brilliant architects, and a collective of catalysts. We weren't just colleagues; we were a brotherhood ready to build the future of connection.
          </p>
        </div>

        <div className="max-w-6xl mx-auto flex flex-col gap-32">
          {founders.map((founder, idx) => {
            const isEven = idx % 2 === 0;
            return (
              <motion.div 
                key={founder.name} 
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ margin: "-100px", once: true }}
                transition={{ duration: 0.8 }}
                className={`flex flex-col ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-12 md:gap-20 group`}
              >
                
                {/* IMAGE SIDE */}
                <div className="w-full md:w-5/12 relative">
                  {/* Decorative Border Offset */}
                  <div className={`absolute top-4 ${isEven ? 'left-4' : 'right-4'} w-full h-full border-2 border-green-500/20 rounded-3xl -z-10 transition-transform duration-700 group-hover:translate-x-4 group-hover:translate-y-4`} />
                  <div className="relative aspect-[3/4] rounded-3xl overflow-hidden bg-black border border-white/10 shadow-2xl">
                    <Image 
                      src={founder.image} 
                      alt={founder.name}
                      fill
                      className="object-cover transition-transform duration-1000 group-hover:scale-105 filter grayscale hover:grayscale-0"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-80" />
                  </div>
                </div>

                {/* TEXT CONTENT SIDE */}
                <div className="w-full md:w-7/12 flex flex-col gap-6">
                  <div>
                    <h3 className="text-green-400 font-bold tracking-widest uppercase text-xs mb-4 bg-green-500/10 w-fit px-4 py-1.5 rounded-full border border-green-500/20 shadow-lg">
                      {founder.role}
                    </h3>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 tracking-tight">
                      {founder.name}
                    </h2>
                    <div className="space-y-5 text-zinc-300 text-lg leading-relaxed">
                      {founder.bio.map((paragraph, pIdx) => (
                        <p key={pIdx}>{paragraph}</p>
                      ))}
                    </div>
                  </div>

                  {/* Social Links */}
                  <div className="flex gap-4 pt-6 mt-4 border-t border-white/5">
                    {founder.socials.linkedin && (
                      <a href={founder.socials.linkedin} className="p-3.5 rounded-full bg-white/5 border border-white/10 text-zinc-400 hover:text-black hover:bg-green-500 hover:border-green-500 transition-all duration-300 hover:shadow-[0_0_20px_rgba(34,197,94,0.4)]">
                        <Linkedin className="w-5 h-5" />
                      </a>
                    )}
                    {founder.socials.twitter && (
                      <a href={founder.socials.twitter} className="p-3.5 rounded-full bg-white/5 border border-white/10 text-zinc-400 hover:text-black hover:bg-green-500 hover:border-green-500 transition-all duration-300 hover:shadow-[0_0_20px_rgba(34,197,94,0.4)]">
                        <Twitter className="w-5 h-5" />
                      </a>
                    )}
                     {founder.socials.youtube && (
                      <a href={founder.socials.youtube} className="p-3.5 rounded-full bg-white/5 border border-white/10 text-zinc-400 hover:text-black hover:bg-green-500 hover:border-green-500 transition-all duration-300 hover:shadow-[0_0_20px_rgba(34,197,94,0.4)]">
                        <Youtube className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                </div>

              </motion.div>
            )
          })}
        </div>
      </section>

      {/* --- CHAPTER 4: OUR HOME / CTA --- */}
      <section className="py-40 px-6 md:px-12 relative z-10 border-t border-white/5 bg-black/80 backdrop-blur-2xl text-center overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-green-600/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-3xl mx-auto flex flex-col items-center gap-8 relative z-10">
           <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-green-400 mb-4 shadow-[0_0_40px_rgba(34,197,94,0.2)]">
               <MapPin size={40} />
           </div>
           <h2 className="text-5xl md:text-6xl font-black text-white leading-tight tracking-tight">
             Rooted in <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">Oko Erin.</span><br/> Built for the World.
           </h2>
           <p className="text-xl text-zinc-400 leading-relaxed font-medium max-w-2xl mt-2">
             Our headquarters proudly sits in Oko Erin, Kwara State, Nigeria. From this vibrant community, we are writing the code that will power the next generation of global digital educators. The story is just beginning.
           </p>
           
           <div className="flex flex-wrap items-center justify-center gap-6 mt-10">
             <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-3 px-8 py-4 bg-white text-black rounded-full font-black uppercase tracking-widest text-sm hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.2)]">
               Back to Top <ArrowRight size={18} />
             </button>
           </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}

export default AboutPage
