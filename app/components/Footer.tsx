'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { logo } from '../assets'
import { Youtube, Twitter, Instagram, Linkedin } from 'lucide-react'

const Footer = () => {
  return (
    <footer className="bg-neutral-950 pt-20 pb-10 px-6 md:px-12 border-t border-white/10 z-10 relative">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
        
        {/* Column 1: Brand */}
        <div className="flex flex-col gap-6">
            <Link href="/" className="flex items-center gap-2">
                <div className="relative w-10 h-10 overflow-hidden rounded-xl bg-white/5 border border-white/10 p-1">
                    <Image src={logo} alt="Grove Connect" className="object-cover" width={40} height={40} />
                </div>
                <span className="text-xl font-bold text-white">Grove Connect</span>
            </Link>
          <p className="text-zinc-400 leading-relaxed text-sm">
            Empowering creators with the tools, knowledge, and community to thrive in the digital economy.
          </p>
          <div className="flex gap-4">
            <a href="https://youtube.com/@groveconnect" target="_blank" className="text-zinc-400 hover:text-red-500 transition-colors"><Youtube size={20} /></a>
            <a href="https://twitter.com/groveconnect" target="_blank" className="text-zinc-400 hover:text-blue-400 transition-colors"><Twitter size={20} /></a>
            <a href="https://instagram.com/groveconnect" target="_blank" className="text-zinc-400 hover:text-pink-500 transition-colors"><Instagram size={20} /></a>
            <a href="https://linkedin.com/company/groveconnect" target="_blank" className="text-zinc-400 hover:text-blue-600 transition-colors"><Linkedin size={20} /></a>
          </div>
        </div>

        {/* Links Columns */}
        <div>
          <h4 className="text-white font-bold mb-6">Platform</h4>
          <ul className="flex flex-col gap-3 text-sm text-zinc-400">
            <li><Link href="/courses" className="hover:text-emerald-400 transition-colors">Courses</Link></li>
            <li><Link href="/mentorship" className="hover:text-emerald-400 transition-colors">Mentorship</Link></li>
            <li><Link href="/community" className="hover:text-emerald-400 transition-colors">Community</Link></li>
            <li><Link href="/pricing" className="hover:text-emerald-400 transition-colors">Pricing</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold mb-6">Resources</h4>
          <ul className="flex flex-col gap-3 text-sm text-zinc-400">
            <li><Link href="/blog" className="hover:text-emerald-400 transition-colors">Blog</Link></li>
            <li><a href="https://youtube.com/@groveconnect" target="_blank" className="hover:text-emerald-400 transition-colors">YouTube Channel</a></li>
            <li><Link href="/tools" className="hover:text-emerald-400 transition-colors">Creator Tools</Link></li>
            <li><Link href="/contact" className="hover:text-emerald-400 transition-colors">Support</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold mb-6">Company</h4>
          <ul className="flex flex-col gap-3 text-sm text-zinc-400">
            <li><Link href="/about" className="hover:text-emerald-400 transition-colors">About Us</Link></li>
            <li><Link href="/careers" className="hover:text-emerald-400 transition-colors">Careers</Link></li>
            <li><Link href="/contact" className="hover:text-emerald-400 transition-colors">Contact</Link></li>
            <li><Link href="/privacy" className="hover:text-emerald-400 transition-colors">Privacy Policy</Link></li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-zinc-500 text-xs">
        <p>© {new Date().getFullYear()} Grove Connect. All rights reserved.</p>
        <div className="flex gap-6">
            <Link href="/terms" className="hover:text-zinc-300 transition-colors">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-zinc-300 transition-colors">Privacy Policy</Link>
        </div>
      </div>
    </footer>
  )
}

export default Footer