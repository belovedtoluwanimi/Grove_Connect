'use client'

import React from 'react'
import Image from 'next/image'
import Navbar from '../components/Navbar' // Adjust path if necessary
import Footer from '../components/Footer' // Adjust path if necessary
import { Linkedin, Twitter, Youtube, ArrowRight } from 'lucide-react'
// REPLACE these with actual founder photos
import { Ajiboss, Daniel, Dunsin, EmmaDesigns, Eniola, heroImage, Joseph, Obong } from '../assets' 

// --- 1. FOUNDER DATA STRUCTURE ---
// This makes it easy to add/remove founders later.
type FounderData = {
  name: string
  role: string
  bio: string[] // An array of paragraphs
  image: any // Using 'any' for auto-imported assets, ideally StaticImageData
  socials: {
    linkedin?: string
    twitter?: string
    youtube?: string
  }
}

const founders: FounderData[] = [
  {
    name: "Joseph Beloved",
    role: "CEO & Co-Founder | The Visionary",
    image: Joseph, // REPLACE with actual photo (e.g., founderAlexImg)
    bio: [
      "Beloved spent over a decade in digital media strategy, realizing that the tools available to creators were fragmented and outdated.",
      "Driven by a obsession with efficiency and community building, Beloved founded Grove Connect to unify the creator journey into one seamless ecosystem. They believe that the future of the economy is built by individuals, not just corporations."
    ],
    socials: {
      linkedin: "www.linkedin.com/in/joseph-beloved-3152b8293",
      twitter: "#"
    }
  },
  {
    name: "Eniola Adekeye",
    role: "CTO & Co-Founder | The Architect",
    image: Eniola, // REPLACE with actual photo (e.g., founderSarahImg)
    bio: [
      "A former lead engineer at major tech giants, Sarah saw the technical hurdles holding brilliant creatives back.",
      "She architected the Grove Connect platform from the ground up, focusing on scalability, speed, and an intuitive user experience. Her mission is to make complex technology invisible so creators can focus purely on their craft."
    ],
    socials: {
      linkedin: "#",
      twitter: "#",
      youtube: "#"
    }
  },
  {
    name: "Dunsin Olowonirejuaro",
    role: "Head of Community & Growth | The Catalyst",
    image: Dunsin, // REPLACE with actual photo (e.g., founderDavidImg)
    bio: [
      "David started as a YouTube creator himself, growing a community to over 500K subscribers. He understands the lonely grind of the creator path intimately.",
      "At Grove Connect, David bridges the gap between platform and people. He leads our educational initiatives and ensures that our community remains a vibrant, supportive space for genuine collaboration."
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
    image: Ajiboss, // REPLACE with actual photo (e.g., founderDavidImg)
    bio: [
      "David started as a YouTube creator himself, growing a community to over 500K subscribers. He understands the lonely grind of the creator path intimately.",
      "At Grove Connect, David bridges the gap between platform and people. He leads our educational initiatives and ensures that our community remains a vibrant, supportive space for genuine collaboration."
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
    image: Daniel, // REPLACE with actual photo (e.g., founderDavidImg)
    bio: [
      "David started as a YouTube creator himself, growing a community to over 500K subscribers. He understands the lonely grind of the creator path intimately.",
      "At Grove Connect, David bridges the gap between platform and people. He leads our educational initiatives and ensures that our community remains a vibrant, supportive space for genuine collaboration."
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
    image: EmmaDesigns, // REPLACE with actual photo (e.g., founderDavidImg)
    bio: [
      "David started as a YouTube creator himself, growing a community to over 500K subscribers. He understands the lonely grind of the creator path intimately.",
      "At Grove Connect, David bridges the gap between platform and people. He leads our educational initiatives and ensures that our community remains a vibrant, supportive space for genuine collaboration."
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
    image: Obong, // REPLACE with actual photo (e.g., founderDavidImg)
    bio: [
      "David started as a YouTube creator himself, growing a community to over 500K subscribers. He understands the lonely grind of the creator path intimately.",
      "At Grove Connect, David bridges the gap between platform and people. He leads our educational initiatives and ensures that our community remains a vibrant, supportive space for genuine collaboration."
    ],
    socials: {
      linkedin: "#",
      twitter: "#",
      youtube: "#"
    }
  },
  // {
  //   name: "David Okonkwo",
  //   role: "Head of Community & Growth | The Catalyst",
  //   image: heroImage, // REPLACE with actual photo (e.g., founderDavidImg)
  //   bio: [
  //     "David started as a YouTube creator himself, growing a community to over 500K subscribers. He understands the lonely grind of the creator path intimately.",
  //     "At Grove Connect, David bridges the gap between platform and people. He leads our educational initiatives and ensures that our community remains a vibrant, supportive space for genuine collaboration."
  //   ],
  //   socials: {
  //     linkedin: "#",
  //     twitter: "#",
  //     youtube: "#"
  //   }
  // },
  // {
  //   name: "David Okonkwo",
  //   role: "Head of Community & Growth | The Catalyst",
  //   image: heroImage, // REPLACE with actual photo (e.g., founderDavidImg)
  //   bio: [
  //     "David started as a YouTube creator himself, growing a community to over 500K subscribers. He understands the lonely grind of the creator path intimately.",
  //     "At Grove Connect, David bridges the gap between platform and people. He leads our educational initiatives and ensures that our community remains a vibrant, supportive space for genuine collaboration."
  //   ],
  //   socials: {
  //     linkedin: "#",
  //     twitter: "#",
  //     youtube: "#"
  //   }
  // }
]

// --- 2. THE PAGE COMPONENT ---
const AboutPage = () => {
  return (
    <main className="bg-black min-h-screen w-full relative overflow-hidden">
      <Navbar />

      {/* --- AMBIENT BACKGROUND GLOW --- */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-green-800/10 blur-[120px]" />
          <div className="absolute bottom-[10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-800/10 blur-[100px]" />
      </div>

      {/* --- HERO HEADER --- */}
      <section className="pt-32 pb-20 px-6 md:px-12 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          <span className="text-green-400 font-medium tracking-widest uppercase text-sm">
            Our DNA
          </span>
          <h1 className="text-4xl md:text-6xl font-bold text-white mt-6 mb-8 leading-tight">
            Meeting the Minds Building the <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">
              Creator Future.
            </span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Grove Connect wasn't started in a boardroom. It was born out of frustration with the status quo and a shared belief that creators deserve better tools, better education, and a better community.
          </p>
        </div>
      </section>

      {/* --- FOUNDERS LIST --- */}
      <section className="py-20 px-6 md:px-12 relative z-10 border-t border-white/10">
        <div className="max-w-6xl mx-auto flex flex-col gap-32">
          {founders.map((founder, idx) => {
            // Trick to alternate layout: Even indexes left image, odd indexes right image
            const isEven = idx % 2 === 0;
            
            return (
              <div key={founder.name} className={`flex flex-col ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-12 md:gap-20 group`}>
                
                {/* IMAGE SIDE */}
                <div className="w-full md:w-5/12 relative">
                  {/* Decorative Border Offset */}
                  <div className={`absolute top-4 ${isEven ? 'left-4' : 'right-4'} w-full h-full border-2 border-green-500/30 rounded-2xl -z-10 transition-transform duration-500 group-hover:translate-x-2 group-hover:translate-y-2`} />
                  
                  {/* Image Container */}
                  <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-neutral-900 border border-white/10 shadow-2xl shadow-green-900/10">
                    <Image 
                      src={founder.image} 
                      alt={founder.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105 grayscale group-hover:grayscale-0"
                    />
                    {/* Green overlay flash on hover */}
                    <div className="absolute inset-0 bg-green-500/20 mix-blend-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>
                </div>

                {/* TEXT CONTENT SIDE */}
                <div className="w-full md:w-7/12 flex flex-col gap-6">
                  <div>
                    <h3 className="text-green-400 font-medium tracking-wider uppercase mb-2">
                      {founder.role}
                    </h3>
                    <h2 className="text-4xl font-bold text-white mb-6">
                      {founder.name}
                    </h2>
                    <div className="space-y-4 text-gray-300 text-lg leading-relaxed">
                      {founder.bio.map((paragraph, pIdx) => (
                        <p key={pIdx}>{paragraph}</p>
                      ))}
                    </div>
                  </div>

                  {/* Social Links */}
                  <div className="flex gap-4 pt-4">
                    {founder.socials.linkedin && (
                      <a href={founder.socials.linkedin} className="p-3 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-green-600 hover:border-green-600 transition-all duration-300">
                        <Linkedin className="w-5 h-5" />
                      </a>
                    )}
                    {founder.socials.twitter && (
                      <a href={founder.socials.twitter} className="p-3 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-green-600 hover:border-green-600 transition-all duration-300">
                        <Twitter className="w-5 h-5" />
                      </a>
                    )}
                     {founder.socials.youtube && (
                      <a href={founder.socials.youtube} className="p-3 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-green-600 hover:border-green-600 transition-all duration-300">
                        <Youtube className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                </div>

              </div>
            )
          })}
        </div>
      </section>

      {/* --- MISSION WRAP-UP / CTA --- */}
      <section className="py-32 px-6 md:px-12 relative z-10 border-t border-white/10 text-center">
        <div className="max-w-3xl mx-auto flex flex-col items-center gap-8">
           <h2 className="text-3xl md:text-4xl font-bold text-white">
            United by a Single Purpose
          </h2>
           <p className="text-lg text-gray-300 leading-relaxed">
            While our backgrounds are diverse, our commitment is singular: to build the infrastructure that powers the next generation of digital media entrepreneurs. We are just getting started.
          </p>
           <button className="flex items-center gap-2 text-green-400 border-b border-green-400 pb-1 hover:text-white hover:border-white transition-all w-fit group text-lg">
              Join Our Vision
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
        </div>
      </section>

      <Footer />
    </main>
  )
}

export default AboutPage