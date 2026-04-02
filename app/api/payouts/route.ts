import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Initialize the raw client to securely write to the database
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { userId, amount, method, details } = body;

        console.log("👉 1. Payout Request Received:", body);

        if (!userId || !amount || !method || !details) {
            console.log("❌ 2. Missing data from frontend!");
            return NextResponse.json({ error: 'Missing required payout details.' }, { status: 400 });
        }

        // 1. STRICT SECURITY: Verify KYC before allowing withdrawal
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('is_verified')
            .eq('id', userId)
            .single();
        
        if (profileError) {
            console.log("❌ 3. Database error fetching profile:", profileError);
            return NextResponse.json({ error: 'Failed to verify user profile.' }, { status: 500 });
        }

        if (!profile?.is_verified) {
            console.log("❌ 4. User is not KYC verified.");
            return NextResponse.json({ error: 'Identity verification (KYC) required for payouts.' }, { status: 403 });
        }

        // 2. Insert into your finance ledger
        console.log("⏳ 5. Inserting transaction into payout_requests table...");
        const { error: insertError } = await supabase.from('payout_requests').insert({
            user_id: userId,
            amount: parseFloat(amount),
            method: method,
            details: details,
            status: 'pending',
            requested_at: new Date().toISOString()
        });

        if (insertError) {
            console.log("❌ 6. Database Insert Error:", insertError);
            return NextResponse.json({ error: `DB Error: ${insertError.message}` }, { status: 400 });
        }

        console.log("✅ 7. Payout Successfully Recorded!");
        return NextResponse.json({ success: true, message: 'Payout requested successfully.' });

    } catch (error: any) {
        console.error("🔥 SERVER CRASH:", error);
        return NextResponse.json({ error: 'Internal server error processing payout.' }, { status: 500 });
    }
}