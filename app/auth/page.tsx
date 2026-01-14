"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Mail, Lock, User, Github, Chrome } from "lucide-react";
import Link from "next/link";
import { cn } from "@/app/lib/utils"; // Ensure you have a cn utility or remove usage

// --- REUSABLE COMPONENTS ---

const InputGroup = ({
  id,
  type,
  placeholder,
  icon,
}: {
  id: string;
  type: string;
  placeholder: string;
  icon: React.ReactNode;
}) => (
  <div className="relative mb-4 group">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 group-focus-within:text-green-400 transition-colors">
      {icon}
    </div>
    <input
      id={id}
      type={type}
      placeholder={placeholder}
      className="w-full pl-10 pr-4 py-3 bg-neutral-900/50 border border-neutral-800 rounded-lg 
                 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 
                 focus:ring-1 focus:ring-green-500 transition-all duration-300"
    />
  </div>
);

const SocialButton = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
  <button className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border border-neutral-800 bg-neutral-900/50 hover:bg-neutral-800 hover:border-green-500/50 transition-all duration-300 group">
    <div className="text-gray-400 group-hover:text-white transition-colors">{icon}</div>
    <span className="text-sm font-medium text-gray-400 group-hover:text-white">{label}</span>
  </button>
);

// --- MAIN COMPONENT ---

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen w-full bg-black flex items-center justify-center relative overflow-hidden p-4">
      {/* Background Ambience */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-green-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-emerald-900/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Back to Home Link */}
      <Link
        href="/"
        className="absolute top-8 left-8 text-gray-400 hover:text-green-400 flex items-center gap-2 transition-colors z-20"
      >
        <ArrowLeft size={18} />
        <span className="text-sm font-medium">Back to Home</span>
      </Link>

      {/* The Auth Card */}
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative w-full max-w-md bg-neutral-950/80 backdrop-blur-xl border border-green-500/50 rounded-2xl shadow-[0_0_50px_-12px_rgba(34,197,94,0.2)] overflow-hidden z-10"
      >
        <div className="p-8">
          {/* Header */}
          <motion.div layout className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
              {isLogin ? "Welcome Back" : "Join the Movement"}
            </h2>
            <p className="text-gray-400 text-sm">
              {isLogin
                ? "Enter your credentials to access your account."
                : "Create an account and start growing today."}
            </p>
          </motion.div>

          {/* Form Content Switcher */}
          <div className="relative min-h-[320px]">
            <AnimatePresence mode="wait">
              {isLogin ? (
                <motion.form
                  key="login"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col h-full"
                  onSubmit={(e) => e.preventDefault()}
                >
                  <InputGroup
                    id="email"
                    type="email"
                    placeholder="Email Address"
                    icon={<Mail size={18} />}
                  />
                  <InputGroup
                    id="password"
                    type="password"
                    placeholder="Password"
                    icon={<Lock size={18} />}
                  />
                  
                  <div className="flex justify-end mb-6">
                    <a href="#" className="text-xs text-green-400 hover:text-green-300 transition-colors">
                      Forgot Password?
                    </a>
                  </div>

                  <button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold py-3 rounded-lg shadow-lg shadow-green-900/20 transform active:scale-[0.98] transition-all duration-200">
                    Sign In
                  </button>

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-neutral-800"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-neutral-950 px-2 text-gray-500">Or continue with</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <SocialButton icon={<Github size={18} />} label="GitHub" />
                    <SocialButton icon={<Chrome size={18} />} label="Google" />
                  </div>
                </motion.form>
              ) : (
                <motion.form
                  key="signup"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col h-full"
                  onSubmit={(e) => e.preventDefault()}
                >
                  <InputGroup
                    id="name"
                    type="text"
                    placeholder="Full Name"
                    icon={<User size={18} />}
                  />
                  <InputGroup
                    id="email"
                    type="email"
                    placeholder="Email Address"
                    icon={<Mail size={18} />}
                  />
                  <InputGroup
                    id="password"
                    type="password"
                    placeholder="Create Password"
                    icon={<Lock size={18} />}
                  />

                  <button className="w-full mt-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold py-3 rounded-lg shadow-lg shadow-green-900/20 transform active:scale-[0.98] transition-all duration-200">
                    Create Account
                  </button>
                  
                  <p className="text-center text-[10px] text-gray-500 mt-4">
                    By registering, you agree to our <span className="text-green-400 cursor-pointer">Terms</span> and <span className="text-green-400 cursor-pointer">Privacy Policy</span>.
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer Toggle */}
        <div className="bg-neutral-900/50 p-4 border-t border-neutral-800 text-center">
          <p className="text-sm text-gray-400">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-green-400 font-semibold hover:text-green-300 hover:underline transition-all ml-1"
            >
              {isLogin ? "Sign Up" : "Log In"}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;