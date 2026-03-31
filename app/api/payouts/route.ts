import { NextResponse } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// prefer server-only key for server code
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_KEY environment variable');
}

export const supabaseServer: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);
export default supabaseServer;

export async function POST(req: Request) {
    const supabase = supabaseServer;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { amount, method, details } = await req.json();

    try {
        // 1. STRICT SECURITY: Verify KYC before allowing withdrawal
        const { data: profile } = await supabase.from('profiles').select('is_verified').eq('id', user.id).single();
        
        if (!profile?.is_verified) {
            return NextResponse.json({ error: 'Identity verification (KYC) required for payouts.' }, { status: 403 });
        }

        // 2. Insert into your finance ledger
        const { error } = await supabase.from('payout_requests').insert({
            user_id: user.id,
            amount: parseFloat(amount), // Ensure it's a number
            method: method,
            details: details,
            status: 'pending',
            requested_at: new Date().toISOString()
        });

        if (error) throw error;

        // 3. (Future) Trigger Stripe Connect or PayPal API here

        return NextResponse.json({ success: true, message: 'Payout requested successfully.' });

    } catch (error: any) {
        console.error("Payout Error:", error);
        return NextResponse.json({ error: 'Failed to process payout.' }, { status: 500 });
    }
}