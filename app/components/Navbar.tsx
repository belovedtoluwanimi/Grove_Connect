"use client";

import React, { useState } from 'react';
import { LucideArrowUpRight, LucideArrowUpRightFromCircle, LucideCircleArrowOutUpRight, Menu, X } from 'lucide-react'; // optional: hamburger icon
import Image from 'next/image';
import { logo } from '../assets';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-black/20 backdrop-blur-lg fixed w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0 text-2xl ml-20 font-bold text-green-400">
            <Image 
              src={logo}
              alt='grove connect logo'
              width={30}
              height={30}
              className='bg-transparent'
            />
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-6  text-white">
            <a href="#" className="hover:underline">
              Home
            </a>
            <a href="#" className="hover:underline">
              About
            </a>
            <a href="#" className="hover:underline">
              Contact
            </a>
            <a href="#" className="hover:underline">
              YouTube
            </a>
          </div>

          {/* CTA Button (Desktop) */}
          <div className="hidden md:block">
            <button className="bg-transparent border hover:scale-1 text-white px-8 cursor-pointer py-3 rounded-full transition-colors duration-200 items-center">
              Contact <LucideArrowUpRight className="inline-block ml-1 p-[0.2px] border rounded-full" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-white focus:outline-none"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-black/90 backdrop-blur-lg px-4 pt-2 pb-4 space-y-2 text-white">
          <a href="#" className="block hover:underline">
            Home
          </a>
          <a href="#" className="block hover:underline">
            About
          </a>
          <a href="#" className="block hover:underline">
            Contact
          </a>
          <button className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors duration-200">
            Contact
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
