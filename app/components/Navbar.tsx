"use client";

import React, { useState } from 'react';
import { LucideArrowUpRight, Menu, X } from 'lucide-react';
import Image from 'next/image';
import { logo, navItems } from '../assets';
import { FloatingNav } from './ui/floating-navbar';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    // CONTAINER: Fixed position, perfectly centered horizontally using inset-x-0 + mx-auto
    <nav className="fixed top-6 inset-x-0 mx-auto w-[95%] md:w-[90%] max-w-7xl z-50">
      
      {/* VISUAL LAYER: Handles background, blur, border, and shape change on mobile open */}
      <div 
        className={`
          relative 
          transition-all duration-300 ease-in-out
          ${isOpen ? 'rounded-3xl bg-black/90' : 'rounded-full'} 
          px-4 sm:px-6
        `}
      >
        <div className="flex justify-between items-center h-16">
          
          {/* 1. LOGO SECTION */}
          {/* Removed ml-20 to allow flexbox to handle spacing naturally */}
          <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer">
            <Image 
              src={logo}
              alt='grove connect logo'
              width={35} // Slightly larger for better visibility
              height={35}
              className='bg-transparent object-contain'
            />
             {/* Optional: Add text if you want the brand name visible next to logo */}
             {/* <span className="font-bold text-white hidden sm:block">Grove Connect</span> */}
          </div>

          {/* 2. DESKTOP MENU (FloatingNav) */}
          {/* Hidden on mobile, visible on medium screens and up */}
          <div className="hidden md:block">
             <FloatingNav navItems={navItems} className="!relative !top-0 !mx-0" />
          </div>

          {/* 3. CTA BUTTON (Desktop) */}
          <div className="hidden md:block">
            <button className="group flex items-center gap-1 bg-transparent border border-white/20 hover:border-green-400 cursor-pointer text-white px-6 py-2 rounded-full transition-all duration-200 hover:bg-green-500/10">
              <span className="text-sm font-medium">Sign Up</span>
              <LucideArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>

          {/* 4. MOBILE MENU TOGGLE */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-white p-2 hover:bg-white/10 rounded-full transition-colors focus:outline-none"
              aria-label="Toggle menu"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* 5. MOBILE MENU DROPDOWN */}
        {/* Renders inside the container so it shares the background blur */}
        {isOpen && (
          <div className="md:hidden pt-2 pb-6 px-2 space-y-1 border-t border-white/10 animate-in fade-in slide-in-from-top-2 duration-200">
            {navItems.map((item: any, idx: number) => (
              <a
                key={idx}
                href={item.link} // Assuming navItems has { name, link }
                className="block px-4 py-3 text-base font-medium text-gray-200 hover:text-green-400 hover:bg-white/5 rounded-xl transition-colors"
                onClick={() => setIsOpen(false)} // Close menu on click
              >
                {item.name}
              </a>
            ))}
            
            {/* Mobile CTA Button */}
            <div className="pt-4 mt-2">
              <button className="w-full flex justify-center items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-3 rounded-xl cursor-pointer font-medium transition-colors">
                Sign Up
                <LucideArrowUpRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;