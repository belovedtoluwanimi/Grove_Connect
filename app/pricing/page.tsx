import React from 'react'
import { Check } from 'lucide-react'
import Link from 'next/link'

const PriceCard = ({ title, price, features, recommended }: any) => (
    <div className={`p-8 rounded-3xl border flex flex-col ${recommended ? 'bg-zinc-900 border-emerald-500 relative' : 'bg-black border-white/10'}`}>
        {recommended && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Most Popular</span>}
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <div className="text-4xl font-black text-white mb-6">${price}<span className="text-lg text-zinc-500 font-medium">/mo</span></div>
        <ul className="space-y-4 mb-8 flex-1">
            {features.map((f:string, i:number) => (
                <li key={i} className="flex items-center gap-3 text-zinc-300 text-sm"><Check size={16} className="text-emerald-500" /> {f}</li>
            ))}
        </ul>
        <Link href="/auth">
            <button className={`w-full py-3 rounded-xl font-bold transition-all ${recommended ? 'bg-emerald-500 text-black hover:bg-emerald-400' : 'bg-white/10 text-white hover:bg-white/20'}`}>Choose Plan</button>
        </Link>
    </div>
)

export default function PricingPage() {
  return (
    <div className="pt-32 pb-20 bg-[#050505] min-h-screen text-white px-6">
        <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-black mb-4">Simple, Transparent Pricing</h1>
            <p className="text-zinc-400">Invest in your future without breaking the bank.</p>
        </div>
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            <PriceCard title="Starter" price="0" features={["Access to free courses", "Community support", "Basic profile"]} />
            <PriceCard title="Pro Creator" price="29" recommended features={["All courses included", "Priority support", "Certified badges", "Download access"]} />
            <PriceCard title="Team" price="99" features={["5 Pro accounts", "Team dashboard", "API Access", "Dedicated manager"]} />
        </div>
    </div>
  )
}