import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';

function getSupabaseClient() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error('Missing SUPABASE env vars: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY');
    return createSupabaseClient(url, key);
}

export async function POST(req: Request) {
    const supabase = getSupabaseClient();
    
    // 1. Authenticate the request
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized Access' }, { status: 401 });
    }

    const body = await req.json();

    try {
        // --- ACTION: GENERATE NEW API KEY ---
        if (body.action === 'roll_key') {
            // Generate a secure 32-character hex string
            const newKey = 'pk_live_grove_' + crypto.randomBytes(16).toString('hex');
            
            // Save to Supabase
            const { error } = await supabase
                .from('profiles')
                .update({ api_key: newKey })
                .eq('id', user.id);

            if (error) throw error;
            return NextResponse.json({ success: true, key: newKey });
        }

        // --- ACTION: SAVE WEBHOOK ---
        if (body.action === 'save_webhook') {
            // Basic URL validation
            try { new URL(body.url); } 
            catch (e) { return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 }); }

            const { error } = await supabase
                .from('profiles')
                .update({ webhook_url: body.url })
                .eq('id', user.id);

            if (error) throw error;
            return NextResponse.json({ success: true, message: 'Webhook connected.' });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error: any) {
        console.error("Developer API Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}