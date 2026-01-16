'use client'

import React from 'react'
import Image from 'next/image'
import { logo } from '../assets' // Replace with your logo asset
import { Youtube, Twitter, Instagram, Linkedin } from 'lucide-react'

const Footer = () => {
  return (
    <footer className="bg-neutral-950 pt-20 pb-10 px-6 md:px-12 border-t border-white/10 z-10 relative">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
        
        {/* Column 1: Brand */}
        <div className="flex flex-col gap-6">
           <div className="flex items-center gap-2">
                <Image src={logo} alt="Grove Connect Logo" width={40} height={40} />
                <span className="text-xl font-bold text-white">Grove Connect</span>
            </div>
          <p className="text-gray-400 leading-relaxed">
            Empowering creators with the tools, knowledge, and community to thrive in the digital economy.
          </p>
          <div className="flex gap-4">
            <a href="#" className="text-gray-400 hover:text-green-400 transition-colors"><Youtube className="w-6 h-6" /></a>
            <a href="#" className="text-gray-400 hover:text-green-400 transition-colors"><Twitter className="w-6 h-6" /></a>
            <a href="#" className="text-gray-400 hover:text-green-400 transition-colors"><Instagram className="w-6 h-6" /></a>
            <a href="#" className="text-gray-400 hover:text-green-400 transition-colors"><Linkedin className="w-6 h-6" /></a>
          </div>
        </div>

        {/* Links Columns */}
        <div>
          <h4 className="text-white font-bold mb-6">Platform</h4>
          <ul className="flex flex-col gap-4 text-gray-400">
            <li><a href="#" className="hover:text-green-400 transition-colors">Courses</a></li>
            <li><a href="#" className="hover:text-green-400 transition-colors">Mentorship</a></li>
            <li><a href="#" className="hover:text-green-400 transition-colors">Community</a></li>
            <li><a href="#" className="hover:text-green-400 transition-colors">Pricing</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold mb-6">Resources</h4>
          <ul className="flex flex-col gap-4 text-gray-400">
            <li><a href="#" className="hover:text-green-400 transition-colors">Blog</a></li>
            <li><a href="#" className="hover:text-green-400 transition-colors">YouTube Channel</a></li>
            <li><a href="#" className="hover:text-green-400 transition-colors">Creator Tools</a></li>
            <li><a href="#" className="hover:text-green-400 transition-colors">Support</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold mb-6">Company</h4>
          <ul className="flex flex-col gap-4 text-gray-400">
            <li><a href="#" className="hover:text-green-400 transition-colors">About Us</a></li>
            <li><a href="#" className="hover:text-green-400 transition-colors">Careers</a></li>
            <li><a href="#" className="hover:text-green-400 transition-colors">Contact</a></li>
            <li><a href="#" className="hover:text-green-400 transition-colors">Privacy Policy</a></li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-gray-500 text-sm">
        <p>© {new Date().getFullYear()} Grove Connect. All rights reserved.</p>
        <div className="flex gap-6">
            <a href="#" className="hover:text-gray-300 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-gray-300 transition-colors">Privacy Policy</a>
        </div>
      </div>
    </footer>
  )
}

export default Footer