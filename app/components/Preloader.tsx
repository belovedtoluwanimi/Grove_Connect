'use client'

import React, { useState, useRef, useEffect } from 'react'
import { preloader } from '../assets'

type PreloaderProps = {
  onFinish: () => void
}

const Preloader: React.FC<PreloaderProps> = ({ onFinish }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [hasInteracted, setHasInteracted] = useState(false)
  
  // FIX: Initialize as FALSE so nothing renders during the initial check
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    // 1. Check local storage
    const hasVisited = localStorage.getItem('hasVisited')

    if (hasVisited) {
      // 2a. If visited, keep it hidden and tell parent to finish immediately
      onFinish()
    } else {
      // 2b. If NOT visited, now we allow the preloader to show
      setShouldRender(true)
    }
  }, [onFinish])

  const handleStart = () => {
    const video = videoRef.current
    if (!video) return

    video.currentTime = 0
    video.volume = 1.0
    
    const playPromise = video.play()
    
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setHasInteracted(true)
        })
        .catch((error) => {
          console.error("Playback failed:", error)
          handlePreloaderFinish()
        })
    }
  }

  const handlePreloaderFinish = () => {
    localStorage.setItem('hasVisited', 'true')
    onFinish()
  }

  // If shouldRender is false, we return null immediately.
  // This prevents the "Enter Experience" button from flashing on reload.
  if (!shouldRender) return null

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
        onEnded={handlePreloaderFinish} 
        onError={handlePreloaderFinish}
      />

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