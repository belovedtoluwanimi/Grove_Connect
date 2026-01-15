'use client'

import React, { useState } from 'react'
import Preloader from './components/Preloader'
import Hero from './components/Hero'
import Navbar from './components/Navbar'
import { FloatingNav } from './components/ui/floating-navbar'
import { navItems } from './assets'
import HomeWrapper from './components/HomeWrapper'

const HomePage = () => {
  const [loading, setLoading] = useState(true)

  return (
    <>
      {loading && <Preloader onFinish={() => setLoading(false)} />}

      {!loading && (
        <main className='fade-in'>
          <Navbar />
          <HomeWrapper />
          {/* Other sections */}
        </main>
      )}
    </>
  )
}

export default HomePage
