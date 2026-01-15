'use client'

import React from 'react'
import { heroImage } from '../assets' 
import Image from 'next/image'
import MagicButton from './MagicButton'
import { TextGenerateEffect } from './ui/TextGenerateEffect'
import { CircleArrowOutUpRightIcon } from 'lucide-react'

const Hero = () => {
  return (
    <div id='home' className="relative w-full h-screen overflow-hidden">
      {/* Background Image */}
      <Image
        src={heroImage}
        alt='Hero'
        fill
        className="w-full h-full object-cover"
        priority 
      />

      {/* Overlay 
        - Increased opacity to bg-black/60 for better text contrast
        - added z-10 to ensure it sits above image but below nav
      */}
      <div className="absolute inset-0 bg-black/60 flex justify-center items-center px-5">
        
        {/* Content Container 
          - max-w-[89vw]: Prevents text from hitting edges on mobile
          - md:max-w-2xl / lg:max-w-[60vw]: Keeps content centered and readable on wide screens
        */}
        <div id="hero-content" className="relative flex flex-col items-center justify-center max-w-[89vw] md:max-w-2xl lg:max-w-2xl z-10">
          
          {/* Heading */}
          <TextGenerateEffect
            words="Built to Connect Designed to grow"
            className="text-center text-[40px] md:text-5xl lg:text-6xl leading-none mt-10 tracking-tight"
          />

          {/* Subtext 
             - text-sm on mobile, text-lg on tablet, text-xl on desktop
             - text-white/80: Softens the white for better hierarchy vs the heading
          */}
          <p className="text-center md:tracking-wider mb-8 text-sm md:text-lg lg:text-xl text-white/80 mt-4 max-w-xl">
            Empower your audience with a digital ecosystem that scales effortlessly. Where meaningful connections turn into lasting growth.
          </p>

          {/* Button Wrapper 
             - Ensures the button has proper spacing from text
          */}
          <div className="flex flex-col md:flex-row gap-4 items-center">
             {/* Note: Margin top is handled by the wrapper gap or inside MagicButton.
                If MagicButton has 'md:mt-10', it will push down further on desktop.
             */}
            <a href="/auth"> {/* Link to your new Auth Page */}
              <MagicButton 
                title="Get Started"
                icon={<CircleArrowOutUpRightIcon size={18} />}
                position="right"
                // otherClasses="!bg-black" // Optional: if you want to override button bg
              />
            </a>
          </div>

        </div>
      </div>
    </div>
  )
}

export default Hero