'use client'

import React, { useRef } from 'react'
import { heroImage } from '../assets' // Ensure this path is correct
import Image from 'next/image'
import MagicButton from './MagicButton'
import { TextGenerateEffect } from './ui/TextGenerateEffect'
import { CircleArrowOutUpRightIcon } from 'lucide-react'

const Hero = () => {
  // Removed the GSAP useEffect because you are using TextGenerateEffect 
  // and the 'textRef' was not attached to any element in your JSX.

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <Image
        src={heroImage}
        alt='Hero'
        fill
        className="w-full h-full object-cover"
        priority // Good practice for LCP (Largest Contentful Paint)
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 flex justify-center items-center px-4">
        
        {/* CENTERING FIX:
           1. added 'flex flex-col' to stack text and button vertically.
           2. added 'items-center' to horizontally center them.
        */}
        <div className="text-white relative flex flex-col items-center justify-center max-w-2xl">
          
          <TextGenerateEffect
            words="Built to Connect Designed to grow"
            className="text-center text-[40px] md:text-5xl lg:text-6xl leading-none"
          />
          <p className='text-center'>Empower your audience with a digital ecosystem that scales effortlessly. Where meaningful connections turn into lasting growth.</p>

          {/* The button will now be centered because of 'items-center' on the parent div.
            The margin is handled inside MagicButton (md:mt-10) or you can add 'mt-8' here.
          */}
          <MagicButton 
            title="Get Started"
            icon={<CircleArrowOutUpRightIcon size={18} />}
            position="right"
          />
        </div>
      </div>
    </div>
  )
}

export default Hero