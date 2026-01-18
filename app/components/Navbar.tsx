"use client";

import React, { useState } from 'react';
import { LucideArrowUpRight, Menu, X, ShoppingCart, User, LogOut } from 'lucide-react';
import Image from 'next/image';
import { logo, navItems } from '../assets'; // Keep your assets
import { FloatingNav } from './ui/floating-navbar';
import Link from 'next/link';
import { useAuth } from '@/app/hooks/useAuth'; // Import the hook we just made
import { useRouter } from 'next/navigation';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, supabase } = useAuth();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setShowUserMenu(false);
    router.push('/');
    router.refresh();
  };

  return (
    <nav className="fixed top-6 inset-x-0 mx-auto w-[95%] md:w-[90%] max-w-7xl z-50">
      
      <div 
        className={`
          relative 
          transition-all duration-300 ease-in-out
          ${isOpen ? 'rounded-3xl bg-black/90' : 'rounded-full'} 
          px-4 sm:px-6
        `}
      >
        <div className="flex justify-between items-center h-16">
          
          {/* 1. LOGO */}
          <Link href="/">
            <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer">
              <Image 
                src={logo}
                alt='grove connect logo'
                width={35}
                height={35}
                className='bg-transparent object-contain'
              />
            </div>
          </Link>

          {/* 2. DESKTOP MENU */}
          <div className="hidden md:block">
             <FloatingNav navItems={navItems} className="!relative !top-0 !mx-0" />
          </div>

          {/* 3. AUTH SECTION (Dynamic) */}
          <div className="hidden md:flex items-center gap-6">
            
            {user ? (
              // --- LOGGED IN STATE ---
              <>
                {/* Cart Icon */}
                <button className="relative text-gray-300 hover:text-green-400 transition-colors">
                  <ShoppingCart size={22} />
                  {/* Mock Badge - You can connect this to real cart state later */}
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-600 text-[10px] font-bold text-white flex items-center justify-center rounded-full">
                    0
                  </span>
                </button>

                {/* User Avatar / Dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="w-10 h-10 rounded-full bg-gradient-to-tr from-green-600 to-emerald-800 flex items-center justify-center text-white font-bold border-2 border-transparent hover:border-white transition-all"
                  >
                    {user.user_metadata.full_name?.charAt(0) || <User size={18} />}
                  </button>

                  {/* Dropdown Menu */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-3 w-48 bg-neutral-900 border border-white/10 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                      <div className="px-4 py-3 border-b border-white/10">
                        <p className="text-sm text-white font-medium truncate">{user.user_metadata.full_name}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                      <Link href="/dashboard" className="block px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white">
                        My Dashboard
                      </Link>
                      <button 
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/10 hover:text-red-300 flex items-center gap-2"
                      >
                        <LogOut size={14} /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              // --- LOGGED OUT STATE ---
              <Link href="/auth">
                <button className="group flex items-center gap-1 bg-transparent border border-white/20 hover:border-green-400 cursor-pointer text-white px-6 py-3 rounded-full transition-all duration-200 hover:bg-green-500/10">
                  <span className="text-sm font-medium">Sign Up</span>
                  <LucideArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
              </Link>
            )}
          </div>

          {/* 4. MOBILE MENU TOGGLE */}
          <div className="md:hidden flex items-center gap-4">
            {/* Show tiny avatar on mobile header too if logged in */}
            {user && (
               <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold">
                  {user.user_metadata.full_name?.charAt(0)}
               </div>
            )}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-white p-2 hover:bg-white/10 rounded-full transition-colors focus:outline-none"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* 5. MOBILE MENU DROPDOWN */}
        {isOpen && (
          <div className="md:hidden pt-2 pb-6 px-2 space-y-1 border-t border-white/10 animate-in fade-in slide-in-from-top-2 duration-200">
            {navItems.map((item: any, idx: number) => (
              <a
                key={idx}
                href={item.link} 
                className="block px-4 py-3 text-base font-medium text-gray-200 hover:text-green-400 hover:bg-white/5 rounded-xl transition-colors"
                onClick={() => setIsOpen(false)} 
              >
                {item.name}
              </a>
            ))}
            
            {/* Mobile CTA Logic */}
            <div className="pt-4 mt-2">
              {user ? (
                 <button 
                  onClick={handleLogout}
                  className="w-full flex justify-center items-center gap-2 bg-neutral-800 text-red-400 px-4 py-3 rounded-xl cursor-pointer font-medium"
                 >
                    Sign Out
                 </button>
              ) : (
                <Link href="/auth">
                  <button className="w-full flex justify-center items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-3 rounded-xl cursor-pointer font-medium transition-colors">
                    Sign Up
                    <LucideArrowUpRight size={18} />
                  </button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;