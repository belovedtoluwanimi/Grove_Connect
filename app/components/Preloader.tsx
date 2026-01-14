'use client'

import React, { useState, useRef } from 'react'
import { preloader } from '../assets'

type PreloaderProps = {
  onFinish: () => void
}

const Preloader: React.FC<PreloaderProps> = ({ onFinish }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [hasInteracted, setHasInteracted] = useState(false)

  const handleStart = () => {
    const video = videoRef.current
    if (!video) return

    // Unmute and play based on user interaction
    video.currentTime = 0
    video.volume = 1.0 // Ensure volume is up
    
    const playPromise = video.play()
    
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setHasInteracted(true)
        })
        .catch((error) => {
          console.error("Playback failed:", error)
          // Fallback: If it still fails, just finish the loader
          onFinish()
        })
    }
  }

  return (
    <div
      className="
        fixed inset-0 z-[9999]
        flex items-center justify-center
        bg-black
        overflow-hidden
        touch-none
      "
      aria-busy="true"
      aria-label="Loading content"
    >
      <video
        ref={videoRef}
        className={`
          w-full h-full
          object-cover
          max-w-full max-h-full
          transition-opacity duration-500
          ${hasInteracted ? 'opacity-100' : 'opacity-0'} 
        `}
        src={preloader}
        playsInline
        preload="auto"
        onEnded={onFinish}
        onError={onFinish}
        // Remove autoPlay, we handle it manually
      />

      {/* This button is REQUIRED for browsers to allow sound.
        It hides itself once the video starts playing.
      */}
      {!hasInteracted && (
        <button
          onClick={handleStart}
          className="
            absolute z-10
            px-8 py-4
            text-white text-xl tracking-widest uppercase
            border border-green-500 rounded-full
            backdrop-blur-sm
            hover:bg-green-300/10 hover:border-green-500/80
            transition-all duration-300
            animate-pulse cursor-pointer
          "
        >
          Enter Experience
        </button>
      )}
    </div>
  )
}

export default Preloader