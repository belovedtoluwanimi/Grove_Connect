import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Uses the God-Mode key to write the code securely
);

export async function POST(req: Request) {
  try {
    const { action, email, userId, code } = await req.json();

    // --- SCENARIO 1: SENDING THE EMAIL ---
    if (action === 'send') {
      // 1. Generate a random 6-digit code
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      // 2. Save it to the user's profile in the database
      await supabaseAdmin.from('profiles').update({ otp_code: otp }).eq('id', userId);

      // 3. Send the email via Resend
      await resend.emails.send({
        from: 'Grove Security <onboarding@resend.dev>', // Resend's free testing email
        to: email, // Make sure your Resend account email matches this while testing!
        subject: 'Grove Connect - Your 2FA Code',
        html: `
          <div style="font-family: sans-serif; text-align: center; padding: 40px;">
            <h2>Your Security Code</h2>
            <p>Enter this 6-digit code to enable 2FA on your tutor account:</p>
            <h1 style="letter-spacing: 0.2em; color: #10b981; font-size: 40px;">${otp}</h1>
            <p style="color: #666; font-size: 12px;">If you did not request this, please ignore this email.</p>
          </div>
        `
      });

      return NextResponse.json({ success: true });
    }

    // --- SCENARIO 2: VERIFYING THE CODE ---
    if (action === 'verify') {
      // 1. Fetch the real code from the database
      const { data } = await supabaseAdmin.from('profiles').select('otp_code').eq('id', userId).single();

      // 2. Check if it matches what the user typed
      if (data?.otp_code === code) {
        // Success! Clear the code and enable 2FA
        await supabaseAdmin.from('profiles').update({ 
            otp_code: null, 
            two_factor_enabled: true 
        }).eq('id', userId);

        return NextResponse.json({ success: true });
      } else {
        return NextResponse.json({ success: false, error: "Invalid code" }, { status: 400 });
      }
    }

  } catch (error) {
    console.error("2FA Error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}