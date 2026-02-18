'use client'

import React, { useState } from 'react'
import { Loader2, Upload, Video, ImageIcon, AlertCircle } from 'lucide-react'
import { uploadFileToSupabase } from '../utils'

export const Input = ({ label, value, onChange, placeholder, type = 'text', error, ...props }: any) => (
  <div className="space-y-2 w-full">
    {label && <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{label}</label>}
    <input 
      type={type}
      value={value} 
      onChange={e => onChange(e.target.value)} 
      className={`w-full bg-zinc-900 border ${error ? 'border-red-500' : 'border-white/10'} rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-all text-white placeholder-zinc-700`} 
      placeholder={placeholder}
      {...props}
    />
    {error && <p className="text-red-500 text-xs flex items-center gap-1"><AlertCircle size={12}/> {error}</p>}
  </div>
)

export const TextArea = ({ label, value, onChange, placeholder, rows=4 }: any) => (
  <div className="space-y-2 w-full">
    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{label}</label>
    <textarea 
      value={value} 
      onChange={e => onChange(e.target.value)} 
      className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-all text-white placeholder-zinc-700 resize-none" 
      placeholder={placeholder}
      rows={rows}
    />
  </div>
)

export const MediaUpload = ({ label, type, url, onUploadComplete }: { label: string, type: 'image'|'video', url: string|null, onUploadComplete: (url: string) => void }) => {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string|null>(null)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return
    setUploading(true)
    setError(null)
    
    try {
      const publicUrl = await uploadFileToSupabase(e.target.files[0])
      onUploadComplete(publicUrl)
    } catch (err) {
      setError("Upload failed. Using local preview.")
      // Fallback handled in utils, but we catch generic errors here
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{label}</label>
      <label className={`aspect-video bg-zinc-900 border border-dashed ${error ? 'border-red-500' : 'border-white/20'} rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 transition-all relative overflow-hidden group`}>
        {url ? (
          type === 'video' ? <video src={url} className="w-full h-full object-cover" controls /> : <img src={url} className="w-full h-full object-cover" />
        ) : (
          <div className="text-center group-hover:scale-105 transition-transform">
            <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
              {uploading ? <Loader2 className="animate-spin text-zinc-500"/> : <Upload size={18} className="text-zinc-500"/>}
            </div>
            <span className="text-xs text-zinc-500 font-bold uppercase">{uploading ? 'Uploading...' : `Click to Upload ${type}`}</span>
          </div>
        )}
        <input type="file" className="hidden" accept={type === 'video' ? "video/*" : "image/*"} onChange={handleFile} disabled={uploading} />
      </label>
      {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
  )
}

export const NavBtn = ({ active, icon: Icon, label, onClick, alert }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium ${active ? 'bg-white text-black shadow-lg shadow-white/5' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}>
    <Icon size={18} /> <span className="flex-1 text-left">{label}</span> {alert && <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
  </button>
)