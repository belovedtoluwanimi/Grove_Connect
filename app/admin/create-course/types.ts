export type CourseMode = 'standard' | 'premium' | null
export type Step = 'mode' | 'details' | 'curriculum' | 'mentorship' | 'pricing' | 'verification' | 'review'

// --- CONTENT TYPES ---
export interface ContentItem {
  id: string
  title: string
  type: 'video' | 'article' | 'quiz' | 'assignment' | 'live_session'
  duration?: number // minutes
  isFreePreview: boolean
  videoUrl?: string
  content?: string // For text content
}

export interface Module {
  id: string
  title: string
  items: ContentItem[]
  isOpen: boolean
  // Premium specifics
  isMilestone: boolean
  milestoneGoal?: string
}

// --- SCHEDULING TYPES ---
export interface TimeWindow {
  start: string
  end: string
}

export interface DaySchedule {
  day: string
  enabled: boolean
  windows: TimeWindow[]
}

export interface PremiumConfig {
  format: 'cohort' | 'self_paced'
  features: {
    oneOnOne: boolean
    prioritySupport: boolean
    assignments: boolean
    community: boolean
  }
  scheduling: {
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
}

// --- MAIN STATE ---
export interface CourseData {
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
  
  // Curriculum (Standard) or Roadmap (Premium)
  modules: Module[]
  
  // Premium Only Config
  premiumConfig?: PremiumConfig

  // Pricing
  pricing: {
    type: 'free' | 'one_time' | 'subscription'
    amount: string
    currency: string
  }
}

export const INITIAL_AVAILABILITY: DaySchedule[] = [
  'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'
].map(day => ({
  day,
  enabled: ['Mon', 'Wed', 'Fri'].includes(day),
  windows: [{ start: '09:00', end: '17:00' }]
}))