'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Mail, MapPin, Phone, Send, Loader2, CheckCircle2, 
  MessageSquare, HelpCircle, Twitter, Linkedin, Github 
} from 'lucide-react'
import Navbar from '../components/Navbar'

// --- BACKGROUND COMPONENTS ---
const BackgroundEffects = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {/* Grid */}
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-50" />
    
    {/* Glows */}
    <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[128px]" />
    <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[128px]" />
  </div>
)

export default function ContactPage() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'General Inquiry',
    message: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Simulate API Call
    await new Promise(resolve => setTimeout(resolve, 2000))

    setLoading(false)
    setSuccess(true)
    // Reset form after delay if needed
    // setTimeout(() => { setSuccess(false); setFormData({name:'', email:'', subject:'General', message:''}) }, 5000)
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-24 pb-12 px-6 relative overflow-hidden font-sans selection:bg-emerald-500/30">
        <Navbar />
      <BackgroundEffects />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* HEADER */}
        <div className="text-center mb-16 space-y-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider"
          >
            <MessageSquare size={14} /> We'd love to hear from you
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-black tracking-tight"
          >
            Get in <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">Touch</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.2 }}
            className="text-zinc-400 max-w-2xl mx-auto text-lg"
          >
            Have a question about courses? Want to partner with us? Or just want to say hi? Drop us a line below.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-start">
          
          {/* --- LEFT: CONTACT INFO --- */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ delay: 0.3 }}
            className="space-y-8"
          >
            <div className="space-y-6">
              <ContactCard 
                icon={Mail} 
                title="Email Us" 
                detail="groveconn3ct22@gmail.com" 
                sub="We typically reply within 2 hours." 
              />
              <ContactCard 
                icon={Phone} 
                title="Call Support" 
                detail="+234-9134709682" 
                sub="Mon-Fri from 8am to 5pm." 
              />
            </div>

            {/* Socials */}
            <div className="pt-8 border-t border-white/10">
              <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4">Follow Us</h4>
              <div className="flex gap-4">
                <SocialBtn icon={Twitter} />
                <SocialBtn icon={Linkedin} />
                <SocialBtn icon={Github} />
              </div>
            </div>
          </motion.div>

          {/* --- RIGHT: FORM --- */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ delay: 0.4 }}
            className="bg-zinc-900/50 border border-white/10 backdrop-blur-xl p-8 rounded-3xl shadow-2xl relative overflow-hidden"
          >
            {/* Success Overlay */}
            <AnimatePresence>
              {success && (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  className="absolute inset-0 bg-[#050505]/95 flex flex-col items-center justify-center z-20 text-center p-8"
                >
                  <motion.div 
                    initial={{ scale: 0 }} 
                    animate={{ scale: 1 }} 
                    className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center text-black mb-6 shadow-[0_0_50px_rgba(16,185,129,0.5)]"
                  >
                    <CheckCircle2 size={40} />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-white mb-2">Message Sent!</h3>
                  <p className="text-zinc-400 mb-8">We've received your inquiry and will get back to you shortly.</p>
                  <button onClick={() => setSuccess(false)} className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm font-bold transition-colors">
                    Send Another
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Your Name</label>
                  <input 
                    required 
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Doe" 
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white placeholder:text-zinc-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Email Address</label>
                  <input 
                    required 
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="john@example.com" 
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white placeholder:text-zinc-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Subject</label>
                <select 
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all appearance-none cursor-pointer"
                >
                  <option>General Inquiry</option>
                  <option>Technical Support</option>
                  <option>Partnership & Sales</option>
                  <option>Report an Issue</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Message</label>
                <textarea 
                  required 
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="How can we help you?" 
                  rows={5}
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white placeholder:text-zinc-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none resize-none transition-all"
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-white text-black font-bold text-lg py-4 rounded-xl hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" /> : <><Send size={18} /> Send Message</>}
              </button>
            </form>
          </motion.div>

        </div>
      </div>
    </div>
  )
}

// --- SUB-COMPONENTS ---

const ContactCard = ({ icon: Icon, title, detail, sub }: any) => (
  <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-white/5 transition-colors cursor-default group">
    <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-emerald-400 group-hover:scale-110 transition-transform shadow-lg">
      <Icon size={24} />
    </div>
    <div>
      <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">{title}</h3>
      <p className="text-zinc-300 font-medium">{detail}</p>
      <p className="text-zinc-600 text-xs mt-1">{sub}</p>
    </div>
  </div>
)

const SocialBtn = ({ icon: Icon }: any) => (
  <button className="p-3 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 hover:text-emerald-400 hover:border-emerald-500/30 transition-all group">
    <Icon size={20} className="group-hover:scale-110 transition-transform"/>
  </button>
)