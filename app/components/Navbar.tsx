"use client";

import React, { useState, useEffect } from 'react';
import { 
  Menu, X, ShoppingCart, User, LogOut, 
  LayoutDashboard, ChevronDown, ArrowRight 
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
        fixed top-0 inset-x-0 z-50 h-20 w-full transition-all duration-300
        ${scrolled || isOpen 
          ? 'bg-[#050505]/70 backdrop-blur-md border-b border-white/5' 
          : 'bg-transparent border-b border-transparent'}
      `}
    >
      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
        
        {/* 1. LOGO */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-9 h-9 overflow-hidden rounded-xl bg-white/5 border border-white/10 p-1">
             <Image 
               src={logo}
               alt='Grove Connect'
               width={36}
               height={36}
               className='object-cover group-hover:scale-110 transition-transform duration-500'
             />
          </div>
          <span className="font-bold text-xl tracking-tight text-white hidden sm:block">
            Grove<span className="text-green-500">Connect</span>
          </span>
        </Link>

        {/* 2. DESKTOP LINKS */}
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
              <Link href="/dashboard">
                <button className="p-2 text-zinc-400 hover:text-white transition-colors" title="My Learning">
                   <LayoutDashboard size={20} />
                </button>
              </Link>

              <div className="h-4 w-[1px] bg-white/10 mx-1" />

              <div className="relative">
                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-white/5 transition-all"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-700 flex items-center justify-center text-xs font-bold text-white shadow-lg">
                    {user.user_metadata.full_name?.charAt(0) || <User size={14} />}
                  </div>
                  <ChevronDown size={14} className={`text-zinc-500 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-4 w-56 bg-[#0A0A0A] border border-white/10 rounded-xl shadow-2xl overflow-hidden py-1 ring-1 ring-white/5"
                    >
                      <div className="px-4 py-3 border-b border-white/5">
                        <p className="text-sm font-medium text-white truncate">{user.user_metadata.full_name}</p>
                        <p className="text-xs text-zinc-500 truncate">{user.email}</p>
                      </div>
                      <div className="p-1">
                        <Link href="/dashboard" className="flex items-center gap-2 w-full px-3 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                          <LayoutDashboard size={14} /> Student Dashboard
                        </Link>
                      </div>
                      <div className="border-t border-white/5 p-1">
                        <button onClick={handleLogout} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
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
                <button className="group relative px-6 py-2.5 bg-white text-black text-sm font-bold rounded-full overflow-hidden transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                  <span className="relative z-10 flex items-center gap-2">
                    Get Started <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform"/>
                  </span>
                </button>
              </Link>
            </div>
          )}
        </div>

        {/* 4. MOBILE MENU TOGGLE */}
        <button onClick={() => setIsOpen(!isOpen)} className="md:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-colors">
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* 5. MOBILE MENU */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: '100vh' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden fixed inset-0 top-20 bg-[#050505]/95 backdrop-blur-xl z-40 border-t border-white/10 overflow-y-auto"
          >
            <div className="flex flex-col p-6 space-y-6">
              {navItems.map((item: any, idx: number) => (
                <Link key={idx} href={item.link} onClick={() => setIsOpen(false)} className="text-2xl font-bold text-zinc-400 hover:text-white transition-all">
                  {item.name}
                </Link>
              ))}
              <div className="w-full h-[1px] bg-white/10" />
              {!user && (
                  <Link href="/auth" onClick={() => setIsOpen(false)} className="text-xl font-bold text-white flex items-center gap-2">
                      Get Started <ArrowRight size={20} />
                  </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;