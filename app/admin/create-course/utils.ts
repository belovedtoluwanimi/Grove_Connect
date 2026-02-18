import { createClient } from '@/app/utils/supabase/client'
import { CourseData, DaySchedule } from './types'

const DRAFT_KEY = 'grove_course_draft_v2'

export const generateId = () => crypto.randomUUID()

// --- DRAFT MANAGEMENT ---
export const saveDraft = (data: CourseData) => {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({
      data,
      timestamp: Date.now()
    }))
  } catch (e) { console.error('Draft save failed', e) }
}

export const loadDraft = (): { data: CourseData, timestamp: number } | null => {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch (e) { return null }
}

export const clearDraft = () => {
  if (typeof window === 'undefined') return
  localStorage.removeItem(DRAFT_KEY)
}

// --- DEFAULTS ---
export const DEFAULT_AVAILABILITY: DaySchedule[] = [
  'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'
].map(day => ({
  day,
  enabled: ['Mon', 'Wed', 'Fri'].includes(day),
  windows: [{ start: '09:00', end: '17:00' }]
}))

export const INITIAL_DATA: CourseData = {
  mode: null,
  title: '',
  subtitle: '',
  description: '',
  category: 'Development',
  customCategory: '',
  level: 'Beginner',
  thumbnail: null,
  promoVideo: null,
  objectives: ['', '', ''],
  modules: [
    { id: 'mod-init', title: 'Introduction', items: [], isOpen: true, isMilestone: false }
  ],
  pricing: { type: 'one_time', amount: '', currency: 'USD' }
}

// --- SUPABASE UPLOAD HELPER ---
export const uploadFileToSupabase = async (file: File, bucket: string = 'course-media'): Promise<string> => {
  const supabase = createClient()
  const fileExt = file.name.split('.').pop()
  const fileName = `${generateId()}.${fileExt}`
  const filePath = `${fileName}`

  // Upload
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, file)

  if (uploadError) {
    console.error('Supabase upload failed, falling back to Blob', uploadError)
    // Fallback for demo purposes if bucket doesn't exist
    return URL.createObjectURL(file)
  }

  // Get Public URL
  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath)
  return data.publicUrl
}