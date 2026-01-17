'use client'

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Mail, Lock, User, Github, Chrome, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/app/utils/supabase/client"; // Your existing client helper

// --- REUSABLE COMPONENTS (Updated to accept props) ---

const InputGroup = ({
  id,
  type,
  placeholder,
  icon,
  value,
  onChange,
  required = false
}: {
  id: string;
  type: string;
  placeholder: string;
  icon: React.ReactNode;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
}) => (
  <div className="relative mb-4 group">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 group-focus-within:text-green-400 transition-colors">
      {icon}
    </div>
    <input
      id={id}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      className="w-full pl-10 pr-4 py-3 bg-neutral-900/50 border border-neutral-800 rounded-lg 
                 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 
                 focus:ring-1 focus:ring-green-500 transition-all duration-300"
    />
  </div>
);

const SocialButton = ({ icon, label, onClick, disabled }: { icon: React.ReactNode; label: string, onClick: () => void, disabled?: boolean }) => (
  <button 
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border border-neutral-800 bg-neutral-900/50 hover:bg-neutral-800 hover:border-green-500/50 transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed"
  >
    <div className="text-gray-400 group-hover:text-white transition-colors">{icon}</div>
    <span className="text-sm font-medium text-gray-400 group-hover:text-white">{label}</span>
  </button>
);

// --- MAIN COMPONENT ---

const AuthPage = () => {
  const router = useRouter();
  const supabase = createClient();

  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // 1. EMAIL AUTHENTICATION
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      if (isLogin) {
        // Log In Logic
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        
        router.push("/courses"); // Redirect students to the course catalog
      } else {
        // Sign Up Logic
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
              role: 'student', // Explicitly tag as student
            },
          },
        });
        if (error) throw error;

        alert("Account created! Please check your email to confirm.");
        setIsLogin(true);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // 2. SOCIAL AUTHENTICATION (OAuth)
  const handleSocialAuth = async (provider: 'google' | 'github') => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`, // Required for OAuth
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setErrorMsg(err.message);
      setLoading(false);
    }
  };

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

          {/* Error Message */}
          {errorMsg && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 text-xs flex items-center gap-2"
            >
              <AlertCircle size={14} className="shrink-0" />
              {errorMsg}
            </motion.div>
          )}

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
                  onSubmit={handleEmailAuth}
                >
                  <InputGroup
                    id="email"
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    icon={<Mail size={18} />}
                  />
                  <InputGroup
                    id="password"
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    icon={<Lock size={18} />}
                  />
                  
                  <div className="flex justify-end mb-6">
                    <a href="#" className="text-xs text-green-400 hover:text-green-300 transition-colors">
                      Forgot Password?
                    </a>
                  </div>

                  <button disabled={loading} className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold py-3 rounded-lg shadow-lg shadow-green-900/20 transform active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                    {loading ? <Loader2 className="animate-spin w-5 h-5" /> : "Sign In"}
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
                    <SocialButton 
                      icon={<Github size={18} />} 
                      label="GitHub" 
                      onClick={() => handleSocialAuth('github')} 
                      disabled={loading}
                    />
                    <SocialButton 
                      icon={<Chrome size={18} />} 
                      label="Google" 
                      onClick={() => handleSocialAuth('google')} 
                      disabled={loading}
                    />
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
                  onSubmit={handleEmailAuth}
                >
                  <InputGroup
                    id="name"
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    icon={<User size={18} />}
                  />
                  <InputGroup
                    id="email"
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    icon={<Mail size={18} />}
                  />
                  <InputGroup
                    id="password"
                    type="password"
                    placeholder="Create Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    icon={<Lock size={18} />}
                  />

                  <button disabled={loading} className="w-full mt-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold py-3 rounded-lg shadow-lg shadow-green-900/20 transform active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                     {loading ? <Loader2 className="animate-spin w-5 h-5" /> : "Create Account"}
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
              onClick={() => {
                setIsLogin(!isLogin);
                setErrorMsg(null);
                // Reset form fields when switching views
                setName("");
                setEmail("");
                setPassword("");
              }}
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