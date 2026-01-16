'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { Search, Star, PlayCircle, Clock, BarChart, Filter, ChevronDown } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { heroImage } from '../assets' // We still use this for course cards

// --- MOCK DATA ---
type Course = {
  id: string
  title: string
  instructor: string
  rating: number
  students: string
  price: string
  originalPrice?: string
  image: any
  category: string
  badge?: 'Bestseller' | 'New' | 'Highest Rated'
  duration: string
  lectures: number
}

const allCourses: Course[] = [
  // PROGRAMMING
  {
    id: '1',
    title: "Full Stack Web Development Bootcamp 2026",
    instructor: "Sarah Chen",
    rating: 4.8,
    students: "12,400",
    price: "$19.99",
    originalPrice: "$89.99",
    image: heroImage, 
    category: "Programming",
    badge: "Bestseller",
    duration: "42h 15m",
    lectures: 140
  },
  {
    id: '2',
    title: "Python for Data Science & Machine Learning",
    instructor: "Dr. Alex Johnson",
    rating: 4.7,
    students: "8,200",
    price: "$14.99",
    originalPrice: "$79.99",
    image: heroImage,
    category: "AI",
    duration: "28h 30m",
    lectures: 92
  },
  // YOUTUBE & VIDEO
  {
    id: '3',
    title: "YouTube Masterclass: 0 to 100K Subscribers",
    instructor: "David Okonkwo",
    rating: 4.9,
    students: "25,000",
    price: "$24.99",
    originalPrice: "$99.99",
    image: heroImage,
    category: "YouTube",
    badge: "Highest Rated",
    duration: "12h 10m",
    lectures: 45
  },
  {
    id: '4',
    title: "Cinematic Video Editing in DaVinci Resolve",
    instructor: "Grove Media Team",
    rating: 4.6,
    students: "5,300",
    price: "$12.99",
    originalPrice: "$49.99",
    image: heroImage,
    category: "Video Editing",
    badge: "New",
    duration: "18h 00m",
    lectures: 60
  },
  // MUSIC & AUDIO
  {
    id: '5',
    title: "Music Production 101: Ableton Live From Scratch",
    instructor: "Marcus Beat",
    rating: 4.7,
    students: "3,100",
    price: "$19.99",
    originalPrice: "$69.99",
    image: heroImage,
    category: "Music",
    duration: "14h 45m",
    lectures: 55
  },
  {
    id: '6',
    title: "Podcast Audio Engineering for Beginners",
    instructor: "Grove Media Team",
    rating: 4.5,
    students: "1,200",
    price: "Free",
    image: heroImage,
    category: "Music",
    duration: "4h 20m",
    lectures: 12
  },
   // AI & TECH
  {
    id: '7',
    title: "Prompt Engineering: Master ChatGPT & Midjourney",
    instructor: "Sarah Chen",
    rating: 4.8,
    students: "9,800",
    price: "$16.99",
    originalPrice: "$59.99",
    image: heroImage,
    category: "AI",
    badge: "Bestseller",
    duration: "8h 15m",
    lectures: 34
  },
  {
    id: '8',
    title: "Next.js 15: The Complete Developer Guide",
    instructor: "Alex Johnson",
    rating: 4.9,
    students: "4,500",
    price: "$29.99",
    originalPrice: "$129.99",
    image: heroImage,
    category: "Programming",
    badge: "Highest Rated",
    duration: "32h 00m",
    lectures: 110
  }
]

const categories = ["All", "Programming", "AI", "YouTube", "Video Editing", "Music", "Business"]

const CoursesPage = () => {
  const [activeCategory, setActiveCategory] = useState("All")
  
  // Filter logic
  const displayedCourses = activeCategory === "All" 
    ? allCourses 
    : allCourses.filter(c => c.category === activeCategory)

  return (
    <main className="bg-black min-h-screen w-full relative overflow-x-hidden">
      <Navbar />

      {/* --- HERO SECTION --- */}
      <section className="relative pt-32 pb-24 px-6 md:px-12 border-b border-white/10 overflow-hidden">
        
        {/* 1. BACKGROUND IMAGE LAYER (z-0) */}
        <div className="absolute inset-0 z-0">
          {/* Using a reliable Unsplash URL to guarantee visibility. 
              If you want to use 'heroImage', make sure it is imported correctly 
              and not pointing to Google Drive. */}
          <Image 
            src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=3291&auto=format&fit=crop"
            alt="Learning Background" 
            fill 
            className="object-cover opacity-60"
            priority
          />
          {/* Gradient Overlay for Text Readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/90 to-black/40" />
        </div>

        {/* 2. CONTENT LAYER (z-10) */}
        <div className="relative z-10 max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
          
          <div className="w-full md:w-2/3">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              What do you want to <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">
                Master Today?
              </span>
            </h1>
            <p className="text-gray-300 text-lg mb-8 max-w-2xl font-light">
              Join thousands of learners acquiring the skills that matter. From coding the future to directing your own cinematic universe.
            </p>

            {/* SEARCH BAR */}
            <div className="relative max-w-2xl group">
              <div className="absolute inset-0 bg-green-500/30 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative flex items-center bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-6 py-4 focus-within:border-green-500/50 focus-within:bg-black/80 transition-all shadow-xl">
                <Search className="text-gray-300 w-6 h-6 mr-4" />
                <input 
                  type="text" 
                  placeholder="Search for Python, Video Editing, Marketing..." 
                  className="bg-transparent border-none outline-none text-white w-full placeholder-gray-400 text-lg"
                />
              </div>
            </div>
          </div>
          
          {/* STATS / SOCIAL PROOF RIGHT */}
          <div className="hidden md:flex w-1/3 flex-col gap-4">
             <div className="bg-black/60 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-2xl transform hover:-translate-y-1 transition-transform">
                <h3 className="text-3xl font-bold text-white">100+</h3>
                <p className="text-gray-400 text-sm">Premium Courses</p>
             </div>
             <div className="bg-black/60 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-2xl transform hover:-translate-y-1 transition-transform">
                <h3 className="text-3xl font-bold text-green-400">50k+</h3>
                <p className="text-gray-400 text-sm">Active Students</p>
             </div>
          </div>
        </div>
      </section>

      {/* --- CATEGORY PILLS --- */}
      <section className="sticky top-20 z-40 bg-black/80 backdrop-blur-md border-b border-white/10 py-4 px-6 md:px-12">
        <div className="max-w-7xl mx-auto flex items-center gap-4 overflow-x-auto no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`
                whitespace-nowrap px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 border
                ${activeCategory === cat 
                  ? 'bg-green-600 border-green-600 text-white shadow-[0_0_20px_rgba(22,163,74,0.4)]' 
                  : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/30'}
              `}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* --- MAIN COURSE GRID --- */}
      <section className="py-16 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-white">
              {activeCategory === "All" ? "Top Picks for You" : `${activeCategory} Courses`}
            </h2>
            <button className="flex items-center gap-2 text-sm text-gray-400 hover:text-white border border-white/10 px-4 py-2 rounded-lg transition-colors">
              <Filter className="w-4 h-4" /> Filter <ChevronDown className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {displayedCourses.map((course) => (
              <div 
                key={course.id} 
                className="group relative bg-neutral-900 border border-white/10 rounded-xl overflow-hidden hover:border-green-500/50 hover:-translate-y-1 transition-all duration-300 flex flex-col h-full"
              >
                {/* Image Section */}
                <div className="relative aspect-video w-full overflow-hidden">
                  <Image 
                    src={course.image} 
                    alt={course.title} 
                    fill 
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Overlay Play Button */}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <PlayCircle className="w-12 h-12 text-white fill-green-500/50" />
                  </div>
                  {/* Badge */}
                  {course.badge && (
                    <div className="absolute top-2 left-2 bg-yellow-500/90 text-black text-[10px] font-bold px-2 py-1 uppercase tracking-wide rounded shadow-md">
                      {course.badge}
                    </div>
                  )}
                </div>

                {/* Content Section */}
                <div className="p-5 flex flex-col flex-grow">
                  <h3 className="text-white font-bold text-lg leading-snug line-clamp-2 mb-2 group-hover:text-green-400 transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-gray-400 text-sm mb-3">{course.instructor}</p>
                  
                  {/* Rating */}
                  <div className="flex items-center gap-1 mb-3">
                    <span className="text-yellow-500 font-bold text-sm">{course.rating}</span>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-3 h-3 ${i < Math.floor(course.rating) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-600'}`} 
                        />
                      ))}
                    </div>
                    <span className="text-gray-500 text-xs">({course.students})</span>
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-4 mt-auto">
                    <div className="flex items-center gap-1"><Clock className="w-3 h-3" /> {course.duration}</div>
                    <div className="flex items-center gap-1"><BarChart className="w-3 h-3" /> {course.lectures} lectures</div>
                  </div>

                  {/* Price Row */}
                  <div className="flex items-center justify-between border-t border-white/10 pt-4">
                    <div className="flex flex-col">
                        <span className="text-white font-bold text-lg">{course.price}</span>
                        {course.originalPrice && (
                           <span className="text-gray-500 text-xs line-through">{course.originalPrice}</span>
                        )}
                    </div>
                    <button className="text-xs font-medium text-black bg-white hover:bg-green-400 px-4 py-2 rounded transition-colors">
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* --- LEARNING PATHS (Feature) --- */}
      <section className="py-16 px-6 md:px-12 bg-neutral-950 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-8">Featured Learning Paths</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-8 rounded-2xl bg-gradient-to-br from-neutral-900 to-black border border-white/10 flex flex-col md:flex-row items-center gap-6 group hover:border-green-500/30 transition-colors">
                    <div className="w-24 h-24 rounded-full bg-green-900/20 flex items-center justify-center shrink-0 border border-green-500/30 group-hover:scale-110 transition-transform">
                        <span className="text-3xl">🎬</span>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white mb-2">Content Creator Zero to Hero</h3>
                        <p className="text-gray-400 text-sm mb-4">A structured bundle of 5 courses taking you from scripting to monetization.</p>
                        <button className="text-green-400 text-sm font-medium hover:text-white transition-colors">Explore Path &rarr;</button>
                    </div>
                </div>
                 <div className="p-8 rounded-2xl bg-gradient-to-br from-neutral-900 to-black border border-white/10 flex flex-col md:flex-row items-center gap-6 group hover:border-blue-500/30 transition-colors">
                    <div className="w-24 h-24 rounded-full bg-blue-900/20 flex items-center justify-center shrink-0 border border-blue-500/30 group-hover:scale-110 transition-transform">
                        <span className="text-3xl">💻</span>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white mb-2">Full Stack Developer 2026</h3>
                        <p className="text-gray-400 text-sm mb-4">Master React, Next.js, and Node in one comprehensive curriculum.</p>
                        <button className="text-green-400 text-sm font-medium hover:text-white transition-colors">Explore Path &rarr;</button>
                    </div>
                </div>
            </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}

export default CoursesPage