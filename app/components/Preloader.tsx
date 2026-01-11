'use client'

import React, { useEffect, useRef } from 'react'
import { preloader } from '../assets'

type PreloaderProps = {
  onFinish: () => void
}

const Preloader: React.FC<PreloaderProps> = ({ onFinish }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // iOS Safari sometimes needs explicit play call
    const playPromise = video.play()
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Fail silently – user still sees loading UI
      })
    }
  }, [])

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
        className="
          w-full h-full
          object-cover
          max-w-full max-h-full
        "
        src={preloader}
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={onFinish}
        onError={onFinish}
      />

      {/* Overlay text */}
      <p
        className="
          absolute bottom-4
          text-white text-sm
          tracking-wide
          opacity-80
        "
      >
        Loading…
      </p>
    </div>
  )
}

export default Preloader
