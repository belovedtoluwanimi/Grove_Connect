export type CourseMode = 'standard' | 'premium' | null
export type Step = 'mode' | 'details' | 'curriculum' | 'mentorship' | 'pricing' | 'verification' | 'review'

// --- CONTENT TYPES ---
export interface ContentItem {
  id: string
  title: string
  type: 'video' | 'article' | 'quiz' | 'assignment' | 'live_session'
  videoUrl?: string
  content?: string // For article text or assignment instructions
  duration?: number // minutes
  isFreePreview: boolean
  isUploading?: boolean // UI state
}

export interface Module {
  id: string
  title: string
  items: ContentItem[]
  isOpen: boolean
  isMilestone: boolean
  milestoneGoal?: string
}

// --- SCHEDULING TYPES (Premium) ---
export interface TimeWindow {
  start: string
  end: string
}

export interface DaySchedule {
  day: string
  enabled: boolean
  windows: TimeWindow[]
}

export interface SchedulingConfig {
  timezone: string
  platform: 'google_meet' | 'zoom' | 'jitsi' | 'custom'
  customLink?: string
  sessionDuration: number // minutes
  bufferTime: number // minutes
  availability: DaySchedule[]
  bookingRules: {
    maxPerWeek: number
    minLeadTime: number // hours
  }
}

// --- VERIFICATION TYPES ---
export interface InstructorVerification {
  status: 'idle' | 'pending' | 'verified' | 'rejected'
  submittedAt?: string
  notes?: string
}

// --- MAIN COURSE STATE ---
export interface CourseData {
  id?: string // Optional, if editing existing
  mode: CourseMode
  title: string
  subtitle: string
  description: string
  category: string
  customCategory: string
  level: string
  thumbnail: string | null
  promoVideo: string | null
  objectives: string[]
  
  // Curriculum
  modules: Module[]
  
  // Premium Config
  premiumConfig?: {
    format: 'cohort' | 'self_paced'
    communityAccess: boolean
    prioritySupport: boolean
    scheduling: SchedulingConfig
  }

  // Pricing
  pricing: {
    type: 'free' | 'one_time' | 'subscription'
    amount: string
    currency: string
  }
}