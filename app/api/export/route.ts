import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function GET(req: Request) {
    const supabase = createSupabaseClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        // 1. Fetch all personal data from Supabase
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        const { data: courses } = await supabase.from('courses').select('*').eq('instructor_id', user.id);
        
        // 2. Compile into a single payload
        const exportData = {
            export_date: new Date().toISOString(),
            platform: "Grove Connect",
            user: {
                account_id: user.id,
                email: user.email,
                profile: profile,
            },
            courses: courses || [],
            // Add other tables here later (e.g., payout_history)
        };

        // 3. Force the browser to download it as a file
        return new NextResponse(JSON.stringify(exportData, null, 2), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename="grove_data_export_${user.id.substring(0,8)}.json"`,
            },
        });

    } catch (error) {
        return NextResponse.json({ error: 'Failed to compile data' }, { status: 500 });
    }
}