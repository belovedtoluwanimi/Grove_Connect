'use client'

import React from 'react'
import { preloader } from '../assets'

type PreloaderProps = {
  onFinish: () => void
}

const Preloader: React.FC<PreloaderProps> = ({ onFinish }) => {
  return (
    <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center">
      <video
        className="w-full h-full object-cover"
        src={preloader}
        autoPlay
        muted
        playsInline
        onEnded={onFinish}
      />
      <p className="absolute bottom-4 text-white text-sm">Loading...</p>
    </div>
  )
}

export default Preloader
