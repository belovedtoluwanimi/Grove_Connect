"use client";

import React, { useState, useEffect } from 'react';
import { 
  LucideArrowUpRight, Menu, X, ShoppingCart, 
  User, LogOut, LayoutDashboard, ChevronDown 
} from 'lucide-react';
import Image from 'next/image';
import { logo, navItems } from '../assets'; 
import Link from 'next/link';
import { useAuth } from '@/app/hooks/useAuth'; 
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, supabase } = useAuth();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Handle Scroll Effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setShowUserMenu(false);
    router.push('/');
    router.refresh();
  };

  return (
    <nav 
      className={`
        fixed top-0 inset-x-0 z-50 h-16 transition-all duration-300 border-b
        ${scrolled || isOpen 
          ? 'bg-black/80 backdrop-blur-xl border-white/10' 
          : 'bg-transparent border-transparent'}
      `}
    >
      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
        
        {/* 1. LOGO */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative w-8 h-8 overflow-hidden rounded-lg">
             <Image 
               src={logo}
               alt='Grove Connect'
               fill
               className='object-cover group-hover:scale-110 transition-transform duration-500'
             />
          </div>
          <span className="font-bold text-lg tracking-tight text-white hidden sm:block">
            Grove<span className="text-green-500">Connect</span>
          </span>
        </Link>

        {/* 2. DESKTOP LINKS (Centered) */}
        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item: any, idx: number) => (
            <Link 
              key={idx} 
              href={item.link}
              className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
            >
              {item.name}
            </Link>
          ))}
        </div>

        {/* 3. AUTH & ACTIONS */}
        <div className="hidden md:flex items-center gap-4">
          
          {user ? (
            // --- LOGGED IN STATE ---
            <div className="flex items-center gap-4">
              {/* Dashboard Link (Quick Access) */}
              <Link href="/dashboard">
                <button className="p-2 text-zinc-400 hover:text-white transition-colors" title="My Learning">
                   <LayoutDashboard size={20} />
                </button>
              </Link>

              {/* Cart */}
              <button className="relative p-2 text-zinc-400 hover:text-white transition-colors">
                <ShoppingCart size={20} />
                <span className="absolute top-1 right-0.5 w-2 h-2 bg-green-500 rounded-full animate-pulse ring-2 ring-black" />
              </button>

              {/* User Profile Dropdown */}
              <div className="relative">
                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full border border-white/10 hover:bg-white/5 transition-all"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-green-500 to-emerald-700 flex items-center justify-center text-[10px] font-bold text-white border border-black/20">
                    {user.user_metadata.full_name?.charAt(0) || <User size={12} />}
                  </div>
                  <ChevronDown size={14} className={`text-zinc-500 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-56 bg-[#0A0A0A] border border-white/10 rounded-xl shadow-2xl overflow-hidden py-1"
                    >
                      <div className="px-4 py-3 border-b border-white/5">
                        <p className="text-sm font-medium text-white truncate">{user.user_metadata.full_name}</p>
                        <p className="text-xs text-zinc-500 truncate">{user.email}</p>
                      </div>
                      <div className="p-1">
                        <Link href="/dashboard" className="flex items-center gap-2 w-full px-3 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                          <LayoutDashboard size={14} /> Student Dashboard
                        </Link>
                        <Link href="/admin/dashboard" className="flex items-center gap-2 w-full px-3 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                          <User size={14} /> Instructor Hub
                        </Link>
                      </div>
                      <div className="border-t border-white/5 p-1">
                        <button 
                          onClick={handleLogout}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <LogOut size={14} /> Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            // --- LOGGED OUT STATE ---
            <div className="flex items-center gap-4">
              <Link href="/auth" className="text-sm font-medium text-zinc-300 hover:text-white transition-colors">
                Log In
              </Link>
              <Link href="/auth">
                <button className="group relative px-5 py-2.5 bg-white text-black text-sm font-bold rounded-full overflow-hidden transition-all hover:pr-8">
                  <span className="relative z-10">Get Started</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-green-300 to-green-400 opacity-0 group-hover:opacity-100 transition-opacity z-0" />
                  <LucideArrowUpRight size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all z-20" />
                </button>
              </Link>
            </div>
          )}
        </div>

        {/* 4. MOBILE MENU TOGGLE */}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* 5. MOBILE MENU (Full Screen Overlay) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: '100vh' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden fixed inset-0 top-16 bg-black z-40 border-t border-white/10 overflow-y-auto"
          >
            <div className="flex flex-col p-6 space-y-6">
              <div className="space-y-2">
                {navItems.map((item: any, idx: number) => (
                  <Link 
                    key={idx} 
                    href={item.link}
                    onClick={() => setIsOpen(false)}
                    className="block text-2xl font-bold text-zinc-400 hover:text-white hover:translate-x-2 transition-all"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>

              <div className="w-full h-[1px] bg-white/10" />

              <div className="space-y-4">
                {user ? (
                  <>
                    <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl">
                      <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-bold">
                        {user.user_metadata.full_name?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-white font-medium">{user.user_metadata.full_name}</p>
                        <p className="text-xs text-zinc-500">{user.email}</p>
                      </div>
                    </div>
                    <Link href="/dashboard" onClick={() => setIsOpen(false)} className="block w-full py-3 bg-white text-black text-center font-bold rounded-xl">
                      Go to Dashboard
                    </Link>
                    <button onClick={handleLogout} className="block w-full py-3 border border-white/10 text-red-400 text-center font-bold rounded-xl hover:bg-red-500/10">
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/auth" onClick={() => setIsOpen(false)} className="block w-full py-4 text-center border border-white/10 rounded-xl text-white font-bold hover:bg-white/5">
                      Log In
                    </Link>
                    <Link href="/auth" onClick={() => setIsOpen(false)} className="block w-full py-4 text-center bg-white text-black rounded-xl font-bold hover:bg-gray-200">
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;