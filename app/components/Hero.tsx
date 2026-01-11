'use client'

import React, { useEffect, useRef } from 'react'
import { heroVideo } from '../assets'
import gsap from 'gsap'

const TEXT = 'Built to Connect Designed to grow'

const Hero = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const textRef = useRef<HTMLHeadingElement | null>(null)

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {})
    }

    if (!textRef.current) return

    const letters = Array.from(
      textRef.current.querySelectorAll('.char')
    ) as HTMLElement[]

    gsap.set(textRef.current, { perspective: 1000 })

    const tl = gsap.timeline({ delay: 0.3 })

    // PHASE 1: Bounce-in entrance
    tl.fromTo(
      letters,
      {
        y: 90,
        opacity: 0,
        scale: 0.85,
      },
      {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.9,
        ease: 'bounce.out',
        stagger: {
          each: 0.04,
          from: 'start',
        },
      }
    )

    // PHASE 2: Letters misbehave
    tl.to(
      letters,
      {
        duration: 0.6,
        stagger: {
          each: 0.06,
          from: 'random',
        },
        rotateX: (i) => {
          const char = letters[i].innerText.toLowerCase()
          if (char === 'i') return 180
          return 0
        },
        rotateZ: (i) => {
          const char = letters[i].innerText.toLowerCase()
          if (char === 'b') return 90
          return gsap.utils.random(-20, 20)
        },
        y: (i) => {
          const char = letters[i].innerText.toLowerCase()
          if (char === 'b') return -20
          return 0
        },
        ease: 'power2.inOut',
      },
      '+=0.6'
    )

    // PHASE 3: Return to normal
    tl.to(
      letters,
      {
        rotateX: 0,
        rotateY: 0,
        rotateZ: 0,
        y: 0,
        duration: 0.7,
        ease: 'power3.out',
        stagger: {
          each: 0.03,
          from: 'center',
        },
      },
      '+=0.3'
    )
  }, [])

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        src={heroVideo}
        autoPlay
        muted
        loop
        playsInline
      />

      <div className="absolute inset-0 bg-black/90 flex justify-center items-center gap-30 px-4">
        <div className="text-white relative justify-center">
          <h1
            ref={textRef}
            className="
              flex flex-wrap justify-start text-start
              font-extrabold tracking-tight leading-none
              text-[56px] sm:text-[80px] lg:text-[90px]
              max-w-[690px]
            "
          >
            {TEXT.split(' ').map((word, wordIndex) => (
              <span
                key={wordIndex}
                className="word inline-flex whitespace-nowrap mr-3"
              >
                {word.split('').map((char, charIndex) => (
                  <span
                    key={charIndex}
                    className="char inline-block will-change-transform"
                  >
                    {char}
                  </span>
                ))}
              </span>
            ))}
          </h1>
        </div>

        <div>
          <iframe
            className="rounded-[20px]"
            width="460"
            height="260"
            src="https://www.youtube-nocookie.com/embed/FQcykfQOju8"
            title="Grove Connect video"
            loading="lazy"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  )
}

export default Hero
