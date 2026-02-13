import React from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function LegalPage() {
  return (
    <div className="pt-32 pb-20 bg-[#050505] min-h-screen text-white px-6">
        <Navbar />
        <div className="max-w-3xl mx-auto prose prose-invert">
            <h1>Privacy Policy</h1>
            <p className="text-zinc-400">Last updated: February 2026</p>
            <hr className="border-white/10 my-8"/>
            <p>Welcome to Grove Connect. We respect your privacy and are committed to protecting your personal data...</p>
            <h3>1. Data We Collect</h3>
            <p>We collect data to provide better services to all our users...</p>
            {/* Add more legal dummy text here */}
        </div>
        <Footer />
    </div>
  )
}