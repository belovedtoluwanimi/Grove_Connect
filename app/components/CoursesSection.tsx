'use client'

import React from 'react'
import Image from 'next/image'
import { Clock, BarChart, ArrowRight } from 'lucide-react'
import { courseImage, heroImage } from '../assets' // REPLACE with actual course thumbnails

const courses = [
  {
    title: "YouTube Growth Accelerator",
    description: "The complete blueprint from 0 to 100K subscribers. Master the algorithm and content strategy.",
    image: courseImage, // Replace
    level: "Beginner to Pro",
    duration: "12 Hours"
  },
  {
    title: "Cinematic Video Editing Masterclass",
    description: "Learn Premiere Pro & DaVinci Resolve. Turn raw footage into compelling stories.",
    image: courseImage, // Replace
    level: "Intermediate",
    duration: "20 Hours"
  },
  {
    title: "Digital Product Launchpad",
    description: "How to build, market, and sell your own digital products to your audience.",
    image: courseImage, // Replace
    level: "Advanced",
    duration: "8 Hours"
  }
]

const CoursesSection = () => {
  return (
    <section id="courses" className="relative w-full py-20 md:py-32 px-6 md:px-12 bg-black border-t border-green-500/10 z-10">
      <div className="max-w-7xl mx-auto">
        
         {/* Header with 'View All' Button */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div>
             <span className="text-green-400 font-medium tracking-widest uppercase text-sm">
              Featured Courses
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-white mt-4">
              Start Your Learning Journey
            </h2>
          </div>
          <button className="flex items-center cursor-pointer gap-2 text-gray-300 hover:text-green-400 transition-colors group shrink-0">
            View All Courses
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map((course, idx) => (
            <div key={idx} className="group rounded-2xl overflow-hidden bg-neutral-900 border border-white/10 hover:border-green-500/50 transition-all duration-300 flex flex-col">
              {/* Image */}
              <div className="relative aspect-video overflow-hidden">
                <Image src={course.image} alt={course.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
              </div>

              {/* Content */}
              <div className="p-8 flex flex-col flex-grow">
                <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-green-400 transition-colors">
                  {course.title}
                </h3>
                <p className="text-gray-400 mb-6 flex-grow line-clamp-3">
                  {course.description}
                </p>

                {/* Metadata & Button */}
                <div className="flex items-center justify-between pt-6 border-t border-white/10">
                  <div className="flex gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1"><BarChart className="w-4 h-4" /> {course.level}</div>
                    <div className="flex items-center gap-1"><Clock className="w-4 h-4" /> {course.duration}</div>
                  </div>
                </div>
                 <button className="w-full cursor-pointer mt-6 py-3 c bg-white/5 hover:bg-green-600 text-white rounded-lg font-medium transition-all duration-300">
                    Enroll Now
                  </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}

export default CoursesSection