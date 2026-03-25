import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

// Completely bypasses SSR for the checkout component and the Paystack library inside it
const CheckoutClient = dynamic(() => import('./CheckoutClient'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-500 w-10 h-10" />
    </div>
  )
})

export default function CheckoutPage() {
  return <CheckoutClient />
}