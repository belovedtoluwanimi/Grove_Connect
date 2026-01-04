'use client'

import React, { useState } from 'react'
import Preloader from './components/Preloader'
import Hero from './components/Hero'
import Navbar from './components/Navbar'

const HomePage = () => {
  const [loading, setLoading] = useState(true)

  return (
    <>
      {loading && <Preloader onFinish={() => setLoading(false)} />}

      {!loading && (
        <main className='fade-in'>
          <Navbar />
          <Hero />
          {/* Other sections */}
        </main>
      )}
    </>
  )
}

export default HomePage
