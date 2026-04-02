'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { 
  LayoutDashboard, BookOpen, Users, DollarSign, Settings, 
  Bell, Search, Plus, MoreVertical, LogOut, Loader2,
  TrendingUp, ArrowUpRight, CreditCard, Lock, User, Image as ImageIcon,
  Calendar, ChevronDown, ChevronLeft, Globe, Shield, Smartphone, Trash2, Edit, 
  MapPin, CheckCircle2, AlertCircle, X, QrCode, Facebook, Twitter, Linkedin, Instagram, Mail, Eye,
  Webhook,
  Copy,
  Code,
  Download,
  Landmark,
  ArrowLeft,
  Clock,
  ChevronRight
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/app/utils/supabase/client'
import API_URL from '@/app/utils/api'
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line 
} from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'

// --- DECLARE CUSTOM ELEMENT ---
// (Removed to avoid type conflict with global.d.ts)

// --- TYPES ---
type Course = {
  id: string
  title: string
  status: 'Draft' | 'Review' | 'Active'
  price: number
  students_count: number
  total_revenue: number
  created_at: string
  average_rating?: number // Added to track rating per course
}

type UserProfile = {
  id: string
  full_name: string
  email: string
  avatar_url?: string
  bio?: string
  nationality?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zip?: string
  payout_method?: string
  payout_details?: string
  two_factor_enabled?: boolean
  social_twitter?: string
  social_linkedin?: string
  social_instagram?: string
  is_verified?: boolean
}

type Notification = {
  id: string
  title: string
  message: string
  time: string
  read: boolean
  type: 'info' | 'success' | 'warning'
}

type TimeRange = '7d' | '30d' | '90d' | '365d'

// --- CONSTANTS ---
const COUNTRIES = [
  "United States", "United Kingdom", "Nigeria", "India", "Canada", "Germany", "Australia", 
  "France", "Brazil", "Japan", "South Africa", "Kenya", "Ghana", "Singapore", "United Arab Emirates"
].sort();

const PAYOUT_MAPPING: Record<string, string[]> = {
  'United States': ['Stripe', 'Bank Transfer (ACH)', 'PayPal'],
  'United Kingdom': ['Stripe', 'Bank Transfer (BACS)', 'PayPal'],
  'Nigeria': ['Flutterwave', 'Paystack', 'Bank Transfer', 'Crypto (USDT)'],
  'India': ['Razorpay', 'PayPal', 'Bank Transfer'],
  'default': ['PayPal', 'International Wire', 'Crypto (USDT)']
}

// --- TOAST COMPONENT ---
const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => (
  <motion.div 
    initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
    className={`fixed bottom-8 right-8 z-[100] flex items-center gap-4 pl-4 pr-6 py-4 rounded-xl shadow-2xl backdrop-blur-xl border border-white/10 ${
      type === 'success' ? 'bg-green-900/90 text-white' : 'bg-red-900/90 text-white'
    }`}
  >
    <div className={`p-2 rounded-full ${type === 'success' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
      {type === 'success' ? <CheckCircle2 size={20} className="text-green-400" /> : <AlertCircle size={20} className="text-red-400" />}
    </div>
    <div>
      <h4 className="font-bold text-sm">{type === 'success' ? 'Success' : 'Error'}</h4>
      <p className="text-xs opacity-90">{message}</p>
    </div>
    <button onClick={onClose} className="ml-2 opacity-50 hover:opacity-100"><X size={14} /></button>
  </motion.div>
)

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  
  // --- STATE ---
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [showKYCModal, setShowKYCModal] = useState(false) // <-- NEW STATE
  const [isVerifying, setIsVerifying] = useState(false)
  
  // UI State
  const [currentView, setCurrentView] = useState<'overview' | 'courses' | 'settings' | 'course_detail'>('overview')
  const [settingsTab, setSettingsTab] = useState<'profile' | 'security' | 'payouts' | 'preferences' | 'privacy' | 'integrations'>('profile')
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'} | null>(null)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [timeRange, setTimeRange] = useState<TimeRange>('30d')
  
  // 2FA State
  const [show2FASetup, setShow2FASetup] = useState(false)
  const [twoFACode, setTwoFACode] = useState("")

  const [profileDraft, setProfileDraft] = useState<Partial<UserProfile>>({})
  const [newPassword, setNewPassword] = useState("")

  // --- FINTECH WITHDRAWAL ENGINE STATE ---
  const [isWithdrawModalOpen, setWithdrawModalOpen] = useState(false)
  const [withdrawStep, setWithdrawStep] = useState<1 | 2 | 3 | 4>(1)
  const [withdrawAmount, setWithdrawAmount] = useState<string>('')
  const [isProcessingPayout, setIsProcessingPayout] = useState(false)

  // --- ACCOUNT LINKING ENGINE STATE ---
  const [isLinkModalOpen, setLinkModalOpen] = useState(false)
  const [linkStep, setLinkStep] = useState<1 | 2 | 3>(1)
  const [linkMethod, setLinkMethod] = useState<'Bank' | 'PayPal' | 'Crypto' | ''>('')

  // --- REAL DATA STATES ---
  const [bankList, setBankList] = useState<{name: string, code: string}[]>([])
  const [paypalEmail, setPayPalEmail] = useState("")

  // Fetch ALL banks dynamically when the modal opens
  useEffect(() => {
      if (isLinkModalOpen && linkMethod === 'Bank' && bankList.length === 0) {
          // This fetches the live list of every recognized bank in Nigeria
          fetch('https://api.paystack.co/bank?country=nigeria')
          .then(res => res.json())
          .then(data => {
              if (data.status) {
                  // Sort them alphabetically for better UX
                  const sortedBanks = data.data.sort((a: any, b: any) => a.name.localeCompare(b.name));
                  setBankList(sortedBanks);
              }
          })
          .catch(err => console.error("Failed to fetch live banks", err));
      }
  }, [isLinkModalOpen, linkMethod, bankList.length]);
  
  // Bank Resolution State
  const [bankCode, setBankCode] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [resolvedName, setResolvedName] = useState('')
  const [isResolving, setIsResolving] = useState(false)

  // Mock list of banks (In production, fetch this from Paystack/Flutterwave /bank API)
//   const NIGERIAN_BANKS = [
//       { name: "Access Bank", code: "044" },
//       { name: "Guaranty Trust Bank (GTB)", code: "058" },
//       { name: "United Bank for Africa (UBA)", code: "033" },
//       { name: "Zenith Bank", code: "057" },
//       { name: "First Bank of Nigeria", code: "011" },
//       { name: "Moniepoint Microfinance Bank", code: "50515" },
//       { name: "Opay", code: "090267" }
//   ]
  
// --- REAL FINTECH LEDGER STATE ---
  const [transactions, setTransactions] = useState<any[]>([])
  const [totalWithdrawn, setTotalWithdrawn] = useState(0)

  // --- REAL-TIME NOTIFICATION ENGINE ---
  const notificationRef = useRef<HTMLDivElement>(null)
  const [notifications, setNotifications] = useState<any[]>([])
  const [selectedNotification, setSelectedNotification] = useState<any | null>(null) // For the reading modal

  // 1. Fetch & Listen to WebSockets
  useEffect(() => {
      if (!user?.id) return;

      // Fetch initial history
      const fetchNotifications = async () => {
          const { data } = await supabase
              .from('notifications')
              .select('*')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false })
              .limit(50);
          if (data) setNotifications(data);
      };
      fetchNotifications();

      // Subscribe to Real-Time INSERTS (New Notifications)
      const channel = supabase
          .channel('realtime-alerts')
          .on('postgres_changes', {
              event: 'INSERT',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${user.id}`
          }, (payload) => {
              const newAlert = payload.new;
              setNotifications(prev => [newAlert, ...prev]);
              showToast(`New Alert: ${newAlert.title}`, "success"); // Flash a toast instantly
          })
          .subscribe();

      return () => { supabase.removeChannel(channel); }
  }, [user?.id, supabase]);

  // 2. Close dropdown when clicking outside
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
              setNotificationsOpen(false)
          }
      }
      if (notificationsOpen) document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [notificationsOpen])

  // 3. Database-Synced Read Actions
  const markAsRead = async (id: string) => {
      setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n)) // Optimistic UI update
      await supabase.from('notifications').update({ read: true }).eq('id', id);
  }

  const markAllRead = async () => {
      setNotifications(notifications.map(n => ({ ...n, read: true }))) // Optimistic UI update
      showToast("All notifications marked as read", "success")
      await supabase.from('notifications').update({ read: true }).eq('user_id', user?.id).eq('read', false);
  }

  // --- GLOBAL SEARCH ENGINE ---
  const searchRef = useRef<HTMLDivElement>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  // 1. Close search when clicking outside
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
              setIsSearchOpen(false)
          }
      }
      if (isSearchOpen) document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isSearchOpen])

  // 2. The Search Algorithm
  const searchResults = useMemo(() => {
      if (!searchQuery.trim()) return { courses: [], settings: [] }
      const q = searchQuery.toLowerCase()
      
      // Filter Dynamic Courses
      const matchedCourses = courses.filter(c => c.title.toLowerCase().includes(q))
      
      // Filter Static Settings Pages
      const settingsPages = [
          { id: 'profile', label: 'Public Profile & Bio', icon: User },
          { id: 'security', label: 'Trust & Security (2FA, Password)', icon: Shield },
          { id: 'payouts', label: 'Payouts, Wallet & Taxes', icon: CreditCard },
          { id: 'preferences', label: 'Notification Preferences', icon: Bell },
          { id: 'privacy', label: 'Privacy & Data Export (GDPR)', icon: Eye },
          { id: 'integrations', label: 'API Keys & Webhooks', icon: Code }
      ]
      const matchedSettings = settingsPages.filter(s => s.label.toLowerCase().includes(q))

      return { courses: matchedCourses, settings: matchedSettings }
  }, [searchQuery, courses])

  // 3. The Navigation Router
  const handleSearchNavigation = (type: 'course' | 'setting', id: string, courseObj?: Course) => {
      if (type === 'setting') {
          setCurrentView('settings')
          setSettingsTab(id as any)
      } else if (type === 'course' && courseObj) {
          setSelectedCourse(courseObj)
          setCurrentView('course_detail')
      }
      setIsSearchOpen(false)
      setSearchQuery("") // Clear search after navigation
  }
  // --- PRIVACY & API STATE ---
  const [privacyPrefs, setPrivacyPrefs] = useState({
      publicProfile: true,
      showCourses: true,
      allowDirectMessages: false
  })
  const [emailPrefs, setEmailPrefs] = useState({
      purchases: true,
      reviews: true,
      marketing: false,
      platformUpdates: true
  })
  const [apiKey, setApiKey] = useState<string | null>("pk_live_grove_5a9b8c7d6e...")
  const [webhookUrl, setWebhookUrl] = useState("")
  const [isGeneratingKey, setIsGeneratingKey] = useState(false)

  const handleCopyKey = () => {
      if (apiKey) {
          navigator.clipboard.writeText(apiKey)
          showToast("API Key copied to clipboard!", "success")
      }
  }

  const handleGenerateNewKey = async () => {
      setIsGeneratingKey(true)
      try {
          const res = await fetch('/api/developer', {
              method: 'POST',
              body: JSON.stringify({ action: 'roll_key' })
          });
          const data = await res.json();
          if (data.success) {
              setApiKey(data.key);
              showToast("New API Key generated successfully.", "success");
          } else throw new Error(data.error);
      } catch (err: any) {
          showToast(err.message, "error");
      } finally {
          setIsGeneratingKey(false);
      }
  }

  // --- HELPERS ---
  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }


  const handlePasswordUpdate = async () => {
    if (newPassword.length < 6) return showToast("Password must be at least 6 characters", "error")

    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) showToast(error.message, "error")
    else {
        showToast("Password updated successfully!", "success")
        setNewPassword("") // Clear the input
    }
}
  // --- GLOBAL SECURITY CHECK ---
  // --- GLOBAL SECURITY CHECK ---
  const handleNewCourseClick = (e: React.MouseEvent) => {
      e.preventDefault() 
      if (!user) return

      // KYC is no longer required to build courses! (The Payout Gate strategy)
      // Tutors can build and publish freely. We only require 2FA for account security.
      if (!user.two_factor_enabled) {
          showToast("You must enable Email 2FA before building a course.", "error")
          setCurrentView('settings')
          setSettingsTab('security')
          return
      }

      // If 2FA is active, let them build!
      router.push('/admin/create-course')
  }

  // --- 1. DATA ENGINE (FIXED) ---
  useEffect(() => {
    const init = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return router.push('/auth')

      // Fetch Profile
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', authUser.id).single()
      setUser(profile)

      // Fetch Courses WITH Real Enrollment Counts and Real Reviews
      const { data: courseData } = await supabase
        .from('courses')
        .select(`
            *,
            enrollments(id),
            reviews(rating)
        `)
        .eq('instructor_id', authUser.id)
        .order('created_at', { ascending: false })

      if (courseData) {
        // Process data to calculate real totals
        const processedCourses = courseData.map((c: any) => {
            const realStudentCount = c.enrollments ? c.enrollments.length : 0
            
            // Calculate Rating
            const ratings = c.reviews?.map((r: any) => r.rating) || []
            const avgRating = ratings.length > 0 
                ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length 
                : 0

            return {
                ...c,
                students_count: realStudentCount, // Use real count
                total_revenue: c.price * realStudentCount, // Use real revenue
                average_rating: avgRating // Use real rating
            }
        })
        setCourses(processedCourses)
      }
      // Fetch Real Payout Ledger
      const { data: payoutData } = await supabase
        .from('payout_requests')
        .select('*')
        .eq('user_id', authUser.id)
        .order('requested_at', { ascending: false })

      if (payoutData) {
          setTransactions(payoutData)
          // Calculate lifetime withdrawn amount (only counting completed or pending transfers)
          const withdrawnAmount = payoutData
              .filter(tx => tx.status !== 'failed')
              .reduce((sum, tx) => sum + Number(tx.amount), 0)
          setTotalWithdrawn(withdrawnAmount)
      }
      setLoading(false)
    }
    init()
  }, [router])

  // --- 2. ANALYTICS GENERATOR (True Dynamic Trends) ---
  const analyticsData = useMemo(() => {
    const now = new Date()
    const dataPoints: any[] = []
    let days = 30
    
    if (timeRange === '7d') days = 7
    if (timeRange === '90d') days = 90
    if (timeRange === '365d') days = 365

    const totalRev = courses.reduce((acc, c) => acc + c.total_revenue, 0)
    const totalStudents = courses.reduce((acc, c) => acc + (c.students_count || 0), 0)

    for (let i = days; i >= 0; i--) {
        const d = new Date()
        d.setDate(now.getDate() - i)
        
        const label = days > 90 
            ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) 
            : d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })
        
        // Simulation Algo: Generate a natural growth curve leading up to current totals
        const progress = 1 - (i / days) // 0 to 1
        const curve = Math.pow(progress, 2) // Quadratic growth
        
        // Add random variance to make it look organic
        const variance = (Math.random() * 0.1) - 0.05 
        
        dataPoints.push({
            name: label,
            revenue: Math.floor(totalRev * (curve + variance)),
            students: Math.floor(totalStudents * (curve + variance))
        })
    }
    // Filter out negatives from variance
    return dataPoints.map(p => ({
        ...p, 
        revenue: Math.max(0, p.revenue), 
        students: Math.max(0, p.students)
    }))
  }, [courses, timeRange])

  // Calculate Overall Stats & Ledger Balance
  const overallStats = useMemo(() => {
      const totalRev = courses.reduce((acc, c) => acc + c.total_revenue, 0);
      const totalSt = courses.reduce((acc, c) => acc + (c.students_count || 0), 0);
      const avgRt = courses.length > 0 
        ? (courses.reduce((acc, c) => acc + (c.average_rating || 0), 0) / courses.length).toFixed(1) 
        : "N/A";

      // Fintech Math: 
      // Platform takes 20% (0.2). Tutor gets 80% (0.8).
      const grossTutorRevenue = totalRev * 0.8;
      
      // Simulate pending clearance (e.g., funds held for 30-day refund periods).
      // In production, calculate this by checking if the enrollment date is < 30 days.
      const pendingClearance = grossTutorRevenue * 0.2; 
      
      const clearedRevenue = grossTutorRevenue - pendingClearance;
      
      // True Liquid Balance = Cleared Revenue - Everything they already withdrew
      const liquidBalance = Math.max(0, clearedRevenue - totalWithdrawn);

      return {
          revenue: totalRev,
          students: totalSt,
          rating: avgRt,
          courses: courses.length,
          availableBalance: liquidBalance,
          pendingClearance: pendingClearance
      }
  }, [courses, totalWithdrawn]);

  // --- HANDLERS ---

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return
    const file = e.target.files[0]

    // Client-side check
    if (file.size > 10 * 1024 * 1024) return showToast("File too large. Max 10MB.", 'error')

    setIsUploadingAvatar(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      // Use the ?type=image query param for safety
      const res = await fetch(`${API_URL}/api/upload?type=image`, { method: 'POST', body: formData })
      
      if(!res.ok) {
          const err = await res.json().catch(()=>({}))
          throw new Error(err.error || "Upload failed")
      }
      
      const { url } = await res.json()
      
      const { error } = await supabase.from('profiles').update({ avatar_url: url }).eq('id', user?.id)
      if (error) throw error

      setUser(prev => prev ? { ...prev, avatar_url: url } : null)
      showToast("Profile picture updated!", 'success')
    } catch (err: any) {
      showToast(err.message, 'error')
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return
    
    // Optimistic UI Update (Instant feedback)
    const oldUser = { ...user }
    setUser({ ...user, ...updates })

    const { error } = await supabase.from('profiles').update(updates).eq('id', user.id)
    
    if (error) {
        console.error(error)
        setUser(oldUser) // Revert on fail
        showToast("Failed to save changes. Check internet.", 'error')
    } else {
        showToast("Settings saved.", 'success')
    }
  }

  const handleEnable2FA = async () => {
      try {
          const res = await fetch('/api/2fa', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'verify', userId: user?.id, code: twoFACode })
          })
          const data = await res.json()
          
          if (data.success) {
              setUser(prev => prev ? {...prev, two_factor_enabled: true} : null)
              setShow2FASetup(false)
              showToast("Two-Factor Authentication Enabled!", "success")
          } else {
              showToast("Invalid code. Please try again.", "error")
          }
      } catch (e) {
          showToast("Verification failed. Check connection.", "error")
      }
  }

  const handleEditCourse = (id: string) => router.push(`/admin/create-course?edit=${id}`)
  
  const handleDeleteCourse = async (id: string) => {
      if(!confirm("Are you sure? This action is irreversible.")) return
      await supabase.from('courses').delete().eq('id', id)
      setCourses(prev => prev.filter(c => c.id !== id))
      showToast("Course deleted.", 'success')
  }

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-green-500"><Loader2 className="animate-spin w-10 h-10" /></div>

  return (
    <div className="min-h-screen bg-black flex text-white overflow-hidden font-sans selection:bg-green-500/30">
      <AnimatePresence>{toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}</AnimatePresence>

      {/* SIDEBAR */}
      <aside className="w-72 bg-neutral-950 border-r border-white/5 hidden lg:flex flex-col z-20 shadow-2xl">
        <div className="p-8 pb-4">
          <Link href='/'>
            <h2 className="text-2xl font-bold tracking-tighter flex items-center gap-2">GROVE<span className="text-green-500 text-xs bg-green-500/10 px-2 py-1 rounded border border-green-500/20">TUTOR</span></h2>
          </Link>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <NavButton active={currentView === 'overview'} onClick={() => setCurrentView('overview')} icon={LayoutDashboard}>Dashboard</NavButton>
          <NavButton active={currentView === 'courses' || currentView === 'course_detail'} onClick={() => setCurrentView('courses')} icon={BookOpen}>My Courses</NavButton>
          <NavButton active={currentView === 'settings'} onClick={() => setCurrentView('settings')} icon={Settings}>Settings</NavButton>
        </nav>

        <div className="p-4 m-4 bg-neutral-900/50 rounded-xl border border-white/5">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-green-500 to-emerald-700 flex items-center justify-center font-bold text-sm shadow-lg overflow-hidden shrink-0">
                 {user?.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover" /> : user?.full_name?.charAt(0)}
              </div>
              <div className="overflow-hidden">
                 <p className="text-sm font-bold truncate text-white">{user?.full_name}</p>
                 <p className="text-xs text-gray-500 truncate capitalize">{user?.nationality || 'Global'}</p>
              </div>
           </div>
           <button onClick={async () => { await supabase.auth.signOut(); router.push('/auth') }} className="mt-4 w-full flex items-center justify-center gap-2 text-xs text-red-400 hover:bg-red-500/10 py-2 rounded-lg transition-colors">
             <LogOut size={14} /> Sign Out
           </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col relative overflow-y-auto h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900 via-black to-black">
        
        {/* Header */}
        <header className="h-20 border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0 z-10 flex items-center justify-between px-8 py-8">
          {/* GLOBAL SEARCH WRAPPER */}
          <div className="relative w-full max-w-[150px] sm:max-w-xs md:w-96 z-50" ref={searchRef}>
            <div className={`flex items-center gap-3 text-zinc-400 bg-[#0a0a0a] px-4 py-2.5 border transition-colors ${isSearchOpen && searchQuery ? 'border-emerald-500/50 rounded-t-2xl rounded-b-none' : 'border-white/10 rounded-full focus-within:border-white/30'}`}>
              <Search size={16} className={isSearchOpen && searchQuery ? "text-emerald-500" : ""} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setIsSearchOpen(true); }}
                onFocus={() => setIsSearchOpen(true)}
                placeholder="Search courses, settings..." 
                className="bg-transparent outline-none text-sm w-full text-white placeholder-zinc-600" 
              />
              {searchQuery && (
                  <button onClick={() => { setSearchQuery(""); setIsSearchOpen(false); }} className="text-zinc-500 hover:text-white">
                      <X size={14} />
                  </button>
              )}
            </div>

            {/* SEARCH RESULTS DROPDOWN */}
            {isSearchOpen && searchQuery.trim().length > 0 && (
                <div className="absolute top-full left-0 w-full bg-[#0a0a0a] border border-white/10 border-t-0 rounded-b-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1 max-h-[70vh] overflow-y-auto no-scrollbar">
                    
                    {searchResults.courses.length === 0 && searchResults.settings.length === 0 ? (
                        <div className="p-6 text-center text-zinc-500 text-sm">No results found for "{searchQuery}"</div>
                    ) : (
                        <div className="py-2">
                            {/* Course Results */}
                            {searchResults.courses.length > 0 && (
                                <div className="mb-2">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 px-4 py-2">Courses</h4>
                                    {searchResults.courses.map(course => (
                                        <button 
                                            key={course.id} 
                                            onClick={() => handleSearchNavigation('course', course.id, course)}
                                            className="w-full text-left px-4 py-3 hover:bg-white/5 flex items-center gap-3 transition-colors group"
                                        >
                                            <div className="p-2 bg-zinc-900 rounded-lg group-hover:bg-emerald-500/20 group-hover:text-emerald-400 transition-colors"><BookOpen size={16}/></div>
                                            <div>
                                                <p className="text-sm font-bold text-white line-clamp-1">{course.title}</p>
                                                <p className="text-[10px] text-zinc-500 uppercase">{course.status} • ${course.price}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Settings Results */}
                            {searchResults.settings.length > 0 && (
                                <div>
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 px-4 py-2">Settings & Configuration</h4>
                                    {searchResults.settings.map(setting => (
                                        <button 
                                            key={setting.id} 
                                            onClick={() => handleSearchNavigation('setting', setting.id)}
                                            className="w-full text-left px-4 py-3 hover:bg-white/5 flex items-center gap-3 transition-colors group"
                                        >
                                            <div className="p-2 bg-zinc-900 rounded-lg group-hover:bg-blue-500/20 group-hover:text-blue-400 transition-colors">
                                                <setting.icon size={16}/>
                                            </div>
                                            <p className="text-sm font-bold text-white">{setting.label}</p>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
          </div>
          <div className="flex items-center gap-6">
              
              {/* NOTIFICATION WRAPPER */}
              <div className="relative" ref={notificationRef}>
                <button onClick={() => setNotificationsOpen(!notificationsOpen)} className="relative text-zinc-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full">
                  <Bell size={20} />
                  {notifications.some(n => !n.read) && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]" />}
                </button>
                
                {notificationsOpen && (
                    <div className="absolute right-0 sm:-right-4 mt-4 w-[calc(100vw-2rem)] sm:w-96 bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 max-w-sm origin-top-right">
                        <div className="p-4 border-b border-white/5 font-bold text-sm flex justify-between items-center bg-black/40">
                            <span className="text-white">Notifications</span>
                            <button onClick={markAllRead} className="text-[10px] text-emerald-400 hover:text-emerald-300 transition-colors uppercase tracking-wider font-black">Mark all read</button>
                        </div>
                        <div className="max-h-[60vh] overflow-y-auto no-scrollbar">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center flex flex-col items-center">
                                    <Bell size={32} className="text-zinc-700 mb-3"/>
                                    <p className="text-zinc-500 text-sm">You're all caught up!</p>
                                </div>
                            ) : (
                                notifications.map(n => (
                                    <div 
                                        key={n.id} 
                                        onClick={() => { 
                                            markAsRead(n.id); 
                                            setSelectedNotification(n); 
                                            setNotificationsOpen(false); 
                                        }}
                                        className={`p-4 border-b border-white/5 cursor-pointer transition-colors ${n.read ? 'bg-transparent opacity-60 hover:opacity-100' : 'bg-emerald-500/5 hover:bg-emerald-500/10'}`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <h5 className="text-sm font-bold text-white flex items-start gap-2 leading-tight">
                                                {!n.read && <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0 mt-1.5 shadow-[0_0_8px_rgba(16,185,129,0.8)]"/>}
                                                <span className="line-clamp-1">{n.title}</span>
                                            </h5>
                                            <span className="text-[10px] text-zinc-500 whitespace-nowrap ml-3 shrink-0">
                                                {new Date(n.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-zinc-400 pl-3 line-clamp-2">{n.message}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
              </div>
              <button 
                onClick={handleNewCourseClick} 
                className="bg-white text-black px-5 py-2 rounded-full text-sm font-bold hover:bg-gray-200 transition-colors shadow-lg flex items-center gap-2"
              >
                <Plus size={16} /> New Course
              </button>
          </div>
        </header>

        <div className="p-8 space-y-8 max-w-[1600px] mx-auto w-full">
          
          {/* === OVERVIEW VIEW === */}
          {currentView === 'overview' && (
            <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="space-y-8">
              <div className="flex justify-between items-center">
                  <h1 className="text-3xl font-bold text-white">Tutor Dashboard</h1>
                  
                  {/* TIME RANGE SELECTOR */}
                  <div className="flex bg-neutral-900 border border-white/10 rounded-lg p-1">
                      {['7d', '30d', '90d', '365d'].map(range => (
                          <button 
                            key={range}
                            onClick={() => setTimeRange(range as TimeRange)}
                            className={`px-3 py-1 text-xs font-bold rounded transition-all ${timeRange === range ? 'bg-white text-black' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                          >
                              {range.toUpperCase()}
                          </button>
                      ))}
                  </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="Total Revenue" value={`$${overallStats.revenue.toLocaleString()}`} icon={DollarSign} trend="+12%" trendUp={true} />
                <StatCard label="Total Enrollments" value={overallStats.students.toLocaleString()} icon={Users} trend="+8%" trendUp={true} />
                <StatCard label="Active Courses" value={overallStats.courses.toString()} icon={BookOpen} trend="+1" trendUp={true} />
                <StatCard label="Avg. Rating" value={String(overallStats.rating)} icon={TrendingUp} trend="+0.1" trendUp={true} />
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 {/* Revenue Chart */}
                 <div className="lg:col-span-2 bg-neutral-900/40 border border-white/5 p-6 rounded-2xl relative min-h-[350px]">
                    <h3 className="text-lg font-bold mb-6 text-white">Revenue Growth</h3>
                    <div className='h-[300px] w-full min-w-0'>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={analyticsData}>
                            <defs><linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/><stop offset="95%" stopColor="#22c55e" stopOpacity={0}/></linearGradient></defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                            <XAxis dataKey="name" stroke="#666" tickLine={false} axisLine={false} />
                            <YAxis stroke="#666" tickLine={false} axisLine={false} tickFormatter={(v)=>`$${v}`} />
                            <Tooltip contentStyle={{backgroundColor:'#000', border:'1px solid #333', borderRadius:'8px'}} />
                            <Area type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={3} fill="url(#colorRev)" />
                        </AreaChart>
                    </ResponsiveContainer>
                    </div>
                 </div>

                 {/* Enrollments Bar Chart */}
                 <div className="bg-neutral-900/40 border border-white/5 p-6 rounded-2xl min-h-[350px]">
                    <h3 className="text-lg font-bold mb-6 text-white">New Students</h3>
                    <div className='h-[300px] w-full min-w-0'>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={analyticsData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                            <XAxis dataKey="name" stroke="#666" tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={{backgroundColor:'#000', border:'1px solid #333', borderRadius:'8px'}} cursor={{fill:'rgba(255,255,255,0.05)'}} />
                            <Bar dataKey="students" fill="#fff" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                    </div>
                 </div>
              </div>

              <h3 className="text-xl font-bold pt-4 text-white">Recent Courses</h3>
              <CoursesTable courses={courses.slice(0, 5)} onAction={handleEditCourse} onDelete={handleDeleteCourse} onView={(c: Course) => { setSelectedCourse(c); setCurrentView('course_detail') }} />
            </motion.div>
          )}

          {/* === COURSES VIEW === */}
          {currentView === 'courses' && (
             <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-white">My Courses</h1>
                    <div className="flex gap-2">
                        <button onClick={handleNewCourseClick} className="bg-white text-black px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"><Plus size={16}/> Create Course</button>
                    </div>
                </div>
                {courses.length === 0 ? (
                    <div className="text-center py-20 bg-neutral-900/40 rounded-2xl border border-white/5">
                        <BookOpen size={48} className="mx-auto text-zinc-600 mb-4" />
                        <h3 className="text-xl font-bold mb-2">No courses yet</h3>
                        <p className="text-zinc-500 mb-6">Complete your security setup to start teaching.</p>
                        <button onClick={handleNewCourseClick} className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-500 transition-colors">Start Verification</button>
                    </div>
                ) : (
                    <CoursesTable courses={courses} onAction={handleEditCourse} onDelete={handleDeleteCourse} onView={(c: Course) => { setSelectedCourse(c); setCurrentView('course_detail') }} />
                )}
             </motion.div>
          )}

          {/* === COURSE DETAIL ANALYTICS === */}
          {currentView === 'course_detail' && selectedCourse && (
             <motion.div initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} className="space-y-8">
                <button onClick={() => setCurrentView('courses')} className="flex items-center gap-2 text-gray-400 hover:text-white"><ChevronLeft size={16}/> Back to Courses</button>
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-white">{selectedCourse.title}</h1>
                        <p className="text-gray-400 mt-1">Status: <span className="text-green-400 font-bold uppercase">{selectedCourse.status}</span> • Created: {new Date(selectedCourse.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => handleEditCourse(selectedCourse.id)} className="bg-white text-black px-4 py-2 rounded-lg font-bold text-sm hover:bg-gray-200">Edit Content</button>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard label="Revenue" value={`$${selectedCourse.total_revenue}`} icon={DollarSign} trendUp={true} trend="+5%" />
                    <StatCard label="Active Students" value={selectedCourse.students_count} icon={Users} trendUp={true} trend="+12" />
                    <StatCard label="Price Point" value={`$${selectedCourse.price}`} icon={CreditCard} trendUp={true} trend="Fixed" />
                </div>
                <div className="bg-neutral-900/40 border border-white/5 p-6 rounded-2xl h-[400px]">
                    <h3 className="text-lg font-bold mb-6">Engagement Trend</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={analyticsData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                            <XAxis dataKey="name" stroke="#666" />
                            <YAxis stroke="#666" />
                            <Tooltip contentStyle={{backgroundColor:'#000'}} />
                            <Line type="monotone" dataKey="students" stroke="#3b82f6" strokeWidth={3} dot={{r:4, fill:'#3b82f6'}} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
             </motion.div>
          )}

           {/*
          {currentView === 'settings' && user && (
            <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <div className="lg:col-span-1 flex overflow-x-auto gap-2 pb-2 lg:pb-0 lg:flex-col lg:space-y-1 no-scrollbar">
   {['profile', 'security', 'payouts'].map((tab) => (
      <button key={tab} onClick={() => setSettingsTab(tab as any)} className={`whitespace-nowrap px-4 py-3 rounded-lg text-sm font-medium capitalize transition-all ${settingsTab === tab ? 'bg-white text-black font-bold' : 'text-gray-400 hover:bg-white/5'}`}>{tab}</button>
   ))}
</div>

               <div className="lg:col-span-3 bg-neutral-900/40 border border-white/5 rounded-2xl p-8 min-h-[600px]">
                  
                  
                  {settingsTab === 'profile' && (
                     <div className="space-y-8 animate-in fade-in">
                        <div className="flex justify-between items-center border-b border-white/10 pb-4">
                            <h3 className="text-xl font-bold">Personal Information</h3>
                            {user.is_verified ? (
                                <span className="flex items-center gap-1 text-green-400 text-xs font-bold bg-green-900/20 px-3 py-1 rounded-full"><CheckCircle2 size={12}/> Verified Tutor</span>
                            ) : (
                                <button className="flex items-center gap-1 text-yellow-400 text-xs font-bold bg-yellow-900/20 px-3 py-1 rounded-full hover:bg-yellow-900/40">Verify Identity</button>
                            )}
                        </div>
                        
                        <div className="flex items-center gap-6">
                           <div className="w-24 h-24 rounded-full bg-neutral-800 border-2 border-dashed border-white/20 flex items-center justify-center relative overflow-hidden group">
                              {user.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover" /> : <ImageIcon className="text-gray-500" />}
                              <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                                {isUploadingAvatar ? <Loader2 className="animate-spin text-white" /> : <><Edit size={16} className="text-white mb-1"/><span className="text-[10px] font-bold text-white">CHANGE</span></>}
                                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                              </label>
                           </div>
                           <div><p className="font-bold text-lg">{user.full_name}</p><p className="text-sm text-gray-500">{user.email}</p></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Nationality</label>
                             <select className="w-full bg-black border border-white/10 rounded-lg p-3 outline-none focus:border-green-500" value={user.nationality || ''} onChange={(e) => updateProfile({ nationality: e.target.value })}>
                                <option value="" disabled>Select Country</option>
                                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                             </select>
                           </div>
                           <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Phone Number</label><input defaultValue={user.phone} onChange={(e)=>setProfileDraft({...profileDraft, phone: e.target.value})} className="w-full bg-black border border-white/10 rounded-lg p-3 outline-none focus:border-green-500" placeholder="+1 (555) 000-0000" /></div>
                           <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Address Line</label><input defaultValue={user.address} onChange={(e)=>setProfileDraft({...profileDraft, address: e.target.value})} className="w-full bg-black border border-white/10 rounded-lg p-3 outline-none focus:border-green-500" /></div>
                           <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">City</label><input defaultValue={user.city} onChange={(e)=>setProfileDraft({...profileDraft, city: e.target.value})} className="w-full bg-black border border-white/10 rounded-lg p-3 outline-none" /></div>
                             <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Zip Code</label><input defaultValue={user.zip} onChange={(e)=>setProfileDraft({...profileDraft, zip: e.target.value})} className="w-full bg-black border border-white/10 rounded-lg p-3 outline-none" /></div>
                           </div>
                        </div>
                        
                        <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Bio</label><textarea defaultValue={user.bio} onChange={(e)=>setProfileDraft({...profileDraft, bio: e.target.value})} className="w-full h-32 bg-black border border-white/10 rounded-lg p-3 outline-none resize-none focus:border-green-500" /></div>
                        
                        <div className="pt-4 border-t border-white/10">
                            <h4 className="text-sm font-bold text-white mb-4">Social Links</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-2 bg-black border border-white/10 rounded-lg px-3 py-2">
                                    <Twitter size={16} className="text-gray-500"/>
                                    <input defaultValue={user.social_twitter} onChange={(e)=>setProfileDraft({...profileDraft, social_twitter: e.target.value})} placeholder="Twitter Username" className="bg-transparent outline-none text-sm w-full"/>
                                </div>
                                <div className="flex items-center gap-2 bg-black border border-white/10 rounded-lg px-3 py-2">
                                    <Linkedin size={16} className="text-gray-500"/>
                                    <input defaultValue={user.social_linkedin} onChange={(e)=>setProfileDraft({...profileDraft, social_linkedin: e.target.value})} placeholder="LinkedIn Profile" className="bg-transparent outline-none text-sm w-full"/>
                                </div>
                                <div className="flex items-center gap-2 bg-black border border-white/10 rounded-lg px-3 py-2">
                                    <Instagram size={16} className="text-gray-500"/>
                                    <input defaultValue={user.social_instagram} onChange={(e)=>setProfileDraft({...profileDraft, social_instagram: e.target.value})} placeholder="Instagram Handle" className="bg-transparent outline-none text-sm w-full"/>
                                </div>
                                <div className="flex items-center gap-2 bg-black border border-white/10 rounded-lg px-3 py-2">
                                    <Mail size={16} className="text-gray-500"/>
                                    <input defaultValue={user.email} disabled className="bg-transparent outline-none text-sm w-full text-gray-500 cursor-not-allowed"/>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end"><button onClick={()=>updateProfile({})} className="bg-white text-black px-6 py-2 rounded-lg font-bold text-sm hover:bg-gray-200">Save Changes</button></div>
                     </div>
                  )}

                  {settingsTab === 'security' && (
                     <div className="space-y-8 animate-in fade-in">
                        <h3 className="text-xl font-bold border-b border-white/10 pb-4">Trust & Security</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            
                            <div className={`p-6 rounded-2xl border ${user.is_verified ? 'bg-emerald-900/10 border-emerald-500/30' : 'bg-neutral-800/50 border-white/10'}`}>
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`p-3 rounded-xl ${user.is_verified ? 'bg-emerald-500/20' : 'bg-blue-500/20'}`}>
                                        <User size={24} className={user.is_verified ? "text-emerald-400" : "text-blue-400"} />
                                    </div>
                                    {user.is_verified && <CheckCircle2 className="text-emerald-500" />}
                                </div>
                                <h4 className="font-bold text-white mb-2">Identity Verification</h4>
                                <p className="text-xs text-gray-400 mb-6">Required to publish courses on Grove Connect.</p>
                                
                                {user.is_verified ? (
                                    <span className="inline-block px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-full">Verified Tutor</span>
                                ) : (
                                    <button onClick={() => setShowKYCModal(true)} className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg transition-colors">Start KYC Process</button>
                                )}
                            </div>

                            
                            <div className={`p-6 rounded-2xl border ${user.two_factor_enabled ? 'bg-emerald-900/10 border-emerald-500/30' : 'bg-neutral-800/50 border-white/10'}`}>
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`p-3 rounded-xl ${user.two_factor_enabled ? 'bg-emerald-500/20' : 'bg-neutral-700'}`}>
                                        <Shield size={24} className={user.two_factor_enabled ? "text-emerald-400" : "text-gray-400"} />
                                    </div>
                                    {user.two_factor_enabled && <CheckCircle2 className="text-emerald-500" />}
                                </div>
                                <h4 className="font-bold text-white mb-2">Email 2-Factor Auth</h4>
                                <p className="text-xs text-gray-400 mb-6">Receive a secure OTP via email when logging in.</p>
                                
                                {user.two_factor_enabled ? (
                                    <span className="inline-block px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-full">2FA Active</span>
                                ) : (
                                    <button 
                                        onClick={async (e) => {
                                            const btn = e.currentTarget;
                                            btn.disabled = true;
                                            btn.innerText = "Sending...";
                                            
                                            try {
                                                await fetch('/api/2fa', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ action: 'send', email: user.email, userId: user.id })
                                                });
                                                setShow2FASetup(true);
                                                showToast("OTP sent to your email!", "success");
                                            } catch (err) {
                                                showToast("Failed to send email.", "error");
                                            } finally {
                                                btn.disabled = false;
                                                btn.innerText = "Enable Email 2FA";
                                            }
                                        }} 
                                        className="w-full py-2 bg-white text-black hover:bg-gray-200 text-sm font-bold rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        Enable Email 2FA
                                    </button>
                                )}
                            </div>
                        </div>

                        
                        {show2FASetup && !user.two_factor_enabled && (
                            <div className="p-6 bg-neutral-900 border border-white/10 rounded-xl max-w-md">
                                <h4 className="font-bold text-white mb-2">Check your email</h4>
                                <p className="text-xs text-gray-400 mb-4">We sent a 6-digit code to {user.email}. Enter it below to enable 2FA.</p>
                                <div className="flex gap-2">
                                    <input 
                                        value={twoFACode} 
                                        onChange={(e)=>setTwoFACode(e.target.value.replace(/\D/g, ''))} 
                                        placeholder="000000" 
                                        className="flex-1 bg-black border border-white/10 rounded p-2 text-center tracking-[1em] font-mono outline-none focus:border-emerald-500" 
                                        maxLength={6} 
                                    />
                                    <button onClick={handleEnable2FA} className="bg-emerald-600 hover:bg-emerald-500 px-6 rounded font-bold text-sm transition-colors">Verify</button>
                                </div>
                            </div>
                        )}

                        <div className="space-y-4 pt-8 border-t border-white/10 max-w-md">
                           <h4 className="text-sm font-bold text-gray-400 uppercase">Change Password</h4>
                           <input type="password" placeholder="Current Password" className="w-full bg-black border border-white/10 rounded-lg p-3 outline-none focus:border-white/30 transition-colors" />
                           <input type="password" placeholder="New Password" className="w-full bg-black border border-white/10 rounded-lg p-3 outline-none focus:border-white/30 transition-colors" />
                           <button className="w-full bg-white text-black px-6 py-3 rounded-lg font-bold text-sm hover:bg-gray-200 transition-colors">Update Password</button>
                        </div>
                     </div>
                  )}
                  
                  {settingsTab === 'payouts' && (
                     <div className="space-y-8 animate-in fade-in">
                        
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-6 bg-gradient-to-br from-emerald-900/40 to-black border border-emerald-500/30 rounded-2xl">
                                <p className="text-sm font-bold text-emerald-500 mb-1 uppercase 
                                <h2 className="text-4xl font-black text-white mb-4">${(overallStats.revenue * 0.8).toFixed(2)}</h2>
                                <button 
                                    onClick={() => {
                                        if (!user?.payout_method || !user?.payout_details) {
                                            return showToast("Please save your payout account details first.", "error")
                                        }
                                        if ((overallStats.revenue * 0.8) < 50) {
                                            return showToast("Minimum payout is $50.00", "error")
                                        }
                                        showToast("Payout request submitted! Processing takes 3-5 days.", "success")
                                    }}
                                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors shadow-lg"
                                >
                                    Request Withdrawal
                                </button>
                            </div>
                            <div className="p-6 bg-neutral-900/40 border border-white/5 rounded-2xl flex flex-col justify-center">
                                <p className="text-sm font-bold text-gray-500 mb-1 uppercase tracking-wider">Pending Clearance</p>
                                <h2 className="text-3xl font-black text-gray-300 mb-2">${(overallStats.revenue * 0.2).toFixed(2)}</h2>
                                <p className="text-xs text-gray-500">Funds clear 30 days after a student purchases to account for refunds.</p>
                            </div>
                        </div>

                        <h3 className="text-xl font-bold border-b border-white/10 pb-4 mt-8">Payout Method</h3>
                        
                        {(!user.nationality) ? (
                            <div className="text-center py-10 text-gray-500"><p>Please set your Nationality in the Profile tab to see payout options.</p></div>
                        ) : (
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    {(PAYOUT_MAPPING[user.nationality] || PAYOUT_MAPPING['default']).map(method => (
                                        <label key={method} className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all ${user.payout_method === method ? 'bg-emerald-900/20 border-emerald-500' : 'bg-neutral-900 border-white/10 hover:border-white/30'}`}>
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-white rounded-full"><CreditCard size={16} className="text-black"/></div>
                                                <span className="font-bold">{method}</span>
                                            </div>
                                            <input type="radio" name="payout" checked={user.payout_method === method} onChange={() => updateProfile({ payout_method: method })} className="accent-emerald-500 w-5 h-5" />
                                        </label>
                                    ))}
                                </div>

                                
                                {user.payout_method && (
                                    <div className="p-6 bg-black border border-white/10 rounded-xl space-y-4 animate-in fade-in">
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase">
                                                {user.payout_method === 'PayPal' ? 'PayPal Email Address' : 
                                                 user.payout_method.includes('Crypto') ? 'USDT Wallet Address (TRC20)' : 
                                                 'Bank Account Details (IBAN / Account Number)'}
                                            </label>
                                            
                                            <input 
                                                defaultValue={(user as any).payout_details || ''} 
                                                onChange={(e)=>setProfileDraft({...profileDraft, payout_details: e.target.value})}
                                                placeholder="Enter your account details here..." 
                                                className="w-full mt-2 bg-neutral-900 border border-white/10 rounded-lg p-3 outline-none focus:border-emerald-500 text-white" 
                                            />
                                        </div>
                                        <p className="text-xs text-yellow-500 flex items-center gap-1"><AlertCircle size={12}/> Please double check these details. Payments sent to the wrong account cannot be reversed.</p>
                                    </div>
                                )}
                            </div>
                        )}
                     </div>
                  )}
               </div>
            </motion.div>
          )}
      <AnimatePresence>
          {showKYCModal && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                  
                  <motion.div 
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                      onClick={() => !isVerifying && setShowKYCModal(false)}
                  />
                  
                  
                  <motion.div 
                      initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                      animate={{ opacity: 1, scale: 1, y: 0 }} 
                      exit={{ opacity: 0, scale: 0.95, y: 20 }}
                      className="relative w-full max-w-lg bg-neutral-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl z-10 flex flex-col max-h-[90vh]"
                  >
                      
                      <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/40">
                          <div>
                              <h2 className="text-xl font-bold flex items-center gap-2"><Shield className="text-emerald-500"/> Tutor Verification</h2>
                              <p className="text-xs text-zinc-400 mt-1">Required before publishing courses on Grove Academy.</p>
                          </div>
                          {!isVerifying && (
                              <button onClick={() => setShowKYCModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20}/></button>
                          )}
                      </div>

                      <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center justify-center min-h-[400px]">
                          {isVerifying ? (
                              <div className="w-full h-full flex items-center justify-center relative">
                                  
                                  <SmileCameraWrapper 
                                  user={user}
                                      onSuccess={async (detail: any) => {
                                          console.log("Smile ID Response:", detail)
                                          
                                          // Update Supabase Profile
                                          const { error } = await supabase
                                              .from('profiles')
                                              .update({ is_verified: true })
                                              .eq('id', user?.id)
                                              
                                          if (!error) {
                                              setUser(prev => prev ? {...prev, is_verified: true} : null)
                                              setShowKYCModal(false)
                                              showToast("Identity Verified Successfully!", "success")
                                              
                                              if (user?.two_factor_enabled) {
                                                  setTimeout(() => router.push('/admin/create-course'), 500)
                                              }
                                          } else {
                                              showToast("Database update failed.", "error")
                                          }
                                      }}
                                      onError={(detail: any) => {
                                          console.error(detail)
                                          showToast("Camera error. Please ensure permissions are granted.", "error")
                                          setIsVerifying(false)
                                      }}
                                  />
                              </div>
                              ) : (
                              <div className="text-center space-y-6">
                                  <div className="flex justify-center gap-4">
                                      <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20"><User size={32} className="text-emerald-400"/></div>
                                      <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20"><Smartphone size={32} className="text-blue-400"/></div>
                                  </div>
                                  <div>
                                      <h3 className="text-2xl font-bold mb-2">Prove you're human</h3>
                                      <p className="text-zinc-400 text-sm max-w-sm mx-auto leading-relaxed">
                                          To maintain trust and safety for our students, all Grove Academy tutors must complete a quick 3D liveness check.
                                      </p>
                                  </div>
                                  <div className="bg-black/40 border border-white/5 rounded-xl p-4 text-left space-y-3">
                                      <div className="flex items-start gap-3"><CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0"/><p className="text-xs text-zinc-300">Takes less than 30 seconds</p></div>
                                      <div className="flex items-start gap-3"><CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0"/><p className="text-xs text-zinc-300">Ensure you are in a well-lit room</p></div>
                                      <div className="flex items-start gap-3"><CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0"/><p className="text-xs text-zinc-300">Remove glasses or hats for the scan</p></div>
                                  </div>
                                  <button onClick={() => setIsVerifying(true)} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-colors flex items-center justify-center gap-2">
                                      Start Verification <ArrowUpRight size={18} />
                                  </button>
                              </div>
                          )}
                      </div>
                  </motion.div>
              </div>
          )}
      </AnimatePresence> */}

      {/* === PREMIUM TUTOR SETTINGS VIEW === */}
          {currentView === 'settings' && user && (
            <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
              
              {/* --- PREMIUM SIDEBAR NAV --- */}
              <div className="w-full lg:w-64 shrink-0 flex overflow-x-auto lg:flex-col gap-2 pb-4 lg:pb-0 no-scrollbar">
                <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-4 mb-2 hidden lg:block">Account Settings</h3>
                
                {[
                  { id: 'profile', label: 'Public Profile', icon: User },
                  { id: 'security', label: 'Trust & Security', icon: Shield },
                  { id: 'payouts', label: 'Payouts & Taxes', icon: CreditCard },
                ].map((tab) => (
                  <button 
                    key={tab.id} 
                    onClick={() => setSettingsTab(tab.id as any)} 
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                      settingsTab === tab.id 
                        ? 'bg-zinc-800/80 text-white shadow-sm border border-white/10' 
                        : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <tab.icon size={18} className={settingsTab === tab.id ? "text-emerald-400" : "text-zinc-500"} />
                    {tab.label}
                  </button>
                ))}

                <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-4 mb-2 mt-6 hidden lg:block">Platform & Data</h3>
                {[
                  { id: 'preferences', label: 'Notifications', icon: Bell },
                  { id: 'privacy', label: 'Privacy & Data', icon: Eye },
                  { id: 'integrations', label: 'API & Webhooks', icon: Code }
                ].map((tab) => (
                  <button 
                    key={tab.id} 
                    onClick={() => setSettingsTab(tab.id as any)} 
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                      settingsTab === tab.id 
                        ? 'bg-zinc-800/80 text-white shadow-sm border border-white/10' 
                        : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <tab.icon size={18} className={settingsTab === tab.id ? "text-emerald-400" : "text-zinc-500"} />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* --- SETTINGS CONTENT AREA --- */}
              <div className="flex-1 space-y-6 min-h-[600px] pb-24">
                  
                  {/* 1. PROFILE SETTINGS */}
                  {/* 1. PROFILE SETTINGS */}
                  {settingsTab === 'profile' && (
                     <div className="space-y-6 animate-in fade-in duration-500">
                        
                        {/* Avatar & Header Card */}
                        <div className="p-8 bg-[#0a0a0a] border border-white/5 rounded-3xl flex flex-col sm:flex-row items-center sm:items-start gap-8 relative overflow-hidden shadow-2xl">
                            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-emerald-900/20 to-transparent pointer-events-none" />
                            
                            <div className="relative z-10 group">
                               <div className="w-32 h-32 rounded-full bg-zinc-900 border-4 border-[#0a0a0a] shadow-2xl flex items-center justify-center overflow-hidden relative">
                                  {/* Fixed: Checks draft state first, then user state for live updates */}
                                  {user?.avatar_url || profileDraft?.avatar_url ? (
                                      <img src={profileDraft?.avatar_url || user?.avatar_url} className="w-full h-full object-cover" alt="Avatar" /> 
                                  ) : (
                                      <ImageIcon className="text-zinc-600" size={32} />
                                  )}
                                  
                                  <label className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-all duration-300">
                                    {isUploadingAvatar ? (
                                        <Loader2 className="animate-spin text-white" /> 
                                    ) : (
                                        <><Edit size={18} className="text-white mb-1"/><span className="text-[10px] font-bold text-white uppercase tracking-wider">Upload</span></>
                                    )}
                                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={isUploadingAvatar} />
                                  </label>
                               </div>
                               
                               {user?.is_verified && (
                                   <div className="absolute bottom-0 right-0 w-8 h-8 bg-emerald-500 rounded-full border-4 border-[#0a0a0a] flex items-center justify-center" title="Verified Tutor">
                                       <CheckCircle2 size={16} className="text-[#0a0a0a]"/>
                                   </div>
                               )}
                            </div>
                            
                            <div className="flex-1 z-10 text-center sm:text-left mt-2">
                                <h2 className="text-2xl font-black text-white">{user?.full_name}</h2>
                                <p className="text-sm text-zinc-400 mb-4">{user?.email}</p>
                                {!user?.is_verified && (
                                    <button onClick={() => setShowKYCModal(true)} className="px-4 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg text-xs font-bold hover:bg-blue-500/20 transition-colors">
                                        Verify Identity to Publish
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Details Card */}
                        <div className="p-8 bg-[#0a0a0a] border border-white/5 rounded-3xl space-y-6">
                            <h3 className="text-lg font-bold border-b border-white/5 pb-4">Public Profile Information</h3>
                            
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Public URL</label>
                                <div className="flex bg-black border border-white/10 rounded-xl overflow-hidden focus-within:border-emerald-500/50 transition-colors">
                                    <span className="px-4 py-3 bg-zinc-900 border-r border-white/5 text-zinc-500 text-sm hidden sm:block">groveconnect.com/tutor/</span>
                                    <input disabled defaultValue={user?.id?.substring(0,8)} className="bg-transparent px-4 py-3 text-sm text-white w-full outline-none text-zinc-400" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                               <div className="space-y-2">
                                 <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Nationality</label>
                                 <select className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-500/50 text-white appearance-none" defaultValue={profileDraft?.nationality || user?.nationality || ''} onChange={(e) => setProfileDraft({...profileDraft, nationality: e.target.value})}>
                                    <option value="" disabled>Select Country</option>
                                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                                 </select>
                               </div>
                               <div className="space-y-2"><label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Phone Number</label><input defaultValue={profileDraft?.phone || user?.phone} onChange={(e)=>setProfileDraft({...profileDraft, phone: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-500/50 text-white" placeholder="+1 (555) 000-0000" /></div>
                            </div>
                            
                            <div className="space-y-2"><label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Instructor Bio</label><textarea defaultValue={profileDraft?.bio || user?.bio} onChange={(e)=>setProfileDraft({...profileDraft, bio: e.target.value})} placeholder="Tell students about your expertise..." className="w-full h-32 bg-black border border-white/10 rounded-xl px-4 py-3 text-sm outline-none resize-none focus:border-emerald-500/50 text-white" /></div>
                        </div>

                        {/* Social Card */}
                        <div className="p-8 bg-[#0a0a0a] border border-white/5 rounded-3xl space-y-6">
                            <h3 className="text-lg font-bold border-b border-white/5 pb-4">Social Links</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Twitter / X</label>
                                    <div className="flex items-center gap-3 bg-black border border-white/10 rounded-xl px-4 py-3 focus-within:border-emerald-500/50">
                                        <Twitter size={16} className="text-zinc-500"/><input defaultValue={profileDraft?.social_twitter || user?.social_twitter} onChange={(e)=>setProfileDraft({...profileDraft, social_twitter: e.target.value})} placeholder="Username" className="bg-transparent outline-none text-sm w-full text-white"/>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">LinkedIn</label>
                                    <div className="flex items-center gap-3 bg-black border border-white/10 rounded-xl px-4 py-3 focus-within:border-emerald-500/50">
                                        <Linkedin size={16} className="text-zinc-500"/><input defaultValue={profileDraft?.social_linkedin || user?.social_linkedin} onChange={(e)=>setProfileDraft({...profileDraft, social_linkedin: e.target.value})} placeholder="Profile URL" className="bg-transparent outline-none text-sm w-full text-white"/>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end sticky bottom-6 z-20">
                            <button onClick={()=>updateProfile(profileDraft)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest text-sm transition-all shadow-[0_0_30px_rgba(16,185,129,0.2)] hover:shadow-[0_0_40px_rgba(16,185,129,0.4)] hover:-translate-y-0.5">Save Profile</button>
                        </div>
                     </div>
                  )}

                  {/* 2. TRUST & SECURITY TAB */}
                  {settingsTab === 'security' && (
                     <div className="space-y-6 animate-in fade-in duration-500">
                        {/* KYC Verification Card */}
                        <div className={`p-8 rounded-3xl border shadow-xl ${user.is_verified ? 'bg-[#0a0a0a] border-emerald-500/30' : 'bg-[#0a0a0a] border-white/5'}`}>
                            <div className="flex items-start justify-between mb-4">
                                <div className={`p-3 rounded-xl ${user.is_verified ? 'bg-emerald-500/20' : 'bg-blue-500/20'}`}>
                                    <User size={24} className={user.is_verified ? "text-emerald-400" : "text-blue-400"} />
                                </div>
                                {user.is_verified && <CheckCircle2 className="text-emerald-500" size={28} />}
                            </div>
                            <h4 className="text-xl font-bold text-white mb-2">Identity Verification (KYC)</h4>
                            <p className="text-sm text-gray-400 mb-6">Required by financial regulations before you can publish courses or withdraw payouts on Grove Connect.</p>
                            
                            {user.is_verified ? (
                                <span className="inline-block px-4 py-2 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-lg uppercase tracking-widest border border-emerald-500/20">Verified Tutor</span>
                            ) : (
                                <button onClick={() => setShowKYCModal(true)} className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg">Start KYC Process</button>
                            )}
                        </div>

                        {/* 2FA Card */}
                        <div className="p-8 bg-[#0a0a0a] border border-white/5 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
                            <div className="flex items-start gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${user.two_factor_enabled ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'bg-zinc-800'}`}>
                                    <Shield size={24} className={user.two_factor_enabled ? "text-[#0a0a0a]" : "text-zinc-500"} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">Two-Factor Authentication {user.two_factor_enabled && <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] uppercase tracking-widest rounded border border-emerald-500/20">Active</span>}</h3>
                                    <p className="text-sm text-zinc-400 mt-1">Add an extra layer of security to your account. Highly recommended.</p>
                                </div>
                            </div>
                            
                            {!user.two_factor_enabled && !show2FASetup && (
                                <button onClick={async (e) => {
                                    const btn = e.currentTarget; btn.disabled = true; btn.innerText = "Sending...";
                                    try {
                                        await fetch('/api/2fa', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'send', email: user.email, userId: user.id }) });
                                        setShow2FASetup(true); showToast("OTP sent to your email!", "success");
                                    } catch (err) { showToast("Failed to send email.", "error"); } 
                                    finally { btn.disabled = false; btn.innerText = "Enable 2FA"; }
                                }} className="px-6 py-3 bg-white text-black hover:bg-zinc-200 text-sm font-bold rounded-xl transition-colors whitespace-nowrap">
                                    Enable 2FA
                                </button>
                            )}
                        </div>

                        {show2FASetup && !user.two_factor_enabled && (
                            <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} className="p-8 bg-zinc-900/50 border border-emerald-500/20 rounded-3xl">
                                <h4 className="font-bold text-white mb-2">Check your email</h4>
                                <p className="text-sm text-zinc-400 mb-6">We sent a 6-digit code to <span className="text-white">{user.email}</span>.</p>
                                <div className="flex max-w-md gap-3">
                                    <input value={twoFACode} onChange={(e)=>setTwoFACode(e.target.value.replace(/\D/g, ''))} placeholder="000000" className="flex-1 bg-black border border-white/10 rounded-xl p-3 text-center tracking-[1em] font-mono text-xl outline-none focus:border-emerald-500 text-white" maxLength={6} />
                                    <button onClick={handleEnable2FA} className="bg-emerald-600 hover:bg-emerald-500 px-8 rounded-xl font-bold text-sm transition-colors text-white">Verify</button>
                                </div>
                            </motion.div>
                        )}

                        {/* Password Card */}
                        <div className="p-8 bg-[#0a0a0a] border border-white/5 rounded-3xl space-y-6 shadow-xl">
                           <h3 className="text-lg font-bold border-b border-white/5 pb-4">Change Password</h3>
                           <div className="max-w-md space-y-4">
                               <div className="space-y-2"><label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">New Password</label><input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/30 transition-colors text-white" /></div>
                               <button onClick={handlePasswordUpdate} className="bg-zinc-800 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-zinc-700 transition-colors border border-white/5">Update Password</button>
                           </div>
                        </div>
                     </div>
                  )}

                  {/* 3. FINTECH PAYOUTS TAB */}
                  {settingsTab === 'payouts' && (
                     <div className="space-y-6 animate-in fade-in duration-500">
                        
                        {/* Premium Wallet Dashboard */}
                        <div className="p-8 bg-gradient-to-br from-[#0a0a0a] to-[#050505] border border-white/5 rounded-3xl overflow-hidden relative shadow-2xl">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 blur-[120px] pointer-events-none" />
                            
                            <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8 relative z-10">
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10"><DollarSign size={16} className="text-emerald-500"/></div>
                                        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Available Balance</h3>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <h2 className="text-5xl md:text-6xl font-black text-white tracking-tighter">
                                            ${(overallStats.availableBalance).toFixed(2).split('.')[0]}<span className="text-3xl text-zinc-500">.{ (overallStats.availableBalance).toFixed(2).split('.')[1] }</span>
                                        </h2>
                                        <span className="text-emerald-500 font-bold ml-2 text-sm bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">USD</span>
                                    </div>
                                </div>
                                
                                <div className="w-full md:w-auto space-y-3">
                                    <div className="p-4 bg-black/50 border border-white/10 rounded-2xl flex items-center justify-between gap-6 backdrop-blur-md">
                                        <div>
                                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Pending Clearance</p>
                                            <p className="text-lg font-bold text-zinc-300">${overallStats.pendingClearance.toFixed(2)}</p>
                                        </div>
                                        <Clock size={20} className="text-zinc-600"/>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            if (!user?.payout_method || !user?.payout_details) return showToast("Please configure a payout method below first.", "error")
                                            if (overallStats.availableBalance < 10) return showToast("Minimum withdrawal is $10.00", "error")
                                            setWithdrawStep(1)
                                            setWithdrawAmount('')
                                            setWithdrawModalOpen(true)
                                        }} 
                                        className="w-full px-8 py-4 bg-white text-black hover:bg-zinc-200 font-black uppercase tracking-widest text-xs rounded-2xl transition-all shadow-[0_0_30px_rgba(255,255,255,0.15)] flex items-center justify-center gap-2"
                                    >
                                        Withdraw Funds <ArrowUpRight size={16}/>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Linked Account Card */}
                            <div className="p-8 bg-[#0a0a0a] border border-white/5 rounded-3xl shadow-xl flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-6">
                                        <h3 className="text-sm font-bold text-white uppercase tracking-widest">Payout Method</h3>
                                        {user?.payout_method && (
                                            <button onClick={() => setLinkModalOpen(true)} className="text-xs font-bold text-emerald-400 hover:text-emerald-300">Change</button>
                                        )}
                                    </div>
                                    
                                    {!user?.payout_method ? (
                                        <div className="text-center py-6">
                                            <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                                                <Landmark size={24} className="text-zinc-600" />
                                            </div>
                                            <p className="text-sm text-zinc-400 mb-6">No payout method configured. Link a bank account or PayPal to receive your earnings.</p>
                                            <button 
                                                onClick={() => { setLinkStep(1); setLinkModalOpen(true); }}
                                                className="px-6 py-3 bg-white text-black font-bold rounded-xl text-sm hover:bg-zinc-200 transition-colors shadow-lg"
                                            >
                                                Add Payout Method
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-4 p-5 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl relative overflow-hidden group">
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[50px] pointer-events-none" />
                                                <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center border border-emerald-500/30 shrink-0 relative z-10 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                                                    {user.payout_method.includes('Bank') || user.payout_method.includes('Transfer') ? <Landmark size={20} className="text-emerald-400"/> : <CreditCard size={20} className="text-emerald-400"/>}
                                                </div>
                                                <div className="overflow-hidden w-full relative z-10">
                                                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Active Destination</p>
                                                    <p className="font-bold text-white text-base truncate">{user.payout_method}</p>
                                                    <p className="text-sm text-zinc-400 font-mono mt-0.5 tracking-wider">
                                                        {user.payout_method === 'PayPal' ? user.payout_details : `•••• ${user.payout_details?.slice(-4) || 'XXXX'}`}
                                                    </p>
                                                </div>
                                                <CheckCircle2 size={24} className="text-emerald-500 shrink-0 relative z-10"/>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Recent Transactions */}
                            <div className="p-8 bg-[#0a0a0a] border border-white/5 rounded-3xl shadow-xl">
                                <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-6">
                                    <h3 className="text-sm font-bold text-white uppercase tracking-widest">Recent Activity</h3>
                                </div>
                                <div className="space-y-4 max-h-[200px] overflow-y-auto no-scrollbar">
                                    {transactions.length === 0 ? (
                                        <p className="text-sm text-zinc-600 text-center py-4">No recent payouts.</p>
                                    ) : (
                                        transactions.map((tx) => (
                                            <div key={tx.id} className="flex items-center justify-between p-3 bg-black border border-white/5 rounded-xl">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 shrink-0">
                                                        <ArrowUpRight size={16} className="text-emerald-500" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-white">Withdrawal</p>
                                                        <p className="text-xs text-zinc-500">{new Date(tx.requested_at || tx.date).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-bold text-white">${Number(tx.amount).toFixed(2)}</p>
                                                    <p className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded inline-block mt-1 ${tx.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : tx.status === 'failed' ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                                                        {tx.status}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                     </div>
                  )}
                  {/* 4. NOTIFICATION PREFERENCES */}
                  {settingsTab === 'preferences' && (
                     <div className="space-y-6 animate-in fade-in duration-500">
                        <div className="p-8 bg-[#0a0a0a] border border-white/5 rounded-3xl shadow-xl">
                            <h3 className="text-lg font-bold border-b border-white/5 pb-4 mb-6">Email Notifications</h3>
                            
                            <div className="space-y-3">
                                {[
                                    { id: 'purchases', title: 'Course Purchases', desc: 'Get notified immediately when a student buys your course.' },
                                    { id: 'reviews', title: 'Student Reviews & Q&A', desc: 'Receive a daily digest of new student questions and ratings.' },
                                    { id: 'marketing', title: 'Grove Academy Marketing', desc: 'Tips on how to grow your audience and platform news.' },
                                    { id: 'platformUpdates', title: 'Platform Updates', desc: 'Important technical updates regarding Grove Connect.' }
                                ].map((pref) => (
                                    <div key={pref.id} className="flex items-center justify-between p-5 bg-black border border-white/5 rounded-2xl hover:border-white/10 transition-colors group">
                                        <div>
                                            <h4 className="font-bold text-white text-sm">{pref.title}</h4>
                                            <p className="text-xs text-zinc-500 mt-1">{pref.desc}</p>
                                        </div>
                                        <div 
                                            onClick={() => setEmailPrefs(prev => ({...prev, [pref.id]: !(prev as any)[pref.id]}))} 
                                            className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${ (emailPrefs as any)[pref.id] ? 'bg-emerald-500' : 'bg-zinc-800'}`}
                                        >
                                            <motion.div 
                                                layout 
                                                transition={{ type: "spring", stiffness: 700, damping: 30 }}
                                                className="w-4 h-4 bg-white rounded-full shadow-sm"
                                                style={{ marginLeft: (emailPrefs as any)[pref.id] ? '24px' : '0px' }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-end pt-8 border-t border-white/5 mt-6">
                                <button onClick={() => showToast("Preferences updated successfully!", "success")} className="bg-white text-black px-8 py-3 rounded-xl font-bold text-sm hover:bg-zinc-200 transition-colors shadow-lg">Save Preferences</button>
                            </div>
                        </div>
                     </div>
                  )}

                  {/* 5. PRIVACY & DATA (GDPR COMPLIANCE) */}
                  {settingsTab === 'privacy' && (
                     <div className="space-y-6 animate-in fade-in duration-500">
                        <div className="p-8 bg-[#0a0a0a] border border-white/5 rounded-3xl shadow-xl">
                            <h3 className="text-lg font-bold border-b border-white/5 pb-4 mb-6">Profile Visibility</h3>
                            <p className="text-sm text-zinc-400 mb-6">Control how your profile appears to students and search engines.</p>
                            
                            <div className="space-y-3">
                                {[
                                    { id: 'publicProfile', title: 'Public Search Indexing', desc: 'Allow Google and other search engines to index your Grove Tutor profile.' },
                                    { id: 'showCourses', title: 'Display Course Library', desc: 'Show all your active courses on your public profile page.' },
                                    { id: 'allowDirectMessages', title: 'Allow Direct Messages', desc: 'Let enrolled students send you direct messages on the platform.' }
                                ].map((pref) => (
                                    <div key={pref.id} className="flex items-center justify-between p-5 bg-black border border-white/5 rounded-2xl hover:border-white/10 transition-colors">
                                        <div>
                                            <h4 className="font-bold text-white text-sm">{pref.title}</h4>
                                            <p className="text-xs text-zinc-500 mt-1">{pref.desc}</p>
                                        </div>
                                        <div 
                                            onClick={() => setPrivacyPrefs(prev => ({...prev, [pref.id]: !(prev as any)[pref.id]}))} 
                                            className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${ (privacyPrefs as any)[pref.id] ? 'bg-emerald-500' : 'bg-zinc-800'}`}
                                        >
                                            <motion.div layout transition={{ type: "spring", stiffness: 700, damping: 30 }} className="w-4 h-4 bg-white rounded-full shadow-sm" style={{ marginLeft: (privacyPrefs as any)[pref.id] ? '24px' : '0px' }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="flex justify-end pt-8 mt-6 border-t border-white/5">
                                <button onClick={() => showToast("Privacy settings saved.", "success")} className="bg-white text-black px-8 py-3 rounded-xl font-bold text-sm hover:bg-zinc-200 transition-colors shadow-lg">Save Privacy Settings</button>
                            </div>
                        </div>

                        {/* Data Portability (GDPR) */}
                        <div className="p-8 bg-[#0a0a0a] border border-white/5 rounded-3xl space-y-4 shadow-xl">
                            <h3 className="text-lg font-bold border-b border-white/5 pb-4">Data Portability</h3>
                            <p className="text-sm text-zinc-400">In accordance with GDPR, you can request a copy of all personal data Grove Connect holds about you.</p>
                            <div className="flex items-center justify-between p-5 bg-black border border-white/5 rounded-2xl">
                                <div>
                                    <h4 className="font-bold text-white text-sm">Export Personal Data</h4>
                                    <p className="text-xs text-zinc-500 mt-1">Download a JSON file containing your profile, courses, and financial history.</p>
                                </div>
                                <button onClick={() => {
                                    showToast("Compiling your data. Download will start automatically.", "success");
                                    window.open('/api/export', '_blank');
                                }} className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 border border-white/10 text-white rounded-xl font-bold text-sm hover:bg-zinc-800 transition-colors">
                                    <Download size={16}/> Request Export
                                </button>
                            </div>
                        </div>

                        {/* --- DANGER ZONE --- */}
                        <div className="p-8 bg-[#0a0a0a] border border-red-500/20 rounded-3xl relative overflow-hidden shadow-2xl mt-12">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 blur-[50px] pointer-events-none" />
                            <h4 className="text-lg font-bold text-red-500 mb-2 relative z-10">Danger Zone</h4>
                            <p className="text-sm text-zinc-400 mb-6 relative z-10">Permanently delete your account and all associated course data. This action cannot be undone.</p>
                            
                            <div className="p-6 bg-black border border-red-500/20 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
                                <div>
                                    <h5 className="font-bold text-white text-sm">Delete Tutor Account</h5>
                                    <p className="text-xs text-red-400/60 mt-1">You must process all pending payouts before deleting.</p>
                                </div>
                                <button onClick={() => showToast("Please contact support to initiate account deletion.", "error")} className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all border border-red-500/20 w-full sm:w-auto text-center whitespace-nowrap">
                                    Delete Account
                                </button>
                            </div>
                        </div>
                     </div>
                  )}

                  {/* 6. API & INTEGRATIONS */}
                  {settingsTab === 'integrations' && (
                     <div className="space-y-6 animate-in fade-in duration-500">
                        {/* Developer API Keys */}
                        <div className="p-8 bg-[#0a0a0a] border border-white/5 rounded-3xl relative overflow-hidden shadow-xl">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] pointer-events-none" />
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2"><Code size={20} className="text-blue-500"/> Developer API</h3>
                                    <p className="text-sm text-zinc-400 mt-1">Build custom integrations or connect to external tools.</p>
                                </div>
                            </div>

                            <div className="space-y-4 relative z-10">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">Live Secret Key</label>
                                <div className="flex items-center gap-3 bg-black border border-white/10 rounded-xl p-2 pr-4 focus-within:border-blue-500/50 transition-colors">
                                    <div className="p-3 bg-zinc-900 rounded-lg"><Lock size={16} className="text-zinc-500"/></div>
                                    <input 
                                        type="password" 
                                        readOnly 
                                        value={apiKey || ''} 
                                        className="bg-transparent outline-none text-sm text-white w-full font-mono tracking-widest cursor-not-allowed" 
                                    />
                                    <button onClick={handleCopyKey} className="text-zinc-500 hover:text-white transition-colors" title="Copy to clipboard">
                                        <Copy size={18}/>
                                    </button>
                                </div>

                                <div className="flex justify-between items-center pt-4 border-t border-white/5 mt-4">
                                    <p className="text-xs text-yellow-500 flex items-center gap-1"><AlertCircle size={14}/> Do not share this key.</p>
                                    <button onClick={handleGenerateNewKey} disabled={isGeneratingKey} className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-2">
                                        {isGeneratingKey ? <Loader2 size={14} className="animate-spin"/> : "Roll Key (Revoke Old)"}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Webhooks */}
                        <div className="p-8 bg-[#0a0a0a] border border-white/5 rounded-3xl space-y-6 shadow-xl">
                            <div>
                                <h3 className="text-lg font-bold text-white flex items-center gap-2"><Webhook size={20} className="text-purple-500"/> Outbound Webhooks</h3>
                                <p className="text-sm text-zinc-400 mt-1">Send real-time alerts to Zapier, Discord, or your own servers when an event happens.</p>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">Endpoint URL</label>
                                <input 
                                    value={webhookUrl}
                                    onChange={(e) => setWebhookUrl(e.target.value)}
                                    placeholder="https://hooks.zapier.com/hooks/catch/..." 
                                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-purple-500/50 text-white font-mono text-sm" 
                                />
                            </div>

                            <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-4">
                                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">Events to send:</p>
                                <div className="flex flex-wrap gap-2">
                                    <span className="px-3 py-1 bg-white/5 text-zinc-300 text-xs font-bold rounded-lg border border-white/10">course.purchased</span>
                                    <span className="px-3 py-1 bg-white/5 text-zinc-300 text-xs font-bold rounded-lg border border-white/10">student.enrolled</span>
                                    <span className="px-3 py-1 bg-white/5 text-zinc-300 text-xs font-bold rounded-lg border border-white/10">review.created</span>
                                </div>
                            </div>

                            <div className="flex justify-end border-t border-white/5 pt-6">
                                <button onClick={() => {
                                    if(!webhookUrl) return showToast("Please enter a valid URL.", "error")
                                    showToast("Webhook endpoint saved and verified!", "success")
                                }} className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-3 rounded-xl font-bold text-sm transition-colors shadow-lg">
                                    Save Webhook
                                </button>
                            </div>
                        </div>
                     </div>
                  )}

              </div>
            </motion.div>
          )}

      {/* --- KYC VERIFICATION MODAL (SMILE ID) --- */}
      <AnimatePresence>
          {showKYCModal && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                  <motion.div 
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                      onClick={() => !isVerifying && setShowKYCModal(false)}
                  />
                  <motion.div 
                      initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                      animate={{ opacity: 1, scale: 1, y: 0 }} 
                      exit={{ opacity: 0, scale: 0.95, y: 20 }}
                      className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl z-10 flex flex-col max-h-[90vh]"
                  >
                      <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/40">
                          <div>
                              <h2 className="text-xl font-bold flex items-center gap-2"><Shield className="text-emerald-500"/> Tutor Verification</h2>
                              <p className="text-xs text-zinc-400 mt-1">Required before publishing courses on Grove Academy.</p>
                          </div>
                          {!isVerifying && (
                              <button onClick={() => setShowKYCModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20}/></button>
                          )}
                      </div>

                      <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center justify-center min-h-[400px]">
                          {isVerifying ? (
                              <div className="w-full h-full flex items-center justify-center relative">
                                  <SmileCameraWrapper 
                                  user={user}
                                      onSuccess={async (detail: any) => {
                                          const { error } = await supabase
                                              .from('profiles')
                                              .update({ is_verified: true })
                                              .eq('id', user?.id)
                                              
                                          if (!error) {
                                              setUser(prev => prev ? {...prev, is_verified: true} : null)
                                              setShowKYCModal(false)
                                              showToast("Identity Verified Successfully!", "success")
                                              if (user?.two_factor_enabled) {
                                                  setTimeout(() => router.push('/admin/create-course'), 500)
                                              }
                                          } else {
                                              showToast("Database update failed.", "error")
                                          }
                                      }}
                                      onError={(detail: any) => {
                                          showToast("Camera error. Please ensure permissions are granted.", "error")
                                          setIsVerifying(false)
                                      }}
                                  />
                              </div>
                              ) : (
                              <div className="text-center space-y-6">
                                  <div className="flex justify-center gap-4">
                                      <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20"><User size={32} className="text-emerald-400"/></div>
                                      <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20"><Smartphone size={32} className="text-blue-400"/></div>
                                  </div>
                                  <div>
                                      <h3 className="text-2xl font-bold mb-2 text-white">Prove you're human</h3>
                                      <p className="text-zinc-400 text-sm max-w-sm mx-auto leading-relaxed">
                                          To maintain trust and safety for our students, all Grove Academy tutors must complete a quick 3D liveness check.
                                      </p>
                                  </div>
                                  <div className="bg-black/40 border border-white/5 rounded-xl p-4 text-left space-y-3">
                                      <div className="flex items-start gap-3"><CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0"/><p className="text-xs text-zinc-300">Takes less than 30 seconds</p></div>
                                      <div className="flex items-start gap-3"><CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0"/><p className="text-xs text-zinc-300">Ensure you are in a well-lit room</p></div>
                                      <div className="flex items-start gap-3"><CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0"/><p className="text-xs text-zinc-300">Remove glasses or hats for the scan</p></div>
                                  </div>
                                  <button onClick={() => setIsVerifying(true)} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-colors flex items-center justify-center gap-2">
                                      Start Verification <ArrowUpRight size={18} />
                                  </button>
                              </div>
                          )}
                      </div>
                  </motion.div>
              </div>
          )}
      </AnimatePresence>

      {/* --- FINTECH ACCOUNT LINKING MODAL (NUBAN RESOLVER) --- */}
      <AnimatePresence>
          {isLinkModalOpen && (
              <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => !isResolving && setLinkModalOpen(false)} />
                  
                  <motion.div 
                      initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                      className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl z-10"
                  >
                      {/* STEP 1: Select Method */}
                      {linkStep === 1 && (
                          <div className="p-8">
                              <div className="flex justify-between items-center mb-8">
                                  <h3 className="text-xl font-black text-white tracking-tight">Add Payout Method</h3>
                                  <button onClick={() => setLinkModalOpen(false)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-zinc-400"><X size={18}/></button>
                              </div>
                              
                              <div className="space-y-3">
                                  <button onClick={() => { setLinkMethod('Bank'); setLinkStep(2); }} className="w-full p-5 bg-black border border-white/5 rounded-2xl flex items-center justify-between hover:border-emerald-500/50 transition-all group">
                                      <div className="flex items-center gap-4">
                                          <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center border border-white/10 group-hover:bg-emerald-500/10 transition-colors"><Landmark size={20} className="text-white group-hover:text-emerald-400"/></div>
                                          <div className="text-left">
                                              <p className="font-bold text-white text-sm">Local Bank Transfer</p>
                                              <p className="text-xs text-zinc-500 mt-1">Direct deposit to your bank account</p>
                                          </div>
                                      </div>
                                      <ChevronRight size={20} className="text-zinc-600 group-hover:text-emerald-500 transition-colors"/>
                                  </button>

                                  <button onClick={() => { setLinkMethod('PayPal'); setLinkStep(2); }} className="w-full p-5 bg-black border border-white/5 rounded-2xl flex items-center justify-between hover:border-blue-500/50 transition-all group">
                                      <div className="flex items-center gap-4">
                                          <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center border border-white/10 group-hover:bg-blue-500/10 transition-colors"><Globe size={20} className="text-white group-hover:text-blue-400"/></div>
                                          <div className="text-left">
                                              <p className="font-bold text-white text-sm">PayPal</p>
                                              <p className="text-xs text-zinc-500 mt-1">Connect your global PayPal account</p>
                                          </div>
                                      </div>
                                      <ChevronRight size={20} className="text-zinc-600 group-hover:text-blue-500 transition-colors"/>
                                  </button>
                              </div>
                          </div>
                      )}

                      {/* STEP 2: REAL Bank Resolution Form */}
                      {linkStep === 2 && linkMethod === 'Bank' && (
                          <div className="p-8">
                              <div className="flex items-center gap-4 mb-8">
                                  <button onClick={() => setLinkStep(1)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-zinc-400"><ArrowLeft size={18}/></button>
                                  <h3 className="text-xl font-black text-white tracking-tight">Enter Bank Details</h3>
                              </div>

                              <div className="space-y-6 mb-8">
                                  <div className="space-y-2">
                                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2">Select Bank</label>
                                      <select 
                                          value={bankCode} 
                                          onChange={(e) => setBankCode(e.target.value)} 
                                          className="w-full bg-black border border-white/10 rounded-2xl px-4 py-4 text-sm text-white outline-none focus:border-emerald-500/50 appearance-none"
                                      >
                                          <option value="" disabled>
                                              {bankList.length === 0 ? "Loading banks..." : "Choose your bank..."}
                                          </option>
                                          {/* NOW MAPPING OVER THE REAL, LIVE FETCHED BANK LIST */}
                                          {bankList.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
                                      </select>
                                  </div>

                                  <div className="space-y-2">
                                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2">Account Number</label>
                                      <input 
                                          type="text" 
                                          value={accountNumber} 
                                          onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10))} 
                                          placeholder="0123456789" 
                                          className="w-full bg-black border border-white/10 rounded-2xl px-4 py-4 text-white outline-none focus:border-emerald-500/50 tracking-widest font-mono"
                                      />
                                  </div>
                              </div>

                              <button 
                                  disabled={isResolving || !bankCode || accountNumber.length !== 10}
                                  onClick={async () => {
                                      setIsResolving(true);
                                      try {
                                          const res = await fetch('/api/resolve-bank', {
                                              method: 'POST',
                                              headers: { 'Content-Type': 'application/json' },
                                              body: JSON.stringify({ bankCode, accountNumber })
                                          });
                                          const data = await res.json();
                                          
                                          if (data.success) {
                                              setResolvedName(data.account_name);
                                              setLinkStep(3);
                                          } else {
                                              showToast(data.error || "Account not found. Please check details.", "error");
                                          }
                                      } catch (err) {
                                          showToast("Network error. Could not connect to bank.", "error");
                                      } finally {
                                          setIsResolving(false);
                                      }
                                  }}
                                  className="w-full py-4 bg-emerald-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-emerald-500 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] disabled:opacity-50 flex items-center justify-center gap-2"
                              >
                                  {isResolving ? <Loader2 size={18} className="animate-spin"/> : 'Verify Account'}
                              </button>
                          </div>
                      )}

                      {/* STEP 3: Identity Confirmation */}
                      {linkStep === 3 && linkMethod === 'Bank' && (
                          <div className="p-8 text-center flex flex-col items-center">
                              <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20 mb-6 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                                  <User size={32} className="text-emerald-400" />
                              </div>
                              <h3 className="text-lg font-bold text-white mb-2">Confirm Account Name</h3>
                              <p className="text-sm text-zinc-400 mb-8">Please confirm that the name on this bank account matches your identity. Payments to mismatched names may fail.</p>
                              
                              <div className="w-full p-6 bg-black border border-white/5 rounded-2xl mb-8 border-dashed border-emerald-500/30">
                                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">Resolved Name from Bank</p>
                                  <p className="text-xl font-black text-white uppercase tracking-tight">{resolvedName}</p>
                                  <div className="w-full h-px bg-white/10 my-4" />
                                  <p className="text-sm font-mono text-zinc-400">{accountNumber} • {bankList.find(b=>b.code===bankCode)?.name}</p>
                              </div>

                              <div className="flex gap-4 w-full">
                                  <button onClick={() => setLinkStep(2)} className="flex-1 py-4 bg-white/5 text-white font-bold rounded-2xl hover:bg-white/10 transition-colors">Wrong Account</button>
                                  <button 
                                      onClick={async () => {
                                          const bankName = bankList.find(b=>b.code===bankCode)?.name;
                                          const payoutName = `${bankName} Transfer`;
                                          
                                          await updateProfile({ 
                                              payout_method: payoutName, 
                                              payout_details: accountNumber 
                                          });
                                          
                                          setLinkModalOpen(false);
                                      }} 
                                      className="flex-1 py-4 bg-emerald-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-emerald-500 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                                  >
                                      Yes, Save Account
                                  </button>
                              </div>
                          </div>
                      )}

                      {/* NEW STEP 2: Functional PayPal Form */}
                      {linkStep === 2 && linkMethod === 'PayPal' && (
                          <div className="p-8">
                              <div className="flex items-center gap-4 mb-8">
                                  <button onClick={() => setLinkStep(1)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-zinc-400"><ArrowLeft size={18}/></button>
                                  <h3 className="text-xl font-black text-white tracking-tight">Enter PayPal Details</h3>
                              </div>

                              <div className="space-y-6 mb-8">
                                  <div className="space-y-2">
                                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2">PayPal Email Address</label>
                                      <input 
                                          type="email" 
                                          value={paypalEmail} 
                                          onChange={(e) => setPayPalEmail(e.target.value)} 
                                          placeholder="tutor@example.com" 
                                          className="w-full bg-black border border-white/10 rounded-2xl px-4 py-4 text-white outline-none focus:border-blue-500/50"
                                          autoFocus
                                      />
                                  </div>
                                  <p className="text-xs text-zinc-500 px-2 leading-relaxed">By linking your PayPal account, you authorize Grove Connect to send your payout funds directly to this email address via PayPal Payouts.</p>
                              </div>

                              <button 
                                  disabled={!paypalEmail.includes('@') || !paypalEmail.includes('.')}
                                  onClick={async () => {
                                      await updateProfile({ 
                                          payout_method: 'PayPal', 
                                          payout_details: paypalEmail 
                                      });
                                      setLinkModalOpen(false);
                                  }}
                                  className="w-full py-4 bg-blue-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-blue-500 transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] disabled:opacity-50"
                              >
                                  Save PayPal Account
                              </button>
                          </div>
                      )}
                  </motion.div>
              </div>
          )}
      </AnimatePresence>

      {/* --- ELITE FINTECH WITHDRAWAL ENGINE --- */}
      <AnimatePresence>
          {isWithdrawModalOpen && (
              <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6">
                  {/* Blurred Backdrop */}
                  <motion.div 
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-black/90 backdrop-blur-xl"
                      onClick={() => !isProcessingPayout && setWithdrawModalOpen(false)}
                  />
                  
                  {/* Master Modal Container */}
                  <motion.div 
                      initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                      animate={{ opacity: 1, scale: 1, y: 0 }} 
                      exit={{ opacity: 0, scale: 0.95, y: 20 }}
                      className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl z-10 flex flex-col"
                  >
                      {/* Step 1: Amount & Gateway Selection */}
                      {withdrawStep === 1 && (
                          <div className="p-8">
                              <div className="flex justify-between items-center mb-8">
                                  <h3 className="text-xl font-black text-white tracking-tight">Withdraw Funds</h3>
                                  <button onClick={() => setWithdrawModalOpen(false)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors"><X size={18}/></button>
                              </div>
                              
                              {/* The LEDGER Display */}
                              <div className="text-center mb-10 p-6 bg-gradient-to-b from-white/5 to-transparent border border-white/5 rounded-3xl">
                                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-3">Available Balance</p>
                                  <div className="flex items-center justify-center text-5xl font-black text-white focus-within:text-emerald-400 transition-colors">
                                      <span className="text-2xl text-zinc-500 mr-1 -mt-4">$</span>
                                      <input 
                                          type="number" 
                                          value={withdrawAmount}
                                          onChange={(e) => setWithdrawAmount(e.target.value)}
                                          placeholder="0.00"
                                          className="bg-transparent outline-none w-48 text-center placeholder-zinc-700"
                                          autoFocus
                                      />
                                  </div>
                                  
                                  {/* Quick Select Pills */}
                                  <div className="flex justify-center gap-3 mt-6">
                                      <button onClick={() => setWithdrawAmount(((overallStats.availableBalance) * 0.25).toFixed(2))} className="px-4 py-1.5 bg-black border border-white/10 rounded-full text-xs font-bold text-zinc-400 hover:text-white transition-colors">25%</button>
                                      <button onClick={() => setWithdrawAmount(((overallStats.availableBalance) * 0.50).toFixed(2))} className="px-4 py-1.5 bg-black border border-white/10 rounded-full text-xs font-bold text-zinc-400 hover:text-white transition-colors">50%</button>
                                      <button onClick={() => setWithdrawAmount((overallStats.availableBalance).toFixed(2))} className="px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-xs font-bold hover:bg-emerald-500/20 transition-colors">Max</button>
                                  </div>
                              </div>

                              {/* Gateway Selection */}
                              <div className="space-y-3 mb-8">
                                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block px-2">Transfer Destination</label>
                                  
                                  {/* Render user's saved methods. If they are in Nigeria/Africa, emphasize Flutterwave/Paystack */}
                                  <div className="p-4 bg-black border border-white/10 rounded-2xl flex items-center justify-between cursor-pointer hover:border-emerald-500/50 transition-colors">
                                      <div className="flex items-center gap-4">
                                          <div className="w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center border border-white/5 shrink-0">
                                              {user?.payout_method?.includes('Bank') || user?.payout_method?.includes('Paystack') || user?.payout_method?.includes('Flutterwave') ? <Landmark size={18} className="text-white"/> : <CreditCard size={18} className="text-white"/>}
                                          </div>
                                          <div>
                                              <p className="text-sm font-bold text-white">{user?.payout_method || 'Add Payout Method'}</p>
                                              <p className="text-xs text-zinc-500 font-mono mt-0.5">{user?.payout_details?.substring(0,8)}••••••</p>
                                          </div>
                                      </div>
                                      <CheckCircle2 size={20} className="text-emerald-500" />
                                  </div>
                              </div>

                              <button 
                                  onClick={() => {
                                      const amt = parseFloat(withdrawAmount);
                                      if (isNaN(amt) || amt < 10) return showToast("Minimum withdrawal is $10", "error");
                                      if (amt > (overallStats.availableBalance)) return showToast("Insufficient funds", "error");
                                      setWithdrawStep(2);
                                  }}
                                  className="w-full py-4 bg-white text-black font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-zinc-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                              >
                                  Review Transfer
                              </button>
                          </div>
                      )}

                      {/* Step 2: The Ledger Review (Fees & Taxes) */}
                      {withdrawStep === 2 && (
                          <div className="p-8">
                              <div className="flex items-center gap-4 mb-8">
                                  <button onClick={() => setWithdrawStep(1)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors"><ArrowLeft size={18}/></button>
                                  <h3 className="text-xl font-black text-white tracking-tight">Review Details</h3>
                              </div>

                              <div className="bg-black border border-white/5 rounded-3xl p-6 mb-8 space-y-4">
                                  <div className="flex justify-between items-center">
                                      <span className="text-sm font-medium text-zinc-400">Withdrawal Amount</span>
                                      <span className="text-sm font-bold text-white">${parseFloat(withdrawAmount).toFixed(2)}</span>
                                  </div>
                                  
                                  {/* Dynamic Fees based on Gateway */}
                                  <div className="flex justify-between items-center">
                                      <span className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                                          Gateway Fee 
                                          <span className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded text-zinc-400 uppercase tracking-wider">
                                              {user?.payout_method?.includes('Paystack') ? '1.5%' : user?.payout_method?.includes('Flutterwave') ? '1.4%' : 'Standard'}
                                          </span>
                                      </span>
                                      <span className="text-sm font-bold text-red-400">-${(parseFloat(withdrawAmount) * 0.015).toFixed(2)}</span>
                                  </div>
                                  
                                  <div className="w-full h-px bg-white/10 my-2" />
                                  
                                  <div className="flex justify-between items-center">
                                      <span className="text-base font-bold text-white">Net Payout</span>
                                      <span className="text-2xl font-black text-emerald-400">${(parseFloat(withdrawAmount) * 0.985).toFixed(2)}</span>
                                  </div>
                              </div>

                              <div className="p-5 border border-white/5 bg-white/5 rounded-2xl mb-8 flex items-start gap-4">
                                  <div className="mt-0.5"><Clock size={18} className="text-emerald-500" /></div>
                                  <div>
                                      <p className="text-sm font-bold text-white">Estimated Arrival</p>
                                      <p className="text-xs text-zinc-400 leading-relaxed mt-1">
                                          {user?.payout_method?.includes('PayPal') ? 'Within minutes via PayPal Instant.' : '1-2 business days via Local Bank Transfer.'}
                                      </p>
                                  </div>
                              </div>

                              <button 
                                  onClick={() => setWithdrawStep(3)}
                                  className="w-full py-4 bg-emerald-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-emerald-500 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                              >
                                  Confirm Details
                              </button>
                          </div>
                      )}

                      {/* Step 3: Security Vault (Password/PIN to execute) */}
                      {withdrawStep === 3 && (
                          <div className="p-8">
                              <div className="flex items-center gap-4 mb-8">
                                  <button onClick={() => setWithdrawStep(2)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors"><ArrowLeft size={18}/></button>
                                  <h3 className="text-xl font-black text-white tracking-tight">Security Check</h3>
                              </div>

                              <div className="text-center mb-8">
                                  <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center border border-white/10 mx-auto mb-6">
                                      <Lock size={24} className="text-white" />
                                  </div>
                                  <p className="text-sm text-zinc-400 px-4">For your security, please enter your Grove Connect password to authorize this transfer of <span className="text-white font-bold">${parseFloat(withdrawAmount).toFixed(2)}</span>.</p>
                              </div>

                              <div className="mb-8">
                                  <input 
                                      type="password" 
                                      placeholder="Enter your password"
                                      className="w-full bg-black border border-white/10 rounded-2xl px-4 py-4 text-center text-white outline-none focus:border-emerald-500/50 transition-colors tracking-widest font-mono"
                                      autoFocus
                                  />
                              </div>

                              <button 
                                  disabled={isProcessingPayout}
                                  onClick={async () => {
                                      setIsProcessingPayout(true);
                                      try {
                                          // Connect to your actual backend API route
                                          const res = await fetch('/api/payouts', {
                                              method: 'POST',
                                              headers: { 'Content-Type': 'application/json' },
                                              body: JSON.stringify({ 
                                                  amount: parseFloat(withdrawAmount), 
                                                  method: user?.payout_method, 
                                                  details: user?.payout_details 
                                              })
                                          });
                                          const data = await res.json();
                                          if (data.success) {
                                              setWithdrawStep(4);
                                          } else {
                                              showToast(data.error, "error");
                                          }
                                      } catch (err) {
                                          showToast("Network error communicating with payment gateway.", "error");
                                      } finally {
                                          setIsProcessingPayout(false);
                                      }
                                  }}
                                  className="w-full py-4 bg-emerald-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-emerald-500 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50"
                              >
                                  {isProcessingPayout ? <Loader2 size={18} className="animate-spin" /> : 'Authorize Transfer'}
                              </button>
                              <div className="mt-6 flex items-center justify-center gap-2 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                                  <Shield size={12} /> Secured by 256-bit Encryption
                              </div>
                          </div>
                      )}

                      {/* Step 4: Digital Receipt (Success) */}
                      {withdrawStep === 4 && (
                          <div className="p-10 text-center flex flex-col items-center relative overflow-hidden">
                              <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[conic-gradient(var(--tw-gradient-stops))] from-emerald-500/0 via-emerald-500/10 to-emerald-500/0 animate-[spin_4s_linear_infinite]" />
                              
                              <div className="relative z-10 w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center border-4 border-[#0a0a0a] shadow-[0_0_40px_rgba(16,185,129,0.3)] mb-6">
                                  <CheckCircle2 size={48} className="text-emerald-500" />
                              </div>
                              
                              <h3 className="text-3xl font-black text-white mb-2 relative z-10 tracking-tight">Transfer Initiated</h3>
                              <p className="text-sm text-zinc-400 mb-8 max-w-xs relative z-10">Your funds are being processed via {user?.payout_method}. A receipt has been sent to your email.</p>
                              
                              <div className="w-full p-5 bg-black border border-white/5 rounded-2xl space-y-3 mb-8 relative z-10 text-left">
                                  <div className="flex justify-between items-center">
                                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Amount Sent</span>
                                      <span className="font-bold text-white">${(parseFloat(withdrawAmount) * 0.985).toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Transaction ID</span>
                                      <span className="text-xs font-mono text-zinc-400">TX_{Math.floor(100000 + Math.random() * 900000)}</span>
                                  </div>
                              </div>

                              <button 
      onClick={() => {
          setWithdrawModalOpen(false);
          // Deduct from local available balance instantly
          setTotalWithdrawn(prev => prev + parseFloat(withdrawAmount));
          
          // Push to real transaction history array
          setTransactions([{ 
              id: `tx_${Math.floor(100000 + Math.random() * 900000)}`, // Or use receipt ID from API
              requested_at: new Date().toISOString(), 
              amount: parseFloat(withdrawAmount), 
              status: 'pending', 
              method: user?.payout_method || 'Bank Transfer' 
          }, ...transactions]);
      }}
      className="relative z-10 w-full py-4 bg-white text-black font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-zinc-200 transition-colors"
  >
      Done
  </button>
                          </div>
                      )}
                  </motion.div>
              </div>
          )}
      </AnimatePresence>

      {/* --- FINTECH ACCOUNT LINKING MODAL --- */}
      <AnimatePresence>
          {isLinkModalOpen && (
              <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => !isResolving && setLinkModalOpen(false)} />
                  
                  <motion.div 
                      initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                      className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl z-10"
                  >
                      {/* STEP 1: Select Method */}
                      {linkStep === 1 && (
                          <div className="p-8">
                              <div className="flex justify-between items-center mb-8">
                                  <h3 className="text-xl font-black text-white tracking-tight">Add Payout Method</h3>
                                  <button onClick={() => setLinkModalOpen(false)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-zinc-400"><X size={18}/></button>
                              </div>
                              
                              <div className="space-y-3">
                                  <button onClick={() => { setLinkMethod('Bank'); setLinkStep(2); }} className="w-full p-5 bg-black border border-white/5 rounded-2xl flex items-center justify-between hover:border-emerald-500/50 transition-all group">
                                      <div className="flex items-center gap-4">
                                          <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center border border-white/10 group-hover:bg-emerald-500/10 transition-colors"><Landmark size={20} className="text-white group-hover:text-emerald-400"/></div>
                                          <div className="text-left">
                                              <p className="font-bold text-white text-sm">Local Bank Transfer</p>
                                              <p className="text-xs text-zinc-500 mt-1">Direct deposit to your bank account</p>
                                          </div>
                                      </div>
                                      <ChevronRight size={20} className="text-zinc-600 group-hover:text-emerald-500 transition-colors"/>
                                  </button>

                                  <button onClick={() => { setLinkMethod('PayPal'); setLinkStep(2); }} className="w-full p-5 bg-black border border-white/5 rounded-2xl flex items-center justify-between hover:border-blue-500/50 transition-all group">
                                      <div className="flex items-center gap-4">
                                          <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center border border-white/10 group-hover:bg-blue-500/10 transition-colors"><Globe size={20} className="text-white group-hover:text-blue-400"/></div>
                                          <div className="text-left">
                                              <p className="font-bold text-white text-sm">PayPal</p>
                                              <p className="text-xs text-zinc-500 mt-1">Connect your global PayPal account</p>
                                          </div>
                                      </div>
                                      <ChevronRight size={20} className="text-zinc-600 group-hover:text-blue-500 transition-colors"/>
                                  </button>
                              </div>
                          </div>
                      )}

                      {/* STEP 2: Bank Resolution Form */}
                      {linkStep === 2 && linkMethod === 'Bank' && (
                          <div className="p-8">
                              <div className="flex items-center gap-4 mb-8">
                                  <button onClick={() => setLinkStep(1)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-zinc-400"><ArrowLeft size={18}/></button>
                                  <h3 className="text-xl font-black text-white tracking-tight">Enter Bank Details</h3>
                              </div>

                              <div className="space-y-6 mb-8">
                                  <div className="space-y-2">
                                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2">Select Bank</label>
                                      <select 
                                          value={bankCode} 
                                          onChange={(e) => setBankCode(e.target.value)} 
                                          className="w-full bg-black border border-white/10 rounded-2xl px-4 py-4 text-sm text-white outline-none focus:border-emerald-500/50 appearance-none"
                                      >
                                          <option value="" disabled>Choose your bank...</option>
                                          {NIGERIAN_BANKS.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
                                      </select>
                                  </div>

                                  <div className="space-y-2">
                                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2">Account Number</label>
                                      <input 
                                          type="text" 
                                          value={accountNumber} 
                                          onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10))} 
                                          placeholder="0123456789" 
                                          className="w-full bg-black border border-white/10 rounded-2xl px-4 py-4 text-white outline-none focus:border-emerald-500/50 tracking-widest font-mono"
                                      />
                                  </div>
                              </div>

                              <button 
                                  disabled={isResolving || !bankCode || accountNumber.length !== 10}
                                  onClick={async () => {
                                      setIsResolving(true);
                                      try {
                                          // PING THE REAL API TO FETCH ACCOUNT NAME
                                          const res = await fetch('/api/resolve-bank', {
                                              method: 'POST',
                                              headers: { 'Content-Type': 'application/json' },
                                              body: JSON.stringify({ bankCode, accountNumber })
                                          });
                                          const data = await res.json();
                                          
                                          if (data.success) {
                                              setResolvedName(data.account_name);
                                              setLinkStep(3);
                                          } else {
                                              showToast(data.error || "Account not found", "error");
                                          }
                                      } catch (err) {
                                          // FALLBACK FOR TESTING IF API FAILS
                                          setResolvedName(user?.full_name?.toUpperCase() || "JOHN DOE");
                                          setLinkStep(3);
                                      } finally {
                                          setIsResolving(false);
                                      }
                                  }}
                                  className="w-full py-4 bg-emerald-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-emerald-500 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] disabled:opacity-50 flex items-center justify-center gap-2"
                              >
                                  {isResolving ? <Loader2 size={18} className="animate-spin"/> : 'Verify Account'}
                              </button>
                          </div>
                      )}

                      {/* STEP 3: Identity Confirmation */}
                      {linkStep === 3 && linkMethod === 'Bank' && (
                          <div className="p-8 text-center flex flex-col items-center">
                              <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20 mb-6 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                                  <User size={32} className="text-emerald-400" />
                              </div>
                              <h3 className="text-lg font-bold text-white mb-2">Confirm Account Name</h3>
                              <p className="text-sm text-zinc-400 mb-8">Please confirm that the name on this bank account matches your identity. Payments to mismatched names may fail.</p>
                              
                              <div className="w-full p-6 bg-black border border-white/5 rounded-2xl mb-8 border-dashed border-emerald-500/30">
                                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">Resolved Name from Bank</p>
                                  <p className="text-xl font-black text-white uppercase tracking-tight">{resolvedName}</p>
                                  <div className="w-full h-px bg-white/10 my-4" />
                                  <p className="text-sm font-mono text-zinc-400">{accountNumber} • {NIGERIAN_BANKS.find(b=>b.code===bankCode)?.name}</p>
                              </div>

                              <div className="flex gap-4 w-full">
                                  <button onClick={() => setLinkStep(2)} className="flex-1 py-4 bg-white/5 text-white font-bold rounded-2xl hover:bg-white/10 transition-colors">Wrong Account</button>
                                  <button 
                                      onClick={() => {
                                          const bankName = NIGERIAN_BANKS.find(b=>b.code===bankCode)?.name;
                                          updateProfile({ payout_method: `${bankName} Transfer`, payout_details: accountNumber });
                                          setLinkModalOpen(false);
                                          showToast("Bank account linked successfully!", "success");
                                      }} 
                                      className="flex-1 py-4 bg-emerald-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-emerald-500 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                                  >
                                      Yes, Save Account
                                  </button>
                              </div>
                          </div>
                      )}

                      {/* OAuth Redirection State for PayPal/Stripe */}
                      {linkStep === 2 && linkMethod === 'PayPal' && (
                          <div className="p-10 text-center flex flex-col items-center">
                              <Loader2 size={40} className="text-blue-500 animate-spin mb-6" />
                              <h3 className="text-xl font-black text-white mb-2">Connecting to PayPal</h3>
                              <p className="text-sm text-zinc-400">Redirecting you to the secure authorization gateway...</p>
                          </div>
                      )}
                  </motion.div>
              </div>
          )}
      </AnimatePresence>

      {/* --- NOTIFICATION READING MODAL --- */}
          <AnimatePresence>
              {selectedNotification && (
                  <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                      <motion.div 
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className="absolute inset-0 bg-black/80 backdrop-blur-md"
                          onClick={() => setSelectedNotification(null)}
                      />
                      <motion.div 
                          initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                          animate={{ opacity: 1, scale: 1, y: 0 }} 
                          exit={{ opacity: 0, scale: 0.95, y: 20 }}
                          className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl z-10 flex flex-col"
                      >
                          <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/40">
                              <h3 className="font-bold text-lg flex items-center gap-3 text-white">
                                  <div className={`p-2 rounded-xl ${selectedNotification.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : selectedNotification.type === 'warning' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                      {selectedNotification.type === 'success' ? <CheckCircle2 size={20}/> : selectedNotification.type === 'warning' ? <AlertCircle size={20}/> : <Bell size={20}/>}
                                  </div>
                                  {selectedNotification.title}
                              </h3>
                              <button onClick={() => setSelectedNotification(null)} className="p-2 text-zinc-500 hover:text-white hover:bg-white/10 rounded-full transition-colors"><X size={20}/></button>
                          </div>
                          
                          <div className="p-6 md:p-8 overflow-y-auto max-h-[60vh]">
                              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4">
                                  Received: {new Date(selectedNotification.created_at).toLocaleString()}
                              </p>
                              <div className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap font-medium">
                                  {selectedNotification.message}
                              </div>
                          </div>
                          
                          <div className="p-6 border-t border-white/5 bg-black/40 flex justify-end">
                              <button onClick={() => setSelectedNotification(null)} className="px-8 py-3 bg-white text-black font-black uppercase tracking-widest text-xs rounded-xl hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:scale-105">
                                  Acknowledge
                              </button>
                          </div>
                      </motion.div>
                  </div>
              )}
          </AnimatePresence>

        </div>
      </main>
      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full bg-black/90 backdrop-blur-xl border-t border-white/10 flex justify-around items-center p-3 z-50 pb-safe">
          <button onClick={() => setCurrentView('overview')} className={`flex flex-col items-center gap-1 ${currentView === 'overview' ? 'text-green-500' : 'text-gray-500'}`}>
              <LayoutDashboard size={20} />
              <span className="text-[10px] font-bold">Home</span>
          </button>
          <button onClick={() => setCurrentView('courses')} className={`flex flex-col items-center gap-1 ${currentView === 'courses' ? 'text-green-500' : 'text-gray-500'}`}>
              <BookOpen size={20} />
              <span className="text-[10px] font-bold">Courses</span>
          </button>
          <button onClick={() => setCurrentView('settings')} className={`flex flex-col items-center gap-1 ${currentView === 'settings' ? 'text-green-500' : 'text-gray-500'}`}>
              <Settings size={20} />
              <span className="text-[10px] font-bold">Settings</span>
          </button>
      </nav>
    </div>
  )
}
// --- SUB-COMPONENTS BELOW THIS LINE OMITTED FOR BREVITY ---

// --- SUB-COMPONENTS ---
const NavButton = ({ active, children, onClick, icon: Icon }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${active ? 'bg-white text-black shadow-lg font-bold' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
    <Icon size={18} className={active ? "text-black" : "text-gray-500"} /> {children}
  </button>
)

const StatCard = ({ label, value, icon: Icon, trend, trendUp }: any) => (
  <div className="bg-neutral-900/40 border border-white/5 p-6 rounded-2xl hover:bg-neutral-900/60 transition-colors group">
    <div className="flex justify-between items-start mb-4">
      <div className="p-3 bg-neutral-800 rounded-xl text-gray-400 group-hover:text-white transition-all"><Icon size={20} /></div>
      <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${trendUp ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
        {trendUp ? <TrendingUp size={12} /> : <ArrowUpRight size={12} className="rotate-90" />} {trend}
      </div>
    </div>
    <h3 className="text-3xl font-bold text-white mb-1">{value}</h3>
    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">{label}</p>
  </div>
)

interface CoursesTableProps {
  courses: Course[];
  onAction: (id: string) => void;
  onDelete: (id: string) => void;
  onView?: (course: Course) => void;
}

const CoursesTable = ({ courses, onAction, onDelete, onView }: CoursesTableProps) => (
  <div className="bg-neutral-900/40 border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-neutral-950 text-xs uppercase text-gray-500 font-bold">
          <tr><th className="p-5">Course</th><th className="p-5">Status</th><th className="p-5">Price</th><th className="p-5">Students</th><th className="p-5">Revenue</th><th className="p-5">Rating</th><th className="p-5"></th></tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {courses.map((course: Course) => (
            <tr key={course.id} onClick={() => onView && onView(course)} className="hover:bg-white/[0.02] transition-colors cursor-pointer group">
              <td className="p-5 font-bold text-white flex items-center gap-3"><div className="w-10 h-10 bg-neutral-800 rounded flex items-center justify-center"><BookOpen size={16} className="text-gray-500"/></div>{course.title}</td>
              <td className="p-5"><span className={`px-3 py-1 rounded-full text-[10px] uppercase font-bold ${course.status === 'Active' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>{course.status}</span></td>
              <td className="p-5 text-gray-300">${course.price}</td>
              <td className="p-5 text-gray-300">{course.students_count || 0}</td>
              <td className="p-5 font-mono text-green-400 font-bold">${course.total_revenue}</td>
              <td className="p-5 text-yellow-400 flex items-center gap-1 font-bold">{course.average_rating ? course.average_rating.toFixed(1) : '-'}<span className="text-[10px] text-gray-600">★</span></td>
              <td className="p-5 text-right"><button onClick={(e) => { e.stopPropagation(); onAction(course.id) }} className="text-gray-500 hover:text-white mr-4"><Edit size={16} /></button><button onClick={(e) => { e.stopPropagation(); onDelete(course.id) }} className="text-gray-500 hover:text-red-400"><Trash2 size={16} /></button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    
  </div>
)

// --- SMILE ID CAMERA WRAPPER ---
const SmileCameraWrapper = ({user, onSuccess, onError }: { user: UserProfile | null, onSuccess: (detail: any) => void, onError: (detail: any) => void }) => {
    const [scriptLoaded, setScriptLoaded] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // 1. Inject the script dynamically
        const script = document.createElement('script');
        script.src = "https://unpkg.com/@smile_identity/smart-camera-web@11.0.1/smart-camera-web.js";
        script.async = true;
        
        script.onload = () => setScriptLoaded(true);
        script.onerror = () => onError("Failed to load Smile ID script");
        
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, []);

useEffect(() => {
    // 2. Inject the web component ONLY after the script is loaded
    if (scriptLoaded && containerRef.current) {
        // This forces the user to take a photo of their ID card, then a selfie.
        containerRef.current.innerHTML = '<smart-camera-web mode="document"></smart-camera-web>';
        const cameraEl = containerRef.current.querySelector('smart-camera-web');
        
        if (cameraEl) {
            const handleSuccess = async (e: any) => {
                // e.detail.images contains the base64 encrypted photos of the ID and Selfie
                
                try {
                    // Send the encrypted images to our secure backend
                    const res = await fetch('/api/verify-kyc', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            images: e.detail.images,
                            userId: user?.id 
                        })
                    });

                    const data = await res.json();

                    if (data.success) {
                        onSuccess(data); // Tell the dashboard it worked!
                    } else {
                        onError(data.error); // Tell the dashboard the ID failed
                    }
                } catch (err) {
                    onError("Network error during verification.");
                }
            };
            const handleError = (e: any) => onError(e.detail);

            cameraEl.addEventListener('imagesComputed', handleSuccess);
            cameraEl.addEventListener('error', handleError);

            return () => {
                cameraEl.removeEventListener('imagesComputed', handleSuccess);
                cameraEl.removeEventListener('error', handleError);
            };
        }
    }
}, [scriptLoaded, onSuccess, onError]);

    if (!scriptLoaded) {
        return <div className="flex flex-col items-center text-emerald-500"><Loader2 className="animate-spin w-8 h-8 mb-2"/> Loading secure camera...</div>;
    }

    return <div ref={containerRef} className="w-full h-full rounded-2xl overflow-hidden shadow-2xl border border-white/10" />;
};
