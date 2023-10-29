'use client'

import React, { useState } from 'react'
import { Eye, EyeOff, ArrowRight, CheckCircle2, Lock } from 'lucide-react'
import Link from 'next/link'

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="min-h-screen w-full bg-black flex relative overflow-hidden">
      
      {/* --- AMBIENT BACKGROUND --- */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-green-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-900/20 blur-[120px] rounded-full pointer-events-none" />

      {/* --- LEFT SIDE: ARTWORK & VALUE PROP (Hidden on Mobile) --- */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 relative z-10 border-r border-white/10">
        <div className="text-2xl font-bold text-white tracking-tighter">
          GROVE <span className="text-green-500">CONNECT</span>
        </div>

        <div className="space-y-6">
          <h1 className="text-5xl font-bold text-white leading-tight">
            Turn Your Knowledge <br />
            Into a <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">Global Empire.</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-md">
            Join the elite tier of educators. Tools for analytics, growth, and legal compliance—all in one dashboard.
          </p>
          
          <div className="space-y-3 pt-4">
            {['Zero-fee payouts for first 3 months', 'Automated Legal Compliance Checks', 'Advanced Student Analytics'].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 text-gray-300">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-gray-500 text-sm">
          © {new Date().getFullYear()} Grove Connect Inc.
        </div>
      </div>

      {/* --- RIGHT SIDE: FORM --- */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative z-10">
        <div className="w-full max-w-md space-y-8">
          
          {/* Header */}
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-white">
              {isLogin ? 'Welcome Back, Mentor' : 'Apply as an Instructor'}
            </h2>
            <p className="mt-2 text-gray-400">
              {isLogin ? 'Enter your credentials to access the dashboard.' : 'Start your journey with Grove Connect today.'}
            </p>
          </div>

          {/* Form */}
          <form className="space-y-6 mt-8" onSubmit={(e) => e.preventDefault()}>
            {!isLogin && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">First Name</label>
                  <input type="text" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-green-500 focus:outline-none transition-colors" placeholder="John" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Last Name</label>
                  <input type="text" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-green-500 focus:outline-none transition-colors" placeholder="Doe" />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Email Address</label>
              <input type="email" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-green-500 focus:outline-none transition-colors" placeholder="mentor@groveconnect.com" />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-green-500 focus:outline-none transition-colors" 
                  placeholder="••••••••" 
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-green-900/20">
              {isLogin ? 'Access Dashboard' : 'Create Account'}
              <ArrowRight size={18} />
            </button>
          </form>

          {/* Toggle */}
          <div className="text-center pt-4 border-t border-white/10">
            <p className="text-gray-400">
              {isLogin ? "Don't have an account yet?" : "Already an instructor?"}
              <button 
                onClick={() => setIsLogin(!isLogin)}
                className="ml-2 text-green-400 hover:text-green-300 font-medium underline-offset-4 hover:underline transition-all"
              >
                {isLogin ? "Apply Now" : "Sign In"}
              </button>
            </p>
          </div>
          
          <div className="flex items-center justify-center gap-2 text-gray-600 text-xs">
            <Lock size={12} />
            <span>256-bit SSL Encrypted Connection</span>
          </div>

        </div>
      </div>
    </div>
  )
}

export default AuthPage